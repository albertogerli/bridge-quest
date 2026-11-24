import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { inizioVisibile, type CorsoPubblico, type LivelloCorso, type TipoCorso } from "@/lib/corsi";
import { segnalaSalvoRete } from "@/lib/report-error";

/**
 * SOLO SERVER: legge i corsi pubblicati per la pagina pubblica.
 *
 * Usa la chiave di servizio (vedi `scripts/sql/corsi-2026-11.sql`: nessuna
 * policy per `anon`) e sceglie le colonne una per una, così chi ha caricato
 * il corso, il consenso e i messaggi dell'amministratore non escono mai.
 * Locandine e programmi stanno in un bucket privato: qui si firmano
 * indirizzi validi due giorni, più della cache della pagina.
 */


const DURATA_FIRMA = 60 * 60 * 48;

interface RigaCorso {
  id: string;
  tipo: TipoCorso;
  livello: LivelloCorso;
  maestro: string;
  prima_lezione: string;
  orari: CorsoPubblico["orari"];
  telefono: string;
  email: string | null;
  whatsapp: boolean;
  programma: string | null;
  costo: string | null;
  note: string | null;
  locandina_path: string | null;
  programma_path: string | null;
  asd_code: string;
}

const COLONNE =
  "id, tipo, livello, maestro, prima_lezione, orari, telefono, email, whatsapp, programma, costo, note, locandina_path, programma_path, asd_code";

async function completa(righe: RigaCorso[]): Promise<CorsoPubblico[]> {
  if (!righe.length) return [];
  const db = createAdminSupabaseClient();
  const codici = [...new Set(righe.map((r) => r.asd_code))];
  const { data: circoli } = await db
    .from("asd_clubs")
    .select("code, name, address, city, province, cap, lat, lng")
    .in("code", codici);
  const perCodice = new Map((circoli ?? []).map((c) => [c.code as string, c]));

  const percorsi = righe.flatMap((r) => [r.locandina_path, r.programma_path]).filter((p): p is string => !!p);
  const firme = new Map<string, string>();
  if (percorsi.length) {
    const { data } = await db.storage.from("corsi").createSignedUrls(percorsi, DURATA_FIRMA);
    for (const f of data ?? []) if (f.path && f.signedUrl) firme.set(f.path, f.signedUrl);
  }

  return righe.flatMap((r) => {
    const c = perCodice.get(r.asd_code);
    if (!c) return [];
    return [
      {
        id: r.id,
        tipo: r.tipo,
        livello: r.livello,
        maestro: r.maestro,
        primaLezione: r.prima_lezione,
        orari: Array.isArray(r.orari) ? r.orari : [],
        telefono: r.telefono,
        email: r.email,
        whatsapp: r.whatsapp,
        programma: r.programma,
        costo: r.costo,
        note: r.note,
        locandinaUrl: r.locandina_path ? (firme.get(r.locandina_path) ?? null) : null,
        locandinaPdf: !!r.locandina_path?.endsWith(".pdf"),
        programmaUrl: r.programma_path ? (firme.get(r.programma_path) ?? null) : null,
        circolo: {
          code: c.code,
          name: c.name ?? "",
          address: c.address ?? "",
          city: c.city ?? "",
          province: c.province ?? "",
          cap: c.cap ?? "",
          lat: c.lat ?? 0,
          lng: c.lng ?? 0,
        },
      },
    ];
  });
}

/** I corsi in pagina: pubblicati, con la prima lezione da non più di un mese. */
export async function corsiPubblicati(): Promise<CorsoPubblico[]> {
  try {
    const db = createAdminSupabaseClient();
    const { data, error } = await db
      .from("corsi")
      .select(COLONNE)
      .eq("stato", "pubblicato")
      .gte("prima_lezione", inizioVisibile())
      .order("prima_lezione", { ascending: true })
      .limit(500);
    if (error) throw error;
    return await completa((data ?? []) as RigaCorso[]);
  } catch (err) {
    segnalaSalvoRete("corsi:pubblicati", err);
    return [];
  }
}

/** Un corso pubblicato (anche se già iniziato da più di un mese: il link resta valido). */
export async function corsoPubblicato(id: string): Promise<CorsoPubblico | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  try {
    const db = createAdminSupabaseClient();
    const { data, error } = await db.from("corsi").select(COLONNE).eq("id", id).eq("stato", "pubblicato").maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return (await completa([data as RigaCorso]))[0] ?? null;
  } catch (err) {
    segnalaSalvoRete("corsi:uno", err);
    return null;
  }
}
