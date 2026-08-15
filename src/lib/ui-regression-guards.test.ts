import { readdirSync, readFileSync } from "node:fs";
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

// ── Mano del Giorno ────────────────────────────────────────────────────────

describe("mano del giorno: fine partita e tema scuro", () => {
  const play = "src/app/gioca/mano-del-giorno/_use-daily-play.ts";

  it("la partita viene salvata per l'analisi una volta sola", () => {
    // La chiamata comune fuori dal ramo + quella nel ramo «mano di ieri»
    // registravano la stessa partita due volte.
    const calls = source(play).match(/saveGameForAnalysis\(/g) ?? [];
    expect(calls).toHaveLength(1);
  });

  it("«Rigioca» riarma la celebrazione", () => {
    // `CelebrationCombo` parte sul fronte di salita di `trigger`: restando a
    // `true` la mano rigiocata finiva senza effetto.
    const replay = source(play).match(/const replay = \(\) => \{[\s\S]*?\n  \};/)?.[0];
    expect(replay).toBeDefined();
    expect(replay).toContain("setShowCelebration(false)");
  });

  const resultCards = [
    "src/app/gioca/mano-del-giorno/_components/daily-game-result.tsx",
    "src/app/gioca/mano-del-giorno/_components/daily-result-card.tsx",
  ];

  it.each(resultCards)("%s tinge la card di esito anche al buio", (file) => {
    // Senza varianti scure la card restava un riquadro quasi bianco, con
    // sopra testo chiaro (il resto della pagina le aveva già).
    const src = source(file);
    expect(src).toContain(
      "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-900"
    );
    expect(src).toContain(
      "from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border border-red-200 dark:border-red-900"
    );
  });

  it("l'esito di fine partita non ha più tinte chiare senza controparte scura", () => {
    // Ogni classe di tinta chiara (sfondo/testo/bordo su scala 50-200 o
    // 600-900) deve comparire in una stringa di classi che dichiara anche la
    // variante `dark:` per lo stesso ruolo e colore.
    expect(
      lightOnlyTints(
        source("src/app/gioca/mano-del-giorno/_components/daily-game-result.tsx")
      )
    ).toEqual([]);
  });
});

// ── Pagina modulo di lezione ───────────────────────────────────────────────

describe("modulo di lezione: punteggio, XP e power-up", () => {
  const session = "src/app/lezioni/[lessonId]/[moduleId]/_use-module-session.ts";

  /** Corpo della funzione/arrow di primo livello `const <nome> = ...`. */
  function handler(src: string, name: string): string {
    const match = src.match(
      new RegExp(`const ${name} = [^\\n]*=> \\{[\\s\\S]*?\\n  \\};`)
    );
    expect(match, `handler ${name} non trovato`).not.toBeNull();
    return match![0];
  }

  it("il power-up «salta» legge la soluzione nel campo giusto per tipo", () => {
    // Assegnava sempre `correctAnswer`: su `hand-eval` (soluzione in
    // `correctValue`) e su `card-select` (indice della carta) consegnava una
    // risposta sbagliata, contata anche come errore nel punteggio finale.
    const skip = handler(source(session), "consumeSkip");
    expect(skip).toContain("correctAnswerFor(block)");
    expect(skip).not.toContain("block.correctAnswer ?? 0");
  });

  it("il moltiplicatore XP è derivato dalla serie, non tenuto in stato", () => {
    const src = source(session);
    expect(src).toContain("const xpMultiplier = computeXpMultiplier(correctStreak);");
    expect(src).not.toContain("setXpMultiplier");
  });

  it("l'XP di lettura non usa un moltiplicatore di un render fa", () => {
    // `handleStepAdvance` chiama `awardXp`, che moltiplica per `xpMultiplier`:
    // con le sole `[stepsViewed]` il callback restava congelato all'ultimo
    // render in cui erano cambiati i passi visti.
    expect(source(session)).toContain("}, [stepsViewed, xpMultiplier]);");
  });

  it("ogni risposta corretta aggiorna anche il record di serie", () => {
    // Solo il quiz a scelta multipla alzava `bestStreak`: una serie fatta di
    // «scegli la carta»/«valuta la mano» non arrivava al Best Streak finale.
    const src = source(session);
    for (const name of ["handleQuizAnswer", "handleCardSelect", "handleHandEval"]) {
      expect(handler(src, name)).toContain("registerCorrectStreak()");
    }
    // Un solo punto in cui il record cresce.
    expect(src.match(/setBestStreak\(/g)).toHaveLength(1);
  });

  it("non resta la ref del tempo di ingresso nel passo, scritta e mai letta", () => {
    expect(source(session)).not.toContain("stepEnteredAt");
  });

  it("i coriandoli non leggono `window` direttamente", () => {
    // `window?.innerHeight` solleva `ReferenceError` in SSR: l'optional
    // chaining agisce sul valore, non sull'identificatore non dichiarato.
    const card = source(
      "src/app/lezioni/[lessonId]/[moduleId]/_components/completion-card.tsx"
    );
    expect(card).toContain("confettiFallDistance()");
    expect(card).not.toContain("window?.");
  });
});

// ── Accessibilità: struttura dei titoli ────────────────────────────────────

describe("struttura dei titoli", () => {
  /**
   * Salti di livello fra heading consecutivi nel sorgente (h1 → h3 = salto).
   * Approssima l'ordine del DOM, ma basta a intercettare il caso che axe
   * segnalava; la verifica vera gira nell'audit E2E (`e2e/a11y.spec.ts`, dove
   * `heading-order` è bloccante).
   */
  function headingLevelJumps(src: string): string[] {
    const levels = [...src.matchAll(/<h([1-6])[\s>]/g)].map((m) => parseInt(m[1]));
    expect(levels.length, "nessun heading trovato: regex da rivedere").toBeGreaterThan(0);
    const jumps: string[] = [];
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) jumps.push(`h${levels[i - 1]} → h${levels[i]}`);
    }
    return jumps;
  }

  it("/glossario non salta da h1 a h3 sulle schede dei termini", () => {
    // Violazione `heading-order` rilevata da axe sulla prima scheda.
    expect(headingLevelJumps(source("src/app/glossario/glossario-client.tsx"))).toEqual([]);
  });

  it("/lezioni ha un h1 anche mentre il catalogo carica", () => {
    // Finché il catalogo non arriva la pagina rendeva solo il messaggio di
    // attesa: nessun h1 → `page-has-heading-one`.
    const src = source("src/app/lezioni/page.tsx");
    const loading = src.match(
      /if \(!catalogLoaded \|\| !currentCourse\) \{[\s\S]*?\n  \}/
    )?.[0];
    expect(loading).toBeDefined();
    expect(loading).toMatch(/<h1[\s>]/);
  });
});

