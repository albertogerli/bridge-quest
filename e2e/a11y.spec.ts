import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { dismissCookieBanner, login } from "./helpers";

/**
 * Audit automatico di accessibilità (rilievo perizie 2026-08: nessun audit in CI).
 *
 * Soglia: fallisce su violazioni `serious` e `critical`, più le regole di
 * `ALWAYS_BLOCKING_RULES` (già corrette: il loro ritorno è una regressione).
 * Le altre `moderate`/`minor` vengono raccolte e stampate come promemoria.
 */

const BLOCKING_IMPACTS = new Set(["serious", "critical"]);

/**
 * Regole bloccanti a prescindere dall'impatto dichiarato da axe.
 *
 * `heading-order` (su /glossario) e `page-has-heading-one` (su /lezioni, mentre
 * il catalogo carica) erano le uniche due violazioni `moderate` rimaste: sono
 * state corrette nella struttura dei titoli, e da qui in poi il loro ritorno
 * deve far fallire l'audit invece di finire in una riga di log.
 */
const ALWAYS_BLOCKING_RULES = new Set(["heading-order", "page-has-heading-one"]);

function isBlocking(violation: { id: string; impact?: string | null }): boolean {
  if (ALWAYS_BLOCKING_RULES.has(violation.id)) return true;
  return !!violation.impact && BLOCKING_IMPACTS.has(violation.impact);
}

/**
 * Regole disattivate, con motivazione. Da tenere il più corto possibile:
 * un falso positivo documentato, non una scorciatoia per non correggere.
 */
const DISABLED_RULES: { id: string; why: string }[] = [
  // Vuoto di proposito: al 2026-08 tutte le violazioni serious/critical emerse
  // sulle 4 pagine sono state corrette nel codice (contrasto dei token e delle
  // tinte badge/tab). Aggiungere una voce qui solo per falsi positivi REALI,
  // sempre con la motivazione in `why`.
];

/**
 * Le sezioni animate con motion partono da `opacity: 0` e si rivelano solo
 * quando entrano nel viewport. Se non le si scorre restano trasparenti e axe
 * ne misura il contrasto sul colore semi-trasparente → falsi positivi.
 * Qui si percorre la pagina, si torna in cima e si lascia finire l'animazione.
 */
async function settleInViewAnimations(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });

  // Attesa DETERMINISTICA: le pagine caricano i contenuti dal DB, e ogni
  // arrivo di dati rimonta le sezioni facendo ripartire le animazioni. Un
  // timeout fisso è quindi intrinsecamente instabile: si aspetta invece che
  // nessun elemento resti trasparente (axe leggerebbe contrasto ~0).
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll<HTMLElement>("body *")].every((el) => {
          const o = getComputedStyle(el).opacity;
          return o === "" || parseFloat(o) > 0.99 || el.offsetParent === null;
        }),
      undefined,
      { timeout: 15_000 }
    )
    .catch(() => {
      // Se qualcosa resta trasparente non è (solo) un problema del test:
      // l'audit prosegue e la violazione emerge con il nodo colpevole.
    });
}

async function auditPage(page: Page, path: string) {
  await page.goto(path);
  await dismissCookieBanner(page);
  // Le pagine sono client-rendered: aspetta che il main abbia contenuto.
  await page.waitForLoadState("networkidle").catch(() => {});
  await expect(page.locator("body")).not.toBeEmpty();
  await settleInViewAnimations(page);

  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "best-practice",
  ]);
  for (const rule of DISABLED_RULES) {
    builder = builder.disableRules(rule.id);
  }

  const results = await builder.analyze();

  const blocking = results.violations.filter(isBlocking);
  const informational = results.violations.filter((v) => !isBlocking(v));

  if (informational.length > 0) {
    console.log(
      `[a11y] ${path} — ${informational.length} violazioni moderate/minori (non bloccanti): ` +
        informational.map((v) => v.id).join(", ")
    );
  }

  const report = blocking
    .map(
      (v) =>
        `\n• [${v.impact ?? "n/d"}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n  nodi:\n` +
        v.nodes
          .slice(0, 5)
          .map((n) => `    - ${n.target.join(" ")}\n      ${n.failureSummary?.replace(/\n/g, "\n      ")}`)
          .join("\n")
    )
    .join("");

  expect(blocking, `Violazioni bloccanti su ${path}:${report}`).toEqual([]);
}

test.describe("audit accessibilità (axe)", () => {
  test("landing pubblica /", async ({ page }) => {
    await auditPage(page, "/");
  });

  test("glossario pubblico /glossario", async ({ page }) => {
    await auditPage(page, "/glossario");
  });

  test("percorso lezioni /lezioni (autenticato)", async ({ page }) => {
    await login(page);
    await auditPage(page, "/lezioni");
  });

  test("hub di gioco /gioca (autenticato)", async ({ page }) => {
    await login(page);
    await auditPage(page, "/gioca");
  });
});
