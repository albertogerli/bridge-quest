import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

/**
 * Rete di sicurezza sulla Content-Security-Policy.
 *
 * Una CSP sbagliata non fa fallire i test unitari: fa fallire il *browser*, in
 * silenzio (gli script vengono bloccati e la pagina resta un guscio non
 * idratato). Questi test guardano quindi l'esecuzione reale, non il codice.
 *
 * Servono soprattutto PRIMA di toccare la CSP: vedi il commento in `next.config.ts` per
 * l'analisi del passaggio a una CSP con nonce (valutato e non adottato,
 * costerebbe il prerendering di 53 rotte). Se un domani si adotta il nonce,
 * questi test sono il cancello che dimostra che nulla si è rotto: passano
 * inalterati sia con la CSP attuale sia con quella a nonce.
 */

interface CspViolation {
  directive: string;
  blockedURI: string;
  sample: string;
}

declare global {
  interface Window {
    __cspViolations?: CspViolation[];
  }
}

/**
 * Registra il collettore PRIMA di qualsiasi script di pagina (addInitScript),
 * altrimenti le violazioni del `<head>` — proprio quelle che ci interessano,
 * come lo script inline del tema — sarebbero già passate.
 */
async function collectCspViolations(page: Page) {
  const consoleMessages: string[] = [];

  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__cspViolations?.push({
        directive: e.violatedDirective,
        blockedURI: e.blockedURI,
        sample: e.sample,
      });
    });
  });

  page.on("console", (msg) => {
    const text = msg.text();
    if (/content security policy|refused to (execute|load|connect|apply)/i.test(text)) {
      consoleMessages.push(text);
    }
  });

  return {
    async result() {
      const violations = (await page.evaluate(() => window.__cspViolations ?? [])) ?? [];
      return { violations, consoleMessages };
    },
  };
}

function formatViolations(
  violations: CspViolation[],
  consoleMessages: string[]
): string {
  const lines = [
    ...violations.map(
      (v) => `  [${v.directive}] blocked=${v.blockedURI} sample=${v.sample || "-"}`
    ),
    ...consoleMessages.map((m) => `  [console] ${m}`),
  ];
  return lines.join("\n");
}

/** Le pagine si idratano solo se gli script NON sono stati bloccati. */
async function expectNoCspViolations(page: Page, collector: { result: () => Promise<{ violations: CspViolation[]; consoleMessages: string[] }> }) {
  // Lascia partire anche gli script "afterInteractive" (gtag, analytics).
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2_000);

  const { violations, consoleMessages } = await collector.result();
  expect(
    violations.length + consoleMessages.length,
    `Violazioni CSP rilevate:\n${formatViolations(violations, consoleMessages)}`
  ).toBe(0);
}

test.describe("Content-Security-Policy", () => {
  test("nessuna violazione CSP sulla landing pubblica", async ({ page }) => {
    const collector = await collectCspViolations(page);
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/BridgeLab/i, { timeout: 20_000 });
    await expectNoCspViolations(page, collector);
  });

  test("nessuna violazione CSP sul login", async ({ page }) => {
    const collector = await collectCspViolations(page);
    await page.goto("/login");
    await expect(page.getByPlaceholder("la-tua@email.com")).toBeVisible({
      timeout: 20_000,
    });
    await expectNoCspViolations(page, collector);
  });

  test("nessuna violazione CSP su una pagina autenticata", async ({ page }) => {
    const collector = await collectCspViolations(page);
    await login(page);
    await page.goto("/gioca");
    await expect(page.locator("body")).toContainText(/gioca|smazzata|sfida/i, {
      timeout: 20_000,
    });
    await expectNoCspViolations(page, collector);
  });

  test("l'header CSP è servito e lo script del tema gira davvero", async ({ page }) => {
    const response = await page.goto("/login");
    const csp = response?.headers()["content-security-policy"];
    expect(csp, "header Content-Security-Policy assente").toBeTruthy();

    const scriptSrc = csp!
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("script-src"));
    expect(scriptSrc, "direttiva script-src assente").toBeTruthy();

    // Se/quando si passerà alla CSP con nonce, questi due invarianti devono
    // valere insieme: niente 'unsafe-inline' e un nonce diverso a ogni
    // richiesta. Finché la policy usa 'unsafe-inline' il controllo del nonce
    // non si applica (vedi il commento in next.config.ts).
    if (scriptSrc!.includes("'nonce-")) {
      expect(scriptSrc).not.toContain("'unsafe-inline'");

      const second = await page.context().request.get("/login");
      const secondCsp = second.headers()["content-security-policy"] ?? "";
      const nonceOf = (value: string) => value.match(/'nonce-([^']+)'/)?.[1];
      expect(nonceOf(csp!), "nonce non presente").toBeTruthy();
      expect(
        nonceOf(secondCsp),
        "il nonce deve cambiare a ogni richiesta"
      ).not.toBe(nonceOf(csp!));
    }

    // Anti-flash: lo script inline del tema deve poter girare prima del paint.
    await page.evaluate(() => localStorage.setItem("bq_theme", "dark"));
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
