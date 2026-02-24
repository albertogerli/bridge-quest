/**
 * FIGB Bridge LAB - DDS Web Worker
 *
 * Runs the Double Dummy Solver off the main thread to avoid blocking the UI.
 * Communicates via postMessage with the use-dds hook.
 */

import { solveDDS, estimateFromContract } from "./dds-solver";
import type { DDSRequest, DDSResult } from "./dds-solver";

export interface DDSWorkerRequest {
  type: "solve";
  id: string;
  request: DDSRequest;
}

export interface DDSWorkerResponse {
  type: "result";
  id: string;
  result: DDSResult;
}

// Web Worker message handler
self.onmessage = (event: MessageEvent<DDSWorkerRequest>) => {
  const { type, id, request } = event.data;

  if (type === "solve") {
    try {
      const result = solveDDS(request);

      const response: DDSWorkerResponse = {
        type: "result",
        id,
        result,
      };

      self.postMessage(response);
    } catch (error) {
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
  }
};
