import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import type { Smazzata } from "@/lib/catalog";

/**
 * Il commento di una smazzata, chiesto una mano alla volta invece che tutto
 * insieme.
 *
 * PERCHÉ NON STA PIÙ NEL CATALOGO. Il catalogo si carica in una query sola,
 * duecentosettanta mani, e finché i commenti erano dentro quella query erano
 * nel browser di chiunque prima ancora di aprire una pagina — compresi quelli
 * delle mani assegnate come compito per stasera. Il pulsante «Mostra
 * suggerimento» sembrava un controllo e non lo era.
 *
 * Ora l'unica via è `smazzate_commenti`, che decide a chi rispondere: la regola
 * sta nel database, in `scripts/sql/soluzioni-dopo-il-gioco-2026-08.sql`, e in
 * breve dice che il commento di una mano si nega quando quella mano è dentro un
 * compito ancora da fare di chi lo chiede. Da qui non si distingue «non c'è
 * commento» da «non te lo do»: in entrambi i casi non si mostra niente, ed è
 * giusto così — la seconda risposta sarebbe già un'informazione.
 *
 * SI METTE IN CACHE SOLO QUELLO CHE ARRIVA. Un commento negato oggi va
 * riconcesso appena l'allievo gioca la mano, e ricordarsi il rifiuto vorrebbe
 * dire tenerglielo nascosto per tutta la sessione.
 */

const cache = new Map<string, string>();

/** Svuota la cache: serve ai test, e a chi cambia utente senza ricaricare. */
export function svuotaCacheCommenti(): void {
  cache.clear();
}

interface RigaCommento {
  id: string;
  commentary: string | null;
  commentary_en: string | null;
}

/**
 * I commenti delle mani richieste, per quelle a cui si ha diritto.
 *
 * Le mani già in cache non vengono richieste di nuovo; se non ne resta
 * nessuna da chiedere non parte alcuna chiamata.
 */
export async function caricaCommenti(
  ids: string[],
  lingua: "it" | "en" = "it",
): Promise<Map<string, string>> {
  const mancanti = [...new Set(ids)].filter((id) => id && !cache.has(chiave(id, lingua)));

  if (mancanti.length > 0) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("smazzate_commenti", { p_ids: mancanti });
    if (error) {
      reportError("commenti-smazzate:carica", error);
    } else {
      for (const riga of (data ?? []) as RigaCommento[]) {
        const it = riga.commentary ?? "";
        const en = riga.commentary_en ?? "";
        if (it) cache.set(chiave(riga.id, "it"), it);
        // Senza traduzione si ripiega sull'italiano, come ovunque nel catalogo.
        cache.set(chiave(riga.id, "en"), en || it);
      }
    }
  }

  const esito = new Map<string, string>();
  for (const id of ids) {
    const c = cache.get(chiave(id, lingua));
    if (c) esito.set(id, c);
  }
  return esito;
}

function chiave(id: string, lingua: "it" | "en"): string {
  return `${lingua}:${id}`;
}

/**
 * Il commento che una mano porta già con sé, se ce l'ha.
 *
 * Le mani importate da PBN o generate dall'insegnante non stanno nel catalogo:
 * stanno dentro il compito, e arrivano già filtrate da `compito_per_allievo`.
 * Per quelle non c'è niente da chiedere — quello che è arrivato è quello che
 * si può vedere.
 */
export function commentoGiaPresente(s: Smazzata | undefined | null): string | undefined {
  const c = s?.commentary;
  return c && c.trim() !== "" ? c : undefined;
}
