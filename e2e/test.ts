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
export const test = base.extend<{ isolatedAnalytics: void; diagnosiPagina: void }>({
  isolatedAnalytics: [async ({ context }, use) => {
    await context.route('https://www.googletagmanager.com/gtag/js?*', route =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* isolated analytics fixture */' })
    );
    await use();
  }, { auto: true }],

  /**
   * Quello che la traccia non dice: una finestra di dialogo, una pagina che
   * crolla, un errore non gestito. Il 13/10/2026 le notturne hanno visto
   * navigazioni che non partivano affatto — nessuna richiesta in rete — e la
   * traccia non bastava a dire perché. Le righe finiscono nel log del passo.
   *
   * Il dialogo si chiude come farebbe Playwright da solo (dismiss): un
   * ascoltatore che non lo chiudesse bloccherebbe la pagina.
   */
  diagnosiPagina: [async ({ context }, use, info) => {
    const etichetta = `[diagnosi] ${info.title}:`;
    const segui = (p: import('@playwright/test').Page) => {
      p.on('dialog', d => {
        console.log(`${etichetta} dialogo ${d.type()} «${d.message()}» su ${p.url()}`);
        void d.dismiss().catch(() => {});
      });
      p.on('crash', () => console.log(`${etichetta} la pagina è crollata su ${p.url()}`));
      p.on('pageerror', e => console.log(`${etichetta} errore in pagina: ${e.message.slice(0, 300)}`));
    };
    context.pages().forEach(segui);
    context.on('page', segui);
    await use();
  }, { auto: true }],
});
