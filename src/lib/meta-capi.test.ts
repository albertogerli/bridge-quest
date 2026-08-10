import { describe, it, expect } from "vitest";
import {
  buildCapiEvent,
  clientIpFrom,
  hashPii,
  isCapiEvent,
  readFbCookies,
} from "./meta-capi";

const BASE = { event: "CompleteRegistration", eventId: "abc-123", eventTime: 1_754_000_000 } as const;

describe("hashPii", () => {
  it("produce lo SHA-256 esadecimale minuscolo previsto da Meta", () => {
    // Valori attesi calcolati fuori da questo codice (`openssl dgst -sha256`),
    // altrimenti il test confronterebbe la funzione con sé stessa.
    expect(hashPii("mario@example.com")).toBe(
      "94975275c0782c9df03b43f60e2da7f45d8fe447c73d4c52fad895d2937ae9e3"
    );
    expect(hashPii("test@bridgelab.it")).toBe(
      "05c600e4938ae1323284378775b269cb5adfe681c80ad62933c1732c59f2919b"
    );
  });

  it("normalizza spazi e maiuscole prima di cifrare", () => {
    // Senza normalizzazione lo stesso indirizzo darebbe hash diversi e non
    // combacerebbe con nulla nei dati di Meta.
    const atteso = hashPii("mario@example.com");
    expect(hashPii("  Mario@Example.COM  ")).toBe(atteso);
    expect(hashPii("MARIO@EXAMPLE.COM")).toBe(atteso);
  });

  it("indirizzi diversi danno hash diversi", () => {
    expect(hashPii("a@example.com")).not.toBe(hashPii("b@example.com"));
  });
});

describe("isCapiEvent", () => {
  it("accetta solo i nomi previsti", () => {
    expect(isCapiEvent("CompleteRegistration")).toBe(true);
    expect(isCapiEvent("Lead")).toBe(true);
  });

  it("rifiuta nomi arbitrari e non stringhe", () => {
    // Un nome libero verrebbe registrato tale e quale nei dati di Meta.
    expect(isCapiEvent("Qualsiasi")).toBe(false);
    expect(isCapiEvent("completeregistration")).toBe(false);
    expect(isCapiEvent(null)).toBe(false);
    expect(isCapiEvent(42)).toBe(false);
    expect(isCapiEvent({})).toBe(false);
  });
});

describe("buildCapiEvent", () => {
  it("include sempre event_id, che è ciò che evita il doppio conteggio", () => {
    const e = buildCapiEvent({ ...BASE });
    expect(e.event_id).toBe("abc-123");
    expect(e.event_name).toBe("CompleteRegistration");
    expect(e.event_time).toBe(1_754_000_000);
    expect(e.action_source).toBe("website");
  });

  it("non inserisce l'email se non gliela si passa", () => {
    // Il comportamento predefinito è non trasferire dati personali.
    const e = buildCapiEvent({ ...BASE, clientIp: "1.2.3.4" });
    expect(e.user_data).not.toHaveProperty("em");
  });

  it("se l'email è passata, la invia cifrata e mai in chiaro", () => {
    const e = buildCapiEvent({ ...BASE, email: "mario@example.com" });
    const userData = e.user_data as Record<string, unknown>;
    expect(userData.em).toEqual([hashPii("mario@example.com")]);
    expect(JSON.stringify(e)).not.toContain("mario@example.com");
  });

  it("omette i campi assenti invece di mandarli vuoti", () => {
    const e = buildCapiEvent({ ...BASE });
    expect(e.user_data).toEqual({});
    expect(e).not.toHaveProperty("event_source_url");
  });

  it("riporta i cookie di Meta quando presenti", () => {
    const e = buildCapiEvent({ ...BASE, fbp: "fb.1.2.3", fbc: "fb.1.9.click" });
    expect(e.user_data).toMatchObject({ fbp: "fb.1.2.3", fbc: "fb.1.9.click" });
  });
});

describe("readFbCookies", () => {
  it("estrae _fbp e _fbc", () => {
    expect(readFbCookies("_fbp=fb.1.100.200; _fbc=fb.1.100.CLICK; altro=x")).toEqual({
      fbp: "fb.1.100.200",
      fbc: "fb.1.100.CLICK",
    });
  });

  it("non confonde cookie con nomi simili", () => {
    expect(readFbCookies("my_fbp=x; _fbpx=y")).toEqual({});
  });

  it("regge header assente, vuoto o malformato", () => {
    expect(readFbCookies(null)).toEqual({});
    expect(readFbCookies("")).toEqual({});
    expect(readFbCookies("senza-uguale")).toEqual({});
    expect(readFbCookies("_fbp=")).toEqual({});
  });

  it("gestisce un valore che contiene il segno di uguale", () => {
    expect(readFbCookies("_fbc=fb.1.a=b")).toEqual({ fbc: "fb.1.a=b" });
  });
});

describe("clientIpFrom", () => {
  it("prende il PRIMO indirizzo della catena, non l'ultimo", () => {
    // Prendere l'ultimo darebbe l'IP del proxy Vercel per ogni utente: un
    // identificatore unico condiviso da tutti, cioè inutile e fuorviante.
    expect(clientIpFrom("203.0.113.7, 70.41.3.18, 150.172.238.178")).toBe("203.0.113.7");
  });

  it("regge header singolo, assente o vuoto", () => {
    expect(clientIpFrom("203.0.113.7")).toBe("203.0.113.7");
    expect(clientIpFrom(null)).toBeUndefined();
    expect(clientIpFrom("")).toBeUndefined();
    expect(clientIpFrom("  ,  ")).toBeUndefined();
  });
});
