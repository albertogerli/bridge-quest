import { describe, it, expect } from "vitest";
import {
  availabilityOverlap,
  describeAvailability,
  isAvailabilitySlot,
  isPartnerLevel,
  matchReason,
  matchScore,
  normalizeAvailability,
  sortCandidates,
  type PartnerCandidate,
  type PartnerSeeker,
} from "./partner-matching";

function candidate(over: Partial<PartnerCandidate> & { user_id: string }): PartnerCandidate {
  return {
    display_name: "Tizio",
    avatar_url: null,
    asd_name: null,
    level: "intermedio",
    province: "MI",
    availability: ["sera"],
    ...over,
  };
}

const SEEKER: PartnerSeeker = { level: "intermedio", province: "MI", availability: ["sera", "weekend"] };

describe("validatori", () => {
  it("accettano solo i valori previsti", () => {
    expect(isPartnerLevel("principiante")).toBe(true);
    expect(isAvailabilitySlot("weekend")).toBe(true);
  });

  it("rifiutano valori arbitrari, diversa capitalizzazione e non stringhe", () => {
    expect(isPartnerLevel("esperto")).toBe(false);
    expect(isPartnerLevel("Principiante")).toBe(false);
    expect(isPartnerLevel(null)).toBe(false);
    expect(isAvailabilitySlot("notte")).toBe(false);
    expect(isAvailabilitySlot(3)).toBe(false);
  });
});

describe("normalizeAvailability", () => {
  it("riordina secondo l'ordine canonico", () => {
    // Due schede con le stesse fasce devono mostrarsi allo stesso modo.
    expect(normalizeAvailability(["weekend", "mattina", "sera"])).toEqual([
      "mattina",
      "sera",
      "weekend",
    ]);
  });

  it("elimina doppioni e valori sconosciuti", () => {
    expect(normalizeAvailability(["sera", "sera", "notte", 42, null])).toEqual(["sera"]);
  });

  it("regge input non-array", () => {
    expect(normalizeAvailability(null)).toEqual([]);
    expect(normalizeAvailability("sera")).toEqual([]);
    expect(normalizeAvailability(undefined)).toEqual([]);
  });
});

describe("availabilityOverlap", () => {
  it("trova le fasce in comune", () => {
    expect(availabilityOverlap(["mattina", "sera"], ["sera", "weekend"])).toEqual(["sera"]);
  });

  it("restituisce vuoto quando non si incrociano", () => {
    expect(availabilityOverlap(["mattina"], ["sera"])).toEqual([]);
    expect(availabilityOverlap([], ["sera"])).toEqual([]);
  });

  it("ignora i valori sporchi da entrambi i lati", () => {
    expect(availabilityOverlap(["sera", "notte"], ["notte", "sera"])).toEqual(["sera"]);
  });
});

describe("describeAvailability", () => {
  it("gestisce zero, una, due e tutte le fasce", () => {
    expect(describeAvailability([])).toBe("Nessuna fascia indicata");
    expect(describeAvailability(["sera"])).toBe("Sera");
    expect(describeAvailability(["mattina", "sera"])).toBe("Mattina e sera");
    expect(describeAvailability(["mattina", "pomeriggio", "sera", "weekend"])).toBe(
      "Sempre disponibile"
    );
  });

  it("usa la virgola per tre fasce e la 'e' solo prima dell'ultima", () => {
    expect(describeAvailability(["mattina", "pomeriggio", "sera"])).toBe(
      "Mattina, Pomeriggio e sera"
    );
  });
});

