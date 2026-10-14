"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, FileText, Loader2, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BricioleClasse } from "@/components/istruttori/briciole-classe";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import { useCatalog } from "@/store/use-catalog-store";
import { getClassAssignments } from "@/lib/instructors";
import { getYouTubeWatchUrl } from "@/components/maestro-video";
import { getLessonDisplayNumber } from "@/data/lesson-meta";
import { reportError, segnalaSalvoRete } from "@/lib/report-error";
import { CollegamentoMateriale } from "@/components/collegamento-materiale";
import {
  aDatetimeLocale,
  daDatetimeLocale,
  raggruppaPerLezione,
  statoMateriale,
  urlValido,
  type MaterialeLezione,
  type TipoMateriale,
} from "@/lib/materiali-lezione";
import {
  aggiornaMateriale,
  creaMateriale,
  eliminaMateriale,
  impostaPubblicazione,
  materialiDellaClasse,
  type DatiMateriale,
} from "@/lib/materiali-lezione-db";

/** Una lezione del catalogo già assegnata a questa classe: da qui vengono i suggerimenti. */
interface LezioneAssegnata {
  lessonId: number;
  corsoId: string;
  etichetta: string;
  assignmentId: string;
}

const ICONE: Record<TipoMateriale, LucideIcon> = {
  video: Video,
  dispensa: FileText,
  esercizio: ClipboardList,
};

const campo =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * I materiali da mandare alla classe dopo ogni lezione.
 *
 * PERCHÉ ESISTE. Richiesta di Giuseppe Trevissoi, 14/10/2026: dopo ogni
 * lezione partono la videolezione, la dispensa e l'esercizio, in quest'ordine.
 * Non sempre tutti e tre, a volte due dello stesso tipo, e ognuno quando lo
 * decide l'insegnante. Fin qui l'unica cosa «rilasciabile» era il compito, e
 * usciva nel momento in cui lo si creava.
 *
 * TRE STATI E BASTA: nascosto, programmato, pubblicato. Il programmato esce
 * da solo all'ora scelta — lo decide il database, non questa pagina: non serve
 * che l'insegnante torni a premere, né che qualcuno tenga aperto il computer.
 *
 * PER CHI LA USA. Insegnanti spesso non giovani, spesso dal tablet: controlli
 * alti, parole di tutti i giorni, nessuna sigla.
 */
