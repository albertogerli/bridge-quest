import { test, expect, type Page } from "./test";

/**
 * Consenso cookie e Google Consent Mode v2.
 *
 * PERCHÉ ESISTE
 * L'12/08/2026 è arrivata una segnalazione esterna: «il consenso di default è
 * denied su tutte le categorie e non viene mai aggiornato, nessun banner nel
 * DOM». Verificata su produzione, era già risolta — la fotografia del
 * dataLayer era stata presa prima del rilascio, e mostrava lo stato corretto
 * di chi non ha ancora scelto.
 *
 * Il problema è che quella verifica ha richiesto un browser pilotato a mano.
 * Queste prove la rendono automatica: se l'aggiornamento del consenso si
 * rompesse, il difetto salterebbe fuori prima del rilascio invece che da un
 * audit esterno settimane dopo.
 *
 * Ciò che viene verificato è la CATENA COMPLETA: default negato → banner
 * visibile → clic → evento di aggiornamento nel dataLayer. Controllare solo
 * che il banner compaia non direbbe nulla su ciò che conta.
 */

type DataLayerEntry = unknown[];

async function dataLayer(page: Page): Promise<DataLayerEntry[]> {
  return page.evaluate(() =>
    ((window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? []).map((a) =>
      Array.from(a as unknown as ArrayLike<unknown>)
    )
  );
}

function find(entries: DataLayerEntry[], kind: string) {
  return entries.find((e) => e[0] === "consent" && e[1] === kind);
}

/**
 * Aspetta che lo script inline del consenso abbia girato.
 *
 * PERCHÉ SERVE, dal 24/09/2026. `gtag-init` è un `next/script` con strategia
 * `afterInteractive`: parte DOPO l'idratazione, e `page.goto()` ritorna al
 * `load`, che viene prima. Finché le notturne giravano su `next dev` la
 * corsa si vinceva quasi sempre; da quando girano su una build di
 * produzione (`next start`, dal 23/09) si perde quasi sempre — e infatti
 * fallivano esattamente le tre prove che leggono il dataLayer SUBITO dopo
 * `goto`, mentre passavano quelle che prima cliccano un pulsante e quindi
 * aspettano senza saperlo.
 *
 * Non indebolisce niente: quello che le prove affermano — il default nega
 * tutto, e lo fa prima di qualunque `config` — resta verificato, e
 * `ordineRispettato` qui sotto lo verifica MEGLIO di prima, perché guarda
 * l'ordine invece del solo contenuto.
 */
async function attendiConsensoIniziale(page: Page): Promise<DataLayerEntry[]> {
  await page.waitForFunction(
    () =>
      ((window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? []).some(
        (a) => (a as unknown as ArrayLike<unknown>)[0] === "consent",
      ),
    undefined,
    { timeout: 15_000 },
  );
  return dataLayer(page);
}

/** Il default deve precedere ogni `config`, o la prima richiesta parte senza. */
function defaultPrimaDelConfig(entries: DataLayerEntry[]): boolean {
  const iDefault = entries.findIndex((e) => e[0] === "consent" && e[1] === "default");
  const iConfig = entries.findIndex((e) => e[0] === "config");
  return iDefault !== -1 && (iConfig === -1 || iDefault < iConfig);
}

test.describe("consenso cookie e Consent Mode v2", () => {
  test("il default nega tutto prima di qualsiasi scelta", async ({ page }) => {
    await page.goto("/");
    const entries = await attendiConsensoIniziale(page);
    const def = find(entries, "default") as
      | [string, string, Record<string, string>]
      | undefined;

    expect(def, "manca gtag('consent','default')").toBeTruthy();
    // «Prima» nel nome della prova non era verificato: si guardava solo che
    // il default ci fosse. Un default emesso DOPO il config non protegge
    // niente, perché la prima richiesta è già partita.
    expect(
      defaultPrimaDelConfig(entries),
      "il consenso di default deve precedere gtag('config', …)",
    ).toBe(true);
    // Tutte e quattro le categorie: dimenticarne una la lascerebbe attiva
    // senza che nessuno l'abbia autorizzata.
    expect(def![2]).toMatchObject({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      // Trattiene i tag in attesa di un eventuale aggiornamento: senza,
      // chi ha già acconsentito perderebbe la prima pagina vista.
      wait_for_update: 500,
    });
  });

  test("prima di scegliere non esiste alcun aggiornamento", async ({ page }) => {
    await page.goto("/");
    // L'attesa serve proprio QUI più che altrove: senza, la prova passava
    // anche quando lo script non aveva ancora girato — il dataLayer era
    // vuoto e «nessun update» era vero per il motivo sbagliato. Una prova
    // che non può fallire non è una prova.
    expect(find(await attendiConsensoIniziale(page), "update")).toBeUndefined();
  });

  test("«Accetta tutti» concede tutte e quattro le categorie", async ({ page }) => {
    await page.goto("/");
    const accetta = page.getByRole("button", { name: "Accetta tutti" });
    await expect(accetta, "il banner non compare a chi non ha ancora scelto").toBeVisible();

    await accetta.click();
    await expect(accetta).toBeHidden();

    const update = find(await dataLayer(page), "update") as
      | [string, string, Record<string, string>]
      | undefined;
    expect(update, "nessun gtag('consent','update') dopo l'accettazione").toBeTruthy();
    expect(update![2]).toMatchObject({
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
  });

  test("«Solo necessari» aggiorna negando, non tace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Solo necessari" }).click();

    const update = find(await dataLayer(page), "update") as
      | [string, string, Record<string, string>]
      | undefined;
    // Un rifiuto silenzioso lascerebbe gtag sul default: identico nei fatti,
    // ma indistinguibile da un consenso mai chiesto.
    expect(update, "il rifiuto deve comunque emettere un update").toBeTruthy();
    expect(update![2].ad_storage).toBe("denied");
  });

  test("la scelta viene ricordata e il banner non si ripresenta", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Accetta tutti" }).click();
    await page.reload();

    await expect(page.getByRole("button", { name: "Accetta tutti" })).toBeHidden();
    // Chi aveva già acconsentito non deve perdere la prima pagina vista: lo
    // script inline rilegge la scelta e concede prima del config.
    const update = find(await dataLayer(page), "update") as
      | [string, string, Record<string, string>]
      | undefined;
    expect(update?.[2]).toMatchObject({ ad_storage: "granted" });
  });

  test("sono impostati ads_data_redaction e url_passthrough", async ({ page }) => {
    await page.goto("/");
    const entries = await attendiConsensoIniziale(page);
    const sets = entries.filter((e) => e[0] === "set").map((e) => e[1]);
    // Servono a chi RIFIUTA: senza, le conversioni da annuncio diventano
    // inattribuibili quando i cookie non sono disponibili.
    expect(sets).toContain("ads_data_redaction");
    expect(sets).toContain("url_passthrough");
  });

  test("«Preferenze cookie» riapre il pannello a chi ha già scelto", async ({ page }) => {
    // Su /privacy e non sulla home: lì, dopo il banner, compare la guida una
    // tantum della nuova versione, un pannello a tutto schermo che coprirebbe
    // il footer. È comportamento previsto, non un difetto da aggirare.
    await page.goto("/privacy");
    await page.getByRole("button", { name: "Solo necessari" }).click();
    await expect(page.getByRole("button", { name: "Accetta tutti" })).toBeHidden();

    // Il caso che conta: chi ha rifiutato deve poter tornare sui propri passi
    // senza cancellare i dati del sito. Un consenso revocabile solo così non
    // sarebbe un consenso valido.
    await page.getByRole("button", { name: "Preferenze cookie" }).click();
    const accetta = page.getByRole("button", { name: "Accetta tutti" });
    await expect(accetta).toBeVisible();

    await accetta.click();
    const entries = await dataLayer(page);
    const updates = entries.filter((e) => e[0] === "consent" && e[1] === "update");
    // Due aggiornamenti: prima il rifiuto, poi la concessione. L'ultimo vince.
    expect(updates.length).toBe(2);
    expect((updates[1] as [string, string, Record<string, string>])[2]).toMatchObject({
      ad_storage: "granted",
    });
  });

  test("lo stato è ispezionabile da console senza poterlo falsificare", async ({ page }) => {
    await page.goto("/privacy");
    // `exposeConsentApi()` la chiama un componente React: esiste dopo
    // l'idratazione, non al `load`. Leggerla subito era la stessa corsa del
    // dataLayer, e infatti questa prova era intermittente invece che rotta.
    await page.waitForFunction(() => window.bridgelabConsent !== undefined, undefined, {
      timeout: 15_000,
    });

    // Tre audit esterni hanno concluso "consenso negato per tutti" leggendo il
    // dataLayer senza cliccare. Questo dà una risposta univoca.
    expect(await page.evaluate(() => window.bridgelabConsent?.status())).toBe("pending");

    await page.getByRole("button", { name: "Accetta tutti" }).click();
    expect(await page.evaluate(() => window.bridgelabConsent?.status())).toBe("granted");
    expect(await page.evaluate(() => window.bridgelabConsent?.decidedAt())).toBeTruthy();

    // Nessun modo di concedere il consenso da codice: un metodo del genere
    // lascerebbe che uno script di terze parti autorizzi il tracciamento al
    // posto della persona.
    const metodi = await page.evaluate(() =>
      Object.keys(window.bridgelabConsent ?? {})
    );
    expect(metodi).not.toContain("grant");
    expect(metodi).not.toContain("set");
  });
});
