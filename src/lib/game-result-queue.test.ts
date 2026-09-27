import { beforeEach, describe, expect, it, vi } from "vitest";
import { createResultQueue, erroreDiScrittura, punteggioIntero, ReteNonRaggiungibile, RifiutoPermanente, SessioneNonValida } from "./game-result-queue";

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

describe("che cos'è andato storto scrivendo un risultato", () => {
  it("nessun errore: niente da sollevare", () => {
    expect(erroreDiScrittura(null)).toBeNull();
    expect(erroreDiScrittura(undefined)).toBeNull();
  });

  /**
   * IL CASO DEL 27/09/2026, iPad, applicazione nativa. postgrest-js, quando
   * la fetch non parte, costruisce `code: ""` e mette il vero motivo nel
   * messaggio. Il punto di chiamata teneva solo il codice e stampava
   * «Salvataggio risultato rifiutato ()»: parentesi vuote, e ogni trenta
   * secondi, perché la coda riprova.
   */
  it("la fetch che non parte è rete, non un rifiuto", () => {
    const e = erroreDiScrittura({ code: "", message: "TypeError: Failed to fetch" });
    expect(e).toBeInstanceOf(ReteNonRaggiungibile);
  });

  it("vale anche con la forma di Safari", () => {
    expect(erroreDiScrittura({ code: "", message: "Load failed" })).toBeInstanceOf(
      ReteNonRaggiungibile,
    );
  });

  it("un permesso negato resta un rifiuto, col suo codice", () => {
    const e = erroreDiScrittura({ code: "42501", message: "permission denied" });
    expect(e).not.toBeInstanceOf(ReteNonRaggiungibile);
    expect(e?.message).toBe("Salvataggio risultato rifiutato (42501)");
  });

  // Il difetto nel difetto: `??` lascia passare la stringa vuota, quindi il
  // messaggio finiva senza niente dentro le parentesi proprio quando il
  // codice mancava — cioè quando serviva di più sapere qualcos'altro.
  it("senza codice si scrive «database», non le parentesi vuote", () => {
    expect(erroreDiScrittura({ code: "", message: "qualcosa di strano" })?.message).toBe(
      "Salvataggio risultato rifiutato (database)",
    );
    expect(erroreDiScrittura({ message: "senza codice" })?.message).toBe(
      "Salvataggio risultato rifiutato (database)",
    );
  });
});

describe("il punteggio è una colonna intera", () => {
  /**
   * IL CASO DEL 27/09/2026. Le stelle della licita sono MEZZE — 2.5, 1.5,
   * 0.5 — e `game_results.score` è `integer`. Un totale di 9.5 arrivava a
   * Postgres come «sintassi non valida per il tipo integer», codice 22P02,
   * e la partita non si salvava.
   */
  it("arrotonda le mezze stelle invece di farsi rifiutare", () => {
    expect(punteggioIntero(9.5)).toBe(10);
    expect(punteggioIntero(2.5)).toBe(3);
    expect(punteggioIntero(0.5)).toBe(1);
  });

  it("lascia stare i punteggi che sono già interi", () => {
    expect(punteggioIntero(0)).toBe(0);
    expect(punteggioIntero(-50)).toBe(-50);
    expect(punteggioIntero(1240)).toBe(1240);
  });

  // Meglio zero di un NaN che diventa `null` e sbatte contro NOT NULL.
  it("un numero che non è un numero vale zero", () => {
    expect(punteggioIntero(NaN)).toBe(0);
    expect(punteggioIntero(Infinity)).toBe(0);
  });
});

describe("una voce che non passerà mai non blocca le altre", () => {
  /**
   * PERCHÉ È PIÙ GRAVE DEL DIFETTO CHE L'HA CAUSATA. La coda manda in
   * ordine e si ferma alla prima che fallisce. Una voce rifiutata dal
   * database — che sarà rifiutata identica anche domani — resta in testa e
   * blocca TUTTI i risultati successivi di quella persona, riprovando ogni
   * trenta secondi per sempre.
   */
  it("il rifiuto del database è permanente, la rete no", () => {
    expect(erroreDiScrittura({ code: "22P02", message: "invalid input syntax" }))
      .toBeInstanceOf(RifiutoPermanente);
    expect(erroreDiScrittura({ code: "", message: "Load failed" }))
      .not.toBeInstanceOf(RifiutoPermanente);
  });

  it("la voce rifiutata sparisce dalla coda, quelle dopo passano", async () => {
    const coda = createResultQueue(localStorage, async (entry) => {
      if (entry.gameType === "licita") {
        throw erroreDiScrittura({ code: "22P02", message: "invalid input syntax" });
      }
    });
    coda.enqueue({ gameType: "licita", score: 9 }, "utente-1", "web");
    coda.enqueue({ gameType: "smazzata", score: 1 }, "utente-1", "web");

    // Il primo giro getta la voce avvelenata e propaga l'errore.
    await expect(coda.flush("utente-1")).rejects.toBeInstanceOf(RifiutoPermanente);
    expect(coda.pending("utente-1").map((v) => v.gameType)).toEqual(["smazzata"]);

    // Il secondo giro passa: prima non ci sarebbe mai arrivato.
    await coda.flush("utente-1");
    expect(coda.pending("utente-1")).toHaveLength(0);
  });
});

describe("il gettone scaduto non è un rifiuto", () => {
  /**
   * Sentry, 27/09/2026: «Sync badges failed (PGRST303; status 401)». PGRST303
   * è il gettone scaduto. Trattarlo da rifiuto permanente avrebbe buttato
   * via la partita, quando basta il rinnovo e un altro tentativo.
   */
  it.each(["PGRST301", "PGRST302", "PGRST303"])("%s è sessione, non rifiuto", (code) => {
    const e = erroreDiScrittura({ code, message: "JWT expired" });
    expect(e).toBeInstanceOf(SessioneNonValida);
    expect(e).not.toBeInstanceOf(RifiutoPermanente);
  });

  it("un vincolo violato resta un rifiuto: riprovarlo non cambia niente", () => {
    expect(erroreDiScrittura({ code: "23514", message: "check constraint" }))
      .toBeInstanceOf(RifiutoPermanente);
  });

  it("la voce con il gettone scaduto resta in coda", async () => {
    const coda = createResultQueue(localStorage, async () => {
      throw erroreDiScrittura({ code: "PGRST303", message: "JWT expired" });
    });
    coda.enqueue({ gameType: "licita", score: 3 }, "utente-2", "web");
    await expect(coda.flush("utente-2")).rejects.toBeInstanceOf(SessioneNonValida);
    expect(coda.pending("utente-2")).toHaveLength(1);
  });
});
