"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, ExternalLink, GraduationCap } from "lucide-react";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";
import { useAsdClubs } from "@/store/use-asd-store";
import {
  ETICHETTA_LIVELLO, ETICHETTA_TIPO, dataNonPassata, orariLeggibili,
  type Giorno, type LivelloCorso, type StatoCorso, type TipoCorso,
} from "@/lib/corsi";

interface Riga {
  id: string;
  user_id: string | null;
  stato: StatoCorso;
  tipo: TipoCorso;
  asd_code: string;
  livello: LivelloCorso;
  maestro: string;
  prima_lezione: string;
  orari: { giorno: Giorno; dalle: string; alle: string }[];
  telefono: string;
  email: string | null;
  whatsapp: boolean;
  locandina_path: string | null;
  programma: string | null;
  programma_path: string | null;
  costo: string | null;
  note: string | null;
  ha_classe_bridgelab: boolean;
  messaggio_admin: string | null;
  sostituisce: string | null;
  created_at: string;
}

type Filtro = "in-attesa" | "pubblicato" | "da-modificare" | "tutti";
const FILTRI: { f: Filtro; nome: string }[] = [
  { f: "in-attesa", nome: "Da approvare" },
  { f: "pubblicato", nome: "Pubblicati" },
  { f: "da-modificare", nome: "In attesa di modifica" },
  { f: "tutti", nome: "Tutti" },
];
const STATO: Record<StatoCorso, string> = {
  "in-attesa": "Da approvare",
  pubblicato: "Pubblicato",
  "da-modificare": "Modifica chiesta",
  rifiutato: "Rifiutato",
  sostituito: "Sostituito",
  ritirato: "Ritirato",
};

/**
 * La coda dei corsi. Ogni corso si vede com'è e accanto i controlli già fatti:
 * il circolo viene dall'elenco FIGB (sempre vero, il modulo non permette
 * altro), la data, la locandina e — per i «Bridge 5.0» — se chi l'ha caricato
 * ha davvero una classe su BridgeLab. Decide l'amministratore.
 */
