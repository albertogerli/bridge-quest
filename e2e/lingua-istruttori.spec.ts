import { expect, test } from "./test";
import { login } from "./helpers";
import { comeInsegnante } from "./ruolo";

let ripristina: (() => Promise<void>) | undefined;
test.beforeAll(async () => {
  ripristina = await comeInsegnante();
});
test.afterAll(async () => {
  await ripristina?.();
});

/**
 * Le pagine dell'insegnante sotto `/en`.
 *
 * PERCHÉ NON BASTA IL CONTROLLO SUL DIZIONARIO. `stringhe-da-tradurre.mjs
 * --controlla` verifica che ogni frase passata da `t()` abbia il suo inglese, e
 * quello è il gate della CI. Ma non vede le frasi che da `t()` non passano
 * affatto: quelle restano italiane sotto `/en` senza rompere niente, e nessun
 * controllo statico se ne accorge.
 *
 * Il 20/08/2026 questo test ha trovato «Divisioni dei semi» in inglese sulla
 * lavagna: era dentro un ternario, e lo strumento che avvolge i testi i
 * ternari non li tocca — apposta, perché lì un'automazione fa danni. Sono
 * proprio quelli che sfuggono, ed è per questo che il controllo va fatto a
 * schermo.
 */
test("le pagine dell'insegnante parlano inglese sotto /en", async ({ page }) => {
  await login(page);
  for (const [percorso, atteso] of [
    ["/en/istruttori/lavagna", "Minibridge"],
    ["/en/istruttori/combinazione", "Card combinations"],
    ["/en/istruttori/libreria", "Library"],
  ] as const) {
    await page.goto(percorso);
    await page.waitForTimeout(2500);
    const testo = await page.locator("body").innerText();
    console.log(`${percorso}: ${testo.includes(atteso) ? "OK" : "MANCA"} «${atteso}»`);
    expect(testo, percorso).toContain(atteso);
    // E non deve restare italiano visibile fra i comandi nuovi.
    for (const italiano of ["Divisioni dei semi", "Le classiche, già pronte", "Cerca per titolo"]) {
      expect(testo, `${percorso} contiene ancora «${italiano}»`).not.toContain(italiano);
    }
  }
});

/**
 * Le pagine rese sul SERVER.
 *
 * Sono il caso che nessun controllo vedeva: `useT()` è un hook e lì non gira,
 * e il server l'indirizzo con `/en` non lo vede nemmeno, perché è una
 * riscrittura. Restavano italiane senza che niente lo segnalasse — la
 * dichiarazione di accessibilità sono quarantatré frasi.
 *
 * Ora la lingua arriva da un'intestazione messa dal proxy. Questo test la prova
 * dove conta: nell'HTML che esce dal server, non dopo che il client si è
 * montato.
 */
test("le pagine rese sul server cambiano lingua", async ({ request }) => {
  const italiano = await (await request.get("/accessibilita")).text();
  expect(italiano).toContain("Dichiarazione di Accessibilit\u00e0");
  expect(italiano).toContain("Standard di riferimento");

  const inglese = await (await request.get("/en/accessibilita")).text();
  expect(inglese).toContain("Accessibility Statement");
  expect(inglese).toContain("Standards we follow");
  // E non deve restare italiano: è il modo in cui il difetto si ripresenterebbe.
  expect(inglese).not.toContain("Standard di riferimento");
  expect(inglese).not.toContain("Misure di accessibilit\u00e0 adottate");
});
