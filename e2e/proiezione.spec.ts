import { expect, test } from "./test";
import { login } from "./helpers";
import { comeInsegnante } from "./ruolo";

/**
 * La vista proiezione, con due finestre vere.
 *
 * PERCHÉ NON BASTA IL TEST DI UNITÀ. `proiezione.test.ts` verifica che
 * `costruisciStato` non metta le mani coperte nel messaggio, e quella è la
 * garanzia forte. Ma fra quella funzione e il proiettore in aula ci sono un
 * canale, una seconda finestra e un componente che disegna: questo prova la
 * catena intera, che è quella che sta davanti alla classe.
 *
 * L'utente di prova nasce senza ruolo, e `/istruttori` è dietro un controllo di
 * ruolo lato server: qui lo si promuove a insegnante, e a fine file lo si
 * rimette com'era (vedi `ruolo.ts`).
 */
let ripristina: (() => Promise<void>) | undefined;
test.beforeAll(async () => {
  ripristina = await comeInsegnante();
});
test.afterAll(async () => {
  await ripristina?.();
});

test("alla finestra proiettata arrivano solo le mani scoperte", async ({ page, context }) => {
  await login(page);
  await page.goto("/istruttori/lavagna");
  await expect(page.getByRole("button", { name: /Apri vista proiezione/i })).toBeVisible({
    timeout: 20_000,
  });

  const [proiezione] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: /Apri vista proiezione/i }).click(),
  ]);
  await proiezione.waitForLoadState("domcontentloaded");

  // Tutte coperte: quattro riquadri, nessuna carta.
  await expect(proiezione.getByText("coperta")).toHaveCount(4, { timeout: 15_000 });

  /**
   * LA VERIFICA CHE CONTA, e non è quella visiva: le carte non devono proprio
   * esserci nella pagina. Se un giorno qualcuno le spedisse tutte e le
   * nascondesse con il CSS, i quattro «coperta» resterebbero lì e questo
   * controllo cadrebbe — che è esattamente il punto.
   */
  const html = await proiezione.content();
  expect(html).not.toMatch(/font-mono text-5xl/);

  // Scopro Nord dal pannello dell'insegnante.
  await page.getByRole("button", { name: "Mostra Nord alla classe" }).click();
  await expect(proiezione.getByText("coperta")).toHaveCount(3, { timeout: 10_000 });

  // Scopro tutte.
  await page.getByRole("button", { name: "Mostra tutte le mani alla classe" }).click();
  await expect(proiezione.getByText("coperta")).toHaveCount(0, { timeout: 10_000 });

  // E le ricopro: la proiezione deve tornare indietro, non restare aperta.
  await page.getByRole("button", { name: "Copri tutte le mani" }).click();
  await expect(proiezione.getByText("coperta")).toHaveCount(4, { timeout: 10_000 });

  await proiezione.close();
});
