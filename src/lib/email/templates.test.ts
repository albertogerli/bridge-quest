import { describe, expect, it } from "vitest";
import { renderEmail, type EmailKind } from "./templates";

const TUTTE: EmailKind[] = [
  "welcome",
  "onboarding_start",
  "inactive_7",
  "inactive_14",
  "streak_risk",
  "friend_request",
  "turno_licita",
];

describe("le email di ciclo di vita", () => {
  it("hanno tutte oggetto, html e testo", () => {
    for (const kind of TUTTE) {
      const e = renderEmail(kind, { name: "Marco", streak: 5, liciteFerme: 2 }, "https://x/unsub");
      expect(e.subject.length, kind).toBeGreaterThan(5);
      expect(e.html, kind).toContain("<");
      expect(e.text.length, kind).toBeGreaterThan(20);
    }
  });

  it("il nome di chi legge non finisce mai nell'html senza passare da esc()", () => {
    // Un nome scelto dall'utente arriva dritto in un'email che leggono altri:
    // se non fosse ripulito, basterebbe chiamarsi «<script>» per spedire
    // markup a nome nostro.
    const e = renderEmail("welcome", { name: "<script>alert(1)</script>" });
    expect(e.html).not.toContain("<script>alert(1)</script>");
    expect(e.html).toContain("&lt;script&gt;");
  });
});

describe("«tocca a te»", () => {
  it("è transazionale: niente consenso, niente piè di pagina di disiscrizione", () => {
    // Riguarda una partita cominciata dall'utente e una persona che aspetta.
    const e = renderEmail("turno_licita", { name: "Anna", liciteFerme: 1 }, "https://x/unsub");
    expect(e.transactional).toBe(true);
    expect(e.html).not.toContain("https://x/unsub");
  });

  it("al singolare e al plurale dice cose diverse", () => {
    const una = renderEmail("turno_licita", { liciteFerme: 1 });
    const tre = renderEmail("turno_licita", { liciteFerme: 3 });
    expect(una.subject).toContain("una licita");
    expect(tre.subject).toContain("3 licite");
  });

  it("senza conteggio non promette numeri sbagliati", () => {
    const e = renderEmail("turno_licita", {});
    expect(e.subject).toContain("una licita");
    expect(e.subject).not.toContain("0");
  });

  it("porta alla licita con un amico, non alla home", () => {
    const e = renderEmail("turno_licita", { liciteFerme: 1 });
    expect(e.html).toContain("/gioca/licita-amico");
  });
});

describe("le email nella lingua della persona", () => {
  it("in inglese arrivano in inglese, testo semplice compreso", () => {
    const en = renderEmail("welcome", { name: "Ann", lingua: "en" });
    expect(en.subject).toBe("Welcome to Bridge LAB 🃏");
    expect(en.html).toContain("your seat at Bridge LAB is ready");
    expect(en.text).toContain("welcome to Bridge LAB");
    // Nessun residuo italiano: è il difetto tipico di una traduzione a metà,
    // dove il corpo è tradotto e l'oggetto no (o viceversa).
    expect(en.subject + en.text).not.toMatch(/Benvenuto|Lezione/);
  });

  it("senza lingua resta italiano: è la lingua di casa", () => {
    const it = renderEmail("welcome", { name: "Anna" });
    expect(it.subject).toBe("Benvenuto in Bridge LAB 🃏");
  });

  it("tutte le email hanno una versione inglese, non solo la prima", () => {
    // Senza questo, basta aggiungere un tipo di email e dimenticarsene: chi
    // legge in inglese riceve italiano e nessuno se ne accorge, perché in
    // sviluppo le email non partono.
    const tipi = [
      "welcome", "onboarding_start", "inactive_7", "inactive_14",
      "friend_request", "turno_licita", "streak_risk",
    ] as const;
    for (const kind of tipi) {
      const en = renderEmail(kind, { name: "Ann", lingua: "en", streak: 3, senderName: "Bob", liciteFerme: 2 });
      const it = renderEmail(kind, { name: "Anna", streak: 3, senderName: "Bob", liciteFerme: 2 });
      expect(en.subject, `${kind}: l'oggetto non è tradotto`).not.toBe(it.subject);
      expect(en.html, `${kind}: il corpo non è tradotto`).not.toBe(it.html);
    }
  });
});
