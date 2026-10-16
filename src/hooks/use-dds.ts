"use client";

/**
 * FIGB Bridge LAB - useDDS Hook
 *
 * Quante prese fa il dichiarante col gioco perfetto, per il riepilogo di fine
 * mano e per il quiz di pianificazione.
 *
 * PRIMA era un Web Worker con un solver in TypeScript (`dds-solver.ts`) che
 * oltre le sei carte per mano non risolveva ma stimava dai punti: su una
 * smazzata intera il risultato era quasi sempre una stima (`isExact: false`),
 * e la pagina della smazzata, giustamente, non la passava al classificatore
 * degli errori. Adesso risponde la libreria `bridge-dds` in WebAssembly
 * (`preseDelDichiarante`), esatta su tredici carte in qualche decina di
 * millisecondi: il calcolo è uno per mano, e il Worker non serve più.
 *
 * L'interfaccia è rimasta la stessa — `isExact` compreso — perché il caso
 * «non è stato possibile calcolare» esiste ancora: se il WebAssembly non si
 * carica si ripiega sulle prese richieste dal contratto, dichiarandolo.
 */

import { useCallback } from "react";
import type { Card, Position } from "@/lib/bridge-engine";
import { parseContract } from "@/lib/bridge-engine";
import { preseDelDichiarante } from "@/lib/dds-table";
import { reportError } from "@/lib/report-error";

export interface DDSAnalysis {
  /** Optimal tricks for declarer (double dummy) */
  ddTricks: number;
  /** Whether this is an exact result or the contract's target as a fallback */
  isExact: boolean;
  /** Computation time in ms */
  timeMs: number;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

/** Same deal, same lead, same answer: no need to solve twice in a session. */
const cache = new Map<string, number>();

function chiave(hands: Record<Position, Card[]>, contract: string, declarer: Position, openingLead?: Card): string {
  const mani = (["north", "east", "south", "west"] as Position[]).map((p) =>
    hands[p].map((c) => `${c.suit[0]}${c.rank}`).sort().join(","),
  );
  return [contract, declarer, ...mani, openingLead ? `${openingLead.suit[0]}${openingLead.rank}` : ""].join("|");
}

const SINISTRA: Record<Position, Position> = { north: "east", east: "south", south: "west", west: "north" };

export function useDDS() {
  /**
   * Prese del dichiarante dalla smazzata intera, con l'attacco dato se c'è
   * (altrimenti con il miglior attacco per la difesa).
   */
  const analyzeHand = useCallback(
    async (
      hands: Record<Position, Card[]>,
      contract: string,
      declarer: Position,
      openingLead?: Card,
    ): Promise<DDSAnalysis> => {
      const avvio = performance.now();
      try {
        const k = chiave(hands, contract, declarer, openingLead);
        let prese = cache.get(k);
        if (prese === undefined) {
          const { trumpSuit } = parseContract(contract);
          prese = await preseDelDichiarante(hands, trumpSuit, declarer, SINISTRA[declarer], openingLead);
          cache.set(k, prese);
        }
        return { ddTricks: prese, isExact: true, timeMs: performance.now() - avvio, loading: false, error: null };
      } catch (err) {
        reportError("dds:analisi-mano", err);
        // Ripiego dichiarato: le prese che il contratto richiede.
        return {
          ddTricks: parseInt(contract[0]) + 6,
          isExact: false,
          timeMs: 0,
          loading: false,
          error: err instanceof Error ? err.message : "Errore analisi DDS",
        };
      }
    },
    [],
  );

  return { analyzeHand };
}
