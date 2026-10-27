"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Asta } from "@/components/bridge/asta";
import { QuattroMani } from "@/components/bridge/riepilogo-mano";
import { parseContract, partnershipOf, type GameState, type Position } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import { mazziereDellaMano, mazziereRegistrato } from "@/lib/compito-licita";
import { useT } from "@/contexts/traduzioni-provider";
import type { ContrattoDaGiocare } from "@/components/classi/compito-licita-mano";

const HandReplay = dynamic(
  () => import("@/components/bridge/hand-replay").then((m) => m.HandReplay),
  { ssr: false },
);

const NOME_POSTO: Record<Position, string> = { north: "Nord", east: "Est", south: "Sud", west: "Ovest" };
const POSTI = Object.keys(NOME_POSTO) as Position[];

/**
 * Una mano del compito di licita già dichiarata, rivista dall'allievo: la sua
 * asta, le quattro mani e, se l'ha giocata, il gioco carta per carta.
 *
 * NON SI RIDICHIARA. Una volta registrata, l'asta resta quella: l'insegnante
 * la corregge, e l'allievo torna qui a guardare il proprio errore accanto alla
 * correzione. Prima la poteva rifare, e così l'errore spariva prima che
 * qualcuno lo vedesse (Saccomanno con la classe, 27/10/2026).
 */
export function RivediLicita({
  smazzata,
  details,
  score,
  onGioca,
}: {
  smazzata: Smazzata;
  details: Record<string, unknown>;
  /** Lo `score` della riga registrata: il gioco la riscrive con lo stesso. */
  score: number;
  /**
   * Gioca adesso il contratto dichiarato, se dopo l'asta l'allievo era
   * tornato al compito senza giocarlo. Assente: non si gioca (compito di sola
   * licita, passo generale, o già giocato).
   */
  onGioca?: (gioco: ContrattoDaGiocare) => void;
}) {
  const t = useT();
  const [replay, setReplay] = useState(false);

  const bids = Array.isArray(details.bids) ? (details.bids as string[]) : [];
  const dealer = mazziereRegistrato(details, mazziereDellaMano(smazzata));
  const contratto = typeof details.contratto === "string" ? details.contratto : null;
  const dichiarante =
    typeof details.dichiarante === "string" && POSTI.includes(details.dichiarante as Position)
      ? (details.dichiarante as Position)
      : null;
  const gioco = leggiGioco(details.gioco);
  const play = details.play as { hands?: unknown; tricks?: unknown } | undefined;
  const sipuoRivedere = !!(gioco && dichiarante && play?.hands && play?.tricks);
  const daGiocare: ContrattoDaGiocare | null =
    onGioca && !gioco && contratto && dichiarante
      ? { contract: contratto, declarer: dichiarante, dealer, bids, riga: { score, details } }
      : null;

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <p className="text-sm font-semibold">
        {contratto && dichiarante
          ? t("La tua licita: {contratto} di {chi}", { contratto, chi: t(NOME_POSTO[dichiarante]) })
          : t("La tua licita: passo generale")}
      </p>
      {bids.length > 0 && <Asta dealer={dealer} bids={bids} ioSono="south" />}

      {gioco ? (
        <p className="text-sm">
          {gioco.difesa
            ? t("L'hai controgiocata in difesa: il dichiarante ha fatto {fatte} prese su {servono}", {
                fatte: gioco.tricksMade,
                servono: gioco.tricksNeeded,
              })
            : t("L'hai giocata: {fatte} prese su {servono}", { fatte: gioco.tricksMade, servono: gioco.tricksNeeded })}
          {" · "}
          {gioco.result >= 0 ? t("mantenuto") : t("sotto di {n}", { n: -gioco.result })}
        </p>
      ) : (
        contratto &&
        !daGiocare && <p className="text-sm text-muted-foreground">{t("Questa mano non l'hai giocata.")}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {sipuoRivedere && (
          <Button size="sm" onClick={() => setReplay(true)}>
            <Play className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t("Rivedi il gioco carta per carta")}
          </Button>
        )}
        {daGiocare && onGioca && (
          <Button size="sm" onClick={() => onGioca(daGiocare)}>
            <Play className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {partnershipOf(daGiocare.declarer) === "ew" ? t("Gioca in difesa") : t("Gioca il contratto")}
          </Button>
        )}
      </div>

      <QuattroMani deal={smazzata.hands} />

      {replay && sipuoRivedere && gioco && dichiarante && (
        <HandReplay
          gameState={
            {
              hands: play!.hands,
              tricks: play!.tricks,
              contract: gioco.contract,
              declarer: dichiarante,
              trumpSuit: parseContract(gioco.contract).trumpSuit,
            } as unknown as GameState
          }
          inBasso="south"
          onClose={() => setReplay(false)}
        />
      )}
    </div>
  );
}

function leggiGioco(raw: unknown): {
  contract: string;
  tricksMade: number;
  tricksNeeded: number;
  result: number;
  difesa: boolean;
} | null {
  if (!raw || typeof raw !== "object") return null;
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
    tricksMade: g.tricksMade,
    tricksNeeded: g.tricksNeeded,
    result: g.result,
    difesa: g.difesa === true,
  };
}
