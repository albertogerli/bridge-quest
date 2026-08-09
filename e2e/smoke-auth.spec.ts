import { expect, test } from "@playwright/test";
import { login } from "./helpers";

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
