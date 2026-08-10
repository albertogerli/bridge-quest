import { describe, it, expect } from "vitest";
import {
  consentModeSignals,
  hasMarketingConsent,
  parseConsent,
  serializeConsent,
  shouldAskConsent,
} from "./consent";

describe("parseConsent", () => {
  it("legge una scelta valida", () => {
    expect(parseConsent('{"marketing":true,"ts":"2026-08-10T12:00:00.000Z"}')).toEqual({
      marketing: true,
      ts: "2026-08-10T12:00:00.000Z",
    });
  });

  it("distingue 'non ha ancora scelto' da 'ha rifiutato'", () => {
    // null = da chiedere; {marketing:false} = ha detto no, non si richiede.
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
    expect(parseConsent('{"marketing":false,"ts":"x"}')).toEqual({ marketing: false, ts: "x" });
  });

  it("tratta un valore corrotto come scelta mai fatta", () => {
    expect(parseConsent("non-json")).toBeNull();
    expect(parseConsent("null")).toBeNull();
    expect(parseConsent("[]")).toBeNull();
    expect(parseConsent('"stringa"')).toBeNull();
    expect(parseConsent("42")).toBeNull();
  });

  it("rifiuta un marketing non booleano invece di forzarlo a vero", () => {
    // "true", 1 e "yes" sono tutti truthy in JS: accettarli significherebbe
    // dedurre un consenso da un dato malformato.
    expect(parseConsent('{"marketing":"true"}')).toBeNull();
    expect(parseConsent('{"marketing":1}')).toBeNull();
    expect(parseConsent("{}")).toBeNull();
  });

  it("sopravvive a un timestamp mancante o sbagliato", () => {
    expect(parseConsent('{"marketing":true}')).toEqual({ marketing: true, ts: "" });
    expect(parseConsent('{"marketing":true,"ts":123}')).toEqual({ marketing: true, ts: "" });
  });
});

describe("hasMarketingConsent — in dubbio non si traccia", () => {
  it("vero solo dopo un sì esplicito", () => {
    expect(hasMarketingConsent('{"marketing":true,"ts":"x"}')).toBe(true);
  });

  it.each([
    ["scelta mai fatta", null],
    ["rifiuto", '{"marketing":false,"ts":"x"}'],
    ["valore corrotto", "{{{"],
    ["oggetto vuoto", "{}"],
    ["stringa 'true'", '{"marketing":"true"}'],
  ])("falso con %s", (_label, raw) => {
    expect(hasMarketingConsent(raw)).toBe(false);
  });

  it("ignora il vecchio consenso a soli cookie tecnici", () => {
    // Il banner precedente salvava una data ISO sotto un'altra chiave, dopo
    // aver parlato di soli cookie tecnici. Quel clic non è un consenso
    // pubblicitario e non deve valere come tale.
    expect(hasMarketingConsent("2026-07-01T10:00:00.000Z")).toBe(false);
  });
});

describe("shouldAskConsent", () => {
  it("chiede solo a chi non ha ancora scelto", () => {
    expect(shouldAskConsent(null)).toBe(true);
    expect(shouldAskConsent("rotto")).toBe(true);
    expect(shouldAskConsent('{"marketing":true,"ts":"x"}')).toBe(false);
    // Chi ha rifiutato non va infastidito a ogni visita.
    expect(shouldAskConsent('{"marketing":false,"ts":"x"}')).toBe(false);
  });
});

describe("serializeConsent", () => {
  it("fa il giro completo senza perdere informazione", () => {
    const consent = { marketing: true, ts: "2026-08-10T12:00:00.000Z" };
    expect(parseConsent(serializeConsent(consent))).toEqual(consent);
  });
});

describe("consentModeSignals", () => {
  it("nega tutto senza consenso", () => {
    expect(consentModeSignals(false)).toEqual({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  });

  it("concede tutto con il consenso", () => {
    expect(Object.values(consentModeSignals(true)).every((v) => v === "granted")).toBe(true);
  });

  it("lega analytics_storage al marketing", () => {
    // GA4 alimenta i pubblici di Google Ads: lasciarlo attivo dopo un rifiuto
    // vanificherebbe il rifiuto.
    expect(consentModeSignals(false).analytics_storage).toBe("denied");
  });
});
