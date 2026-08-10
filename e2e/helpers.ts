import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Helper condivisi dagli spec E2E.
 *
 * Le credenziali arrivano da `e2e/global-setup.ts`, che crea un utente
 * usa-e-getta via service role a ogni run: i test devono quindi assumere uno
 * stato VERGINE (0 XP, nessun modulo completato, nessuna partita giocata).
 */

export interface TestCreds {
  email: string;
  password: string;
  userId?: string;
}

export function testCreds(): TestCreds {
  return JSON.parse(readFileSync(join(__dirname, ".test-user.json"), "utf8"));
}

/**
 * Il banner cookie è un overlay fisso: se resta aperto copre form e CTA.
 *
 * Si sceglie "Solo necessari" di proposito: così le prove non caricano mai
 * tracciatori pubblicitari, ed è anche il percorso che vale la pena esercitare
 * (il consenso negato è il default e non deve rompere nulla).
 */
export async function dismissCookieBanner(page: Page) {
  const cookieBtn = page.getByRole("button", { name: "Solo necessari" });
  if (await cookieBtn.isVisible().catch(() => false)) {
    await cookieBtn.click();
    await expect(cookieBtn).toBeHidden();
  }
}

/** Login via form. "Accedi" esiste sia come tab sia come submit: serve il type. */
export async function login(page: Page) {
  const { email, password } = testCreds();
  await page.goto("/login");
  await dismissCookieBanner(page);
  await page.getByPlaceholder("la-tua@email.com").fill(email);
  await page.getByPlaceholder("La tua password").fill(password);
  await page.locator('button[type="submit"]').click();
  // Il login riuscito porta fuori da /login
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
}
