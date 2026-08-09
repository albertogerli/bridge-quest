import { expect, test } from "@playwright/test";

test.describe("visitatore non autenticato", () => {
  test("la landing si carica con il brand e la CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/BridgeLab/i, { timeout: 20_000 });
    await expect(page.getByRole("link", { name: /login|accedi|inizia|registrati/i }).first()).toBeVisible();
  });

  test("il glossario (SSR pubblico) mostra i termini", async ({ page }) => {
    await page.goto("/glossario");
    await expect(page.locator("body")).toContainText(/glossario/i, { timeout: 20_000 });
  });

  test("l'area admin non è raggiungibile", async ({ page }) => {
    await page.goto("/admin");
    // Il proxy/layout server reindirizza al login (o alla home)
    await page.waitForURL(/\/(login|$)/, { timeout: 20_000 });
    expect(page.url()).not.toContain("/admin");
  });
});
