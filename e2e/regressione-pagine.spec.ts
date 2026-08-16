import { expect, test, type Locator, type Page } from "@playwright/test";
import { dismissCookieBanner, login } from "./helpers";

/**
 * Rete di sicurezza per il refactoring delle 5 pagine monolitiche
 * (lezioni/[lessonId]/[moduleId], profilo, gioca/torneo,
 * gioca/mano-del-giorno, admin).
 *
 * Sono test di COMPORTAMENTO, non di aspetto: verificano che i dati arrivino,
 * che i controlli principali esistano e reagiscano, e che le pagine non
 * esplodano. Nessuna asserzione su classi CSS, layout o testi decorativi:
 * il refactoring può riscrivere il markup senza far diventare rosso il verde.
 *
 * ATTENZIONE — stato iniziale: `e2e/global-setup.ts` crea un utente nuovo a
 * ogni run, ma quell'utente è UNO SOLO per tutta la suite e non resta vergine.
 * I test girano in ordine alfabetico di file, con un worker, e giocano: il
 * primo test di questo stesso file completa un modulo, che vale XP. Quanto di
 * quell'XP sia già stato scritto su Supabase quando arriva il test dopo
 * dipende da una corsa con la sincronizzazione — che in CI, più lenta, si
 * risolve al contrario che sul portatile.
 *
 * Perciò: NIENTE asserzioni su valori assoluti di progresso (0 XP, livello 1,
 * 0 mani). Passerebbero in locale e fallirebbero ogni notte, segnalando un
 * difetto che non esiste — è successo il 16/08/2026 con «Livello 1» su
 * /profilo. Si verificano il formato dei valori e la loro coerenza fra
 * componenti diversi, che non dipendono da chi ha giocato prima. Nemmeno
 * aspettative da account maturo (badge sbloccati, posizioni in classifica).
 *
 * Sincronizzazione: mai `waitForTimeout`. Le pagine sono client-rendered e
 * caricano il catalogo/le smazzate da Supabase in modo asincrono, quindi si
 * aspetta sempre uno STATO osservabile (`toBeVisible`, `toBeEnabled`,
 * `waitForURL`, `waitForFunction`).
 */

/** Le rotte protette mostrano uno spinner senza testo finché l'auth non risolve. */
const LOAD_TIMEOUT = 30_000;

/**
 * RPC Supabase non installate sul progetto puntato da `.env.local`
 * (`scripts/sql/friends-challenges.sql` non applicato; `get_own_profile`
 * assente). Il client le gestisce con fallback ma logga un `console.error` e
 * riceve un 404: è rumore d'ambiente, non una regressione delle pagine.
 *
 * Da RIMUOVERE appena le migrazioni sono applicate. Ogni voce aggiunta qui è
 * un errore che i test smettono di vedere: aggiungerne solo con motivazione.
 */
const KNOWN_MISSING_RPCS = [
  // Creata da scripts/sql/pii-columns-2026-08.sql (PARTE A), non ancora
  // eseguito: `use-auth` degrada sulla lettura diretta di profiles.
  // RIMUOVERE da questa lista appena lo script è applicato.
  "get_own_profile",
];

/** Terze parti che non si caricano in locale e non dicono nulla sul refactoring. */
const THIRD_PARTY = /youtube|ytimg|googlevideo|googletagmanager|google-analytics|doubleclick|gstatic|sentry|vercel-insights|vitals/i;

/**
 * `console.error` generici da ignorare. La riga "Failed to load resource … 404"
 * di Chromium non contiene l'URL: è coperta in modo PIÙ preciso dal controllo
 * sulle risposte HTTP qui sotto, che l'URL invece ce l'ha. Nota che si ignora
 * solo il 404: 4xx/5xx diversi restano bloccanti su entrambi i canali.
 */