/**
 * Tinte chiare prive della corrispondente variante scura *nella stessa stringa
 * di classi* (una riga di sorgente): è lì che Tailwind decide il colore.
 */
function lightOnlyTints(src: string): string[] {
  const tint =
    /(?<![\w:-])(bg|text|border)-(emerald|red|amber|blue|violet|orange|indigo)-(50|100|200|600|700|800|900)(\/\d+)?/g;
  const offenders: string[] = [];
  for (const line of src.split("\n")) {
    for (const match of line.matchAll(tint)) {
      const role = `dark:${match[1]}-${match[2]}-`;
      if (!line.includes(role)) offenders.push(`${match[0]} → manca ${role}*`);
    }
  }
  return offenders;
}

/**
 * L'ancora di rotazione: chi sta in basso al tavolo.
 *
 * IL DIFETTO. In `/gioca/smazzata` si può giocare in difesa, e allora in basso
 * non c'è il dichiarante ma il difensore. Il tavolo ruotava su quello
 * (`anchor`), mentre la griglia d'asta e il replay ricevevano il DICHIARANTE:
 * sulla stessa schermata la lettera «S» indicava due giocatori diversi, e chi
 * rileggeva l'asta attribuiva ogni dichiarazione al posto sbagliato.
 *
 * La causa vera era il NOME della proprietà: si chiamava `declarer`, quindi chi
 * scriveva la chiamata passava il dichiarante — giustamente. Ora si chiama
 * `inBasso` e dice cosa vuole.
 */
describe("l'ancora di rotazione è una sola", () => {
  const smazzata = readFileSync(join(ROOT, "src/app/gioca/smazzata/page.tsx"), "utf8");

  it("la griglia d'asta e il replay ricevono l'ancora, non il dichiarante", () => {
    expect(smazzata).toContain("<BiddingPanel bidding={smazzata.bidding} inBasso={anchor} />");
    expect(smazzata).toMatch(/<HandReplay[\s\S]{0,400}?inBasso=\{anchor\}/);
  });

  it("nessuno passa più `declarer` a quelle due proprietà", () => {
    expect(smazzata).not.toMatch(/<BiddingPanel[^/]*declarer=/);
  });

  it("il punteggio del replay è dichiarante contro difesa, non N-S contro E-O", () => {
    // Dentro una finestra coi nomi dei posti ruotati, «N-S» in coordinate
    // assolute è un secondo sistema di riferimento nello stesso riquadro.
    const replay = readFileSync(join(ROOT, "src/components/bridge/hand-replay.tsx"), "utf8");
    expect(replay).toContain("score.dichiarante");
    expect(replay).not.toMatch(/runningScore\.(ns|ew)/);
  });
});

/**
 * `reportError` deve essere importato dove viene usato.
 *
 * IL TRABOCCHETTO. Il DOM ha una sua `window.reportError(errore)` globale: se
 * l'import manca, il nome si risolve LO STESSO e il codice compila. Con due
 * argomenti TypeScript protesta — è così che l'ho scoperto due volte in un
 * giorno — ma con uno solo passerebbe, e l'errore finirebbe nella console del
 * browser invece che fra le segnalazioni, senza che nulla lo dica.
 *
 * Vale solo per il codice dell'applicazione: negli script di servizio non c'è
 * un `window`.
 */
describe("reportError viene sempre importato", () => {
  it("nessun file lo usa senza importarlo", () => {
    const sorgenti = elencaFile(join(ROOT, "src"), /\.tsx?$/);
    const colpevoli = sorgenti.filter((f) => {
      if (f.endsWith(".test.ts") || f.endsWith("report-error.ts")) return false;
      const src = readFileSync(f, "utf8");
      // Vanno bene sia l'alias sia il percorso relativo: quello che conta è
      // che il nome venga da lì e non da `window`.
      const importato = /from ["'](@\/lib\/report-error|\.{1,2}\/[\w/-]*report-error)["']/.test(src);
      return /\breportError\s*\(/.test(src) && !importato;
    });
    expect(colpevoli.map((f) => f.replace(ROOT, ""))).toEqual([]);
  });
});

/** Tutti i file sotto `dir` che corrispondono a `filtro`, ricorsivamente. */
function elencaFile(dir: string, filtro: RegExp): string[] {
  const out: string[] = [];
  for (const voce of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, voce.name);
    if (voce.isDirectory()) out.push(...elencaFile(p, filtro));
    else if (filtro.test(voce.name)) out.push(p);
  }
  return out;
}
