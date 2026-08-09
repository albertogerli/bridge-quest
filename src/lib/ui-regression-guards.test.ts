import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guardie strutturali sui componenti/hook.
 *
 * Il progetto non ha un ambiente DOM per i test (niente jsdom né
 * testing-library, `vitest.config.ts` gira in node su `src/**\/*.test.ts`):
 * alcune correzioni vivono però dentro React — dipendenze di `useMemo`,
 * letture di localStorage durante il render, side effect dentro un updater di
 * `setState` — e non sono esprimibili come funzione pura.
 *
 * Questi test leggono il sorgente e falliscono se la correzione viene
 * rimossa. Sono volutamente pochi e mirati: ogni asserzione cita il bug che
 * previene. La copertura di comportamento sta nei test delle funzioni pure
 * (`profile-stats.test.ts`, `tournament-stats.test.ts`, `admin-stats.test.ts`).
 */

const ROOT = join(__dirname, "..", "..");

function source(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

// ── Torneo ─────────────────────────────────────────────────────────────────

describe("torneo: le viste seguono la lunghezza reale della sequenza", () => {
  const views = [
    "src/app/gioca/torneo/_components/tournament-summary.tsx",
    "src/app/gioca/torneo/_components/hand-transition.tsx",
    "src/app/gioca/torneo/_components/tournament-play-view.tsx",
    "src/app/gioca/torneo/_components/tournament-result-card.tsx",
  ];

  it.each(views)(
    "%s non conta le mani con la costante nominale TOURNAMENT_HAND_COUNT",
    (file) => {
      // Con una pool più corta di 5 mani la sequenza ne gioca meno: le viste
      // che usavano la costante mostravano totali sbagliati, pallini di troppo
      // e potevano leggere `hands[i]` inesistente. (Il nome può comparire nei
      // commenti: quello che non deve esserci è l'uso.)
      expect(source(file)).not.toMatch(/import \{[^}]*TOURNAMENT_HAND_COUNT/);
      expect(source(file)).not.toContain("grid-cols-5");
    },
  );

  it("la play view passa il totale reale alla singola mano", () => {
    expect(source(views[2])).toContain("totalHands={hands.length}");
  });

  it("la hero usa la costante solo come segnaposto mentre la pool carica", () => {
    const hero = source("src/app/gioca/torneo/_components/tournament-hero.tsx");
    expect(hero).toContain("const handCount = tournamentHands.length;");
    expect(hero).toContain("handCount || TOURNAMENT_HAND_COUNT");
    // Griglia a 5 colonne fissa = pallini per mani che non esistono.
    expect(hero).not.toContain("grid-cols-5");
  });

  it("la hero accoppia gli esiti per smazzataId, non per indice", () => {
    const hero = source("src/app/gioca/torneo/_components/tournament-hero.tsx");
    expect(hero).toContain("handResultFor(existingResult?.handResults, h.id)");
    expect(hero).not.toContain("existingResult?.handResults[i]");
  });

  it("la CTA «Riprendi» usa la stessa decisione della play view", () => {
    const week = source("src/app/gioca/torneo/_use-tournament-week.ts");
    expect(week).toContain("restorableHandCount(");
    // Il conteggio grezzo prometteva riprese che poi ripartivano da capo.
    expect(week).not.toContain("?.handResults.length ?? 0");
  });

  it("il rigioco senza punti non salva progresso", () => {
    const play = source("src/app/gioca/torneo/_use-tournament-play.ts");
    expect(play).toMatch(/if \(alreadyPlayed\) return;/);
    expect(play).toContain("restoreProgress(weekNum, hands, alreadyPlayed)");
  });

  it("/gioca non ricalcola la settimana di torneo per conto suo", () => {
    // Formula duplicata = due verità sulla settimana corrente.
    const gioca = source("src/app/gioca/page.tsx");
    expect(gioca).not.toContain("EPOCH_START");
    expect(gioca).toContain("getWeekNum(Date.now())");
  });
});

// ── Profilo ────────────────────────────────────────────────────────────────

describe("profilo: dati reattivi e senza mismatch di idratazione", () => {
  const hook = "src/app/profilo/_use-profile-data.ts";

  it("i grafici non fotografano più localStorage al mount con deps vuote", () => {
    const src = source(hook);
    expect(src).not.toMatch(/useMemo\([\s\S]*?,\s*\[\]\s*\)/);
    expect(src).toContain("buildGamesPerDay(new Date(), records)");
    expect(src).toContain("[gameStats, streak]");
  });

  it("partite e grafici leggono lo storico, non la coda di sincronizzazione", () => {
    // `bq_game_results_queue` si svuota dopo il flush verso Supabase.
    expect(source(hook)).not.toContain("bq_game_results_queue");
  });

  it("il profilo per i nomi di livello non viene letto da localStorage nel render", () => {
    const src = source(hook);
    expect(src).toContain("getProfileConfig(currentProfile)");
    expect(src).not.toContain('typeof window !== "undefined" ? localStorage.getItem');
  });

  it("il completamento conta solo i moduli ancora a catalogo", () => {
    const src = source(hook);
    expect(src).toContain("countCompletedModules(allWorlds, completedModules)");
    expect(src).not.toContain("Object.keys(completedModules).length");
  });

  it("il contatore inviti non incrementa dentro un updater di setState", () => {
    // Sotto StrictMode l'updater viene invocato due volte: un side effect lì
    // dentro contava l'invito due volte.
    const page = source("src/app/profilo/page.tsx");
    expect(page).toContain("incrementInviteCount()");
    expect(page).not.toMatch(/setInvitesSent\(\s*\(prev\)\s*=>/);
  });
});
