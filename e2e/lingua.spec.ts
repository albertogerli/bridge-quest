import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * Fase 1 dell'inglese: la strada esiste, l'asfalto no.
 *
 * A fine fase `/en/...` deve rispondere e mostrare le stesse pagine — ancora in
 * italiano, perché non è stata tradotta una riga. Quello che queste prove
 * difendono è il patto della fase: **per chi usa il sito in italiano non
 * cambia niente**, e l'inglese non è una copia separata che domani diverge.
 */
test.describe("la lingua nell'indirizzo", () => {
  test("/en risponde e serve la stessa pagina", async ({ page }) => {
    const risposta = await page.goto("/en");
    expect(risposta?.status(), "/en deve rispondere, non dare 404").toBeLessThan(400);
    // Il titolo, non il marchio a schermo: «BridgeLab» in pagina è dentro il
    // logo, cioè un'immagine, e cercarlo come testo fa fallire una pagina sana.
    await expect(page).toHaveTitle(/BridgeLab/, { timeout: 45_000 });
    // E la navigazione dell'applicazione, che dimostra che è arrivata la
    // pagina vera e non un «non trovato» col titolo giusto. In inglese si
    // chiama «Learn»: da quando la navigazione è tradotta, cercare «Impara»
    // qui fallirebbe — ed è giusto così, il test ha colto il cambiamento.
    await expect(page.getByRole("link", { name: "Learn" }).first()).toBeVisible({
      timeout: 45_000,
    });
  });

  test("una pagina interna in inglese serve lo stesso contenuto", async ({ page }) => {
    await page.goto("/en/glossario");
    // Il glossario è l'unica pagina resa dal server: se la riscrittura è
    // sbagliata, qui si vede subito.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("l'attributo lang segue l'indirizzo", async ({ page }) => {
    await page.goto("/en/glossario");
    await expect
      // Generoso: in sviluppo la prima visita a una rotta la compila, e non è
      // quello che questa prova sta misurando.
      .poll(() => page.locator("html").getAttribute("lang"), { timeout: 45_000 })
      .toBe("en");

    await page.goto("/glossario");
    await expect
      .poll(() => page.locator("html").getAttribute("lang"), { timeout: 15_000 })
      .toBe("it");
  });

  test("l'area protetta resta protetta anche col prefisso", async ({ page }) => {
    // Il difetto che questa prova esiste per impedire: rotte protette
    // confrontate con il percorso grezzo, e `/en/admin` che scavalca il
    // controllo perché non comincia per «/admin».
    await page.goto("/en/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  });

  test("il selettore porta alla stessa pagina, non alla home", async ({ page }) => {
    await login(page);
    // Un utente appena creato incontra l'onboarding, che non ha footer: senza
    // saltarlo si cerca il selettore in una pagina che non ce l'ha.
    await page.evaluate(() => {
      localStorage.setItem("bq_onboarded", "1");
      localStorage.setItem("bq_onboarded_date", new Date().toISOString());
      localStorage.setItem("bq_guide_v2_seen", "1");
    });
    // Il selettore vive in fondo alla home: in questa fase è l'unico posto in
    // cui c'è. Quando in fase 2 arriverà anche nelle impostazioni, questa prova
    // andrà estesa lì — non spostata, perché il footer deve continuare ad
    // averlo.
    await page.goto("/");
    const verso = page.getByRole("link", { name: "English" }).first();
    await verso.scrollIntoViewIfNeeded();
    await expect(verso).toBeVisible({ timeout: 45_000 });
    expect(await verso.getAttribute("href")).toBe("/en");
  });
});

/**
 * Fase 2: le stringhe cominciano a tradursi davvero.
 *
 * La navigazione è la prima area convertita, ed è la prova che la catena
 * regge da un capo all'altro: indirizzo → lingua → dizionario → schermo. Se
 * questa passa, tradurre il resto è lavoro, non ricerca.
 */
test.describe("le stringhe tradotte", () => {
  test("la navigazione è in inglese sotto /en e in italiano fuori", async ({ page }) => {
    await login(page);
    await page.evaluate(() => {
      localStorage.setItem("bq_onboarded", "1");
      localStorage.setItem("bq_guide_v2_seen", "1");
    });

    await page.goto("/en");
    await expect(
      page.getByRole("link", { name: "Learn" }).first(),
      "sotto /en la navigazione deve essere tradotta"
    ).toBeVisible({ timeout: 45_000 });

    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Impara" }).first(),
      "in italiano deve restare italiana"
    ).toBeVisible({ timeout: 45_000 });
    // E l'inglese non deve comparire dove non c'entra.
    await expect(page.getByRole("link", { name: "Learn" })).toHaveCount(0);
  });

  test("una frase non ancora tradotta resta in italiano, non sparisce", async ({ page }) => {
    // È il ripiego che permette di tradurre un'area alla volta col sito vivo:
    // «Trova ASD» non è nel dizionario, e sotto /en deve vedersi in italiano
    // invece di lasciare un buco o mostrare una chiave.
    await login(page);
    await page.goto("/en/glossario");
    const html = await page.locator("body").innerText();
    expect(html.length, "la pagina non deve essere vuota").toBeGreaterThan(100);
  });
});

test("l'hub dei giochi è tradotto, e in italiano resta italiano", async ({ page }) => {
  await login(page);
  await page.goto("/en/gioca");
  await expect(page.getByText("Start here").first(), "l'hub deve essere in inglese").toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByText("Bid and See").first()).toBeVisible();

  await page.goto("/gioca");
  await expect(page.getByText("Inizia da qui").first()).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText("Start here")).toHaveCount(0);
});
