"use client";

import { useEffect, useMemo, useRef, useState, use } from "react";
import { RisposteClasse } from "@/components/istruttori/risposte-classe";
import { BricioleClasse } from "@/components/istruttori/briciole-classe";
import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import { useValidatedSmazzate } from "@/store/use-smazzate-store";
// Replay della mano: si apre su richiesta a fine partita.
const HandReplay = dynamic(
  () => import("@/components/bridge/hand-replay").then((m) => m.HandReplay),
  { ssr: false },
);
import { parseContract, type GameState } from "@/lib/bridge-engine";
import {
  PLAY_ERROR_LABELS,
  type PlayErrorCategory,
} from "@/lib/play-error-classifier";
import {
  getAssignment,
  getClassDetail,
  getAssignmentResults,
  type Assignment,
  type ClassMember,
  type AssignmentResultRow,
} from "@/lib/instructors";
import {
  difficolta,
  formattaDurata,
  ripulisci,
  type Difficolta,
  type TempiMano,
} from "@/lib/tempi";
import { NotaSmazzata } from "@/components/istruttori/nota-smazzata";
import { senzaLicita } from "@/lib/gioco-della-carta";
import { useT } from "@/contexts/traduzioni-provider";
import { contrattoLeggibile } from "@/lib/contratto-leggibile";
import { useAlRitorno } from "@/hooks/use-al-ritorno";
import { segnalaSalvoRete } from "@/lib/report-error";
import { classificaCompito } from "@/lib/riepiloghi-classe";
import { mazziereDellaMano, mazziereRegistrato, stelleScritte } from "@/lib/compito-licita";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MessageSquareText } from "lucide-react";
import { CommentoCompito as RiquadroCommento } from "@/components/istruttori/commento-compito";
import { commentiDelCompito, commentiPerMano, type CommentoCompito } from "@/lib/commenti-compito";
import { AssegnaStelle } from "@/components/istruttori/assegna-stelle";
import {
  impostaStelleInsegnante,
  stelleAssegnate,
  stelleDelCompito,
  votoMano,
  type StelleAssegnate,
} from "@/lib/stelle-compito";
import { Asta } from "@/components/bridge/asta";
import { QuattroMani } from "@/components/bridge/riepilogo-mano";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Card, Position } from "@/lib/bridge-engine";

/** Cell state for the heatmap. */
type Cell =
  | { state: "made" | "down"; result: number; tricksMade?: number; tricksNeeded?: number; licita?: CellaLicita }
  | { state: "empty" };

/** Compito di licita: la cella dice il contratto raggiunto, non le prese. */
interface CellaLicita {
  contratto: string | null;
  dichiarante: Position | null;
  /** Le stelle che valgono: dell'insegnante se ci sono; `null` se si aspettano le sue. */
  stelle: number | null;
  /** Le stelle calcolate dal programma, sempre. */
  stelleProgramma: number;
  /** Le stelle date dall'insegnante, o `null`. */
  stelleInsegnante: number | null;
  /** `null`: il compito ha «le stelle le assegno io» e l'insegnante non le ha ancora date. */
  riuscita: boolean | null;
  par: number | null;
  bids: string[];
  mazziere: Position;
  /** Il gioco del contratto dichiarato, quando l'allievo l'ha giocato. */
  gioco: {
    contract: string;
    declarer: Position;
    tricksMade: number;
    tricksNeeded: number;
    result: number;
    /** Contratto degli avversari: l'allievo l'ha controgiocato da Sud. */
    difesa: boolean;
  } | null;
}

const NOME_POSTO: Record<Position, string> = { north: "Nord", east: "Est", south: "Sud", west: "Ovest" };

/** L'iniziale del dichiarante accanto al contratto: «4♠ N». */
const INIZIALE: Record<Position, string> = { north: "N", east: "E", south: "S", west: "O" };

