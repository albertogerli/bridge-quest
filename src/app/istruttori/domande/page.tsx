"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Briciole } from "@/components/briciole";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";
import { domandeDaTest, esercizioDaDomanda, problemiDomanda, type BozzaDomanda } from "@/lib/domande-scelta";
import { cancellaEsercizio, elencaMieiEsercizi, salvaEsercizio, type EsercizioPosizione } from "@/lib/esercizi-posizione";
import { descriviFigura, leggiFigura } from "@/lib/figura-domanda";
import { istante } from "@/lib/novita-insegnante";
import { gruppoTest, TEST_COMMISSIONE, type TestCommissione } from "@/lib/test-commissione";

const VUOTA: BozzaDomanda = { titolo: "", gruppo: "", domanda: "", opzioni: ["", "", ""], giuste: [], soluzione: "" };

/**
 * Le domande a scelta multipla dell'insegnante.
 *
 * Si mettono nei compiti insieme alle mani, da «Nuovo compito»: l'allievo
 * risponde con un tocco, la risposta si registra, l'insegnante vede chi ha
 * risposto cosa e la classe ha la sua classifica. Sono i test della
 * Commissione (Trevissoi, 02/11/2026); un test intero si incolla in una volta.
 */
export default function DomandePage() {
  const t = useT();
  const [mie, setMie] = useState<EsercizioPosizione[] | null>(null);
  const [bozza, setBozza] = useState<BozzaDomanda>(VUOTA);
  const [salvando, setSalvando] = useState(false);
  const [esito, setEsito] = useState<string | null>(null);
  const [incollato, setIncollato] = useState("");

  async function ricarica() {
    setMie((await elencaMieiEsercizi()).filter((e) => e.consegna === "scelta"));
  }
  useEffect(() => {
    let vivo = true;
    void elencaMieiEsercizi().then((tutti) => {
      if (vivo) setMie(tutti.filter((e) => e.consegna === "scelta"));
    });
    return () => { vivo = false; };
  }, []);

  const problemi = problemiDomanda(bozza);
  const gruppi = useMemo(() => {
    const m = new Map<string, EsercizioPosizione[]>();
    for (const e of mie ?? []) {
      const g = e.gruppo || t("Senza gruppo");
      m.set(g, [...(m.get(g) ?? []), e]);
    }
    // Dentro il gruppo, nell'ordine in cui sono state scritte: è l'ordine del test.
    return [...m.entries()].map(([g, d]) => [g, [...d].sort((a, b) => istante(a.created_at) - istante(b.created_at))] as const);
  }, [mie, t]);

  async function salva(domande: BozzaDomanda[]): Promise<number> {
    let fatte = 0;
    for (const d of domande) if (await salvaEsercizio(esercizioDaDomanda(d))) fatte++;
    return fatte;
  }

  async function salvaUna() {
    setSalvando(true);
    const fatte = await salva([bozza]);
    setSalvando(false);
    if (fatte === 1) {
      setEsito(t("Domanda salvata. La trovi in «Nuovo compito» di ogni classe."));
      setBozza({ ...VUOTA, gruppo: bozza.gruppo });
      void ricarica();
    } else {
      setEsito(t("Non salvata. Se succede sempre, va eseguito lo script delle domande a scelta."));
    }
  }

  async function importa() {
    const r = domandeDaTest(incollato);
    if (r.errore) {
      setEsito(t(r.errore));
      return;
    }
    setSalvando(true);
    const fatte = await salva(r.domande);
    setSalvando(false);
    setEsito(
      t("Salvate {n} domande su {m}.", { n: fatte, m: r.domande.length + r.scartate }) +
        (r.scartate > 0 ? " " + t("{n} scartate perché senza risposta giusta o con le opzioni incomplete.", { n: r.scartate }) : ""),
    );
    if (fatte > 0) {
      setIncollato("");
      void ricarica();
    }
  }

  const [aggiungendo, setAggiungendo] = useState<number | null>(null);
  const giaAggiunti = useMemo(() => new Set((mie ?? []).map((e) => e.gruppo)), [mie]);

  /** Un test della Commissione: le domande con le risposte arrivano dal server. */
  async function aggiungiTest(test: TestCommissione) {
    setAggiungendo(test.numero);
    setEsito(null);
    try {
      const r = await fetch("/api/istruttori/test-commissione", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: test.numero }),
      });
      const j = (await r.json().catch(() => ({}))) as { aggiunte?: number; gia?: boolean; codice?: string };
      if (r.ok && j.gia) setEsito(t("Il test {n} c'era già fra le tue domande.", { n: test.numero }));
      else if (r.ok) setEsito(t("Aggiunte {n} domande del test {m}. Le trovi qui sotto e in «Nuovo compito».", { n: j.aggiunte ?? 0, m: test.numero }));
      else if (r.status === 403) setEsito(t("Solo chi insegna può aggiungere i test."));
      else if (j.codice === "42703") setEsito(t("Non aggiunto: va eseguito lo script delle figure delle domande."));
      else setEsito(t("Non sono riuscito ad aggiungere il test. Riprova fra un momento."));
      if (r.ok) void ricarica();
    } catch {
      setEsito(t("Non sono riuscito ad aggiungere il test. Riprova fra un momento."));
    } finally {
      setAggiungendo(null);
    }
  }

  async function cancella(id: string) {
    if (await cancellaEsercizio(id)) void ricarica();
  }

  const campo = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24">
      <Briciole percorso={[{ etichetta: t("Le tue classi"), href: "/istruttori" }, { etichetta: t("Domande a scelta") }]} />
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("Domande a scelta")}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        {t("Le domande vanno nei compiti insieme alle mani, da «Nuovo compito». L'allievo risponde con un tocco; tu vedi chi ha risposto cosa, la divisione delle risposte e la classifica della classe.")}
      </p>

      <section className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-1 font-display text-lg font-bold">{t("I test della Commissione")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {t("I dodici test di Barion con le loro mani e le risposte giuste. Aggiungi quelli che ti servono: diventano domande tue, da mettere nei compiti.")}
        </p>
        <ul className="divide-y divide-border">
          {TEST_COMMISSIONE.map((test) => {
            const fatto = giaAggiunti.has(gruppoTest(test));
            return (
              <li key={test.numero} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t("Test {n}", { n: test.numero })} · {t(test.titolo)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Lezione {n} del programma", { n: test.lezioni.join(", ") })} · {t("{n} domande", { n: test.domande })}
                  </p>
                </div>
                {fatto ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {t("Aggiunto")}
                  </span>
                ) : (
                  <Button size="sm" variant="outline" disabled={aggiungendo !== null || mie === null} onClick={() => void aggiungiTest(test)}>
                    {aggiungendo === test.numero ? t("Aggiungo…") : t("Aggiungi")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-3 font-display text-lg font-bold">{t("Nuova domanda")}</h2>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              {t("Gruppo")}
              <input className={campo} value={bozza.gruppo} placeholder={t("Per esempio: Test 1 · Vincenti e affrancabili")} onChange={(e) => setBozza({ ...bozza, gruppo: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              {t("Titolo (facoltativo)")}
              <input className={campo} value={bozza.titolo} placeholder="1.1" onChange={(e) => setBozza({ ...bozza, titolo: e.target.value })} />
            </label>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            {t("Domanda")}
            <textarea className={campo} rows={2} value={bozza.domanda} onChange={(e) => setBozza({ ...bozza, domanda: e.target.value })} />
          </label>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">{t("Risposte: spunta quelle giuste")}</legend>
            {bozza.opzioni.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0"
                  aria-label={t("Giusta")}
                  checked={!!o.trim() && bozza.giuste.includes(o.trim())}
                  disabled={!o.trim()}
                  onChange={(e) =>
                    setBozza({
                      ...bozza,
                      giuste: e.target.checked ? [...bozza.giuste, o.trim()] : bozza.giuste.filter((g) => g !== o.trim()),
                    })
                  }
                />
                <input
                  className={campo}
                  value={o}
                  placeholder={t("Risposta {n}", { n: i + 1 })}
                  onChange={(e) => {
                    const opzioni = [...bozza.opzioni];
                    const prima = opzioni[i].trim();
                    opzioni[i] = e.target.value;
                    setBozza({ ...bozza, opzioni, giuste: bozza.giuste.map((g) => (g === prima ? e.target.value.trim() : g)) });
                  }}
                />
              </div>
            ))}
            <Button type="button" variant="ghost" className="justify-self-start" onClick={() => setBozza({ ...bozza, opzioni: [...bozza.opzioni, ""] })}>
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              {t("Un'altra risposta")}
            </Button>
          </fieldset>
          <label className="grid gap-1 text-sm font-medium">
            {t("Spiegazione (facoltativa)")}
            <textarea className={campo} rows={2} value={bozza.soluzione} onChange={(e) => setBozza({ ...bozza, soluzione: e.target.value })} />
          </label>
          {problemi.length > 0 && bozza.domanda.trim() && (
            <ul className="text-xs text-amber-700 dark:text-amber-300">
              {problemi.map((p) => <li key={p}>{t(p)}</li>)}
            </ul>
          )}
          <Button onClick={() => void salvaUna()} disabled={salvando || problemi.length > 0} className="justify-self-start">
            {t("Salva la domanda")}
          </Button>
        </div>
      </section>

      <details className="mb-8 rounded-2xl border border-border bg-card">
        <summary className="cursor-pointer list-none px-4 py-3 font-semibold sm:px-5">{t("Incolla un test intero")}</summary>
        <div className="grid gap-3 px-4 pb-4 sm:px-5">
          <p className="text-xs text-muted-foreground">
            {t("Il formato in cui sono trascritti i test della Commissione: un titolo e l'elenco delle domande, ognuna con testo, opzioni e risposta giusta. Le domande senza risposta giusta non si caricano.")}
          </p>
          <textarea className={`${campo} font-mono text-xs`} rows={6} value={incollato} onChange={(e) => setIncollato(e.target.value)} placeholder='{"titolo": "Test 1", "domande": [{"numero": "1.1", "testo": "…", "opzioni": ["…", "…"], "giusta": "…"}]}' />
          <Button variant="outline" onClick={() => void importa()} disabled={salvando || !incollato.trim()} className="justify-self-start">
            {t("Carica il test")}
          </Button>
        </div>
      </details>

      {esito && <p className="mb-6 rounded-lg bg-muted px-3 py-2 text-sm" role="status">{esito}</p>}

      <h2 className="mb-3 font-display text-lg font-bold">{t("Le tue domande")}</h2>
      {mie === null ? (
        <p className="text-sm text-muted-foreground">{t("Caricamento…")}</p>
      ) : mie.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Ancora nessuna domanda.")}</p>
      ) : (
        gruppi.map(([gruppo, domande]) => (
          <div key={gruppo} className="mb-5">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{gruppo} · {domande.length}</h3>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {domande.map((d) => (
                <li key={d.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-line text-sm font-medium">
                      {d.titolo && /^\d+\.\d+$/.test(d.titolo) && <span className="mr-1 text-muted-foreground">{d.titolo}</span>}
                      {d.domanda}
                    </p>
                    {(() => {
                      const f = leggiFigura(d.figura);
                      return f ? <p className="mt-0.5 text-xs">{descriviFigura(f, t)}</p> : null;
                    })()}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {(d.opzioni ?? []).map((o) => (d.risposte.includes(o) ? `✓ ${o}` : o)).join(" · ")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => void cancella(d.id)} aria-label={t("Cancella la domanda")}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
