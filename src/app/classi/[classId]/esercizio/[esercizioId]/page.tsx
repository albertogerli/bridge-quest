"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Briciole } from "@/components/briciole";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import {
  ETICHETTE_CONSEGNA,
  leggiEsercizi,
  rispostaGiusta,
  type EsercizioPosizione,
} from "@/lib/esercizi-posizione";
import { useT } from "@/contexts/traduzioni-provider";

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

  const [esercizio, setEsercizio] = useState<EsercizioPosizione | null>(null);
  const [caricando, setCaricando] = useState(true);
  const [risposta, setRisposta] = useState("");
  const [dato, setDato] = useState<{ giusta: boolean; testo: string } | null>(null);
  const [spiegazione, setSpiegazione] = useState(false);

  useEffect(() => {
    let vivo = true;
    void leggiEsercizi([esercizioId])
      .then((e) => {
        if (vivo) setEsercizio(e[0] ?? null);
      })
      .finally(() => {
        if (vivo) setCaricando(false);
      });
    return () => {
      vivo = false;
    };
  }, [esercizioId]);

  async function rispondi() {
    if (!esercizio) return;
    const giusta = rispostaGiusta(risposta, esercizio.risposte);
    setDato({ giusta, testo: risposta });

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
      await supabase.from("game_results").insert({
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
    } catch (err) {
      reportError("esercizio:salva-risposta", err);
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
        Questo esercizio non c&rsquo;è più, oppure non è per te.
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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[
          { etichetta: "Le mie classi", href: "/classi" },
          { etichetta: "La classe", href: `/classi/${classId}` },
          { etichetta: esercizio.titolo },
        ]}
      />

      <h1 className="mb-1 font-display text-2xl font-bold sm:text-3xl">{esercizio.titolo}</h1>
      <p className="mb-5 text-sm font-medium text-primary">
        {ETICHETTE_CONSEGNA[esercizio.consegna]}
      </p>

      {esercizio.domanda && (
        <p className="mb-5 rounded-lg border border-border bg-muted/40 p-3 text-sm">
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
              {t("Contratto")} <strong>{esercizio.contract}</strong>
              {esercizio.declarer && ` di ${NOME[esercizio.declarer]}`} ·{" "}
            </>
          )}
          {esercizio.played.length} carte già giocate
        </p>
      )}

      <ManoInChiaro carte={mia} etichetta={`La tua mano (${NOME[esercizio.posizione]})`} />
      {morto && <ManoInChiaro carte={morto} etichetta="Il morto" />}

      {!dato ? (
        <div className="mt-6 space-y-3">
          <input
            value={risposta}
            onChange={(e) => setRisposta(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && risposta.trim() && void rispondi()}
            placeholder={
              esercizio.consegna === "dichiara"
                ? "La tua dichiarazione, es. 3SA"
                : esercizio.consegna === "carta"
                  ? "La carta che giochi, es. ♠A"
                  : "Come pianifichi il gioco"
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          <Button onClick={() => void rispondi()} disabled={!risposta.trim()} className="w-full">
            {t("Rispondi")}
          </Button>
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
                {esercizio.risposte.length === 0
                  ? "Risposta registrata"
                  : dato.giusta
                    ? "Giusto"
                    : "Non era questa"}
              </p>
              {!dato.giusta && esercizio.risposte.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {esercizio.risposte.length === 1 ? "La risposta era" : "Andavano bene"}:{" "}
                  {esercizio.risposte.join(", ")}
                </p>
              )}
            </div>
          </div>

          {esercizio.soluzione &&
            (spiegazione ? (
              <p className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
                {esercizio.soluzione}
              </p>
            ) : (
              <Button variant="outline" onClick={() => setSpiegazione(true)} className="w-full">
                {t("Perché?")}
              </Button>
            ))}
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
