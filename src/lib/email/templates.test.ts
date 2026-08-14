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
