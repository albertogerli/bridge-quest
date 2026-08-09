import { defineConfig } from "@playwright/test";

/**
 * E2E smoke suite (rilievo perizie 2026-08: zero test end-to-end).
 *
 * Esecuzione locale: `npm run test:e2e` — avvia il dev server da solo e crea
 * un utente di test usa-e-getta via service role (vedi e2e/global-setup.ts),
 * eliminato a fine run. Richiede `.env.local` completo.
 * Non gira in CI (servirebbero i secret Supabase nel repo GitHub).
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  timeout: 60_000,
  retries: 1,
  workers: 1, // il dev server locale non gradisce il parallelismo
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
