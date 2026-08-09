import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function testCreds(): { email: string; password: string } {
  return JSON.parse(readFileSync(join(__dirname, ".test-user.json"), "utf8"));
}

async function login(page: Page) {
  const { email, password } = testCreds();
  await page.goto("/login");
  // Il banner cookie copre il form al primo accesso
  const cookieBtn = page.getByRole("button", { name: "Accetta" });
  if (await cookieBtn.isVisible().catch(() => false)) {
    await cookieBtn.click();
  }
  await page.getByPlaceholder("la-tua@email.com").fill(email);
  await page.getByPlaceholder("La tua password").fill(password);
  // "Accedi" compare sia come tab sia come submit: serve il type
  await page.locator('button[type="submit"]').click();
  // Il login riuscito porta fuori da /login
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
}

test.describe("utente autenticato", () => {
  test("login → home con navigazione principale", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("link", { name: "Gioca" }).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("la pagina corsi/lezioni si apre", async ({ page }) => {
    await login(page);
    await page.goto("/lezioni");
    await expect(page.locator("body")).toContainText(/corso|lezion/i, { timeout: 20_000 });
  });

  test("l'hub di gioco si apre", async ({ page }) => {
    await login(page);
    await page.goto("/gioca");
    await expect(page.locator("body")).toContainText(/gioca|smazzata|sfida/i, {
      timeout: 20_000,
    });
  });
});
