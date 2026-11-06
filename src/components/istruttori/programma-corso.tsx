"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, Link2, Mail, MessageCircle, Printer, Send } from "lucide-react";
import Link from "@/components/link";
import { useT } from "@/contexts/traduzioni-provider";
import { useMyClasses } from "@/store/use-classes-store";
import { getClassAssignments } from "@/lib/instructors";
import { creaMateriale, materialiDellaClasse } from "@/lib/materiali-lezione-db";
import type { MaterialeLezione } from "@/lib/materiali-lezione";
import { etichettaLezioneProgramma, materialiDellaLezione, type VoceMateriale } from "@/lib/materiali-programma";
import { MODULI_PROGRAMMA, PROGRAMMA_PRIMO_LIVELLO, siglaGruppi, type LezioneProgramma } from "@/lib/programma-corso";
import { gruppoTest, siglaTest, type TestCommissione } from "@/lib/test-commissione";
import { assegnaTestCommissione } from "@/lib/assegna-test";
import { segnalaSalvoRete } from "@/lib/report-error";

/**
 * Il programma del Corso di Primo Livello, lezione per lezione, con le
 * quattro cose che servono a ognuna: slide, videolezione, dispensa ed
 * esercizi. Ognuna si vede, si stampa, si assegna alla classe o se ne manda il link
 * (Trevissoi, 03/11 e 06/11/2026).
 *
 * In «Materiali del corso» si sceglie la classe in cima; dentro una classe
 * (`classId`) la classe è quella. Con una classe scelta, ciò che le è già
 * stato dato ha la spunta «Assegnato»: l'insegnante vede a colpo d'occhio a
 * che punto è.
 *
 * «Assegna» mette slide, video e dispensa fra i «Materiali dopo la lezione»
 * della classe, visibili subito; gli esercizi diventano un compito, come
 * dalla pagina «Esercizi».
 */