export default function AdminCorsiPage() {
  const t = useT();
  const { clubs } = useAsdClubs();
  const [filtro, setFiltro] = useState<Filtro>("in-attesa");
  const [righe, setRighe] = useState<Riga[]>([]);
  const [caricando, setCaricando] = useState(true);
  const [file, setFile] = useState<Record<string, string>>({});
  const [messaggi, setMessaggi] = useState<Record<string, string>>({});
  const [lavoro, setLavoro] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const carica = useCallback(async () => {
    setCaricando(true);
    try {
      const supabase = createClient();
      let q = supabase.from("corsi").select("*").order("created_at", { ascending: false }).limit(200);
      if (filtro !== "tutti") q = q.eq("stato", filtro);
      const { data, error } = await q;
      if (error) throw error;
      const elenco = (data ?? []) as Riga[];
      setRighe(elenco);
      const percorsi = elenco.flatMap((r) => [r.locandina_path, r.programma_path]).filter((p): p is string => !!p);
      if (percorsi.length) {
        const { data: firme } = await supabase.storage.from("corsi").createSignedUrls(percorsi, 3600);
        setFile(Object.fromEntries((firme ?? []).flatMap((f) => (f.path && f.signedUrl ? [[f.path, f.signedUrl] as const] : []))));
      }
    } catch (err) {
      segnalaSalvoRete("admin:corsi", err);
    } finally {
      setCaricando(false);
    }
  }, [filtro]);

  useEffect(() => {
    void carica();
  }, [carica]);

  async function decidi(id: string, azione: "approva" | "modifica" | "rifiuta" | "ritira") {
    setErrore(null);
    const messaggio = messaggi[id]?.trim() || null;
    if (azione === "modifica" && !messaggio) {
      setErrore(id);
      return;
    }
    if ((azione === "rifiuta" || azione === "ritira") && !window.confirm(azione === "rifiuta" ? t("Rifiutare questo corso?") : t("Togliere il corso dalla pagina pubblica?"))) return;
    setLavoro(id);
    try {
      const res = await fetch("/api/admin/corsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, azione, messaggio }),
      });
      if (!res.ok) throw new Error(`admin corsi ${res.status}`);
      await carica();
    } catch (err) {
      segnalaSalvoRete("admin:corsi:decidi", err);
      setErrore(`${id}:rete`);
    } finally {
      setLavoro(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Amministrazione
      </Link>
      <h1 className="mt-3 mb-1 flex items-center gap-2 font-display text-3xl font-bold">
        <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" />
        {t("Corsi di bridge")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("I corsi caricati dagli utenti. Escono su /corsi solo quando li approvi; chi li ha caricati riceve l'esito per mail.")}{" "}
        <Link href="/corsi" className="font-semibold text-primary hover:underline">{t("Apri la pagina pubblica")}</Link>
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTRI.map(({ f, nome }) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            aria-pressed={filtro === f}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
          >
            {t(nome)}
          </button>
        ))}
      </div>

      {caricando ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : righe.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("Nessun corso qui.")}</p>
      ) : (
        <ul className="space-y-4">
          {righe.map((r) => {
            const circolo = clubs.find((c) => c.code === r.asd_code);
            const controlli = [
              { ok: !!circolo, testo: circolo ? t("Circolo nell'elenco FIGB") : t("Circolo non trovato nell'elenco FIGB") },
              { ok: dataNonPassata(r.prima_lezione), testo: dataNonPassata(r.prima_lezione) ? t("Prima lezione nel futuro") : t("Prima lezione già passata") },
              // Facoltativa: senza, la scheda mostra il nome del circolo. Non è un allarme.
              { ok: true, testo: r.locandina_path ? t("Locandina caricata") : t("Senza locandina: la scheda mostrerà il nome del circolo") },
              ...(r.tipo === "bridge-5"
                ? [{ ok: r.ha_classe_bridgelab, testo: r.ha_classe_bridgelab ? t("Chi l'ha caricato ha una classe su BridgeLab") : t("Dichiarato 5.0, ma chi l'ha caricato non ha classi su BridgeLab") }]
                : []),
            ];
            const loc = r.locandina_path ? file[r.locandina_path] : null;
            const prog = r.programma_path ? file[r.programma_path] : null;
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <div>
                    {loc ? (
                      <a href={loc} target="_blank" rel="noopener noreferrer" className="block">
                        {r.locandina_path?.endsWith(".pdf") ? (
                          <span className="flex aspect-[3/4] items-center justify-center rounded-xl border border-border bg-muted text-sm font-semibold">{t("Locandina in PDF")}</span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element -- indirizzo firmato che scade in un'ora
                          <img src={loc} alt={t("Locandina")} className="aspect-[3/4] w-full rounded-xl border border-border object-cover" />
                        )}
                      </a>
                    ) : (
                      <span className="flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">{t("Senza locandina")}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-bold ${r.tipo === "bridge-5" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{t(ETICHETTA_TIPO[r.tipo])}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">{t(STATO[r.stato])}</span>
                      {r.sostituisce && <span className="rounded-full border border-border px-2 py-0.5 font-semibold">{t("Modifica di un corso pubblicato")}</span>}
                      <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("it-IT")}</span>
                    </div>
                    <h2 className="mt-2 font-display text-xl font-bold">{circolo?.name ?? r.asd_code}</h2>
                    <p className="text-sm text-muted-foreground">{[circolo?.address, circolo?.city].filter(Boolean).join(", ")}</p>
                    <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">{t("Livello")}</dt><dd>{t(ETICHETTA_LIVELLO[r.livello])}</dd>
                      <dt className="text-muted-foreground">{t("Maestro")}</dt><dd>{r.maestro}</dd>
                      <dt className="text-muted-foreground">{t("Inizio")}</dt><dd className="tabular-nums">{r.prima_lezione}</dd>
                      <dt className="text-muted-foreground">{t("Orari")}</dt><dd className="tabular-nums">{orariLeggibili(r.orari ?? [], t)}</dd>
                      <dt className="text-muted-foreground">{t("Telefono")}</dt><dd className="tabular-nums">{r.telefono}{r.whatsapp ? " · WhatsApp" : ""}</dd>
                      {r.email && (<><dt className="text-muted-foreground">Email</dt><dd className="break-all">{r.email}</dd></>)}
                      {r.costo && (<><dt className="text-muted-foreground">{t("Costo")}</dt><dd>{r.costo}</dd></>)}
                      {r.note && (<><dt className="text-muted-foreground">{t("Note")}</dt><dd className="whitespace-pre-line">{r.note}</dd></>)}
                    </dl>
                    {(r.programma || prog) && (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer font-semibold">{t("Programma delle lezioni")}</summary>
                        {r.programma && <p className="mt-1 whitespace-pre-line">{r.programma}</p>}
                        {prog && <a href={prog} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline"><ExternalLink className="size-3.5" aria-hidden="true" />{t("Programma in PDF")}</a>}
                      </details>
                    )}
                    <ul className="mt-3 grid gap-1 text-sm">
                      {controlli.map((c) => (
                        <li key={c.testo} className={`flex items-start gap-2 ${c.ok ? "" : "font-semibold text-destructive"}`}>
                          {c.ok ? <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                          {c.testo}
                        </li>
                      ))}
                    </ul>
                    {r.messaggio_admin && <p className="mt-2 text-sm text-muted-foreground">{t("Messaggio mandato: {m}", { m: r.messaggio_admin })}</p>}

                    {(r.stato === "in-attesa" || r.stato === "pubblicato") && (
                      <div className="mt-4 grid gap-2">
                        {r.stato === "in-attesa" && (
                          <label>
                            <span className="sr-only">{t("Messaggio per chi l'ha caricato")}</span>
                            <textarea
                              className="min-h-16 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                              placeholder={t("Messaggio per chi l'ha caricato (obbligatorio per chiedere una modifica)")}
                              value={messaggi[r.id] ?? ""}
                              onChange={(e) => setMessaggi((m) => ({ ...m, [r.id]: e.target.value }))}
                              maxLength={2000}
                            />
                          </label>
                        )}
                        {errore === r.id && <p role="alert" className="text-sm font-semibold text-destructive">{t("Scrivi cosa va modificato.")}</p>}
                        {errore === `${r.id}:rete` && <p role="alert" className="text-sm font-semibold text-destructive">{t("Non è andata: riprova.")}</p>}
                        <div className="flex flex-wrap gap-2">
                          {r.stato === "in-attesa" ? (
                            <>
                              <Button disabled={lavoro === r.id} onClick={() => void decidi(r.id, "approva")}>{t("Approva e pubblica")}</Button>
                              <Button variant="outline" disabled={lavoro === r.id} onClick={() => void decidi(r.id, "modifica")}>{t("Chiedi una modifica")}</Button>
                              <Button variant="ghost" disabled={lavoro === r.id} onClick={() => void decidi(r.id, "rifiuta")}>{t("Rifiuta")}</Button>
                            </>
                          ) : (
                            <>
                              <Link href={`/corsi/${r.id}`} className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted">{t("Vedi online")}</Link>
                              <Button variant="ghost" disabled={lavoro === r.id} onClick={() => void decidi(r.id, "ritira")}>{t("Ritira dalla pagina")}</Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
