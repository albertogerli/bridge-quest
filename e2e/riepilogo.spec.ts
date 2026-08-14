import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * A mano finita si aprono tutte le carte e si vede cosa valeva ogni contratto.
 *
 * PERCHÉ SI SOSTITUISCE LA RETE NEURALE
 * In sviluppo `BEN_API_URL` punta a un servizio locale che di solito non è
 * acceso: ogni mano finisce «annullata» e il riepilogo non si raggiunge mai.
 * Qui la risposta del motore viene sostituita con un passo — è l'unica parte
 * che non ci appartiene, e sostituirla è ciò che rende la prova ripetibile.
 * Tutto il resto (mano dalla scorta, asta, voto, riepilogo) è codice vero.
 *
 * Con tre passi degli altri e un contratto tuo l'asta chiude subito, ed è
 * esattamente il caso da guardare: un contratto raggiunto, e sotto l'elenco di
 * quelli che valevano di più.
 */
test("il riepilogo compare a mano finita", async ({ page }) => {
  test.setTimeout(180_000);

  await page.route("**/api/ben/bid", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ bid: "PASS" }),
    })
  );

  await login(page);
  await page.goto("/gioca/licita");
  await expect(page.getByText(/PO/).first()).toBeVisible({ timeout: 60_000 });

  // Un contratto qualunque: 1♣ è sempre lecito come prima dichiarazione.
  // L'etichetta accessibile del pulsante è «Dichiara 1♣», non «1♣».
  await page.getByRole("button", { name: "Dichiara 1♣" }).click();

  // Restano i passi degli altri, poi la mano chiude.
  for (let i = 0; i < 8; i++) {
    if (await page.getByText("Tutta la smazzata").isVisible().catch(() => false)) break;
    const passo = page.getByRole("button", { name: "Passo", exact: true });
    if (await passo.isEnabled({ timeout: 2000 }).catch(() => false)) await passo.click();
    await page.waitForTimeout(800);
  }

  await expect(page.getByText("Tutta la smazzata")).toBeVisible({ timeout: 30_000 });

  // Le quattro mani, non solo la tua: durante l'asta se ne vedeva una.
  for (const posto of ["Nord", "Est", "Ovest", "Sud"]) {
    await expect(page.getByText(posto, { exact: true }).first()).toBeVisible();
  }

  // E la tabella di cosa valeva ogni contratto, col proprio segnato.
  await expect(page.getByText("Cosa valeva ogni contratto")).toBeVisible();
  // La colonna del valore atteso: è da lì che vengono le stelle, e se sparisse
  // vorrebbe dire che le mani della scorta non portano più le distribuzioni —
  // cioè che il voto è tornato a confrontare due metri diversi.
  await expect(page.getByRole("columnheader", { name: "In media" })).toBeVisible();
  await expect(page.getByText("← il vostro")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Stelle" })).toBeVisible();

  await page.getByText("Tutta la smazzata").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/riepilogo.png", fullPage: true });
});