export function ProgrammaCorso({ classId: classeFissa, onCambio }: { classId?: string; onCambio?: () => void }) {
  const t = useT();
  const { classes } = useMyClasses();
  const [scelta, setScelta] = useState("");
  const classId = classeFissa ?? (scelta || (classes.length === 1 ? classes[0].id : ""));
  const [materiali, setMateriali] = useState<MaterialeLezione[]>([]);
  /** I compiti della classe per titolo: il titolo dice se è assegnato, l'id dà il link. */
  const [compiti, setCompiti] = useState<Map<string, string>>(new Map());
  const [inCorso, setInCorso] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const ricarica = useCallback(async () => {
    if (!classId) return;
    try {
      const [m, c] = await Promise.all([materialiDellaClasse(classId), getClassAssignments(classId)]);
      setMateriali(m.materiali);
      setCompiti(new Map(c.map((a) => [a.title, a.id])));
    } catch (err) {
      segnalaSalvoRete("programma-corso:stato-classe", err);
    }
  }, [classId]);

  useEffect(() => {
    void ricarica();
  }, [ricarica]);

  const urlAssegnati = useMemo(() => new Set(materiali.map((m) => m.url)), [materiali]);

  async function assegnaVoce(l: LezioneProgramma, v: VoceMateriale) {
    if (!classId) return;
    const chiave = `${l.numero}|${v.url}`;
    setInCorso(chiave);
    setErrore(null);
    const lezione = etichettaLezioneProgramma(l);
    try {
      await creaMateriale(
        classId,
        {
          lesson_id: l.lezioniSito[0] != null ? String(l.lezioniSito[0]) : null,
          lezione,
          tipo: v.tipo,
          titolo: v.titolo,
          url: v.url,
          ordine: materiali.filter((m) => m.lezione === lezione && m.tipo === v.tipo).length,
        },
        new Date().toISOString(),
      );
      await ricarica();
      onCambio?.();
    } catch (err) {
      segnalaSalvoRete("programma-corso:assegna-materiale", err);
      setErrore(t("Non assegnato. Controlla la connessione e riprova."));
    } finally {
      setInCorso(null);
    }
  }

  async function assegnaEsercizi(test: TestCommissione) {
    if (!classId) return;
    setInCorso(`test|${test.numero}`);
    setErrore(null);
    const esito = await assegnaTestCommissione(classId, test);
    setInCorso(null);
    if (esito.ok) {
      await ricarica();
      onCambio?.();
    }
    else setErrore(t("Non sono riuscito ad assegnare gli esercizi. Riprova fra un momento."));
  }

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold font-display">{t("Programma del Corso di Primo Livello")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("Le venti lezioni della Commissione. Per ognuna: le slide da proiettare, la videolezione, la dispensa e gli esercizi, da vedere, stampare o assegnare alla classe. Le smazzate si assegnano da «Nuovo compito».")}
      </p>

      {!classeFissa && classes.length > 1 && (
        <label className="mb-4 flex flex-wrap items-center gap-2 text-sm font-medium">
          {t("Per la classe")}
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={scelta}
            onChange={(e) => setScelta(e.target.value)}
          >
            <option value="">{t("Scegli la classe per assegnare")}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      )}
      {errore && <p className="mb-3 text-sm text-destructive" role="alert">{errore}</p>}

      {([1, 2] as const).map((modulo) => (
        <div key={modulo} className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t(MODULI_PROGRAMMA[modulo])}</h3>
          <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {PROGRAMMA_PRIMO_LIVELLO.filter((l) => l.modulo === modulo).map((l) => {
              const m = materialiDellaLezione(l);
              const voci: { nome: string; elenco: VoceMateriale[] }[] = [
                { nome: t("Slide"), elenco: m.slide },
                { nome: t("Videolezione"), elenco: m.video },
                { nome: t("Dispensa"), elenco: m.dispense },
              ];
              return (
                <li key={l.numero} id={`programma-${l.numero}`} className="flex scroll-mt-20 gap-3 px-4 py-3">
                  <span className="w-7 shrink-0 font-display text-lg font-bold tabular-nums text-primary">{l.numero}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t(l.titolo)}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{l.tipo === "gioco" ? t("Gioco") : t("Teoria e gioco")}</span>
                      <span>
                        {l.smazzate === "tavolo"
                          ? t("Smazzate mescolate al tavolo")
                          : Array.isArray(l.smazzate)
                            ? t("Smazzate {sigla}", { sigla: siglaGruppi(l.smazzate) })
                            : t("Smazzate preparate da BridgeLab")}
                      </span>
                      {typeof l.smazzate === "object" && !Array.isArray(l.smazzate) && (
                        <a href={l.smazzate.file} download className="font-semibold text-primary hover:underline">
                          {t("Scarica le smazzate (PBN)")}
                        </a>
                      )}
                    </p>

                    <div className="mt-2 grid gap-1.5">
                      {voci.flatMap(({ nome, elenco }) =>
                        elenco.map((v) => {
                          const fatto = urlAssegnati.has(v.url);
                          return (
                            <Riga
                              key={v.url}
                              nome={nome}
                              titolo={t(v.etichetta)}
                              vedi={v.url}
                              stampa={v.stampabile ? v.url : null}
                              link={assoluto(v.url)}
                              assegnato={!!classId && fatto}
                              puoAssegnare={!!classId && !fatto}
                              occupato={inCorso === `${l.numero}|${v.url}`}
                              onAssegna={() => void assegnaVoce(l, v)}
                            />
                          );
                        }),
                      )}
                      {m.esercizi.map((x) => {
                        const idCompito = compiti.get(gruppoTest(x));
                        const fatto = !!idCompito;
                        return (
                          <Riga
                            key={x.numero}
                            nome={t("Esercizi")}
                            titolo={`${t("Lezione {n}", { n: siglaTest(x) })} · ${t(x.titolo)}`}
                            vedi={`/istruttori/domande#lezione-${siglaTest(x)}`}
                            vediInterno
                            stampa={`/istruttori/domande/stampa?test=${x.numero}`}
                            link={classId && idCompito ? assoluto(`/classi/${classId}/compito/${idCompito}`) : null}
                            assegnato={!!classId && fatto}
                            puoAssegnare={!!classId && !fatto}
                            occupato={inCorso === `test|${x.numero}`}
                            onAssegna={() => void assegnaEsercizi(x)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}

/**
 * L'indirizzo completo da mandare: quello del sito, non della finestra, così
 * da un'anteprima di prova non parte un link finto (come in `LinkCompito`).
 */
function assoluto(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function Riga({
  nome,
  titolo,
  vedi,
  vediInterno = false,
  stampa,
  link,
  assegnato,
  puoAssegnare,
  occupato,
  onAssegna,
}: {
  nome: string;
  titolo: string;
  vedi: string;
  vediInterno?: boolean;
  stampa: string | null;
  /**
   * «Link»: l'indirizzo da rimandare a chi ha perso la lezione o dice di non
   * averlo ricevuto, anche più volte e anche a chi non è in classe (Trevissoi,
   * 06/11/2026). Slide, dispense e video sono pubblici; gli esercizi sono un
   * compito della classe, e il link c'è solo dopo averli assegnati.
   */
  link: string | null;
  assegnato: boolean;
  puoAssegnare: boolean;
  occupato: boolean;
  onAssegna: () => void;
}) {
  const t = useT();
  const [apriLink, setApriLink] = useState(false);
  const [copiato, setCopiato] = useState(false);
  const messaggio = link ? t("«{titolo}» su BridgeLab: {url}", { titolo, url: link }) : "";
  async function copia() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2500);
    } catch {
      // Senza permesso agli appunti resta il campo da selezionare a mano.
    }
  }
  const azione = "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold text-primary hover:bg-primary/10";
  return (
    <div className={`rounded-lg px-2 py-1 text-xs ${assegnato ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted/40"}`}>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="w-24 shrink-0 font-semibold text-muted-foreground">{nome}</span>
      <span className="min-w-0 flex-1 truncate">{titolo}</span>
      {vediInterno ? (
        <Link href={vedi} className={azione}>
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          {t("Vedi")}
        </Link>
      ) : (
        <a href={vedi} target="_blank" rel="noopener" className={azione}>
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          {t("Vedi")}
        </a>
      )}
      {stampa && (
        <a href={stampa} target="_blank" rel="noopener" className={azione}>
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          {t("Stampa")}
        </a>
      )}
      {link && (
        <button type="button" onClick={() => setApriLink((x) => !x)} aria-expanded={apriLink} className={azione}>
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          {t("Link")}
        </button>
      )}
      {assegnato ? (
        <span className="inline-flex items-center gap-1 px-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {t("Assegnato")}
        </span>
      ) : puoAssegnare ? (
        <button type="button" onClick={onAssegna} disabled={occupato} className={`${azione} disabled:opacity-50`}>
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          {occupato ? t("Assegno…") : t("Assegna")}
        </button>
      ) : null}
    </div>
    {apriLink && link && (
      <div className="mt-1.5 mb-1 space-y-1.5">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={t("Il link da mandare")}
          className="w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
        />
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => void copia()} className={azione}>
            {copiato ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copiato ? t("Copiato") : t("Copia il link")}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(messaggio)}`} target="_blank" rel="noopener" className={azione}>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            WhatsApp
          </a>
          <a href={`mailto:?subject=${encodeURIComponent(titolo)}&body=${encodeURIComponent(messaggio)}`} className={azione}>
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {t("Email")}
          </a>
        </div>
      </div>
    )}
    </div>
  );
}
