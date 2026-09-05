import { describe, expect, it } from "vitest";
import {
  corsiAttivi, etichettaLezione, percorsoDelCorso, daFareAdesso,
} from "./percorso-allievo";
import type { Assignment, ClassRoom } from "@/lib/instructors";

const classe = (over: Partial<ClassRoom> = {}): ClassRoom => ({
  id: "c1", instructor_id: "i", asd_code: null, name: "Corso Fiori",
  description: null, invite_code: "AAA111", invite_active: true, stato: "aperta",
  approvazione_automatica: true, invite_expires_at: null, risultati_nominativi: false,
  link_video: null, livello: null, accesso_libero: "tutto-aperto", permessi: {},
  inizio_corso: null, fine_corso: null, created_at: "2026-01-01", ...over,
});

const compito = (over: Partial<Assignment> = {}): Assignment => ({
  id: "a1", class_id: "c1", title: "Lezione 4", instructor_note: null,
  smazzata_ids: [], due_date: null, mode: "homework", unlock_mode: "free",
  soluzioni: "dopo-il-gioco", minibridge: false, esercizio_ids: [], lesson_id: 4,
  link_video: null, live_active_index: null, created_at: "2026-01-01", ...over,
});

describe("il numero della lezione non si rinumera", () => {
  it("un salto dell'insegnante lascia il buco visibile", () => {
    // Se l'insegnante non assegna la 5, l'allievo vede 4, 6, 7. Rinumerando
    // per posizione, la «lezione 6» della frase e la quinta riga dell'elenco
    // sarebbero due cose diverse.
    const righe = percorsoDelCorso([1, 2, 3, 4, 6, 7], new Set([4]), new Set([1, 2, 3]));
    expect(righe.map((r) => r.numero)).toEqual([1, 2, 3, 4, 6, 7]);
  });

  it("l'ordine di assegnazione non cambia i numeri", () => {
    const fuoriOrdine = percorsoDelCorso([7, 1, 4], new Set([7]), new Set([1]));
    expect(fuoriOrdine.map((r) => r.numero)).toEqual([1, 4, 7]);
    expect(fuoriOrdine.find((r) => r.numero === 7)?.stato).toBe("in-corso");
  });
});

describe("le lezioni non assegnate ci sono, grigie", () => {
  it("compaiono come «in attesa» invece di sparire", () => {
    // I contenuti didattici si dichiarano. Sparire genera sospetto:
    // l'allievo che ne parla con un compagno esterno scopre che lui le vede.
    const righe = percorsoDelCorso([1, 2, 3], new Set([1]), new Set());
    expect(righe.filter((r) => r.stato === "in-attesa").map((r) => r.numero)).toEqual([2, 3]);
    expect(righe).toHaveLength(3);
  });
});

describe("il nome del corso solo se i corsi attivi sono più d'uno", () => {
  it("con un corso solo la riga resta pulita", () => {
    expect(etichettaLezione(6, "Corso Fiori", 1)).toBe("lezione 6");
  });

  it("con due corsi il nome serve: «lezione 2» esiste in tutti e due", () => {
    expect(etichettaLezione(2, "Approfondimento", 2)).toBe("lezione 2 — Approfondimento");
  });

  it("NIENTE ARTICOLO davanti al nome del corso", () => {
    // «del Approfondimento» è italiano sbagliato, e l'articolo giusto dipende
    // da genere e lettera iniziale di un nome che scrive l'insegnante. Il
    // trattino funziona con qualunque nome.
    for (const nome of ["Approfondimento", "Martedì sera", "Iniziazione", "Principianti 2026"]) {
      expect(etichettaLezione(3, nome, 2)).toBe(`lezione 3 — ${nome}`);
    }
  });

  it("ATTIVI, non «mai frequentati»: il corso chiuso non conta più", () => {
    // Chi ha finito Fiori l'anno scorso e ora fa solo l'Approfondimento deve
    // tornare a vedere la riga pulita, altrimenti il nome resta lì per sempre.
    const classi = [
      classe({ id: "vecchia", name: "Corso Fiori", stato: "archiviata" }),
      classe({ id: "nuova", name: "Approfondimento", stato: "aperta" }),
    ];
    const attivi = corsiAttivi(classi);
    expect(attivi).toHaveLength(1);
    expect(etichettaLezione(2, "Approfondimento", attivi.length)).toBe("lezione 2");
  });

  it("anche una classe chiusa smette di contare", () => {
    expect(corsiAttivi([classe({ stato: "chiusa" }), classe({ stato: "aperta" })])).toHaveLength(1);
  });
});

describe("i compiti dei due corsi stanno insieme, per scadenza", () => {
  const fiori = classe({ id: "c1", name: "Corso Fiori" });
  const appro = classe({ id: "c2", name: "Approfondimento" });

  it("il più urgente viene primo, anche se è dell'altro corso", () => {
    // Chi ha un compito in scadenza nel corso «non selezionato» deve vederlo:
    // è la ragione per cui non ci sono linguette.
    const mappa = new Map([
      ["c1", [compito({ id: "tardi", due_date: "2026-10-20" })]],
      ["c2", [compito({ id: "presto", class_id: "c2", due_date: "2026-10-02" })]],
    ]);
    const righe = daFareAdesso([fiori, appro], mappa, () => false);
    expect(righe.map((r) => r.assignment.id)).toEqual(["presto", "tardi"]);
    expect(righe[0].classe.name).toBe("Approfondimento");
  });

  it("senza scadenza si va in fondo, non in cima", () => {
    const mappa = new Map([
      ["c1", [compito({ id: "senza" }), compito({ id: "con", due_date: "2026-10-02" })]],
    ]);
    expect(daFareAdesso([fiori], mappa, () => false).map((r) => r.assignment.id))
      .toEqual(["con", "senza"]);
  });

  it("i compiti già fatti non compaiono in «da fare adesso»", () => {
    const mappa = new Map([["c1", [compito({ id: "fatto" })]]]);
    expect(daFareAdesso([fiori], mappa, () => true)).toEqual([]);
  });
});
