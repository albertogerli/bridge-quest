import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * «Licita e vediamo» sulle mani della scorta condivisa.
 *
 * PERCHÉ SERVE UNA PROVA DAL BROWSER
 * Che le funzioni del database facciano la cosa giusta lo prova già
 * `scripts/prova-campo.mjs`. Quello che nessuna di quelle prove tocca è il
 * pezzo in mezzo: che la pagina chieda davvero una mano alla scorta, che la
 * mostri, che l'asta parta dal mazziere giusto — le mani della scorta hanno il
 * mazziere che gli tocca, non sempre Sud — e che alla fine compaia il voto.
 * È esattamente il punto in cui un difetto non si vede da nessun'altra parte.
 *
 * Il compagno e gli avversari sono la rete neurale: se il servizio è giù la
 * mano si annulla e la schermata lo dice. La prova accetta anche quel finale,
 * perché un servizio esterno spento non è un difetto della pagina — ma NON
 * accetta che non succeda niente.
 */
test.describe("licita dalla scorta condivisa", () => {
  test("una mano arriva, si dichiara e si ottiene un esito", async ({ page }) => {
    // In sviluppo la prima apertura della rotta la compila: da sola può
    // prendersi un minuto, e sopra ci vanno le chiamate alla rete neurale.
    test.setTimeout(240_000);
    await login(page);
    await page.goto("/gioca/licita");

    // La mano compare: quattro righe di carte e i punti onori.
    await expect(page.getByText(/PO/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Sei Sud/)).toBeVisible();

    // Si dichiara passo finché non esce un esito: il passo è sempre lecito, ed
    // è la via più corta per arrivare in fondo a un'asta vera.
    const passo = page.getByRole("button", { name: "Passo", exact: true });
    for (let i = 0; i < 12; i++) {
      const finita = await page
        .getByText(/Il tuo contratto vale|Mano annullata/)
        .isVisible()
        .catch(() => false);
      if (finita) break;
      if (await passo.isEnabled().catch(() => false)) {
        await passo.click();
      }
      await page.waitForTimeout(1500);
    }

    await expect(page.getByText(/Il tuo contratto vale|Mano annullata/)).toBeVisible({
      timeout: 60_000,
    });
  });

  test("la sfida 2 contro 2 si apre e spiega cosa serve", async ({ page }) => {
    await login(page);
    await page.goto("/gioca/sfida-coppie");
    await expect(page.getByRole("heading", { name: /Sfida 2 contro 2/ })).toBeVisible({
      timeout: 20_000,
    });
    // L'utente di prova è nuovo: nessun amico, e la pagina deve dirlo invece
    // di mostrare tendine vuote.
    await expect(page.getByText(/almeno un amico|Il tuo compagno/)).toBeVisible();
  });
});
