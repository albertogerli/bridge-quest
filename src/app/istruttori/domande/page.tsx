"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Printer, Send, Trash2 } from "lucide-react";
import { Briciole } from "@/components/briciole";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";
import { domandeDaTest, esercizioDaDomanda, problemiDomanda, type BozzaDomanda } from "@/lib/domande-scelta";
import { cancellaEsercizio, elencaMieiEsercizi, salvaEsercizio, type EsercizioPosizione } from "@/lib/esercizi-posizione";
import { descriviFigura, leggiFigura } from "@/lib/figura-domanda";
import { istante } from "@/lib/novita-insegnante";
import { gruppoTest, siglaTest, TEST_COMMISSIONE, type TestCommissione } from "@/lib/test-commissione";
import { assegnaTestCommissione } from "@/lib/assegna-test";
import { useMyClasses } from "@/store/use-classes-store";
import { LinkCompito } from "@/components/istruttori/link-compito";
import Link from "@/components/link";

const VUOTA: BozzaDomanda = { titolo: "", gruppo: "", domanda: "", opzioni: ["", "", ""], giuste: [], soluzione: "" };

/**
 * Gli esercizi: quelli della Commissione, lezione per lezione, e le domande a
 * scelta che l'insegnante scrive da sé.
 *
 * UNA PAGINA SOLA, perché i test della Commissione SONO gli esercizi
 * (Trevissoi, 06/11/2026): stesse domande dei fogli da stampare. Qui per
 * ognuno ci sono le due cose che servono a fine lezione — assegnarlo alla
 * classe, con il link da mandare su WhatsApp, e stamparlo. Sotto, le domande
 * proprie, che vanno nei compiti come quelle della Commissione.
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

  const giaAggiunti = useMemo(() => new Set((mie ?? []).map((e) => e.gruppo)), [mie]);
  const { classes } = useMyClasses();
  const [assegnando, setAssegnando] = useState<number | null>(null);
  const [classeScelta, setClasseScelta] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [assegnato, setAssegnato] = useState<{ test: number; classId: string; id: string; titolo: string } | null>(null);
  const [erroreAssegna, setErroreAssegna] = useState<string | null>(null);

  async function assegna(test: TestCommissione) {
    if (!classeScelta) return;
    setInCorso(true);
    setErroreAssegna(null);
    const esito = await assegnaTestCommissione(classeScelta, test);
    setInCorso(false);
    if (!esito.ok) {
      setErroreAssegna(
        esito.motivo === "solo-insegnanti"
          ? t("Solo chi insegna può assegnare gli esercizi.")
          : esito.motivo === "manca-script"
            ? t("Non assegnato: va eseguito lo script delle figure delle domande.")
            : t("Non sono riuscito ad assegnare gli esercizi. Riprova fra un momento."),
      );
      return;
    }
    setAssegnato({ test: test.numero, classId: classeScelta, id: esito.compito.id, titolo: esito.titolo });
    setAssegnando(null);
    void ricarica();
  }

  async function cancella(id: string) {
    if (await cancellaEsercizio(id)) void ricarica();
  }

  const campo = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24">
      <Briciole percorso={[{ etichetta: t("Le tue classi"), href: "/istruttori" }, { etichetta: t("Esercizi") }]} />
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("Esercizi")}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        {t("Gli esercizi della Commissione, lezione per lezione: a fine lezione li assegni alla classe e mandi il link agli allievi. Rispondono online con un tocco; tu vedi chi ha risposto cosa e quali domande rispiegare.")}
      </p>

      <section className="mb-10 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-1 font-display text-lg font-bold">{t("Gli esercizi della Commissione")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {t("Numerati come le lezioni del corso. «Stampa» apre il foglio da stampare, con le soluzioni in fondo.")}
        </p>
        <ul className="divide-y divide-border">
          {TEST_COMMISSIONE.map((test) => {
            const aperto = assegnando === test.numero;
            return (
              <li key={test.numero} id={`lezione-${siglaTest(test)}`} className="scroll-mt-20 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {t("Lezione {n}", { n: siglaTest(test) })} · {t(test.titolo)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("{n} domande", { n: test.domande })}
                      {giaAggiunti.has(gruppoTest(test)) && <> · {t("fra le tue domande")}</>}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/istruttori/domande/stampa?test=${test.numero}`} target="_blank">
                      <Printer className="h-4 w-4" aria-hidden="true" />
                      {t("Stampa")}
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={aperto ? "default" : "outline"}
                    onClick={() => {
                      setAssegnando(aperto ? null : test.numero);
                      setErroreAssegna(null);
                      if (!classeScelta && classes.length === 1) setClasseScelta(classes[0].id);
                    }}
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {t("Assegna")}
                  </Button>
                </div>

                {aperto && (
                  <div className="mt-3 grid gap-2 rounded-xl bg-muted/40 p-3 sm:flex sm:flex-wrap sm:items-end">
                    <label className="grid gap-1 text-sm font-medium sm:min-w-64 sm:flex-1">
                      {t("A quale classe?")}
                      <select className={campo} value={classeScelta} onChange={(e) => setClasseScelta(e.target.value)}>
                        <option value="">{t("Scegli la classe")}</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                    <Button onClick={() => void assegna(test)} disabled={!classeScelta || inCorso}>
                      {inCorso ? t("Assegno…") : t("Assegna adesso")}
                    </Button>
                    {erroreAssegna && <p className="text-sm text-destructive sm:basis-full">{erroreAssegna}</p>}
                  </div>
                )}

                {assegnato?.test === test.numero && (
                  <div className="mt-3">
                    <p className="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300" role="status">
                      {t("Assegnato. Gli allievi lo trovano nella pagina della classe; puoi anche mandare il link.")}{" "}
                      <Link href={`/istruttori/${assegnato.classId}/compito/${assegnato.id}`} className="text-primary underline">
                        {t("Vedi le risposte")}
                      </Link>
                    </p>
                    <LinkCompito classId={assegnato.classId} assignmentId={assegnato.id} titolo={assegnato.titolo} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <h2 className="mb-1 font-display text-xl font-bold">{t("Le tue domande a scelta")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("Per esercizi nuovi o in più rispetto a quelli della Commissione. Vanno nei compiti insieme alle mani, da «Nuovo compito».")}
      </p>

      <section className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-3 font-display text-lg font-bold">{t("Nuova domanda")}</h2>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              {t("Gruppo")}
              <input className={campo} value={bozza.gruppo} placeholder={t("Per esempio: Ripasso dell'attacco")} onChange={(e) => setBozza({ ...bozza, gruppo: e.target.value })} />
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

      <h3 className="mb-3 font-display text-lg font-bold">{t("Le domande che hai")}</h3>
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
                      {d.titolo && /^\d+[a-z]?\.\d+$/.test(d.titolo) && <span className="mr-1 text-muted-foreground">{d.titolo}</span>}
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
