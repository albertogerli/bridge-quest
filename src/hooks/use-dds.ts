"use client";

/**
 * BridgeQuest - useDDS Hook
 *
 * Manages the DDS Web Worker for background double-dummy analysis.
 * Features:
 * - Spawns a Web Worker to avoid blocking UI
 * - Caches results by hand hash
 * - Provides loading state
 * - Falls back to contract estimate if worker unavailable
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Card, Position } from "@/lib/bridge-engine";
import type { DDSResult } from "@/lib/dds-solver";
import type { DDSWorkerResponse } from "@/lib/dds-worker";

export interface DDSAnalysis {
  /** Optimal tricks for declarer (double dummy) */
  ddTricks: number;
  /** Whether this is an exact result or estimate */
  isExact: boolean;
  /** Computation time in ms */
  timeMs: number;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

interface PendingRequest {
  resolve: (result: DDSResult) => void;
  reject: (error: Error) => void;
}

// ──────────────────────────────────────────────────────────────
// Result cache (persists across hook instances in the same session)
// ──────────────────────────────────────────────────────────────

const resultCache = new Map<string, DDSResult>();

function hashHands(
  hands: Record<Position, Card[]>,
  contract: string,
  declarer: Position,
  openingLead?: Card,
): string {
  const parts: string[] = [contract, declarer];

  for (const pos of ["north", "east", "south", "west"] as Position[]) {
    const hand = hands[pos]
      .map(c => `${c.suit[0]}${c.rank}`)
      .sort()
      .join(",");
    parts.push(hand);
  }

  if (openingLead) {
    parts.push(`lead:${openingLead.suit[0]}${openingLead.rank}`);
  }

  return parts.join("|");
}

// ──────────────────────────────────────────────────────────────
// Inline solver fallback (runs on main thread if Worker unavailable)
// ──────────────────────────────────────────────────────────────

async function solveInline(
  hands: Record<Position, Card[]>,
  contract: string,
  declarer: Position,
  openingLead?: Card,
): Promise<DDSResult> {
  // Dynamic import to keep initial bundle small
  const { solveDDS } = await import("@/lib/dds-solver");
  return solveDDS({
    hands,
    contract,
    declarer,
    openingLead,
    timeout: 2000,
  });
}

// ──────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────

export function useDDS() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const idCounterRef = useRef(0);
  const [workerReady, setWorkerReady] = useState(false);

  // Initialize worker
  useEffect(() => {
    try {
      const worker = new Worker(
        new URL("@/lib/dds-worker.ts", import.meta.url),
        { type: "module" }
      );

      worker.onmessage = (event: MessageEvent<DDSWorkerResponse>) => {
        const { id, result } = event.data;
        const pending = pendingRef.current.get(id);
        if (pending) {
          pending.resolve(result);
          pendingRef.current.delete(id);
        }
      };

      worker.onerror = (err) => {
        console.warn("[DDS] Worker error:", err.message);
        // Reject all pending requests
        for (const [id, pending] of pendingRef.current) {
          pending.reject(new Error("Worker error"));
          pendingRef.current.delete(id);
        }
      };

      workerRef.current = worker;
      setWorkerReady(true);
    } catch (err) {
      console.warn("[DDS] Worker not available, will use inline solver:", err);
      setWorkerReady(false);
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * Analyze a hand position double-dummy.
   * Returns a promise with the DDS result.
   */
  const analyze = useCallback(
    async (
      hands: Record<Position, Card[]>,
      contract: string,
      declarer: Position,
      openingLead?: Card,
    ): Promise<DDSResult> => {
      // Check cache
      const cacheKey = hashHands(hands, contract, declarer, openingLead);
      const cached = resultCache.get(cacheKey);
      if (cached) return cached;

      let result: DDSResult;

      if (workerRef.current) {
        // Use Web Worker
        const id = String(++idCounterRef.current);

        result = await new Promise<DDSResult>((resolve, reject) => {
          pendingRef.current.set(id, { resolve, reject });

          workerRef.current!.postMessage({
            type: "solve",
            id,
            request: {
              hands,
              contract,
              declarer,
              openingLead,
              timeout: 2000,
            },
          });

          // Safety timeout: if worker doesn't respond in 5s, reject
          setTimeout(() => {
            const pending = pendingRef.current.get(id);
            if (pending) {
              pending.reject(new Error("Worker timeout"));
              pendingRef.current.delete(id);
            }
          }, 5000);
        });
      } else {
        // Fallback: inline solver on main thread
        result = await solveInline(hands, contract, declarer, openingLead);
      }

      // Cache the result
      resultCache.set(cacheKey, result);
      return result;
    },
    []
  );

  /**
   * High-level analysis function that manages loading state.
   * Returns an DDSAnalysis object.
   */
  const analyzeHand = useCallback(
    async (
      hands: Record<Position, Card[]>,
      contract: string,
      declarer: Position,
      openingLead?: Card,
    ): Promise<DDSAnalysis> => {
      try {
        const result = await analyze(hands, contract, declarer, openingLead);
        return {
          ddTricks: result.tricks,
          isExact: result.available,
          timeMs: result.timeMs,
          loading: false,
          error: null,
        };
      } catch (err) {
        // Final fallback: use contract target
        const level = parseInt(contract[0]);
        const tricksNeeded = level + 6;
        return {
          ddTricks: tricksNeeded,
          isExact: false,
          timeMs: 0,
          loading: false,
          error: err instanceof Error ? err.message : "Errore analisi DDS",
        };
      }
    },
    [analyze]
  );

  return {
    analyze,
    analyzeHand,
    workerReady,
  };
}
