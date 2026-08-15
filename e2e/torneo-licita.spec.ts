import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * Il torneo di licita deve poter cominciare, qualunque sia il mazziere.
 *
 * IL DIFETTO CHE QUESTA PROVA ESISTE PER IMPEDIRE. Le mani del torneo hanno il
 * mazziere a rotazione. Quando non è Sud, il cassetto delle dichiarazioni non
 * compare — giustamente, non è il tuo turno — e la pagina deve far parlare i
 * robot per arrivare a te. Se non lo fa, non c'è nessun pulsante e nemmeno una
 * via d'uscita: il torneo muore alla prima mano, cioè quasi subito.
 *
 * La rete neurale viene sostituita con un passo: è l'unica parte che non ci
 * appartiene, e in sviluppo non è accesa.
 */
test("il torneo parte anche quando non apri tu", async ({ page }) => {
  test.setTimeout(180_000);

  await page.route("**/api/ben/bid", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ bid: "PASS" }),
    })
  );

  await login(page);
  await page.goto("/gioca/torneo-licita");

  // La mano arriva.
  await expect(page.getByText(/PO$/).first()).toBeVisible({ timeout: 60_000 });

  // E si può dichiarare: o è il tuo turno subito, o i robot parlano fino a te.
  await expect(page.getByRole("button", { name: "Dichiara 1♣" })).toBeEnabled({
    timeout: 60_000,
  });

  await page.getByRole("button", { name: "Dichiara 1♣" }).click();

  // Con tre passi l'asta chiude e il voto compare.
  await expect(page.getByText("Tutta la smazzata")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Classifica" })).toBeVisible();
});
