/**
 * FIGB Bridge LAB - DDS card selection client
 *
 * Promise-based client for the expert AI: asks the DDS Web Worker for the
 * double-dummy optimal card in endgame positions. Falls back to running the
 * solver inline (main thread) if the Worker is unavailable.
 *
 * Used by ai-difficulty.ts when level = "esperto" and BEN is offline.
 */

import type { DDSRequest, DDSResult, DDSSelectRequest, DDSSelectResult } from "./dds-solver";
import type { DDSWorkerResponse } from "./dds-worker";

const WORKER_SAFETY_TIMEOUT = 4000; // ms — must exceed the solver timeout

interface PendingRequest {
  // The worker guarantees the result type matches the request type (same id)
  resolve: (result: never) => void;
}

let worker: Worker | null = null;
let workerFailed = false;
let idCounter = 0;
const pending = new Map<string, PendingRequest>();

function getWorker(): Worker | null {
  if (workerFailed || typeof window === "undefined") return null;
  if (worker) return worker;

  try {
    worker = new Worker(
      new URL("@/lib/dds-worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event: MessageEvent<DDSWorkerResponse>) => {
      const { id, result } = event.data;
      const req = pending.get(id);
      if (req) {
        (req.resolve as (r: DDSResult | DDSSelectResult) => void)(result);
        pending.delete(id);
      }
    };

    worker.onerror = (err) => {
      console.warn("[DDS-select] Worker error:", err.message);
      /**
       * PRIMA SI RISPONDE, POI SI SVUOTA.
       *
       * `pending.clear()` da solo lascia le promesse in volo senza risposta
       * per sempre: chi aspettava resta appeso, e la rete di sicurezza col
       * timeout non scatta perché cerca la richiesta nella mappa e non la
       * trova più. In pratica la partita si ferma su «Verifica del
       * reclamo…» e non si gioca più una carta.
       *
       * La risposta neutra dice «non disponibile», che è vero, e ogni
       * chiamante sa già cosa farci: è lo stesso valore delle reti di
       * sicurezza qui sotto.
       */
      for (const [, req] of pending) {
        (req.resolve as (r: DDSResult | DDSSelectResult) => void)({
          card: null,
          tricks: 0,
          available: false,
          timeMs: 0,
        } as DDSResult & DDSSelectResult);
      }
      pending.clear();
      worker?.terminate();
      worker = null;
      workerFailed = true;
    };

    return worker;
  } catch (err) {
    console.warn("[DDS-select] Worker not available:", err);
    workerFailed = true;
    return null;
  }
}

/**
 * Ask for the DD-optimal card. Resolves with card: null when the position is
 * too large or the search timed out — callers should fall back to a heuristic.
 */
export async function ddsSelectCard(request: DDSSelectRequest): Promise<DDSSelectResult> {
  const w = getWorker();

  if (w) {
    const id = `sel-${++idCounter}`;
    return new Promise<DDSSelectResult>((resolve) => {
      pending.set(id, { resolve });

      w.postMessage({ type: "selectCard", id, request });

      // Safety timeout: never leave the game waiting on the worker
      setTimeout(() => {
        const req = pending.get(id);
        if (req) {
          pending.delete(id);
          resolve({ card: null, available: false, timeMs: WORKER_SAFETY_TIMEOUT });
        }
      }, WORKER_SAFETY_TIMEOUT);
    });
  }

  // Inline fallback (main thread) with a shorter budget to limit jank
  try {
    const { selectBestCardDDS } = await import("@/lib/dds-solver");
    return selectBestCardDDS({ ...request, timeout: Math.min(request.timeout ?? 800, 800) });
  } catch {
    return { card: null, available: false, timeMs: 0 };
  }
}

/**
 * Solve a position double-dummy (e.g. to validate a claim).
 * Resolves with available: false on timeout/error — treat as "not proven".
 */
export async function ddsSolve(request: DDSRequest): Promise<DDSResult> {
  const w = getWorker();

  if (w) {
    const id = `solve-${++idCounter}`;
    return new Promise<DDSResult>((resolve) => {
      pending.set(id, { resolve });

      w.postMessage({ type: "solve", id, request });

      setTimeout(() => {
        const req = pending.get(id);
        if (req) {
          pending.delete(id);
          resolve({ tricks: 0, available: false, timeMs: WORKER_SAFETY_TIMEOUT });
        }
      }, WORKER_SAFETY_TIMEOUT);
    });
  }

  // Inline fallback (main thread)
  try {
    const { solveDDS } = await import("@/lib/dds-solver");
    return solveDDS({ ...request, timeout: Math.min(request.timeout ?? 1500, 1500) });
  } catch {
    return { tricks: 0, available: false, timeMs: 0 };
  }
}