export default function AssignmentResultsPage({
  params,
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const t = useT();
  const { classId, assignmentId } = use(params);
  const validated = useValidatedSmazzate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [results, setResults] = useState<AssignmentResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** I commenti dell'insegnante sulle mani. `null`: tabella non ancora creata. */
  const [commenti, setCommenti] = useState<CommentoCompito[] | null>([]);
  /** La mano di cui si scrive il commento per tutta la classe. */
  const [commentoClasse, setCommentoClasse] = useState<string | null>(null);
  /** Le stelle date dall'insegnante. `null`: tabella non ancora creata. */
  const [stelleMie, setStelleMie] = useState<StelleAssegnate[] | null>([]);
  /** «Le stelle le assegno io», cambiabile da qui. `null`: si legge dal compito. */
  const [soloMie, setSoloMie] = useState<boolean | null>(null);
  const [erroreSoloMie, setErroreSoloMie] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void stelleDelCompito(assignmentId).then((s) => {
      if (vivo) setStelleMie(s);
    });
    return () => {
      vivo = false;
    };
  }, [assignmentId]);

  function aggiornaStelle(smazzataId: string, studentId: string, stelle: number | null) {
    setStelleMie((prima) => {
      const altre = (prima ?? []).filter((x) => !(x.smazzataId === smazzataId && x.studentId === studentId));
      return stelle === null ? altre : [...altre, { smazzataId, studentId, stelle }];
    });
  }

  useEffect(() => {
    let vivo = true;
    void commentiDelCompito(assignmentId).then((c) => {
      if (vivo) setCommenti(c);
    });
    return () => {
      vivo = false;
    };
  }, [assignmentId]);

  /** Dopo un salvataggio: la lista locale si aggiorna senza rileggere. */
  function aggiornaCommento(smazzataId: string, studentId: string | null, testo: string) {
    setCommenti((prima) => {
      const altri = (prima ?? []).filter((c) => !(c.smazzataId === smazzataId && c.studentId === studentId));
      return testo
        ? [...altri, { smazzataId, studentId, testo, aggiornato: new Date().toISOString() }]
        : altri;
    });
  }

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [a, detail, res] = await Promise.all([
          getAssignment(assignmentId),
          getClassDetail(classId),
          getAssignmentResults(assignmentId),
        ]);
        if (active) {
          setAssignment(a);
          setMembers(detail.members);
          setResults(res);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Errore nel caricamento dei risultati");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [classId, assignmentId]);

  /**
   * I risultati arrivano mentre la pagina è aperta: è il caso normale, con
   * l'insegnante che guarda la classe giocare (Trevissoi, ottobre 2026: «se
   * dobbiamo dare uno strumento in tempo reale, non deve essere necessario il
   * refresh»). Si rileggono iscritti e risultati senza svuotare la pagina; un
   * errore qui lascia quello che si vedeva, al giro dopo si riprova.
   */
  useAlRitorno(() => {
    void Promise.all([getClassDetail(classId), getAssignmentResults(assignmentId)])
      .then(([detail, res]) => {
        setMembers(detail.members);
        setResults(res);
      })
      .catch((err) => segnalaSalvoRete("istruttori/compito:aggiorna", err));
  }, 20_000, !loading && !error);

  // Lookup: `${studentId}|${smazzataId}` -> latest result row
  const resultMap = useMemo(() => {
    const m = new Map<string, AssignmentResultRow>();
    for (const r of results) m.set(`${r.student_id}|${r.smazzata_id}`, r);
    return m;
  }, [results]);

  const soloInsegnante = soloMie ?? assignment?.stelle_insegnante === true;

  /** Compito di licita: le stelle di un allievo, sommate sulle mani dichiarate. */
  function stelleTotali(studentId: string): number {
    let somma = 0;
    for (const id of assignment?.smazzata_ids ?? []) {
      const c = cellFor(studentId, id);
      if (c.state !== "empty" && c.licita?.stelle != null) somma += c.licita.stelle;
    }
    return somma;
  }

  async function cambiaSoloMie(attivo: boolean) {
    setErroreSoloMie(null);
    const prima = soloInsegnante;
    setSoloMie(attivo);
    try {
      await impostaStelleInsegnante(assignmentId, attivo);
    } catch (err) {
      setSoloMie(prima);
      // Senza lo script la colonna non c'è e PostgREST risponde PGRST204.
      if ((err as { code?: string } | null)?.code === "PGRST204") {
        setErroreSoloMie(t("Non ancora attivo: manca un aggiornamento del database."));
        return;
      }
      segnalaSalvoRete("istruttori/compito:stelle-mie", err);
      setErroreSoloMie(t("Non salvato. Controlla la connessione e riprova."));
    }
  }

  function cellFor(studentId: string, smazzataId: string): Cell {
    const r = resultMap.get(`${studentId}|${smazzataId}`);
    if (!r) return { state: "empty" };
    const d = r.details ?? {};
    const tricksMade = typeof d.tricksMade === "number" ? d.tricksMade : undefined;
    const tricksNeeded = typeof d.tricksNeeded === "number" ? d.tricksNeeded : undefined;
    if (d.licita === true) {
      const sm =
        validated.find((s) => s.id === smazzataId) ??
        assignment?.custom_hands?.find((s) => s.id === smazzataId);
      const dichiarante =
        typeof d.dichiarante === "string" && d.dichiarante in INIZIALE ? (d.dichiarante as Position) : null;
      const stelleProgramma = typeof d.stelle === "number" ? d.stelle : 0;
      const stelleInsegnante = stelleAssegnate(stelleMie, smazzataId, studentId);
      const voto = votoMano({ automatiche: stelleProgramma, insegnante: stelleInsegnante, soloInsegnante });
      return {
        state: voto.riuscita === false ? "down" : "made",
        result: r.score,
        licita: {
          contratto: typeof d.contratto === "string" ? d.contratto : null,
          dichiarante,
          stelle: voto.stelle,
          stelleProgramma,
          stelleInsegnante,
          riuscita: voto.riuscita,
          par: typeof d.par === "number" ? d.par : null,
          bids: Array.isArray(d.bids) ? (d.bids as string[]) : [],
          mazziere: mazziereRegistrato(d, sm ? mazziereDellaMano(sm) : "south"),
          gioco: giocoDellaLicita(d.gioco, dichiarante),
        },
      };
    }
    return {
      state: r.score >= 0 ? "made" : "down",
      result: r.score,
      tricksMade,
      tricksNeeded,
    };
  }

  // ── Card-by-card replay of a student's hand ──────────────────────────────
  const [replay, setReplay] = useState<{ title: string; gameState: GameState } | null>(null);
  /** Compito di licita: l'asta di un allievo su una mano, aperta dalla sua casella. */
  const [astaAperta, setAstaAperta] = useState<{
    titolo: string;
    studentId: string;
    smazzataId: string;
    cella: CellaLicita;
    /** Le carte della mano: la licita si corregge guardandole. */
    mani: Record<Position, Card[]> | null;
    /** Apre il gioco carta per carta, se l'allievo ha giocato il contratto. */
    rivedi: (() => void) | null;
  } | null>(null);
  /** Passando a un'altra mano con le frecce si riparte dall'asta, in cima. */
  const finestraAsta = useRef<HTMLDivElement>(null);
  const manoAperta = astaAperta ? `${astaAperta.studentId}|${astaAperta.smazzataId}` : null;
  useEffect(() => {
    finestraAsta.current?.scrollTo({ top: 0 });
  }, [manoAperta]);

  function maniDi(smazzataId: string): Record<Position, Card[]> | null {
    const sm =
      validated.find((s) => s.id === smazzataId) ??
      assignment?.custom_hands?.find((s) => s.id === smazzataId);
    return sm?.hands ?? null;
  }

  function playOf(studentId: string, smazzataId: string) {
    const r = resultMap.get(`${studentId}|${smazzataId}`);
    const play = (r?.details as { play?: { hands?: unknown; tricks?: unknown } } | undefined)?.play;
    return play?.tricks && play?.hands ? play : null;
  }

  /**
   * `giocato`: nel compito di licita il contratto è quello dichiarato
   * dall'allievo, non quello scritto sulla mano.
   */
  function openReplay(
    studentId: string,
    smazzataId: string,
    studentName: string,
    giocato?: { contract: string; declarer: Position },
  ) {
    const play = playOf(studentId, smazzataId);
    const sm =
      validated.find((s) => s.id === smazzataId) ??
      assignment?.custom_hands?.find((s) => s.id === smazzataId);
    if (!play || !sm) return;
    const contract = giocato?.contract ?? sm.contract;
    const gameState = {
      hands: play.hands,
      tricks: play.tricks,
      contract,
      declarer: giocato?.declarer ?? sm.declarer,
      trumpSuit: parseContract(contract).trumpSuit,
    } as unknown as GameState;
    setReplay({ title: `${studentName} · ${contrattoLeggibile(contract)}`, gameState });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-destructive">{error ?? "Compito non trovato"}</p>
      </div>
    );
  }

  const smazzataIds = assignment.smazzata_ids;
  /**
   * Nelle lezioni del gioco della carta (Fiori 1–6) il contratto non è ancora
   * stato spiegato: la colonna dice l'obiettivo in prese, e i risultati sono
   * «esito positivo / negativo» invece di «mantenuto / caduto» — anche qui,
   * perché l'insegnante questa schermata la condivide con gli allievi
   * (Trevissoi, feedback 5).
   */
  const soloGioco = senzaLicita(assignment.lesson_id);
  const colLabel = (id: string) => {
    // Nel compito di licita il contratto è quello che gli allievi devono
    // trovare: scriverlo in testa alla colonna lo dava per già deciso, e
    // questa schermata l'insegnante la mostra alla classe.
    if (assignment.licita) return t("Mano {n}", { n: smazzataIds.indexOf(id) + 1 });
    const s =
      validated.find((sm) => sm.id === id) ??
      assignment.custom_hands?.find((sm) => sm.id === id);
    if (!s) return id;
    const livello = parseInt(s.contract, 10);
    return soloGioco && !Number.isNaN(livello) ? t("{n} prese", { n: livello + 6 }) : s.contract;
  };

  /** La finestra della licita di un allievo su una mano; `null` se non l'ha dichiarata. */
  function astaDi(studentId: string, smazzataId: string): NonNullable<typeof astaAperta> | null {
    const cella = cellFor(studentId, smazzataId);
    if (cella.state === "empty" || !cella.licita) return null;
    const gioco = cella.licita.gioco;
    const nome = members.find((m) => m.student_id === studentId)?.display_name ?? t("Allievo");
    return {
      titolo: `${nome} · ${colLabel(smazzataId)}`,
      studentId,
      smazzataId,
      cella: cella.licita,
      mani: maniDi(smazzataId),
      rivedi: gioco && playOf(studentId, smazzataId) ? () => openReplay(studentId, smazzataId, nome, gioco) : null,
    };
  }

  /**
   * Le frecce della finestra: la mano dichiarata prima e dopo dello stesso
   * allievo. L'insegnante dà le stelle una mano dopo l'altra, e chiudere e
   * riaprire ogni volta le faceva perdere un sacco di tempo (25/10/2026).
   */
  function astaVicina(verso: 1 | -1): NonNullable<typeof astaAperta> | null {
    if (!astaAperta) return null;
    for (
      let i = smazzataIds.indexOf(astaAperta.smazzataId) + verso;
      i >= 0 && i < smazzataIds.length;
      i += verso
    ) {
      const vicina = astaDi(astaAperta.studentId, smazzataIds[i]);
      if (vicina) return vicina;
    }
    return null;
  }
  const astaPrima = astaVicina(-1);
  const astaDopo = astaVicina(1);

  /** Le mani dichiarate e quelle giocate davvero: il gioco, dopo l'asta, l'allievo lo sceglie. */
  const maniLicita = assignment.licita
    ? members.flatMap((m) =>
        smazzataIds.map((id) => cellFor(m.student_id, id)).filter((c) => c.state !== "empty" && c.licita),
      )
    : [];
  const maniGiocate = maniLicita.filter((c) => c.state !== "empty" && c.licita?.gioco).length;

  /**
   * I tempi di riflessione, per allievo e per mano.
   *
   * Due segnali, e sono opposti: chi ci ha messo molto su una carta e ha
   * sbagliato non sapeva come fare — la spiegazione non è arrivata — e chi ha
   * risposto subito e ha sbagliato non si è accorto che c'era una scelta. Con
   * il solo esito si confondono, e sono due lezioni diverse da rifare.
   *
   * I tempi arrivano già ripuliti dal client, ma si ripassano da `ripulisci`:
   * `details` è un jsonb scritto dal browser, e fidarsi di un numero che arriva
   * da lì per calcolare una media di classe vuol dire che basta una scheda
   * lasciata aperta per spostarla.
   */
  const tempiPerAllievo = members
    .map((m) => {
      const voci: { smazzataId: string; t: TempiMano; mantenuto: boolean; segnale: Difficolta }[] = [];
      for (const id of smazzataIds) {
        const r = resultMap.get(`${m.student_id}|${id}`);
        const grezzi = (r?.details as { tempi?: { decisioni?: number[] } } | undefined)?.tempi
          ?.decisioni;
        if (!Array.isArray(grezzi) || grezzi.length === 0) continue;
        const t = ripulisci(grezzi);
        const mantenuto = (r?.score ?? -1) >= 0;
        voci.push({ smazzataId: id, t, mantenuto, segnale: difficolta(t, mantenuto) });
      }
      return {
        studentId: m.student_id,
        name: m.display_name ?? "Allievo",
        voci,
        totaleMs: voci.reduce((a, v) => a + v.t.totaleMs, 0),
        daGuardare: voci.filter((v) => v.segnale !== "normale"),
      };
    })
    .filter((r) => r.voci.length > 0);

  /** Quale mano ha richiesto più tempo alla classe: è quella da rispiegare. */
  const tempoPerMano = smazzataIds
    .map((id) => {
      const durate = tempiPerAllievo
        .flatMap((r) => r.voci.filter((v) => v.smazzataId === id))
        .map((v) => v.t.totaleMs);
      return {
        id,
        mediana: durate.length
          ? [...durate].sort((a, b) => a - b)[Math.floor(durate.length / 2)]
          : 0,
        quanti: durate.length,
      };
    })
    .filter((x) => x.quanti > 0)
    .sort((a, b) => b.mediana - a.mediana);

  /** La classifica di questo compito, dagli stessi esiti della griglia. */
  const classifica = classificaCompito(members, smazzataIds, (studentId, id) => {
    const r = resultMap.get(`${studentId}|${id}`);
    if (!r) return null;
    // Nel compito di licita conta il voto che vale, anche quello dell'insegnante.
    if (assignment.licita) {
      const c = cellFor(studentId, id);
      return { score: c.state !== "empty" && c.licita?.riuscita ? 0 : -1 };
    }
    return { score: r.score };
  });
  const qualcunoHaGiocato = classifica.some((r) => r.giocate > 0);

  // Per-hand difficulty signal: how many students went down on each hand.
  const downPerHand = smazzataIds.map(
    (id) => members.filter((m) => cellFor(m.student_id, id).state === "down").length
  );

  // ── Error taxonomy: aggregate the rule-based play errors per student ─────
  // (recorded by the student app in details.errors, see play-error-classifier)
  const errorTaxonomy = members
    .map((m) => {
      const counts = new Map<PlayErrorCategory, number>();
      for (const id of smazzataIds) {
        const r = resultMap.get(`${m.student_id}|${id}`);
        const errs = (r?.details as { errors?: { category?: string }[] } | undefined)
          ?.errors;
        if (!Array.isArray(errs)) continue;
        for (const e of errs) {
          if (e?.category && e.category in PLAY_ERROR_LABELS) {
            const cat = e.category as PlayErrorCategory;
            counts.set(cat, (counts.get(cat) ?? 0) + 1);
          }
        }
      }
      return {
        studentId: m.student_id,
        name: m.display_name ?? "Allievo",
        counts: [...counts.entries()].sort((a, b) => b[1] - a[1]),
      };
    })
    .filter((row) => row.counts.length > 0);

  // Most frequent theme across the whole class (worth a recap in lesson)
  const classTheme = (() => {
    const totals = new Map<PlayErrorCategory, number>();
    for (const row of errorTaxonomy)
      for (const [cat, n] of row.counts) totals.set(cat, (totals.get(cat) ?? 0) + n);
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
    return top && top[1] >= 2 ? top : null;
  })();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <BricioleClasse classId={classId} pagina={assignment.title} />
      <h1 className="mb-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
        {assignment.title}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {members.length} {members.length === 1 ? "allievo" : "allievi"} · {smazzataIds.length}{" "}
        {smazzataIds.length === 1 ? "mano" : "mani"}
      </p>
      {assignment.licita && (
        <p className="-mt-4 mb-6 text-sm text-muted-foreground">
          {assignment.licita_gioca === false
            ? t("In questo compito gli allievi dichiarano soltanto: non giocano il contratto.")
            : t("Gli allievi dichiarano e poi possono giocare il contratto: il gioco è facoltativo. Finora {g} mani giocate su {d} dichiarate; quelle giocate hanno ▶ nella cella.", {
                g: maniGiocate,
                d: maniLicita.length,
              })}
        </p>
      )}

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-500" /> {t("Esito positivo")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-500" /> {t("Esito negativo")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border bg-muted" /> {t("Non giocata")}
        </span>
        {assignment.licita ? (
          <span className="text-muted-foreground">
            {t("Compito di licita: ogni cella è il contratto raggiunto. Verde da 2 stelle in su; tocca una cella per la licita, le stelle e il par, e per dare le tue stelle.")}
          </span>
        ) : (
          <span className="text-muted-foreground">▶ {t("Clicca una cella giocata per rivedere la mano carta per carta")}</span>
        )}
      </div>

      {assignment.licita && stelleMie !== null && (
        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={soloInsegnante}
              onChange={(e) => void cambiaSoloMie(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              <strong>{t("Le stelle le assegno io")}</strong>
              <span className="block text-xs text-muted-foreground">
                {soloInsegnante
                  ? t("Gli allievi non vedono il voto del programma: vedono «in attesa dell'insegnante» finché non dai le tue stelle. Le celle grigie aspettano te.")
                  : t("Gli allievi vedono le stelle del programma, che confronta il contratto col par. Puoi correggerle mano per mano toccando una cella; con la spunta, invece, le dai solo tu.")}
              </span>
            </span>
          </label>
          {erroreSoloMie && <p className="mt-1 text-xs text-destructive">{erroreSoloMie}</p>}
        </div>
      )}

      {members.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("Nessun allievo iscritto a questa classe.")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-semibold">
                  {t("Allievo")}
                </th>
                {smazzataIds.map((id, i) => (
                  <th key={id} className="px-2 py-2 text-center font-semibold">
                    {!assignment.licita && <div className="font-mono text-xs">{colLabel(id)}</div>}
                    <div className="text-[12px] font-normal text-muted-foreground">M{i + 1}</div>
                    {commenti && (
                      <button
                        type="button"
                        onClick={() => setCommentoClasse(id)}
                        className={`mx-auto mt-0.5 flex items-center rounded p-0.5 hover:bg-muted ${
                          commentiPerMano(commenti, id, null).perTutti ? "text-primary" : "text-muted-foreground/60"
                        }`}
                        title={t("Commento sulla mano per tutta la classe")}
                        aria-label={t("Commento sulla mano {n} per tutta la classe", { n: i + 1 })}
                      >
                        <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.student_id} className="border-b border-border last:border-0">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium">
                    {m.display_name ?? "Allievo"}
                  </td>
                  {smazzataIds.map((id) => {
                    const cell = cellFor(m.student_id, id);
                    const playable = !!playOf(m.student_id, id);
                    const licita = cell.state !== "empty" ? cell.licita : undefined;
                    return (
                      <td key={id} className="px-2 py-2 text-center">
                        <span className="relative inline-block">
                          {commenti && commentiPerMano(commenti, id, m.student_id).perTe && (
                            <span
                              className="absolute -right-1 -top-1 z-10 h-2.5 w-2.5 rounded-full border border-card bg-primary"
                              title={t("Hai commentato questa mano")}
                            />
                          )}
                          <HeatCell
                            cell={cell}
                            playable={playable || !!licita}
                            onClick={
                              licita
                                ? () => setAstaAperta(astaDi(m.student_id, id))
                                : playable
                                  ? () => openReplay(m.student_id, id, m.display_name ?? "Allievo")
                                  : undefined
                            }
                          />
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Footer: down count per hand (class difficulty signal) */}
              <tr className="bg-muted/30 text-xs text-muted-foreground">
                <td className="sticky left-0 z-10 bg-muted/30 px-3 py-2 font-semibold">
                  {t("Esiti negativi / classe")}
                </td>
                {downPerHand.map((n, i) => (
                  <td key={i} className="px-2 py-2 text-center font-semibold">
                    <span className={n > members.length / 2 ? "text-red-600" : ""}>{n}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Classifica di questo compito ── */}
      {members.length > 0 && qualcunoHaGiocato && (
        <div className="mt-8">
          <h2 className="mb-1 font-display text-xl font-bold text-foreground">
            {t("Classifica di questo compito")}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {assignment.licita
              ? t("La vedi solo tu: prima le mani riuscite, poi quelle dichiarate. Si aggiorna da sola mentre la classe dichiara.")
              : t("La vedi solo tu: prima i contratti mantenuti, poi le mani giocate, poi le prese in più o in meno. Si aggiorna da sola mentre la classe gioca.")}
          </p>
          <ol className="divide-y divide-border rounded-lg border border-border">
            {classifica.map((r, i) => (
              <li key={r.studentId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
                <span className="w-6 text-right font-semibold tabular-nums text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1 font-medium">{r.nome}</span>
                {r.giocate === 0 ? (
                  <span className="text-muted-foreground">{t("non ha ancora giocato")}</span>
                ) : (
                  <>
                    <span className="tabular-nums">
                      {assignment.licita
                        ? t("{m} riuscite su {g}", { m: r.mantenute, g: r.giocate })
                        : t("{m} mantenuti su {g}", { m: r.mantenute, g: r.giocate })}
                    </span>
                    <span className="w-16 text-right tabular-nums text-muted-foreground">
                      {assignment.licita
                        ? `${stelleScritte(stelleTotali(r.studentId))} ★`
                        : r.saldo > 0 ? `+${r.saldo}` : r.saldo === 0 ? "=" : r.saldo}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Cosa hanno risposto agli esercizi ── */}
      {assignment && (assignment.esercizio_ids ?? []).length > 0 && (
        <RisposteClasse esercizioIds={assignment.esercizio_ids} righe={results} />
      )}

      {/* ── Le tue note sulle mani ── */}
      {smazzataIds.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-1 font-display text-xl font-bold text-foreground">
            {t("Le tue note")}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {t("Restano attaccate alla mano, non al compito: le ritrovi l’anno prossimo su un’altra classe, e finiscono nella dispensa da stampare.")}
          </p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {smazzataIds.map((id) => {
              const mani = assignment.licita ? maniDi(id) : null;
              return (
              <div key={id} className="px-4 py-3">
                <p className="mb-1 font-mono text-xs text-muted-foreground">{colLabel(id)}</p>
                {/* Nel compito di licita la casella non porta il contratto: le
                    carte restano raggiungibili da qui, una mano alla volta. */}
                {mani && (
                  <details className="mb-2">
                    <summary className="cursor-pointer text-sm text-primary">{t("Vedi le carte")}</summary>
                    <div className="mt-2 max-w-md">
                      <QuattroMani deal={mani} />
                    </div>
                  </details>
                )}
                <NotaSmazzata smazzataId={id} />
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tempi di riflessione ── */}
      {tempiPerAllievo.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-1 font-display text-xl font-bold text-foreground">
            {t("Quanto ci hanno pensato")}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {t("Il tempo non è un voto: serve a distinguere chi non sapeva come fare da chi non si è accorto che c’era una scelta. Agli allievi non compare nessuna classifica di velocità.")}
          </p>

          {tempoPerMano.length > 1 && (
            <p className="mb-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              La mano che ha richiesto più tempo alla classe è la{" "}
              <strong>{colLabel(tempoPerMano[0].id)}</strong> ({formattaDurata(tempoPerMano[0].mediana)}{" "}
              di mediana): è quella da rivedere per prima.
            </p>
          )}

          <div className="divide-y divide-border rounded-lg border border-border">
            {tempiPerAllievo
              .slice()
              .sort((a, b) => b.daGuardare.length - a.daGuardare.length)
              .map((r) => (
                <div key={r.studentId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formattaDurata(r.totaleMs)} in tutto · {r.voci.length}{" "}
                    {r.voci.length === 1 ? "mano" : "mani"}
                  </span>
                  <span className="ml-auto flex flex-wrap gap-1.5">
                    {r.daGuardare.map((v) => (
                      <span
                        key={v.smazzataId}
                        className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                          v.segnale === "lento-e-sbagliato"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        }`}
                        title={
                          v.segnale === "lento-e-sbagliato"
                            ? `${formattaDurata(v.t.massimoMs)} sulla decisione più lunga, e la mano è caduta: non sapeva come fare.`
                            : "Ha giocato di getto e la mano è caduta: non si è accorto che c'era una scelta."
                        }
                      >
                        {colLabel(v.smazzataId)}:{" "}
                        {v.segnale === "lento-e-sbagliato" ? "ci ha pensato" : "di getto"}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Error taxonomy per student ── */}
      {errorTaxonomy.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-1 font-display text-xl font-bold text-foreground">
            {t("Su cosa lavorare")}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("Errori di gioco rilevati automaticamente nelle mani del compito.")}
          </p>

          {classTheme && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              <span className="font-bold">{t("Tema della classe:")}</span>{" "}
              {PLAY_ERROR_LABELS[classTheme[0]].toLowerCase()} ({classTheme[1]}{" "}
              {classTheme[1] === 1 ? "caso" : "casi"}) — vale un ripasso alla
              prossima lezione.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-left font-semibold">{t("Allievo")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("Errori ricorrenti")}</th>
                </tr>
              </thead>
              <tbody>
                {errorTaxonomy.map((row) => (
                  <tr key={row.studentId} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {row.counts.map(([cat, n]) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                          >
                            {PLAY_ERROR_LABELS[cat]}
                            {n > 1 && <span className="font-bold">×{n}</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {/* Nord in alto, come nei diagrammi delle dispense: l'insegnante guarda
            la mano dall'esterno, non dal posto di chi l'ha giocata. */}
        <Dialog open={!!astaAperta} onOpenChange={(aperta) => !aperta && setAstaAperta(null)}>
          {astaAperta && (
            <DialogContent
              ref={finestraAsta}
              className="max-h-[90dvh] overflow-y-auto p-4 sm:p-6"
              onKeyDown={(e) => {
                // Le frecce della tastiera come i pulsanti, ma non dentro un campo di testo o tra le stelle.
                const dove = e.target as HTMLElement;
                if (dove.closest("textarea, input, [role=radiogroup]")) return;
                const vicina = e.key === "ArrowLeft" ? astaPrima : e.key === "ArrowRight" ? astaDopo : null;
                if (vicina) {
                  e.preventDefault();
                  setAstaAperta(vicina);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>{astaAperta.titolo}</DialogTitle>
              </DialogHeader>
              {/* Ferme in cima anche scorrendo fino alle stelle, che stanno in fondo. */}
              <div className="sticky -top-4 z-10 -mx-4 flex items-center justify-between gap-2 bg-background px-4 py-2 sm:-top-6 sm:-mx-6 sm:px-6">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!astaPrima}
                  onClick={() => astaPrima && setAstaAperta(astaPrima)}
                  aria-label={t("Mano precedente")}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {t("Precedente")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!astaDopo}
                  onClick={() => astaDopo && setAstaAperta(astaDopo)}
                  aria-label={t("Mano successiva")}
                >
                  {t("Successiva")}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <p className="text-sm">
                {astaAperta.cella.contratto
                  ? t("{contratto} di {chi}", {
                      contratto: astaAperta.cella.contratto,
                      chi: astaAperta.cella.dichiarante ? t(NOME_POSTO[astaAperta.cella.dichiarante]) : "—",
                    })
                  : t("Passo generale")}
                {" · "}
                {astaAperta.cella.stelle === null
                  ? t("in attesa delle tue stelle")
                  : t("{stelle} stelle su 3", { stelle: stelleScritte(astaAperta.cella.stelle) })}
                {astaAperta.cella.stelleInsegnante !== null && ` (${t("tue")})`}
                {astaAperta.cella.par !== null && ` · ${t("par {par}", { par: astaAperta.cella.par })}`}
              </p>
              {astaAperta.cella.bids.length > 0 && (
                <Asta dealer={astaAperta.cella.mazziere} bids={astaAperta.cella.bids} ioSono="south" />
              )}
              {astaAperta.cella.gioco && (
                <p className="text-sm">
                  {astaAperta.cella.gioco.difesa
                    ? t("Controgiocato in difesa: il dichiarante ha fatto {fatte} prese su {servono}", {
                        fatte: astaAperta.cella.gioco.tricksMade,
                        servono: astaAperta.cella.gioco.tricksNeeded,
                      })
                    : t("Giocato: {fatte} prese su {servono}", {
                        fatte: astaAperta.cella.gioco.tricksMade,
                        servono: astaAperta.cella.gioco.tricksNeeded,
                      })}
                  {" · "}
                  {astaAperta.cella.gioco.result >= 0
                    ? t("mantenuto")
                    : t("sotto di {n}", { n: -astaAperta.cella.gioco.result })}
                </p>
              )}
              {!astaAperta.cella.gioco && (
                <p className="text-sm text-muted-foreground">
                  {!astaAperta.cella.contratto
                    ? t("Passo generale: non c'era niente da giocare.")
                    : assignment.licita_gioca === false
                      ? t("In questo compito si dichiara soltanto: la mano non si gioca.")
                      : t("Non l'ha giocata: dopo l'asta il gioco è facoltativo, e questo allievo è tornato al compito.")}
                </p>
              )}
              {astaAperta.rivedi && (
                <div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const rivedi = astaAperta.rivedi;
                      setAstaAperta(null);
                      rivedi?.();
                    }}
                  >
                    {t("Rivedi il gioco carta per carta")}
                  </Button>
                </div>
              )}
              {astaAperta.mani && <QuattroMani deal={astaAperta.mani} />}
              {stelleMie === null ? (
                <p className="text-xs text-muted-foreground">
                  {t("Le stelle dell'insegnante non sono ancora attive: manca un aggiornamento del database.")}
                </p>
              ) : (
                <AssegnaStelle
                  key={`stelle-${astaAperta.studentId}-${astaAperta.smazzataId}`}
                  assignmentId={assignmentId}
                  smazzataId={astaAperta.smazzataId}
                  studentId={astaAperta.studentId}
                  programma={astaAperta.cella.stelleProgramma}
                  iniziale={astaAperta.cella.stelleInsegnante}
                  soloInsegnante={soloInsegnante}
                  onSalvato={(stelle) => {
                    aggiornaStelle(astaAperta.smazzataId, astaAperta.studentId, stelle);
                    const voto = votoMano({
                      automatiche: astaAperta.cella.stelleProgramma,
                      insegnante: stelle,
                      soloInsegnante,
                    });
                    setAstaAperta({
                      ...astaAperta,
                      cella: { ...astaAperta.cella, stelle: voto.stelle, stelleInsegnante: stelle, riuscita: voto.riuscita },
                    });
                  }}
                />
              )}
              {commenti === null ? (
                <p className="text-xs text-muted-foreground">
                  {t("I commenti sulle mani non sono ancora attivi: manca un aggiornamento del database.")}
                </p>
              ) : (
                <>
                  <RiquadroCommento
                    key={`${astaAperta.studentId}-${astaAperta.smazzataId}`}
                    assignmentId={assignmentId}
                    smazzataId={astaAperta.smazzataId}
                    studentId={astaAperta.studentId}
                    etichetta={t("Commento per questo allievo")}
                    iniziale={commentiPerMano(commenti, astaAperta.smazzataId, astaAperta.studentId).perTe ?? ""}
                    onSalvato={(testo) => aggiornaCommento(astaAperta.smazzataId, astaAperta.studentId, testo)}
                  />
                  <RiquadroCommento
                    key={`tutti-${astaAperta.smazzataId}`}
                    assignmentId={assignmentId}
                    smazzataId={astaAperta.smazzataId}
                    studentId={null}
                    etichetta={t("Commento sulla mano per tutta la classe")}
                    iniziale={commentiPerMano(commenti, astaAperta.smazzataId, null).perTutti ?? ""}
                    onSalvato={(testo) => aggiornaCommento(astaAperta.smazzataId, null, testo)}
                  />
                </>
              )}
            </DialogContent>
          )}
        </Dialog>

        {/* Il commento sulla mano per tutta la classe, dall'intestazione della colonna. */}
        <Dialog open={!!commentoClasse} onOpenChange={(aperta) => !aperta && setCommentoClasse(null)}>
          {commentoClasse && commenti && (
            <DialogContent className="max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>
                  {t("Mano {n}", { n: smazzataIds.indexOf(commentoClasse) + 1 })} · {colLabel(commentoClasse)}
                </DialogTitle>
              </DialogHeader>
              {maniDi(commentoClasse) && <QuattroMani deal={maniDi(commentoClasse)!} />}
              <RiquadroCommento
                key={`tutti-${commentoClasse}`}
                assignmentId={assignmentId}
                smazzataId={commentoClasse}
                studentId={null}
                etichetta={t("Commento sulla mano per tutta la classe")}
                iniziale={commentiPerMano(commenti, commentoClasse, null).perTutti ?? ""}
                onSalvato={(testo) => aggiornaCommento(commentoClasse, null, testo)}
              />
            </DialogContent>
          )}
        </Dialog>

        {replay && (
          <HandReplay gameState={replay.gameState} inBasso="south" onClose={() => setReplay(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Il gioco registrato insieme alla licita, se c'è e si legge. */
function giocoDellaLicita(raw: unknown, dichiarante: Position | null): CellaLicita["gioco"] {
  if (!raw || typeof raw !== "object" || !dichiarante) return null;
  const g = raw as Record<string, unknown>;
  if (
    typeof g.contract !== "string" ||
    typeof g.tricksMade !== "number" ||
    typeof g.tricksNeeded !== "number" ||
    typeof g.result !== "number"
  ) {
    return null;
  }
  return {
    contract: g.contract,
    declarer: dichiarante,
    tricksMade: g.tricksMade,
    tricksNeeded: g.tricksNeeded,
    result: g.result,
    difesa: g.difesa === true,
  };
}

function HeatCell({
  cell,
  playable,
  onClick,
}: {
  cell: Cell;
  playable?: boolean;
  onClick?: () => void;
}) {
  const t = useT();
  if (cell.state === "empty") {
    return <span className="inline-block h-7 w-12 rounded border border-border bg-muted" aria-label={t("Non giocata")} />;
  }
  const made = cell.state === "made";
  if (cell.licita) {
    const { contratto, dichiarante, stelle, stelleInsegnante, riuscita, par, gioco } = cell.licita;
    const titolo =
      (stelle === null
        ? t("in attesa delle tue stelle")
        : t("{stelle} stelle su 3", { stelle: stelleScritte(stelle) }) +
          (stelleInsegnante !== null ? ` (${t("tue")})` : "")) +
      (par !== null ? ` · ${t("par {par}", { par })}` : "") +
      (gioco
        ? ` · ${
            gioco.difesa
              ? t("Controgiocato in difesa: il dichiarante ha fatto {fatte} prese su {servono}", { fatte: gioco.tricksMade, servono: gioco.tricksNeeded })
              : t("Giocato: {fatte} prese su {servono}", { fatte: gioco.tricksMade, servono: gioco.tricksNeeded })
          }`
        : "") +
      ` · ${t("tocca per la licita")}`;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex h-7 min-w-12 cursor-pointer items-center justify-center gap-0.5 whitespace-nowrap rounded px-1 text-xs font-bold text-white ring-offset-1 transition hover:ring-2 hover:ring-primary/60 ${
          riuscita === null ? "bg-slate-400 dark:bg-slate-600" : made ? "bg-emerald-500" : "bg-red-500"
        }`}
        title={titolo}
        aria-label={`${contratto ?? t("Passo generale")}, ${titolo}`}
      >
        {contratto ?? t("Passo")}
        {contratto && dichiarante && <span className="font-normal opacity-80">{t(INIZIALE[dichiarante])}</span>}
        {stelleInsegnante !== null && <span aria-hidden="true" className="font-normal">★</span>}
        {gioco && <span aria-hidden="true" className="text-[12px] font-normal">▶</span>}
      </button>
    );
  }
  const label =
    cell.result === 0 ? "=" : cell.result > 0 ? `+${cell.result}` : `${cell.result}`;
  const title =
    cell.tricksMade != null && cell.tricksNeeded != null
      ? `${cell.tricksMade}/${cell.tricksNeeded} prese${playable ? " · clicca per rivedere" : ""}`
      : playable
        ? "Clicca per rivedere la mano"
        : undefined;
  const base = `inline-flex h-7 w-12 items-center justify-center rounded text-xs font-bold text-white ${
    made ? "bg-emerald-500" : "bg-red-500"
  }`;
  if (playable) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`${base} cursor-pointer ring-offset-1 transition hover:ring-2 hover:ring-primary/60`}
      >
        {label}
      </button>
    );
  }
  return (
    <span className={base} title={title}>
      {label}
    </span>
  );
}
