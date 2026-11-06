"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import { Briciole } from "@/components/briciole";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { getAssignment, getMyAssignmentResults } from "@/lib/instructors";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import {
  ETICHETTE_CONSEGNA,
  leggiEsercizi,
  verificaEsercizio,
  type EsercizioPerAllievo,
  type EsitoEsercizio,
} from "@/lib/esercizi-posizione";
import { useT } from "@/contexts/traduzioni-provider";
import { contrattoLeggibile } from "@/lib/contratto-leggibile";
import { leggiFigura } from "@/lib/figura-domanda";
import { FiguraDomanda } from "@/components/figura-domanda";

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const ORDINE = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const NOME: Record<Position, string> = { north: "Nord", east: "Est", south: "Sud", west: "Ovest" };

/**
 * L'esercizio di posizione, dal lato dell'allievo.
 *
 * SI VEDE UNA MANO SOLA — quella che l'insegnante ha scelto — più il morto se
 * il gioco è già cominciato e il morto è scoperto. È la differenza fra un
 * esercizio e una smazzata da rivedere: qui si decide con le informazioni che
 * si avrebbero al tavolo, non con tutte e cinquantadue le carte davanti.
 *
 * LA SOLUZIONE ARRIVA DOPO AVER RISPOSTO, mai prima, e nemmeno insieme al
 * responso: prima si dice giusto o sbagliato, poi si spiega. Vedere la
 * spiegazione insieme al verdetto fa saltare il momento in cui uno si chiede
 * perché — che è l'unico momento in cui si impara qualcosa.
 */
