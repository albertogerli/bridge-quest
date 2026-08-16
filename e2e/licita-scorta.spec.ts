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
 * LA RETE NEURALE VIENE SOSTITUITA CON UN PASSO.
 * Il compagno e gli avversari sono BEN, un servizio esterno che risponde in
 * 4-9 secondi quando è in forma e ogni tanto non risponde affatto. Con BEN
 * vero dentro, questa prova misurava la latenza di Railway invece del codice:
 * il 16/08/2026 è morta sul tetto dei quattro minuti, e nelle notti prima
 * passava o falliva a seconda del carico. Un test che cambia risposta senza
 * che cambi una riga non dice più niente, e insegna a ignorare il rosso.
 *
 * Quello che qui ci appartiene — e resta verificato — è che la pagina chieda
 * una mano alla scorta, la mostri, faccia partire l'asta dal mazziere giusto e
 * arrivi al voto. Che BEN sia vivo è un'altra domanda, e va fatta a BEN.
 */
test.describe("licita dalla scorta condivisa", () => {
  test("una mano arriva, si dichiara e si ottiene un esito", async ({ page }) => {
    // In sviluppo la prima apertura della rotta la compila: da sola può
    // prendersi un minuto.
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

    // La mano compare: quattro righe di carte e i punti onori.
    await expect(page.getByText(/PO/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Sei Sud/)).toBeVisible();

    // Si dichiara 1♣ e gli altri passano: l'asta chiude su un contratto vero,
    // quindi si arriva al voto e non a un passo generale. Il pulsante è attivo
    // solo quando tocca davvero a te — le mani della scorta ruotano il
    // mazziere, quindi prima possono parlare i robot.
    const apri = page.getByRole("button", { name: "Dichiara 1♣" });
    await expect(
      apri,
      "il turno non è mai arrivato a Sud: l'asta non è partita dal mazziere giusto"
    ).toBeEnabled({ timeout: 60_000 });
    await apri.click();

    // Le due formule possibili, perché il metro cambia con la mano: quelle
    // della scorta condivisa hanno le distribuzioni misurate e dicono «rende in
    // media», quelle locali si confrontano col par e dicono «vale». Cercare
    // solo la seconda faceva fallire il test davanti a un riepilogo completo e
    // corretto — stelle, tabella e tutto (16/08/2026).
    await expect(
      page.getByText(/Il tuo contratto (vale|rende in media)/).first(),
      "l'asta è finita ma il voto non è comparso"
    ).toBeVisible({ timeout: 60_000 });

    // E il riepilogo con cui si impara: cosa avrebbe reso ogni altro contratto.
    await expect(
      page.getByText("Cosa valeva ogni contratto").first(),
      "manca la tabella dei contratti nel riepilogo di fine mano"
    ).toBeVisible();
  });

  test("la sfida 2 contro 2 si apre e spiega cosa serve", async ({ page }) => {
    await login(page);
    await page.goto("/gioca/sfida-coppie");
    await expect(page.getByRole("heading", { name: /Sfida 2 contro 2/ })).toBeVisible({
      timeout: 20_000,
    });
    // L'utente di prova è nuovo: nessun amico, e la pagina deve dirlo invece
    // di mostrare tendine vuote. `.first()`: da quando c'è anche l'iscrizione
    // in coda quel testo compare in due sezioni, e senza il `.first()` la
    // regola dello strict mode farebbe fallire una pagina sana.
    await expect(page.getByText(/almeno un amico|Il tuo compagno/).first()).toBeVisible();
  });
});