const IGNORED_CONSOLE = [
  new RegExp(KNOWN_MISSING_RPCS.join("|")),
  // NB: nessun perdono generico per PGRST202 ("function not found"). Una RPC
  // chiamata con la firma sbagliata deve far fallire il test: è esattamente
  // così che è emerso il bug delle sfide (get_challenge_history chiamata con
  // `result_limit` invece di `p_user_id`/`p_limit`), che rendeva storico e
  // statistiche sempre vuoti in produzione.
  /Failed to load resource: the server responded with a status of 404/i,
  // Rumore di Chromium, non dell'app: è l'header Permissions-Policy che fa il
  // suo lavoro (il browser sonda compute-pressure e si vede negare il permesso).
  // Comparsa non deterministica -> rendeva instabile il test del modulo lezione.
  /Permissions policy violation/i,
  THIRD_PARTY,
];

interface PageProblems {
  /** `console.error` + eccezioni non gestite, già filtrati dal rumore noto. */
  console: string[];
  /** Risposte HTTP 4xx/5xx non previste, con URL: qui il 404 NON è perdonato. */
  requests: string[];
}

/**
 * Due canali complementari: la console cattura le eccezioni React, le risposte
 * catturano i fallimenti di rete con l'URL. Insieme rendono impossibile che un
 * 404 su un endpoint dell'app passi inosservato.
 */
function watchForProblems(page: Page): PageProblems {
  const problems: PageProblems = { console: [], requests: [] };

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((p) => p.test(text))) return;
    problems.console.push(`console.error: ${text}`);
  });

  // Nessuna eccezione non gestita è mai accettabile: niente filtri.
  page.on("pageerror", (err) => {
    problems.console.push(`Uncaught: ${err.message}`);
  });

  page.on("response", (res) => {
    if (res.status() < 400) return;
    const url = res.url();
    if (THIRD_PARTY.test(url)) return;
    if (KNOWN_MISSING_RPCS.some((rpc) => url.includes(`/rpc/${rpc}`))) return;
    problems.requests.push(`${res.status()} ${url}`);
  });

  return problems;
}

/** Asserzione unica sui due canali, con il contesto della pagina nel messaggio. */
async function expectNoProblems(problems: PageProblems, where: string) {
  expect(problems.console, `errori/eccezioni in console su ${where}`).toEqual([]);
  expect(problems.requests, `richieste HTTP fallite su ${where}`).toEqual([]);
}

/** Href dei link presenti a schermo che soddisfano un pattern. */
async function hrefsMatching(links: Locator, pattern: RegExp): Promise<string[]> {
  const all = await links.evaluateAll((els) =>
    els.map((el) => el.getAttribute("href") ?? "")
  );
  return all.filter((h) => pattern.test(h));
}

