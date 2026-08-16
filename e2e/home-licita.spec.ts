import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * Le tre porte della licita devono stare in PRIMA PAGINA.
 *
 * Erano raggiungibili solo scendendo dentro l'hub «Gioca», e tre voci dietro
 * un tocco in più sono tre voci che gli iscritti non sanno che esistono. È la
 * parte del prodotto su cui si gioca con gli altri — stesse smazzate per
 * tutti, confronto col campo, tornei con la classifica — quindi la posizione
 * è una decisione di prodotto, non di grafica: questa prova esiste perché un
 * refactoring della home non se la porti via in silenzio.
 */
test("le tre porte della licita sono in prima pagina", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);

  // Un utente appena creato incontra prima l'onboarding e la guida della nuova
  // versione: due schermate che coprono la home e non c'entrano con questo.
  await page.evaluate(() => {
    localStorage.setItem("bq_onboarded", "1");
    localStorage.setItem("bq_onboarded_date", new Date().toISOString());
    localStorage.setItem("bq_guide_v2_seen", "1");
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Dichiara" }),
    "la sezione della licita non è in prima pagina"
  ).toBeVisible({ timeout: 40_000 });

  for (const [nome, href] of [
    ["Licita e vediamo", "/gioca/licita"],
    ["Licita con un amico", "/gioca/licita-amico"],
    ["Tornei di licita", "/gioca/torneo-licita"],
  ] as const) {
    await expect(
      page.locator(`a[href="${href}"]`).first(),
      `manca il collegamento a ${href}`
    ).toBeVisible();
    await expect(page.getByText(nome).first()).toBeVisible();
  }
});
