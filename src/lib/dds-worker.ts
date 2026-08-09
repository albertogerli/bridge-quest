/**
 * FIGB Bridge LAB - DDS Web Worker
 *
 * Runs the Double Dummy Solver off the main thread to avoid blocking the UI.
 * Communicates via postMessage with the use-dds hook (solve) and the
 * dds-select client (selectCard, used by the expert AI).
 */

import { solveDDS, estimateFromContract, selectBestCardDDS } from "./dds-solver";
import type { DDSRequest, DDSResult, DDSSelectRequest, DDSSelectResult } from "./dds-solver";

export type DDSWorkerRequest =
  | { type: "solve"; id: string; request: DDSRequest }
  | { type: "selectCard"; id: string; request: DDSSelectRequest };

export type DDSWorkerResponse =
  | { type: "result"; id: string; result: DDSResult }
  | { type: "selectResult"; id: string; result: DDSSelectResult };

// Web Worker message handler
self.onmessage = (event: MessageEvent<DDSWorkerRequest>) => {
  const data = event.data;

  if (data.type === "solve") {
    const { id, request } = data;
    try {
      const result = solveDDS(request);

      const response: DDSWorkerResponse = {
        type: "result",
        id,
        result,
      };

      self.postMessage(response);
    } catch {
      // On any error, fall back to contract estimate
      const fallbackTricks = estimateFromContract(request.contract);
      const response: DDSWorkerResponse = {
        type: "result",
        id,
        result: {
          tricks: fallbackTricks,
          available: false,
          timeMs: 0,
        },
      };
      self.postMessage(response);
    }
  } else if (data.type === "selectCard") {
    const { id, request } = data;
    let result: DDSSelectResult;
    try {
      result = selectBestCardDDS(request);
    } catch {
      result = { card: null, available: false, timeMs: 0 };
    }
    const response: DDSWorkerResponse = {
      type: "selectResult",
      id,
      result,
    };
    self.postMessage(response);
  }
};
