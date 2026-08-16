import { defineConfig } from "@playwright/test";

/**
 * E2E smoke suite (rilievo perizie 2026-08: zero test end-to-end).
 *
 * Esecuzione locale: `npm run test:e2e` — avvia il dev server da solo e crea
 * un utente di test usa-e-getta via service role (vedi e2e/global-setup.ts),
 * eliminato a fine run. Le chiavi arrivano dall'ambiente o da `.env.local`
 * (vedi `e2e/env.ts`).
 *
 * Gira anche di notte su GitHub, nell'ambiente protetto `verifiche`.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  timeout: 60_000,
  retries: 1,
  workers: 1, // il dev server locale non gradisce il parallelismo
  // In CI il reporter predefinito è `dot`, che non scrive niente su disco: il
  // workflow caricava una cartella `playwright-report/` che non esisteva, e il
  // passo di upload passava lo stesso. Di un fallimento notturno restava così
  // solo la riga di log — non la traccia, non il DOM, non lo screenshot, cioè
  // proprio le cose che servono quando non puoi riprodurlo in locale (successo
  // il 16/08/2026 con `/profilo`). Il referto va scritto sempre.
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["list"]]
    : [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
