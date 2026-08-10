import { describe, it, expect, vi, afterEach } from "vitest";
import {
  BBO_USERNAME_TAKEN_MESSAGE,
  bboUsernameChanged,
  isBboUsernameBlank,
  isBboUsernameTaken,
  normalizeBboUsername,
  shouldCheckBboUsername,
  type BboRpcClient,
} from "./bbo-username";

describe("normalizeBboUsername", () => {
  it("toglie gli spazi ai bordi e abbassa le maiuscole", () => {
    expect(normalizeBboUsername("  MarioRossi  ")).toBe("mariorossi");
    expect(normalizeBboUsername("MARIOROSSI")).toBe("mariorossi");
    expect(normalizeBboUsername("mariorossi")).toBe("mariorossi");
  });

  it("tratta null e undefined come stringa vuota", () => {
    expect(normalizeBboUsername(null)).toBe("");
    expect(normalizeBboUsername(undefined)).toBe("");
    expect(normalizeBboUsername("")).toBe("");
    expect(normalizeBboUsername("   ")).toBe("");
  });

  it("non tocca gli spazi interni: sono parte dell'handle", () => {
    expect(normalizeBboUsername(" Mario Rossi ")).toBe("mario rossi");
  });

  it("è idempotente", () => {
    const once = normalizeBboUsername("  MarioRossi ");
    expect(normalizeBboUsername(once)).toBe(once);
  });
});

describe("isBboUsernameBlank", () => {
  it("considera vuoto ciò che non contiene caratteri utili", () => {
    expect(isBboUsernameBlank("")).toBe(true);
    expect(isBboUsernameBlank("   ")).toBe(true);
    expect(isBboUsernameBlank("\t\n")).toBe(true);
    expect(isBboUsernameBlank(null)).toBe(true);
    expect(isBboUsernameBlank(undefined)).toBe(true);
  });

  it("un handle vero non è vuoto", () => {
    expect(isBboUsernameBlank("mariorossi")).toBe(false);
    expect(isBboUsernameBlank("  m  ")).toBe(false);
  });
});

describe("bboUsernameChanged", () => {
  it("ignora differenze di sole maiuscole o spazi ai bordi", () => {
    expect(bboUsernameChanged("  MarioRossi ", "mariorossi")).toBe(false);
    expect(bboUsernameChanged("mariorossi", "mariorossi")).toBe(false);
  });

  it("riconosce un handle davvero diverso", () => {
    expect(bboUsernameChanged("mariorossi", "mariabianchi")).toBe(true);
  });

  it("gestisce il passaggio da/verso il campo vuoto", () => {
    expect(bboUsernameChanged("mariorossi", null)).toBe(true);
    expect(bboUsernameChanged("", "mariorossi")).toBe(true);
    expect(bboUsernameChanged("   ", null)).toBe(false);
    expect(bboUsernameChanged(null, undefined)).toBe(false);
  });
});

describe("shouldCheckBboUsername", () => {
  it("non controlla chi lascia il campo vuoto", () => {
    expect(shouldCheckBboUsername("", null)).toBe(false);
    expect(shouldCheckBboUsername("   ", "mariorossi")).toBe(false);
    expect(shouldCheckBboUsername(null, "mariorossi")).toBe(false);
  });

  it("non controlla chi ri-salva il proprio stesso handle", () => {
    expect(shouldCheckBboUsername("mariorossi", "mariorossi")).toBe(false);
    // I 18 handle storicamente duplicati non devono bloccare il resto del profilo.
    expect(shouldCheckBboUsername(" MarioRossi ", "mariorossi")).toBe(false);
  });

  it("controlla un handle nuovo o cambiato", () => {
    expect(shouldCheckBboUsername("mariorossi", null)).toBe(true);
    expect(shouldCheckBboUsername("mariorossi", "")).toBe(true);
    expect(shouldCheckBboUsername("mariabianchi", "mariorossi")).toBe(true);
  });
});

describe("isBboUsernameTaken", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const clientReturning = (data: unknown, error: unknown = null) => {
    const rpc = vi.fn(async () => ({ data, error }));
    return { client: { rpc } as unknown as BboRpcClient, rpc };
  };

  it("non interroga il database per un handle vuoto", async () => {
    const { client, rpc } = clientReturning(true);
    expect(await isBboUsernameTaken(client, "   ", "test")).toBe(false);
    expect(await isBboUsernameTaken(client, null, "test")).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("invia alla RPC il valore normalizzato", async () => {
    const { client, rpc } = clientReturning(false);
    await isBboUsernameTaken(client, "  MarioRossi ", "test");
    expect(rpc).toHaveBeenCalledWith("is_bbo_username_taken", {
      p_bbo_username: "mariorossi",
    });
  });

  it("riporta occupato solo su un true esplicito", async () => {
    expect(await isBboUsernameTaken(clientReturning(true).client, "x", "test")).toBe(true);
    expect(await isBboUsernameTaken(clientReturning(false).client, "x", "test")).toBe(false);
    expect(await isBboUsernameTaken(clientReturning(null).client, "x", "test")).toBe(false);
  });

  it("in caso di errore non blocca l'utente ma segnala", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientReturning(null, new Error("rete giù"));
    expect(await isBboUsernameTaken(client, "mariorossi", "test:scope")).toBe(false);
    expect(spy).toHaveBeenCalled();
  });
});

describe("BBO_USERNAME_TAKEN_MESSAGE", () => {
  it("è un messaggio in italiano, non un errore tecnico", () => {
    expect(BBO_USERNAME_TAKEN_MESSAGE).toBe(
      "Questo nome BBO è già associato a un altro account"
    );
  });
});
