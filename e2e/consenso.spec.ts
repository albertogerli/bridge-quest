import { test, expect, type Page } from "@playwright/test";

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

test.describe("consenso cookie e Consent Mode v2", () => {
  test("il default nega tutto prima di qualsiasi scelta", async ({ page }) => {
    await page.goto("/");
    const def = find(await dataLayer(page), "default") as
      | [string, string, Record<string, string>]
      | undefined;

    expect(def, "manca gtag('consent','default')").toBeTruthy();
    // Tutte e quattro le categorie: dimenticarne una la lascerebbe attiva
    // senza che nessuno l'abbia autorizzata.
    expect(def![2]).toMatchObject({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  });

  test("prima di scegliere non esiste alcun aggiornamento", async ({ page }) => {
    await page.goto("/");
    expect(find(await dataLayer(page), "update")).toBeUndefined();
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
    const entries = await dataLayer(page);
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
});
