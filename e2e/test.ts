import { test as base } from '@playwright/test';

export { expect, type Page, type Locator } from '@playwright/test';

// Exercise the real inline dataLayer and consent integration without depending
// on Google's network or sending synthetic visits to production analytics.
// Application/API requests remain real and their failures remain visible.
/**
 * ATTENZIONE, UNA TRAPPOLA CHE SI PAGA SOLO DI NOTTE.
 *
 * Playwright NON intercetta le richieste che partono da un SERVICE WORKER:
 * `page.route`/`context.route` vedono quelle della pagina, non quelle del
 * worker. `next.config.ts` spegne Serwist in sviluppo, quindi in locale non
 * si nota; le notturne però girano su una build di produzione (`next start`,
 * dal 23/09/2026) e lì il worker è acceso.
 *
 * È già successo: `regressione-pagine.spec.ts` abortiva la fetch delle
 * smazzate e se le vedeva arrivare lo stesso — nella traccia si vede la
 * richiesta abortita della pagina e, TRE MILLISECONDI DOPO, la stessa
 * richiesta senza `pageref`, cioè quella del worker, con dentro i 549 kB.
 *
 * Chi scrive una prova che intercetta la rete metta `test.use({
 * serviceWorkers: "block" })`, o si prepari a un fallimento che in locale
 * non riesce a riprodurre.
 */
export const test = base.extend<{ isolatedAnalytics: void }>({
  isolatedAnalytics: [async ({ context }, use) => {
    await context.route('https://www.googletagmanager.com/gtag/js?*', route =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* isolated analytics fixture */' })
    );
    await use();
  }, { auto: true }],
});
