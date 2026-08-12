import { describe, it, expect } from "vitest";
import {
  evaluateChannel,
  isHealthy,
  persistentFailureMessage,
  FAILURES_BEFORE_REPORT,
  POLL_DEGRADED_MS,
  POLL_HEALTHY_MS,
} from "./realtime-health";

describe("isHealthy", () => {
  it("solo SUBSCRIBED è sano", () => {
    expect(isHealthy("SUBSCRIBED")).toBe(true);
    for (const s of ["CHANNEL_ERROR", "TIMED_OUT", "CLOSED", "boh"]) {
      expect(isHealthy(s)).toBe(false);
    }
  });
});

describe("evaluateChannel — un calo passeggero non va segnalato", () => {
  it("al primo fallimento degrada il polling e tace", () => {
    // È il caso reale del 12/08: Samsung Internet su rete mobile.
    const d = evaluateChannel("CHANNEL_ERROR", 0);
    expect(d.healthy).toBe(false);
    expect(d.shouldReport).toBe(false);
    expect(d.pollMs).toBe(POLL_DEGRADED_MS);
  });

  it("tace anche al secondo", () => {
    expect(evaluateChannel("TIMED_OUT", 1).shouldReport).toBe(false);
  });
});

describe("evaluateChannel — un guasto persistente va segnalato una volta sola", () => {
  it("segnala esattamente alla soglia", () => {
    expect(evaluateChannel("CHANNEL_ERROR", FAILURES_BEFORE_REPORT - 1).shouldReport).toBe(true);
  });

  it("non risegnala ai tentativi successivi", () => {
    // Senza il confronto di uguaglianza, ogni ritentativo genererebbe un
    // evento identico: sarebbe lo stesso rumore di prima, solo più tardi.
    for (const n of [FAILURES_BEFORE_REPORT, FAILURES_BEFORE_REPORT + 5, 50]) {
      expect(evaluateChannel("CHANNEL_ERROR", n).shouldReport).toBe(false);
    }
  });
});

describe("evaluateChannel — riconnessione", () => {
  it("azzera il conteggio e torna all'intervallo lungo", () => {
    const d = evaluateChannel("SUBSCRIBED", 7);
    expect(d).toMatchObject({ healthy: true, failures: 0, pollMs: POLL_HEALTHY_MS, shouldReport: false });
  });

  it("dopo una riconnessione serve di nuovo tutta la soglia per segnalare", () => {
    // Un guasto risolto non deve contribuire alla soglia del successivo.
    let f = evaluateChannel("SUBSCRIBED", 2).failures;
    for (let i = 0; i < FAILURES_BEFORE_REPORT - 1; i++) {
      const d = evaluateChannel("CHANNEL_ERROR", f);
      expect(d.shouldReport).toBe(false);
      f = d.failures;
    }
    expect(evaluateChannel("CHANNEL_ERROR", f).shouldReport).toBe(true);
  });
});

describe("intervalli", () => {
  it("degradato è più fitto di quello sano, ma non troppo", () => {
    expect(POLL_DEGRADED_MS).toBeLessThan(POLL_HEALTHY_MS);
    // Sotto i 30 secondi, con molti utenti disconnessi, diventerebbe un
    // carico inutile sul database.
    expect(POLL_DEGRADED_MS).toBeGreaterThanOrEqual(30_000);
  });
});

describe("persistentFailureMessage", () => {
  it("dice cosa succede all'utente, non solo che è fallito", () => {
    const m = persistentFailureMessage("use-challenges:realtime", "CHANNEL_ERROR", 3);
    expect(m).toContain("use-challenges:realtime");
    expect(m).toContain("CHANNEL_ERROR");
    expect(m).toContain("continua a funzionare");
  });
});
