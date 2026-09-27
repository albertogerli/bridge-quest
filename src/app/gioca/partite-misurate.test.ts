import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Ogni partita lascia una traccia, o dichiara perché no.
 *
 * COSA È SUCCESSO. Il 27/09/2026 una proposta di riprogettazione si reggeva
 * su «quindici pagine di gioco con zero risultati in trenta giorni». Era un
 * artefatto: tredici pagine su ventisette non scrivevano AFFATTO in
 * `game_results`. Il torneo settimanale — dato per morto — aveva 2771
 * partite e 51 giocatori, registrate in un'altra tabella. E quattro giochi
 * veri (cosa-apri, quale-contratto, quiz-prese, licita) non lasciavano
 * niente da nessuna parte: né un risultato né un XP. `sfida-link` l'XP lo
 * dava e il risultato no.
 *
 * Contare zero righe di una tabella in cui nessuno scrive non dice che
 * nessuno gioca: dice che non stiamo misurando. È la differenza fra un
 * fatto e la mancanza di un fatto, ed è costata una diagnosi sbagliata.
 *
 * COSA CONTROLLA. Che ogni cartella sotto `src/app/gioca/` registri il
 * risultato, oppure stia nell'elenco qui sotto con scritto DOVE registra o
 * PERCHÉ non deve. Chi aggiunge un gioco nuovo e si dimentica di misurarlo
 * trova questo test rosso, e la scelta diventa consapevole invece che
 * silenziosa.
 */
const GIOCHI = join(__dirname);

/** Chi non scrive in `game_results`, e il motivo. Ogni voce è una decisione. */
const ALTROVE: Record<string, string> = {
  torneo: "risultati_torneo — 2771 partite, 51 giocatori in 30 giorni",
  "torneo-licita": "risultati_torneo, insieme al torneo",
  "licita-amico": "bidding_sessions — la sessione è di due persone, non di una",
  "sfida-imp": "challenges — la sfida è una riga sola condivisa fra i due",
  "sfida-amico": "challenges, come sfida-imp",
  "sfida-coppie": "sfide_coppie — una riga in 30 giorni: questa è davvero ferma",
  pratica: "non è un gioco: rimanda a /gioca/smazzata con una mano a caso",
  analisi: "non è un gioco: è lo strumento per rivedere una mano già giocata",
};

function cartelleGioco(): string[] {
  return readdirSync(GIOCHI, { withFileTypes: true })
    .filter((v) => v.isDirectory())
    .map((v) => v.name)
    .filter((n) => statSync(join(GIOCHI, n, "page.tsx"), { throwIfNoEntry: false }))
    .sort();
}

function registra(cartella: string): boolean {
  const dir = join(GIOCHI, cartella);
  const file = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((v) => v.isFile() && /\.tsx?$/.test(v.name))
    .map((v) => join(v.parentPath ?? dir, v.name));
  return file.some((f) => /saveGameResult|useGameResults/.test(readFileSync(f, "utf8")));
}

describe("ogni partita lascia una traccia", () => {
  const giochi = cartelleGioco();

  it("le cartelle di gioco si trovano", () => {
    expect(giochi.length).toBeGreaterThan(20);
  });

  it.each(giochi)("/gioca/%s registra, o dichiara dove", (cartella) => {
    const motivo = ALTROVE[cartella];
    if (motivo) {
      expect(
        motivo.length,
        `il motivo per ${cartella} deve dire DOVE registra o PERCHÉ non deve`,
      ).toBeGreaterThan(20);
      return;
    }
    expect(
      registra(cartella),
      `/gioca/${cartella} non registra il risultato da nessuna parte. ` +
        "O chiami saveGameResult() quando la partita finisce, o aggiungi la " +
        "cartella ad ALTROVE scrivendo dove registra o perché non deve. " +
        "Una pagina che non misura nessuno non è una pagina che nessuno usa: " +
        "è una pagina di cui non sappiamo niente.",
    ).toBe(true);
  });

  // Se un gioco comincia a registrare, la sua voce in ALTROVE va tolta:
  // altrimenti l'elenco diventa una lista di scuse invecchiate.
  it("l'elenco delle eccezioni non contiene giochi che ormai registrano", () => {
    const superate = Object.keys(ALTROVE).filter((c) => giochi.includes(c) && registra(c));
    expect(superate, "questi ora registrano: toglili da ALTROVE").toEqual([]);
  });

  it("l'elenco delle eccezioni non nomina cartelle che non esistono più", () => {
    const fantasmi = Object.keys(ALTROVE).filter((c) => !giochi.includes(c));
    expect(fantasmi).toEqual([]);
  });
});