describe("matchScore", () => {
  it("premia la stessa provincia più di ogni altro fattore", () => {
    // Senza vicinanza geografica non ci si incontra: deve pesare più della
    // somma di disponibilità e livello.
    const vicino = candidate({ user_id: "a", province: "MI", level: "avanzato", availability: [] });
    const lontano = candidate({
      user_id: "b",
      province: "RM",
      level: "intermedio",
      availability: ["sera", "weekend"],
    });
    expect(matchScore(SEEKER, vicino)).toBeGreaterThan(matchScore(SEEKER, lontano));
  });

  it("premia le fasce in comune", () => {
    const conOrari = candidate({ user_id: "a", availability: ["sera", "weekend"] });
    const senzaOrari = candidate({ user_id: "b", availability: ["mattina"] });
    expect(matchScore(SEEKER, conOrari)).toBeGreaterThan(matchScore(SEEKER, senzaOrari));
  });

  it("preferisce il livello vicino senza escludere quello lontano", () => {
    const stesso = candidate({ user_id: "a", level: "intermedio" });
    const distante = candidate({ user_id: "b", level: "principiante" });
    expect(matchScore(SEEKER, stesso)).toBeGreaterThan(matchScore(SEEKER, distante));
    // Chi è alle prime armi impara spesso meglio con qualcuno più esperto:
    // il punteggio non deve mai diventare negativo o azzerare il candidato.
    expect(matchScore(SEEKER, distante)).toBeGreaterThan(0);
  });

  it("non premia due province entrambe non indicate", () => {
    // null === null darebbe un falso "stessa provincia" per tutti quelli che
    // non l'hanno compilata.
    const senzaProvincia = candidate({ user_id: "a", province: null, availability: [] });
    const seekerSenza: PartnerSeeker = { level: "intermedio", province: null, availability: [] };
    expect(matchScore(seekerSenza, senzaProvincia)).toBeLessThan(100);
  });

  it("regge un livello sconosciuto senza esplodere", () => {
    const strano = candidate({ user_id: "a", level: "campione-del-mondo" });
    expect(Number.isFinite(matchScore(SEEKER, strano))).toBe(true);
  });
});

describe("sortCandidates", () => {
  it("mette davanti il candidato più affine", () => {
    const lista = [
      candidate({ user_id: "lontano", province: "RM", availability: ["mattina"] }),
      candidate({ user_id: "affine", province: "MI", availability: ["sera", "weekend"] }),
    ];
    expect(sortCandidates(SEEKER, lista).map((c) => c.user_id)).toEqual(["affine", "lontano"]);
  });

  it("a parità di punteggio conserva l'ordine di partenza", () => {
    // Il database ordina già per accesso recente: a parità di affinità quel
    // criterio non va buttato via.
    const lista = [
      candidate({ user_id: "primo" }),
      candidate({ user_id: "secondo" }),
      candidate({ user_id: "terzo" }),
    ];
    expect(sortCandidates(SEEKER, lista).map((c) => c.user_id)).toEqual([
      "primo",
      "secondo",
      "terzo",
    ]);
  });

  it("non modifica l'array ricevuto", () => {
    const lista = [candidate({ user_id: "b", province: "RM" }), candidate({ user_id: "a" })];
    const copia = [...lista];
    sortCandidates(SEEKER, lista);
    expect(lista).toEqual(copia);
  });

  it("regge la lista vuota", () => {
    expect(sortCandidates(SEEKER, [])).toEqual([]);
  });
});

describe("matchReason", () => {
  it("spiega perché due persone sono accostate", () => {
    expect(matchReason(SEEKER, candidate({ user_id: "a", availability: ["sera"] }))).toBe(
      "stessa provincia · disponibile sera · stesso livello"
    );
  });

  it("cita il numero di fasce quando sono più d'una", () => {
    const c = candidate({ user_id: "a", availability: ["sera", "weekend"], level: "avanzato" });
    expect(matchReason(SEEKER, c)).toBe("stessa provincia · 2 fasce in comune");
  });

  it("resta vuoto quando non c'è nulla in comune", () => {
    const c = candidate({ user_id: "a", province: "RM", availability: ["mattina"], level: "avanzato" });
    expect(matchReason(SEEKER, c)).toBe("");
  });
});
