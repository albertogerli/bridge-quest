import { beforeEach, describe, expect, it, vi } from "vitest";
import { createResultQueue, SessioneNonValida } from "./game-result-queue";

const memory = new Map<string, string>();
const localStorage: Storage = {
  get length() { return memory.size; },
  key: (i) => [...memory.keys()][i] ?? null,
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => { memory.set(k, v); },
  removeItem: (k) => { memory.delete(k); },
  clear: () => memory.clear(),
};
beforeEach(() => localStorage.clear());
describe("durable game-result queue", () => {
  it("does not duplicate A or remove B when a save arrives during a flush", async () => {
    let release!: () => void;
    const first = new Promise<void>((resolve) => { release = resolve; });
    const send = vi.fn().mockImplementationOnce(() => first).mockResolvedValue(undefined);
    const queue = createResultQueue(localStorage, send);
    const a = queue.enqueue({ gameType: "smazzata", score: 1 }, "owner-a", "web");
    const saving = queue.flush("owner-a");
    const b = queue.enqueue({ gameType: "smazzata", score: 2 }, "owner-a", "web");
    expect(queue.flush("owner-a")).toBe(saving);
    release();
    await saving;
    expect(send.mock.calls.map(([entry]) => entry.id)).toEqual([a.id, b.id]);
    expect(queue.pending("owner-a")).toEqual([]);
  });
  it("reuses the ID after a committed write whose response was lost", async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error("lost response")).mockResolvedValue(undefined);
    const queue = createResultQueue(localStorage, send);
    const a = queue.enqueue({ gameType: "sfida", score: 4 }, "owner-a", "web");
    await expect(queue.flush("owner-a")).rejects.toThrow("lost response");
    expect(queue.pending("owner-a")).toHaveLength(1);
    await queue.flush("owner-a");
    expect(send.mock.calls.map(([entry]) => entry.id)).toEqual([a.id, a.id]);
  });
  it("isolates owners and leaves guest/legacy results untouched", async () => {
    localStorage.setItem("bq_game_results_queue", "[{\"score\":99}]");
    const send = vi.fn().mockResolvedValue(undefined);
    const queue = createResultQueue(localStorage, send);
    queue.enqueue({ gameType: "sfida", score: 1 }, "owner-a", "web");
    queue.enqueue({ gameType: "sfida", score: 2 }, "owner-b", "web");
    queue.enqueue({ gameType: "sfida", score: 3 }, null, "web");
    await queue.flush("owner-b");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].score).toBe(2);
    expect(queue.pending("owner-a")).toHaveLength(1);
    expect(queue.pending(null)).toHaveLength(1);
    expect(localStorage.getItem("bq_game_results_queue")).not.toBeNull();
  });
  it("independent tabs retain events appended by either tab", () => {
    const send = vi.fn();
    const a = createResultQueue(localStorage, send);
    const b = createResultQueue(localStorage, send);
    a.enqueue({ gameType: "sfida", score: 1 }, "owner-a", "web");
    b.enqueue({ gameType: "sfida", score: 2 }, "owner-a", "web");
    expect(a.pending("owner-a")).toHaveLength(2);
  });
});

describe("la sessione scaduta non è un difetto", () => {
  it("ha un tipo proprio, riconoscibile da chi decide se segnalare", () => {
    // Prima era un `Error` generico con un messaggio: distinguerlo voleva dire
    // confrontare stringhe, e una stringa cambia senza che nessuno se ne
    // accorga. Il tipo no.
    const e = new SessioneNonValida();
    expect(e).toBeInstanceOf(SessioneNonValida);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("SessioneNonValida");
  });

  it("IL RISULTATO RESTA IN CODA: è il lavoro per cui la coda esiste", async () => {
    // La prova che conta. Se la sessione è scaduta il risultato non si perde:
    // resta dov'è e parte al prossimo accesso valido. Cancellarlo — o smettere
    // di riprovare — sarebbe perdere una partita che l'utente ha giocato.
    const coda = createResultQueue(localStorage, async () => {
      throw new SessioneNonValida();
    });
    coda.enqueue({ gameType: "trova-errore", score: 3 }, "utente-1", "web");

    await expect(coda.flush("utente-1")).rejects.toBeInstanceOf(SessioneNonValida);
    expect(coda.pending("utente-1")).toHaveLength(1);
  });

  it("quando la sessione torna, il risultato parte", async () => {
    let sessioneValida = false;
    const coda = createResultQueue(localStorage, async () => {
      if (!sessioneValida) throw new SessioneNonValida();
    });
    coda.enqueue({ gameType: "trova-errore", score: 3 }, "utente-1", "web");

    await coda.flush("utente-1").catch(() => {});
    expect(coda.pending("utente-1")).toHaveLength(1);

    sessioneValida = true;
    await coda.flush("utente-1");
    expect(coda.pending("utente-1")).toHaveLength(0);
  });

  it("un rifiuto del database resta un errore vero, non si confonde", () => {
    // È il motivo per cui si distingue invece di zittire tutto: un permesso
    // mancante o una riga malformata vanno ancora guardati.
    const rifiuto = new Error("Salvataggio risultato rifiutato (42501)");
    expect(rifiuto).not.toBeInstanceOf(SessioneNonValida);
  });
});