export default function MaterialiLezionePage({ params }: { params: Promise<{ classId: string }> }) {
  const t = useT();
  const { lingua } = useLingua();
  const { classId } = use(params);
  const { courses } = useCatalog();

  const [materiali, setMateriali] = useState<MaterialeLezione[]>([]);
  const [disponibile, setDisponibile] = useState(true);
  const [caricando, setCaricando] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [compiti, setCompiti] = useState<{ id: string; lesson_id: number | null }[]>([]);
  /** null = chiuso; "nuovo" = aggiunta; altrimenti l'id del materiale che si sta modificando. */
  const [modulo, setModulo] = useState<string | null>(null);
  /** Il materiale di cui si sta scegliendo l'ora di uscita. */
  const [programmando, setProgrammando] = useState<{ id: string; valore: string } | null>(null);
  const [inCorso, setInCorso] = useState<string | null>(null);

  const ricarica = useCallback(async () => {
    try {
      const esito = await materialiDellaClasse(classId);
      setDisponibile(esito.disponibile);
      setMateriali(esito.materiali);
    } catch (err) {
      segnalaSalvoRete("materiali-lezione:carica", err);
      setErrore(t("Non riesco a leggere i materiali. Riprova fra poco."));
    } finally {
      setCaricando(false);
    }
  }, [classId, t]);

  useEffect(() => {
    void ricarica();
  }, [ricarica]);

  useEffect(() => {
    let vivo = true;
    getClassAssignments(classId)
      .then((c) => {
        if (vivo) setCompiti(c.map((a) => ({ id: a.id, lesson_id: a.lesson_id })));
      })
      .catch((err) => segnalaSalvoRete("materiali-lezione:compiti", err));
    return () => {
      vivo = false;
    };
  }, [classId]);

  /**
   * Le lezioni del catalogo già assegnate alla classe. Si parte da quelle
   * perché sono le lezioni che l'insegnante sta davvero facendo: l'elenco
   * completo di quattro corsi sarebbe una tendina da cinquanta righe.
   */
  const lezioniAssegnate = useMemo<LezioneAssegnata[]>(() => {
    const out: LezioneAssegnata[] = [];
    for (const c of compiti) {
      if (c.lesson_id == null) continue;
      for (const corso of courses) {
        const l = corso.lessons.find((x) => x.id === c.lesson_id);
        if (!l) continue;
        out.push({
          lessonId: l.id,
          corsoId: corso.id,
          etichetta: t("Lezione {n} – {titolo}", { n: getLessonDisplayNumber(l.id), titolo: l.title }),
          assignmentId: c.id,
        });
      }
    }
    return out.sort((a, b) => a.lessonId - b.lessonId);
  }, [compiti, courses, t]);

  const gruppi = useMemo(() => raggruppaPerLezione(materiali, "creazione"), [materiali]);
  const etichetteLibere = useMemo(
    () =>
      [...new Set(materiali.filter((m) => m.lesson_id == null).map((m) => m.lezione))].filter(
        (e) => !lezioniAssegnate.some((l) => l.etichetta === e),
      ),
    [materiali, lezioniAssegnate],
  );

  async function esegui(id: string, scope: string, azione: () => Promise<void>) {
    setInCorso(id);
    setErrore(null);
    try {
      await azione();
      await ricarica();
    } catch (err) {
      reportError(scope, err);
      setErrore(t("Non è andata a buon fine. Riprova."));
    } finally {
      setInCorso(null);
    }
  }

  function quandoLeggibile(iso: string): string {
    return new Date(iso).toLocaleString(lingua === "en" ? "en-US" : "it-IT", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (caricando) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <BricioleClasse classId={classId} pagina={"Materiali dopo la lezione"} />
      <h1 className="mb-1 font-display text-2xl font-bold sm:text-3xl">{t("Materiali dopo la lezione")}</h1>
      <p className="mb-6 text-base text-muted-foreground">
        {t("La videolezione, la dispensa e l'esercizio di ogni lezione. Decidi tu quando gli allievi li vedono: subito, a un'ora precisa, o più avanti.")}
      </p>

      {!disponibile ? (
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-base">
          {t("Questa funzione è in attivazione: fra poco potrai preparare qui i materiali da mandare alla classe.")}
        </p>
      ) : (
        <>
          {errore && (
            <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-base text-destructive">
              {errore}
            </p>
          )}

          {modulo === "nuovo" ? (
            <ModuloMateriale
              classId={classId}
              lezioniAssegnate={lezioniAssegnate}
              etichetteLibere={etichetteLibere}
              materiali={materiali}
              occupato={inCorso === "nuovo"}
              onAnnulla={() => setModulo(null)}
              onSalva={(dati, quando) =>
                void esegui("nuovo", "materiali-lezione:crea", async () => {
                  await creaMateriale(classId, dati, quando);
                  setModulo(null);
                })
              }
            />
          ) : (
            <Button size="lg" className="mb-6 h-12 text-base" onClick={() => setModulo("nuovo")}>
              {t("Aggiungi materiale")}
            </Button>
          )}

          {gruppi.length === 0 && modulo !== "nuovo" && (
            <p className="text-base text-muted-foreground">
              {t("Non hai ancora preparato materiali per questa classe.")}
            </p>
          )}

          <div className="space-y-6">
            {gruppi.map((g) => (
              <section key={g.lezione} className="rounded-xl border border-border bg-card">
                <h2 className="border-b border-border px-4 py-3 font-display text-lg font-semibold">{g.lezione}</h2>
                <ul className="divide-y divide-border">
                  {g.materiali.map((m) => {
                    const Icona = ICONE[m.tipo];
                    const stato = statoMateriale(m);
                    const occupato = inCorso === m.id;
                    if (modulo === m.id) {
                      return (
                        <li key={m.id} className="p-4">
                          <ModuloMateriale
                            classId={classId}
                            lezioniAssegnate={lezioniAssegnate}
                            etichetteLibere={etichetteLibere}
                            materiali={materiali}
                            iniziale={m}
                            occupato={occupato}
                            onAnnulla={() => setModulo(null)}
                            onSalva={(dati) =>
                              void esegui(m.id, "materiali-lezione:modifica", async () => {
                                await aggiornaMateriale(m.id, dati);
                                setModulo(null);
                              })
                            }
                          />
                        </li>
                      );
                    }
                    return (
                      <li key={m.id} className="space-y-3 px-4 py-4">
                        <div className="flex items-start gap-3">
                          <Icona className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold">{m.titolo}</p>
                            <CollegamentoMateriale
                              url={m.url}
                              className="block truncate text-sm text-primary underline-offset-2 hover:underline"
                            >
                              {m.url}
                            </CollegamentoMateriale>
                          </div>
                          {stato === "pubblicato" ? (
                            <Badge>{t("Pubblicato")}</Badge>
                          ) : stato === "programmato" ? (
                            <Badge variant="outline">
                              {t("Programmato per {quando}", { quando: quandoLeggibile(m.pubblica_dal ?? "") })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{t("Nascosto")}</Badge>
                          )}
                        </div>

                        {programmando?.id === m.id ? (
                          <div className="flex flex-wrap items-end gap-2">
                            <label className="min-w-0 flex-1 basis-56 space-y-1">
                              <span className="block text-sm font-medium">{t("Giorno e ora di uscita")}</span>
                              <input
                                type="datetime-local"
                                className={campo}
                                value={programmando.valore}
                                onChange={(e) => setProgrammando({ id: m.id, valore: e.target.value })}
                              />
                            </label>
                            <Button
                              size="lg"
                              disabled={occupato || !daDatetimeLocale(programmando.valore)}
                              onClick={() => {
                                const quando = daDatetimeLocale(programmando.valore);
                                if (!quando) return;
                                void esegui(m.id, "materiali-lezione:programma", async () => {
                                  await impostaPubblicazione(m.id, quando);
                                  setProgrammando(null);
                                });
                              }}
                            >
                              {t("Conferma")}
                            </Button>
                            <Button size="lg" variant="ghost" onClick={() => setProgrammando(null)}>
                              {t("Annulla")}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {stato !== "pubblicato" && (
                              <Button
                                size="lg"
                                disabled={occupato}
                                onClick={() =>
                                  void esegui(m.id, "materiali-lezione:pubblica", () =>
                                    impostaPubblicazione(m.id, new Date().toISOString()),
                                  )
                                }
                              >
                                {t("Pubblica ora")}
                              </Button>
                            )}
                            <Button
                              size="lg"
                              variant="outline"
                              disabled={occupato}
                              onClick={() =>
                                setProgrammando({
                                  id: m.id,
                                  valore: m.pubblica_dal && stato === "programmato" ? aDatetimeLocale(m.pubblica_dal) : "",
                                })
                              }
                            >
                              {t("Programma")}
                            </Button>
                            {stato !== "nascosto" && (
                              <Button
                                size="lg"
                                variant="outline"
                                disabled={occupato}
                                onClick={() =>
                                  void esegui(m.id, "materiali-lezione:nascondi", () => impostaPubblicazione(m.id, null))
                                }
                              >
                                {t("Nascondi")}
                              </Button>
                            )}
                            <Button size="lg" variant="ghost" disabled={occupato} onClick={() => setModulo(m.id)}>
                              {t("Modifica")}
                            </Button>
                            <Button
                              size="lg"
                              variant="ghost"
                              disabled={occupato}
                              className="text-destructive"
                              onClick={() => {
                                if (!confirm(t("Eliminare «{titolo}»? Gli allievi non lo vedranno più.", { titolo: m.titolo }))) return;
                                void esegui(m.id, "materiali-lezione:elimina", () => eliminaMateriale(m.id));
                              }}
                            >
                              {t("Elimina")}
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        <Link href={`/istruttori/${classId}`} className="font-semibold text-primary">
          {t("← Torna alla classe")}
        </Link>
      </p>
    </div>
  );
}

type Quando = "nascosto" | "subito" | "programmato";

/** Valore del selettore della lezione: una del catalogo, una già scritta a mano, o una nuova. */
type SceltaLezione = { tipo: "catalogo"; lessonId: number } | { tipo: "libera"; etichetta: string } | { tipo: "nuova" };

function codificaScelta(s: SceltaLezione): string {
  if (s.tipo === "catalogo") return `catalogo:${s.lessonId}`;
  if (s.tipo === "libera") return `libera:${s.etichetta}`;
  return "nuova";
}

function decodificaScelta(v: string): SceltaLezione {
  if (v.startsWith("catalogo:")) return { tipo: "catalogo", lessonId: Number(v.slice("catalogo:".length)) };
  if (v.startsWith("libera:")) return { tipo: "libera", etichetta: v.slice("libera:".length) };
  return { tipo: "nuova" };
}

/**
 * Il modulo per aggiungere o modificare un materiale.
 *
 * I SUGGERIMENTI. Quando la lezione è una del catalogo, l'indirizzo si scrive
 * da solo: la videolezione del canale BridgeLab, la dispensa del corso, il
 * compito già assegnato. Si sostituisce solo ciò che l'insegnante non ha
 * toccato: se ha incollato il link della sua registrazione Zoom, cambiare
 * lezione non glielo cancella.
 */
function ModuloMateriale({
  classId,
  lezioniAssegnate,
  etichetteLibere,
  materiali,
  iniziale,
  occupato,
  onAnnulla,
  onSalva,
}: {
  classId: string;
  lezioniAssegnate: LezioneAssegnata[];
  etichetteLibere: string[];
  materiali: MaterialeLezione[];
  iniziale?: MaterialeLezione;
  occupato: boolean;
  onAnnulla: () => void;
  onSalva: (dati: DatiMateriale, quando: string | null) => void;
}) {
  const t = useT();

  const sceltaIniziale = (): SceltaLezione => {
    if (iniziale) {
      const cat = lezioniAssegnate.find((l) => String(l.lessonId) === iniziale.lesson_id);
      if (cat) return { tipo: "catalogo", lessonId: cat.lessonId };
      return { tipo: "libera", etichetta: iniziale.lezione };
    }
    const ultima = lezioniAssegnate[lezioniAssegnate.length - 1];
    return ultima ? { tipo: "catalogo", lessonId: ultima.lessonId } : { tipo: "nuova" };
  };

  function suggerimento(s: SceltaLezione, tp: TipoMateriale): { titolo: string; url: string } {
    if (s.tipo !== "catalogo") return { titolo: "", url: "" };
    const l = lezioniAssegnate.find((x) => x.lessonId === s.lessonId);
    if (!l) return { titolo: "", url: "" };
    if (tp === "video") {
      const video = getYouTubeWatchUrl(l.lessonId);
      return video ? { titolo: t("La videolezione"), url: video } : { titolo: "", url: "" };
    }
    if (tp === "dispensa") {
      return { titolo: t("La dispensa"), url: `/dispense?classe=${classId}&corso=${l.corsoId}` };
    }
    return { titolo: t("L'esercizio"), url: `/classi/${classId}/compito/${l.assignmentId}` };
  }

  // Il primo suggerimento si calcola una volta, all'apertura del modulo: negli
  // inizializzatori e non in un effetto, che riscriverebbe i campi a ogni giro.
  const [avvio] = useState(() => {
    const s = sceltaIniziale();
    const tp: TipoMateriale = iniziale?.tipo ?? "video";
    return { scelta: s, tipo: tp, suggerito: iniziale ? { titolo: "", url: "" } : suggerimento(s, tp) };
  });
  const [scelta, setScelta] = useState<SceltaLezione>(avvio.scelta);
  const [nuovaLezione, setNuovaLezione] = useState("");
  const [tipo, setTipo] = useState<TipoMateriale>(avvio.tipo);
  const [titolo, setTitolo] = useState(iniziale?.titolo ?? avvio.suggerito.titolo);
  const [url, setUrl] = useState(iniziale?.url ?? avvio.suggerito.url);
  const [posizione, setPosizione] = useState(String((iniziale?.ordine ?? 0) + 1));
  const [quando, setQuando] = useState<Quando>("subito");
  const [quandoData, setQuandoData] = useState("");
  /** L'ultimo suggerimento scritto da noi: si sostituisce solo se è ancora quello. */
  const [suggerito, setSuggerito] = useState<{ titolo: string; url: string }>(avvio.suggerito);
  const [tentato, setTentato] = useState(false);

  /** Applica il suggerimento senza calpestare quello che l'insegnante ha scritto. */
  function aggiornaSuggerimento(s: SceltaLezione, tp: TipoMateriale) {
    if (iniziale) return;
    const nuovo = suggerimento(s, tp);
    if (titolo.trim() === "" || titolo === suggerito.titolo) setTitolo(nuovo.titolo);
    if (url.trim() === "" || url === suggerito.url) setUrl(nuovo.url);
    setSuggerito(nuovo);
  }

  const etichetta =
    scelta.tipo === "catalogo"
      ? (lezioniAssegnate.find((l) => l.lessonId === scelta.lessonId)?.etichetta ?? "")
      : scelta.tipo === "libera"
        ? scelta.etichetta
        : nuovaLezione.trim();

  // Quanti materiali dello stesso tipo ci sono già in questa lezione. Il nuovo
  // va in fondo da solo: chiedere la posizione a chi sta aggiungendo il primo
  // video della lezione sarebbe una domanda senza senso. Si sceglie solo
  // modificando, quando i materiali da mettere in fila ci sono.
  const giaDelTipo = materiali.filter((m) => m.lezione === etichetta && m.tipo === tipo && m.id !== iniziale?.id).length;
  const posizioneNum = iniziale ? Number.parseInt(posizione, 10) : giaDelTipo + 1;
  const dataProgrammata = quando === "programmato" ? daDatetimeLocale(quandoData) : null;
  const problemi: string[] = [];
  if (!etichetta) problemi.push(t("Scrivi il nome della lezione."));
  if (!titolo.trim()) problemi.push(t("Scrivi un titolo: è quello che leggono gli allievi."));
  if (!urlValido(url))
    problemi.push(t("Il collegamento deve cominciare con https:// (oppure con / se è una pagina di BridgeLab)."));
  if (!Number.isFinite(posizioneNum) || posizioneNum < 1) problemi.push(t("La posizione è un numero da 1 in su."));
  if (!iniziale && quando === "programmato" && !dataProgrammata) problemi.push(t("Scegli giorno e ora di uscita."));

  function salva() {
    setTentato(true);
    if (problemi.length > 0) return;
    const pubblicaDal = iniziale
      ? null
      : quando === "subito"
        ? new Date().toISOString()
        : quando === "programmato"
          ? dataProgrammata
          : null;
    onSalva(
      {
        // Una lezione del catalogo non più assegnata compare come «libera»: se
        // l'insegnante non l'ha cambiata, il riferimento al catalogo resta.
        lesson_id:
          scelta.tipo === "catalogo"
            ? String(scelta.lessonId)
            : iniziale && scelta.tipo === "libera" && scelta.etichetta === iniziale.lezione
              ? iniziale.lesson_id
              : null,
        lezione: etichetta,
        tipo,
        titolo: titolo.trim(),
        url: url.trim(),
        ordine: posizioneNum - 1,
      },
      pubblicaDal,
    );
  }

  const TIPI: { valore: TipoMateriale; etichetta: string }[] = [
    { valore: "video", etichetta: t("Videolezione") },
    { valore: "dispensa", etichetta: t("Dispensa") },
    { valore: "esercizio", etichetta: t("Esercizio") },
  ];

  return (
    <div className="mb-6 space-y-5 rounded-xl border border-primary/40 bg-card p-4 sm:p-5">
      <p className="font-display text-lg font-semibold">
        {iniziale ? t("Modifica il materiale") : t("Aggiungi materiale")}
      </p>

      <label className="block space-y-1.5">
        <span className="block text-base font-medium">{t("Lezione")}</span>
        <select
          className={campo}
          value={codificaScelta(scelta)}
          onChange={(e) => {
            const s = decodificaScelta(e.target.value);
            setScelta(s);
            aggiornaSuggerimento(s, tipo);
          }}
        >
          {lezioniAssegnate.map((l) => (
            <option key={`c${l.lessonId}`} value={codificaScelta({ tipo: "catalogo", lessonId: l.lessonId })}>
              {l.etichetta}
            </option>
          ))}
          {[...etichetteLibere, ...(scelta.tipo === "libera" && !etichetteLibere.includes(scelta.etichetta) ? [scelta.etichetta] : [])].map(
            (e) => (
              <option key={`l${e}`} value={codificaScelta({ tipo: "libera", etichetta: e })}>
                {e}
              </option>
            ),
          )}
          <option value="nuova">{t("Un'altra lezione (scrivo io il nome)")}</option>
        </select>
      </label>
      {scelta.tipo === "nuova" && (
        <label className="block space-y-1.5">
          <span className="block text-base font-medium">{t("Nome della lezione")}</span>
          <input
            className={campo}
            value={nuovaLezione}
            maxLength={200}
            onChange={(e) => setNuovaLezione(e.target.value)}
            placeholder={t("es. Lezione 3 – Il piano di gioco")}
          />
        </label>
      )}

      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-base font-medium">{t("Che cosa mandi")}</legend>
        <div className="flex flex-wrap gap-2">
          {TIPI.map(({ valore, etichetta: nome }) => {
            const Icona = ICONE[valore];
            return (
              <label
                key={valore}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-4 text-base ${
                  tipo === valore ? "border-primary bg-primary/10 font-semibold" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="tipo-materiale"
                  className="h-5 w-5 accent-primary"
                  checked={tipo === valore}
                  onChange={() => {
                    setTipo(valore);
                    aggiornaSuggerimento(scelta, valore);
                  }}
                />
                <Icona className="h-5 w-5" aria-hidden="true" />
                {nome}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="block text-base font-medium">{t("Titolo")}</span>
        <input className={campo} value={titolo} maxLength={200} onChange={(e) => setTitolo(e.target.value)} />
      </label>

      <label className="block space-y-1.5">
        <span className="block text-base font-medium">{t("Collegamento")}</span>
        <input
          className={campo}
          inputMode="url"
          autoComplete="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
        />
        <span className="block text-sm text-muted-foreground">
          {t("Incolla l'indirizzo: YouTube, Google Drive, un PDF, oppure una pagina di BridgeLab.")}
        </span>
      </label>

      {iniziale && giaDelTipo > 0 && (
        <label className="block space-y-1.5">
          <span className="block text-base font-medium">{t("Posizione")}</span>
          <input
            className={`${campo} max-w-32`}
            type="number"
            min={1}
            value={posizione}
            onChange={(e) => setPosizione(e.target.value)}
          />
          <span className="block text-sm text-muted-foreground">
            {t("Ce ne sono {n} di questo tipo in questa lezione: 1 lo mette per primo.", { n: giaDelTipo + 1 })}
          </span>
        </label>
      )}

      {!iniziale && (
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-base font-medium">{t("Quando lo vedono gli allievi")}</legend>
          {(
            [
              ["subito", t("Subito")],
              ["programmato", t("A un giorno e un'ora precisi")],
              ["nascosto", t("Non ancora: lo tengo nascosto")],
            ] as [Quando, string][]
          ).map(([valore, nome]) => (
            <label key={valore} className="flex min-h-11 cursor-pointer items-center gap-3 text-base">
              <input
                type="radio"
                name="quando-materiale"
                className="h-5 w-5 accent-primary"
                checked={quando === valore}
                onChange={() => setQuando(valore)}
              />
              {nome}
            </label>
          ))}
          {quando === "programmato" && (
            <input
              type="datetime-local"
              aria-label={t("Giorno e ora di uscita")}
              className={`${campo} max-w-xs`}
              value={quandoData}
              onChange={(e) => setQuandoData(e.target.value)}
            />
          )}
        </fieldset>
      )}

      {tentato && problemi.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-base text-destructive">
          {problemi.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="lg" className="h-12 text-base" disabled={occupato} onClick={salva}>
          {occupato ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
          {t("Salva")}
        </Button>
        <Button size="lg" variant="ghost" className="h-12 text-base" onClick={onAnnulla}>
          {t("Annulla")}
        </Button>
      </div>
    </div>
  );
}
