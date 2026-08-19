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
  "compito_assegnato",
  "compito_in_scadenza",
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

describe("le email dei compiti", () => {
  const ctx = {
    name: "Anna",
    compitoTitolo: "Vincenti e affrancabili",
    compitoUrl: "https://bridgelab.it/classi/x/compito/y",
    classeNome: "Corso base martedì",
    compitoMani: 8,
  };

  it("sono transazionali: nascono da un'iscrizione a una classe", () => {
    // La persona si è iscritta con un codice che le ha dato il suo insegnante,
    // e questo messaggio è la conseguenza diretta di quel gesto. Chi non li
    // vuole più esce dalla classe.
    for (const kind of ["compito_assegnato", "compito_in_scadenza"] as const) {
      const e = renderEmail(kind, ctx, "https://x/unsub");
      expect(e.transactional, kind).toBe(true);
      expect(e.html, kind).not.toContain("https://x/unsub");
    }
  });

  it("portano al compito, non alla home", () => {
    const e = renderEmail("compito_assegnato", ctx);
    expect(e.html).toContain(ctx.compitoUrl);
    expect(e.text).toContain(ctx.compitoUrl);
  });

  /**
   * Il titolo lo scrive l'insegnante ed è testo libero: arriva nell'html di
   * un'email che leggono i suoi allievi. Se non passasse da esc(), un titolo
   * con dentro del markup diventerebbe markup.
   */
  it("il titolo scritto dall'insegnante viene ripulito", () => {
    const e = renderEmail("compito_assegnato", {
      ...ctx,
      compitoTitolo: "<img src=x onerror=alert(1)>",
    });
    expect(e.html).not.toContain("<img src=x");
    expect(e.html).toContain("&lt;img");
  });

  it("la scadenza si legge in italiano, non in numero di giorni", () => {
    expect(renderEmail("compito_in_scadenza", { ...ctx, giorniAllaScadenza: 0 }).html).toContain("scade oggi");
    expect(renderEmail("compito_in_scadenza", { ...ctx, giorniAllaScadenza: 1 }).html).toContain("scade domani");
    expect(renderEmail("compito_in_scadenza", { ...ctx, giorniAllaScadenza: 3 }).html).toContain("fra 3 giorni");
  });

  it("in inglese cambia tutto, oggetto compreso", () => {
    const e = renderEmail("compito_assegnato", { ...ctx, lingua: "en" });
    expect(e.subject).toContain("New homework");
    expect(e.html).toContain("Go to the homework");
  });
});

describe("l'involucro dell'email, non solo il corpo", () => {
  /**
   * Ogni email era bilingue nel corpo grazie al suo `T(it, en)`, ma
   * intestazione, piè di pagina e disiscrizione stavano nell'involucro comune,
   * in italiano fisso. Chi legge in inglese riceveva un messaggio inglese che
   * si chiudeva in italiano — e quel collegamento è proprio quello che deve
   * capire, perché l'alternativa a capirlo è segnare il messaggio come
   * indesiderato.
   */
  it("in inglese il piè di pagina è inglese", () => {
    const e = renderEmail("inactive_7", { name: "Anna", lingua: "en" }, "https://x/unsub");
    expect(e.html).toContain("I don't want these reminders");
    expect(e.html).not.toContain("Non voglio più questi promemoria");
    expect(e.html).toContain("the bridge school of the Italian Bridge Federation");
  });

  it("in italiano resta italiano", () => {
    const e = renderEmail("inactive_7", { name: "Anna", lingua: "it" }, "https://x/unsub");
    expect(e.html).toContain("Non voglio più questi promemoria");
    expect(e.html).not.toContain("I don't want these reminders");
  });

  /**
   * `lang` non è decorazione: i lettori di schermo lo usano per scegliere la
   * pronuncia, e leggere l'inglese con la fonetica italiana è peggio che non
   * leggerlo.
   */
  it("l'attributo lang segue la lingua", () => {
    expect(renderEmail("welcome", { lingua: "en" }).html).toContain('<html lang="en">');
    expect(renderEmail("welcome", { lingua: "it" }).html).toContain('<html lang="it">');
  });

  it("anche la versione testuale si disiscrive nella lingua giusta", () => {
    const en = renderEmail("inactive_7", { lingua: "en" }, "https://x/unsub");
    expect(en.text).toContain("Unsubscribe from reminders");
    const it = renderEmail("inactive_7", { lingua: "it" }, "https://x/unsub");
    expect(it.text).toContain("Disiscriviti dai promemoria");
  });
});