test.describe("regressione pagine monolitiche", () => {
  test("modulo lezione: contenuto dal DB, avanzamento e blocco successivo", async ({
    page,
  }) => {
    const problems = watchForProblems(page);

    await login(page);
    await page.goto("/lezioni");
    await dismissCookieBanner(page);

    // Il catalogo arriva da Supabase: finché non c'è, la pagina mostra
    // "Caricamento corsi…". L'h1 compare solo a catalogo caricato.
    await expect(
      page.getByRole("heading", { name: "Il Percorso" }),
      "la pagina /lezioni non ha caricato il catalogo dal DB"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });

    // Prima lezione disponibile: primo link /lezioni/<id> in ordine di DOM.
    // Il mondo 1 non è mai bloccato (vedi isWorldLocked), quindi è cliccabile.
    const lessonLinks = page.locator('a[href^="/lezioni/"]');
    await expect(lessonLinks.first()).toBeVisible({ timeout: LOAD_TIMEOUT });
    const lessonHrefs = await hrefsMatching(lessonLinks, /^\/lezioni\/\d+$/);
    expect(
      lessonHrefs.length,
      "nessun link a una lezione trovato su /lezioni"
    ).toBeGreaterThan(0);
    const lessonHref = lessonHrefs[0];

    await page.locator(`a[href="${lessonHref}"]`).first().click();
    await page.waitForURL(new RegExp(`${lessonHref}$`), { timeout: LOAD_TIMEOUT });

    // Pagina lezione: il primo modulo non è mai bloccato (isModuleLocked).
    const moduleLinks = page.locator(`a[href^="${lessonHref}/"]`);
    await expect(
      moduleLinks.first(),
      `la lezione ${lessonHref} non elenca nessun modulo`
    ).toBeVisible({ timeout: LOAD_TIMEOUT });
    const moduleHrefs = await hrefsMatching(
      moduleLinks,
      /^\/lezioni\/\d+\/[^/]+$/
    );
    expect(
      moduleHrefs.length,
      `nessun link a un modulo trovato su ${lessonHref}`
    ).toBeGreaterThan(0);
    const moduleHref = moduleHrefs[0];

    await page.locator(`a[href="${moduleHref}"]`).first().click();
    await page.waitForURL(new RegExp(`${moduleHref}$`), { timeout: LOAD_TIMEOUT });

    // (a) Il contenuto del modulo si carica: il contenitore dei blocchi esiste
    //     e il primo blocco ha testo vero (non un guscio vuoto).
    const content = page.getByTestId("module-content");
    await expect(
      content,
      "il contenuto del modulo non è stato renderizzato (catalogo non caricato?)"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });

    const firstBlock = page.locator('[data-step-block="0"]');
    await expect(
      firstBlock,
      "il primo blocco di contenuto del modulo non è visibile"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });
    const firstBlockText = ((await firstBlock.innerText()) ?? "").trim();
    expect(
      firstBlockText.length,
      `il primo blocco è vuoto: il modulo ${moduleHref} non ha caricato il contenuto testuale`
    ).toBeGreaterThan(10);

    // (b) Il pulsante di avanzamento esiste e diventa cliccabile dopo il tempo
    //     minimo di lettura (MIN_READ_SECONDS = 5 nella pagina). Si aspetta lo
    //     STATO `enabled`, non un timer: se il gate sparisce o non si sblocca
    //     più, il test fallisce per la ragione giusta.
    const avanti = page.getByRole("button", { name: /^Avanti/ });
    await expect(
      avanti,
      "manca il pulsante di avanzamento «Avanti» (il modulo ha un solo blocco?)"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });
    await expect(
      avanti,
      "«Avanti» non si è mai sbloccato dopo il tempo minimo di lettura"
    ).toBeEnabled({ timeout: 20_000 });

    // (c) Avanzando compare il blocco successivo (i blocchi sono cumulativi:
    //     `mod.content.slice(0, currentStep + 1)`).
    await avanti.click();
    await expect(
      page.locator('[data-step-block="1"]'),
      "dopo il click su «Avanti» il secondo blocco di contenuto non è comparso"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });

    await expectNoProblems(problems, "il percorso /lezioni → lezione → modulo");
  });

  test("profilo: identità utente e statistiche coerenti, senza errori in console", async ({
    page,
  }) => {
    const problems = watchForProblems(page);

    await login(page);
    await page.goto("/profilo");
    await dismissCookieBanner(page);

    // Nome utente: l'h1 mostra il display_name del profilo, con fallback
    // "Bridgista" se la riga profiles non è ancora arrivata. In entrambi i
    // casi deve essere non vuoto — un h1 vuoto è la regressione da catturare.
    const nome = page.getByRole("heading", { level: 1 }).first();
    await expect(
      nome,
      "l'intestazione con il nome utente non è visibile su /profilo"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });
    const nomeText = ((await nome.innerText()) ?? "").trim();
    expect(nomeText.length, "il nome utente su /profilo è vuoto").toBeGreaterThan(0);

    // Avatar: immagine caricata oppure fallback con l'iniziale/"?".
    const avatar = page.locator("h1").locator("xpath=../..").locator("img, span").first();
    await expect(avatar, "l'avatar non è renderizzato su /profilo").toBeVisible();

    // NON si presume un utente vergine, e non è una resa.
    //
    // L'utente di prova è UNO per tutta la suite, e i test che girano prima di
    // questo giocano: quello subito sopra percorre una lezione fino a
    // completare un modulo, che vale XP. Se la sincronizzazione verso Supabase
    // fa in tempo a scrivere — e in CI, più lenta, fa in tempo — qui arriva un
    // utente di livello 2. Il test pretendeva «Livello 1» e falliva ogni notte
    // (16/08/2026) per un difetto che non esiste: sul portatile la stessa
    // corsa finiva al contrario, quindi in locale passava sempre.
    //
    // Quello che questa pagina deve garantire non è un numero particolare, ma
    // di non contraddirsi: il livello scritto nella scheda e quello nella
    // barra laterale vengono da due componenti diversi che leggono lo stesso
    // XP, e se divergono è una regressione vera. È un controllo più forte di
    // «Livello 1», e non dipende da chi ha giocato prima.
    const livelloScheda = page.getByRole("heading", { name: /^Livello \d+\b/ });
    await expect(
      livelloScheda,
      "manca l'intestazione del livello su /profilo"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });

    const nScheda = (await livelloScheda.innerText()).match(/Livello (\d+)/)?.[1];
    const barra = page.getByRole("complementary", { name: "Barra laterale" });
    if (await barra.isVisible()) {
      await expect(
        barra.getByText(new RegExp(`^Livello ${nScheda}$`)),
        `la barra laterale non concorda con la scheda (livello ${nScheda})`
      ).toBeVisible();
    }

    // I riquadri delle statistiche: il formato, non il valore. Un riquadro che
    // resta vuoto o mostra «NaN» è la regressione da catturare.
    await expect(
      page.getByTestId("profilo-stat-moduli"),
      "il riquadro dei moduli non mostra un numero"
    ).toHaveText(/^\d+\s*Moduli$/);
    await expect(
      page.getByTestId("profilo-stat-mani"),
      "il riquadro delle mani non mostra un numero"
    ).toHaveText(/^\d+\s*Mani$/);
    await expect(
      page.getByTestId("profilo-stat-completato"),
      "il riquadro del completamento non mostra una percentuale"
    ).toHaveText(/^\d+%\s*Completato$/);

    // Sezioni principali presenti (il refactoring non deve perderne pezzi).
    await expect(
      page.getByRole("heading", { name: "Badge Collezionati" }),
      "manca la sezione «Badge Collezionati» su /profilo"
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Progresso per Corso" }),
      "manca la sezione «Progresso per Corso» su /profilo"
    ).toBeVisible();

    await expectNoProblems(problems, "/profilo");
  });

  test("torneo: stato settimanale e CTA coerente con le mani caricate", async ({
    page,
  }) => {
    const problems = watchForProblems(page);

    await login(page);
    await page.goto("/gioca/torneo");
    await dismissCookieBanner(page);

    await expect(
      page.getByRole("heading", { name: "Torneo Settimanale" }),
      "la pagina /gioca/torneo non ha renderizzato l'intestazione"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });

    // Utente nuovo: torneo mai giocato → CTA di avvio. Le altre etichette
    // (ripresa/rigioco) sono accettate per non rendere il test dipendente da
    // eventuali residui di localStorage, ma lo stato atteso è "Gioca".
    const cta = page.getByRole("button", {
      name: /^(Gioca il Torneo|Riprendi il Torneo|Rigioca il torneo)/,
    });
    await expect(
      cta,
      "manca il pulsante principale del torneo settimanale"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });

    // Riepilogo dello stato settimanale: le 5 mani proposte arrivano dalla pool
    // di smazzate su Supabase. Verificare il conteggio (e non solo la presenza
    // del contenitore) distingue "caricato" da "renderizzato vuoto".
    const hands = page.getByTestId("torneo-hands");
    await expect(
      hands.locator("> div"),
      "il torneo settimanale deve proporre 5 mani"
    ).toHaveCount(5, { timeout: LOAD_TIMEOUT });

    // Coerenza, verso "abilitato": con le 5 mani a schermo la CTA è cliccabile.
    await expect(
      cta,
      "con le 5 mani caricate la CTA del torneo deve essere abilitata"
    ).toBeEnabled({ timeout: LOAD_TIMEOUT });

    await expectNoProblems(problems, "/gioca/torneo");

    // Coerenza, verso "disabilitato". Non si può asserire sullo stato iniziale
    // (la pool può essere già arrivata quando il test aggancia la pagina: sarebbe
    // una corsa). Si rende quindi il caso DETERMINISTICO impedendo la fetch delle
    // smazzate: senza mani la CTA non deve essere cliccabile.
    // Da qui in poi la pagina è volutamente in errore di rete: nessun controllo
    // su console/richieste dopo questo punto.
    await page.route("**/rest/v1/smazzate*", (route) => route.abort());
    await page.goto("/gioca/torneo");
    await expect(
      page.getByRole("heading", { name: "Torneo Settimanale" })
    ).toBeVisible({ timeout: LOAD_TIMEOUT });
    await expect(
      hands.locator("> div"),
      "senza la pool di smazzate non deve essere proposta nessuna mano"
    ).toHaveCount(0);
    await expect(
      cta,
      "senza mani caricate la CTA del torneo deve essere disabilitata"
    ).toBeDisabled();
  });

  test("mano del giorno: la mano si carica e mostra il suo stato", async ({ page }) => {
    const problems = watchForProblems(page);

    await login(page);
    await page.goto("/gioca/mano-del-giorno");
    await dismissCookieBanner(page);

    // Finché la smazzata del giorno non arriva la pagina mostra un `role=status`
    // dedicato: l'h1 compare solo a caricamento concluso.
    await expect(
      page.getByRole("heading", { name: "Mano del Giorno" }),
      "la mano del giorno non è stata caricata (status di caricamento bloccato?)"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });
    await expect(
      page.getByRole("status", { name: "Caricamento mano del giorno" })
    ).toHaveCount(0);

    // Stato: da giocare (CTA solida) oppure già giocata (badge + CTA di rigioco).
    // Per un utente nuovo ci si aspetta il primo, ma il test accetta entrambi
    // perché la mano è condivisa e la data può cambiare a cavallo di mezzanotte.
    const cta = page.getByRole("button", {
      name: /^(Gioca la Mano del Giorno|Rigioca la mano di oggi)$/,
    });
    await expect(
      cta,
      "manca il pulsante principale della mano del giorno"
    ).toBeVisible({ timeout: LOAD_TIMEOUT });
    await expect(
      cta,
      "il pulsante della mano del giorno deve essere sempre cliccabile: la mano è già caricata"
    ).toBeEnabled();

    // I dati della mano sono effettivamente arrivati dal DB.
    await expect(
      page.getByText("Contratto", { exact: true }).first(),
      "la scheda della mano del giorno non mostra il contratto"
    ).toBeVisible();
    await expect(
      page.getByText(/Obiettivo:\s*\d+\s*prese/),
      "la scheda della mano del giorno non mostra l'obiettivo in prese"
    ).toBeVisible();

    await expectNoProblems(problems, "/gioca/mano-del-giorno");
  });

  test("admin: l'utente di test non-admin viene respinto senza crash", async ({
    page,
  }) => {
    const problems = watchForProblems(page);

    await login(page);
    await page.goto("/admin");

    // Il layout server di /admin fa `redirect("/")` se profiles.role !== "admin".
    // Se il gate server venisse aggirato, resta quello client con "Accesso negato":
    // il test accetta entrambi gli esiti, ma NON il passaggio.
    await page
      .waitForURL((url) => !url.pathname.startsWith("/admin"), { timeout: LOAD_TIMEOUT })
      .catch(() => {});

    const respinto = page.url().includes("/admin")
      ? page.getByRole("heading", { name: "Accesso negato" })
      : null;
    if (respinto) {
      await expect(
        respinto,
        "l'utente non-admin è rimasto su /admin senza vedere «Accesso negato»"
      ).toBeVisible({ timeout: LOAD_TIMEOUT });
    }

    // La dashboard amministrativa non deve MAI comparire.
    await expect(
      page.getByRole("heading", { name: /Admin BridgeLab/ }),
      "un utente non-admin ha raggiunto la dashboard di amministrazione"
    ).toHaveCount(0);
    await expect(page.getByPlaceholder("Cerca utente...")).toHaveCount(0);

    // Niente pagina bianca: il rimbalzo porta su una pagina vera e viva.
    await expect(
      page.locator("body"),
      "dopo il rifiuto l'utente è finito su una pagina vuota"
    ).not.toBeEmpty();
    await page.waitForFunction(
      () => (document.body.innerText ?? "").trim().length > 50,
      undefined,
      { timeout: LOAD_TIMEOUT }
    );

    await expectNoProblems(problems, "/admin (utente non-admin)");
  });
});