export default function EsercizioPage({
  params,
}: {
  params: Promise<{ classId: string; esercizioId: string }>;
}) {
  const t = useT();
  const { classId, esercizioId } = use(params);
  const cerca = useSearchParams();
  const assignmentId = cerca.get("compito");

  const [esercizio, setEsercizio] = useState<EsercizioPerAllievo | null>(null);
  const [caricando, setCaricando] = useState(true);
  const [testoRisposta, setRisposta] = useState("");
  const [dato, setDato] = useState<(EsitoEsercizio & { testo: string }) | null>(null);
  const [spiegazione, setSpiegazione] = useState(false);
  const [erroreRisposta, setErroreRisposta] = useState(false);
  /** Le domande del compito, in ordine, e quelle a cui l'allievo ha già risposto. */
  const [ordine, setOrdine] = useState<string[]>([]);
  const [risposte, setRisposte] = useState<Set<string>>(new Set());

  useEffect(() => {
    let vivo = true;
    setDato(null);
    setSpiegazione(false);
    setRisposta("");
    setCaricando(true);
    (async () => {
      try {
        const [e, compito, mie] = await Promise.all([
          leggiEsercizi([esercizioId]),
          assignmentId ? getAssignment(assignmentId).catch(() => null) : null,
          assignmentId ? getMyAssignmentResults([assignmentId]).catch(() => null) : null,
        ]);
        if (!vivo) return;
        setEsercizio(e[0] ?? null);
        setOrdine(compito?.esercizio_ids ?? []);
        const fatte = mie?.get(assignmentId ?? "") ?? new Map();
        setRisposte(new Set(fatte.keys()));
        /*
         * GIÀ RISPOSTO: si rivede la propria risposta, non si risponde di nuovo.
         * Prima la domanda tornava vuota, e la seconda risposta finiva accanto
         * alla prima: l'insegnante vedeva una cosa, l'allievo ne aveva fatta
         * un'altra. Il responso si richiede al database con la risposta data,
         * senza registrare niente.
         */
        const data = fatte.get(esercizioId)?.details?.risposta;
        if (typeof data === "string") {
          const esito = await verificaEsercizio(esercizioId, data);
          if (vivo && esito) setDato({ ...esito, testo: data });
        }
      } finally {
        if (vivo) setCaricando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [esercizioId, assignmentId]);

  async function rispondi(scelta?: string) {
    if (!esercizio) return;
    // Nelle domande a scelta la risposta è l'opzione toccata, non il campo di testo.
    const risposta = scelta ?? testoRisposta;
    // Il responso lo dà il database: qui le risposte attese non ci sono mai
    // state e non ci devono essere. Se la chiamata non riesce non si inventa
    // un verdetto — dire «giusto» per non lasciare la pagina ferma sarebbe
    // peggio di dire «riprova».
    const esito = await verificaEsercizio(esercizio.id, risposta);
    if (!esito) {
      setErroreRisposta(true);
      return;
    }
    setErroreRisposta(false);
    const giusta = esito.giusta;
    setDato({ ...esito, testo: risposta });
    setRisposte((prima) => new Set(prima).add(esercizio.id));

    /**
     * Il risultato va nella stessa tabella delle mani giocate.
     *
     * Serve perché il conteggio di completamento del compito, la classifica e
     * i tempi guardano lì: un esercizio salvato altrove sarebbe invisibile a
     * tutto quello che già funziona. `game_type` lo distingue, `details` porta
     * l'id dell'esercizio come `smazzata_id` — è la chiave che il resto del
     * codice usa per dire «questo pezzo l'ha fatto».
     */
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // supabase-js non lancia: l'errore sta nella risposta. Ignorarlo
      // lasciava l'allievo convinto di aver consegnato e l'insegnante senza
      // la risposta, senza che nessuno lo vedesse.
      const { error: erroreSalvataggio } = await supabase.from("game_results").insert({
        user_id: user.id,
        game_type: "compito",
        assignment_id: assignmentId,
        score: giusta ? 1 : -1,
        details: {
          smazzata_id: esercizio.id,
          esercizio: true,
          consegna: esercizio.consegna,
          risposta,
          giusta,
        },
      });
      if (erroreSalvataggio) throw erroreSalvataggio;
    } catch (err) {
      segnalaSalvoRete("esercizio:salva-risposta", err);
    }
  }

  if (caricando) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (!esercizio) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-10 text-sm text-muted-foreground">
        {t("Questo esercizio non c’è più, oppure non è per te.")}
      </p>
    );
  }

  const mia = esercizio.hands[esercizio.posizione] ?? [];
  // Il morto si vede solo se il gioco è cominciato e non è la propria mano.
  const mortoPos: Position | null =
    esercizio.played.length > 0 && esercizio.declarer
      ? (({ north: "south", south: "north", east: "west", west: "east" } as const)[
          esercizio.declarer
        ] as Position)
      : null;
  const morto = mortoPos && mortoPos !== esercizio.posizione ? esercizio.hands[mortoPos] : null;
  const figura = leggiFigura(esercizio.figura);
  const posto = ordine.indexOf(esercizio.id);
  /*
   * LA DOMANDA DOPO. Un test sono venti domande di fila: senza un «avanti»
   * l'allievo, dopo la prima, tornava al compito e credeva di aver finito
   * (Trevissoi, 06/11/2026: «non procede con la domanda successiva»). Si va
   * alla prossima senza risposta, girando dall'inizio se ne ha saltata qualcuna.
   */
  const prossima =
    posto < 0
      ? null
      : ([...ordine.slice(posto + 1), ...ordine.slice(0, posto)].find((id) => !risposte.has(id)) ?? null);
  const alCompito = `/classi/${classId}/compito/${assignmentId}`;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[
          { etichetta: "Le mie classi", href: "/classi" },
          { etichetta: "La classe", href: `/classi/${classId}` },
          ...(assignmentId ? [{ etichetta: t("Il compito"), href: alCompito }] : []),
          { etichetta: esercizio.titolo },
        ]}
      />

      {posto >= 0 && (
        <p className="mb-1 text-sm font-semibold text-muted-foreground">
          {t("Domanda {n} di {m}", { n: posto + 1, m: ordine.length })}
        </p>
      )}
      <h1 className={`font-display text-2xl font-bold sm:text-3xl ${esercizio.consegna === "scelta" ? "mb-4" : "mb-1"}`}>{esercizio.titolo}</h1>
      {/* Nelle domande a scelta «Scegli la risposta» lo dicono già i pulsanti. */}
      {esercizio.consegna !== "scelta" && (
        <p className="mb-5 text-sm font-medium text-primary">
          {t(ETICHETTE_CONSEGNA[esercizio.consegna])}
        </p>
      )}

      {esercizio.domanda && (
        <p className={`mb-5 whitespace-pre-line rounded-lg border border-border bg-muted/40 p-3 ${esercizio.consegna === "scelta" ? "text-base font-medium" : "text-sm"}`}>
          {esercizio.domanda}
        </p>
      )}

      {esercizio.bids.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("La dichiarazione fin qui")}
          </p>
          <BiddingPanel
            bidding={{ dealer: esercizio.dealer, bids: esercizio.bids }}
            inBasso={esercizio.posizione}
          />
        </div>
      )}

      {esercizio.played.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          {esercizio.contract && (
            <>
              {t("Contratto")} <strong>{contrattoLeggibile(esercizio.contract)}</strong>
              {esercizio.declarer && ` di ${NOME[esercizio.declarer]}`} ·{" "}
            </>
          )}
          {esercizio.played.length} carte già giocate
        </p>
      )}

      {/* La figura del test: la mano, la linea o lo schema di un seme. */}
      {figura && <FiguraDomanda figura={figura} />}

      {/* Una domanda a scelta può non avere una mano: allora non si disegna. */}
      {mia.length > 0 && <ManoInChiaro carte={mia} etichetta={`La tua mano (${NOME[esercizio.posizione]})`} />}
      {morto && <ManoInChiaro carte={morto} etichetta="Il morto" />}

      {!dato && esercizio.consegna === "scelta" && (esercizio.opzioni?.length ?? 0) > 0 ? (
        /*
         * La domanda a scelta: un tocco è la risposta. Niente «Rispondi» da
         * premere dopo — il test della Commissione è fatto così, e un passaggio
         * in più per ogni domanda, su venti domande, è quello che fa smettere.
         */
        <div className="mt-6 grid gap-2" role="group" aria-label={t("Scegli la risposta")}>
          {esercizio.opzioni!.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => void rispondi(o)}
              className="min-h-12 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5"
            >
              {o}
            </button>
          ))}
          {erroreRisposta && (
            <p className="text-sm text-red-600">
              {t("Non riesco a correggere adesso. Riprova fra un momento.")}
            </p>
          )}
        </div>
      ) : !dato ? (
        <div className="mt-6 space-y-3">
          <input
            value={testoRisposta}
            onChange={(e) => setRisposta(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && testoRisposta.trim() && void rispondi()}
            placeholder={
              esercizio.consegna === "dichiara"
                ? "La tua dichiarazione, es. 3SA"
                : esercizio.consegna === "carta"
                  ? "La carta che giochi, es. ♠A"
                  : "Come pianifichi il gioco"
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          <Button onClick={() => void rispondi()} disabled={!testoRisposta.trim()} className="w-full">
            {t("Rispondi")}
          </Button>
          {erroreRisposta && (
            <p className="text-sm text-red-600">
              {t("Non riesco a correggere adesso. Riprova fra un momento.")}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              dato.giusta
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                : "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
            }`}
          >
            {dato.giusta ? (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <XCircle className="h-6 w-6 shrink-0 text-red-600" aria-hidden="true" />
            )}
            <div>
              <p className="font-bold">
                {dato.risposte.length === 0
                  ? "Risposta registrata"
                  : dato.giusta
                    ? "Giusto"
                    : "Non era questa"}
              </p>
              {!dato.giusta && dato.risposte.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {dato.risposte.length === 1 ? "La risposta era" : "Andavano bene"}:{" "}
                  {dato.risposte.join(", ")}
                </p>
              )}
            </div>
          </div>

          {dato.soluzione &&
            (spiegazione ? (
              <p className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
                {dato.soluzione}
              </p>
            ) : (
              <Button variant="outline" onClick={() => setSpiegazione(true)} className="w-full">
                {t("Perché?")}
              </Button>
            ))}

          {assignmentId && (
            prossima ? (
              <Button asChild className="w-full">
                <Link href={`/classi/${classId}/esercizio/${prossima}?compito=${assignmentId}`}>
                  {t("Domanda successiva")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant={posto >= 0 ? "default" : "outline"} className="w-full">
                <Link href={alCompito}>
                  {posto >= 0 ? t("Hai risposto a tutte: vedi il risultato") : t("Torna al compito")}
                </Link>
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function ManoInChiaro({ carte, etichetta }: { carte: Card[]; etichetta: string }) {
  return (
    <div className="mb-3 rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {etichetta}
      </p>
      <div className="space-y-1">
        {SEMI.map((s) => {
          const r = carte
            .filter((c) => c.suit === s)
            .map((c) => c.rank)
            .sort((a, b) => ORDINE.indexOf(a) - ORDINE.indexOf(b));
          return (
            <p key={s} className="flex items-center gap-2">
              <SuitSymbol suit={s} size="md" />
              <span className="font-mono text-lg font-bold tracking-wider">
                {r.length ? r.join(" ") : "—"}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
