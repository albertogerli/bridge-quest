import { test, expect, type Page } from "@playwright/test";
import { login, dismissCookieBanner } from "./helpers";

/**
 * Guardie di impaginazione.
 *
 * PERCHÉ ESISTONO
 * I tre difetti visivi peggiori del 13/08/2026 erano tutti di layout, e nessuno
 * dei test esistenti poteva coglierli:
 *
 *  * l'hero della landing veniva compresso da 552px a 144 perché figlio di un
 *    contenitore flex: titolo, promessa e i tre pulsanti finivano fuori dal
 *    gradiente, in bianco su fondo avorio. Invisibili per OGNI visitatore;
 *  * il bottone "Gioca" copriva l'ultima riga di contenuto su ogni schermata;
 *  * il riquadro "Rivedi la mano" tagliava via la mano di Sud senza permettere
 *    di scorrere.
 *
 * Un test su componenti React non li avrebbe presi: jsdom non calcola il
 * layout. Servono misure prese da un browser vero.
 */

/** Elementi che nascondono contenuto senza dare modo di raggiungerlo. */
async function contenutoTagliato(page: Page) {
  return page.evaluate(() => {
    const colpevoli: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const s = getComputedStyle(el);
      if (s.overflowY !== "hidden" && s.overflow !== "hidden") continue;
      if (s.display === "none" || s.visibility === "hidden") continue;
      // Troncamento VOLUTO: `line-clamp-N` e `truncate` accorciano di
      // proposito, con i puntini, e il testo completo è raggiungibile
      // altrove. Segnalarli renderebbe il controllo inutilizzabile.
      if (s.webkitLineClamp && s.webkitLineClamp !== "none") continue;
      if (s.textOverflow === "ellipsis") continue;
      // Un contenitore scorrevole non nasconde nulla: si può raggiungere.
      if (s.overflowY === "auto" || s.overflowY === "scroll") continue;
      const eccesso = el.scrollHeight - el.clientHeight;
      // 24px di tolleranza: bordi, ombre e arrotondamenti non contano.
      if (el.clientHeight > 0 && eccesso > 24) {
        const id = el.tagName.toLowerCase() +
          (el.className && typeof el.className === "string"
            ? "." + el.className.split(/\s+/).slice(0, 3).join(".")
            : "");
        colpevoli.push(`${id} — visibile ${el.clientHeight}px, contenuto ${el.scrollHeight}px`);
      }
    }
    return colpevoli;
  });
}

/** Distanza fra l'ultimo contenuto e la barra fissa in basso. */
async function fondoCoperto(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    // Se la finestra non è arrivata davvero in fondo, la pagina scorre altrove
    // (contenitore interno) e la misura non significa nulla: a metà pagina un
    // comando flottante copre per forza qualcosa, ed è il suo mestiere.
    const inFondo =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (!inFondo) return null;

    // Di elementi con questa etichetta ce n'è più d'uno — la barra in basso e
    // la navigazione laterale, che a 390px di larghezza è ridotta a un
    // rettangolo 0×0. Prendere il primo che capita significava misurare
    // rispetto a un rettangolo alto zero, con la soglia a y=0: da lì venivano
    // le segnalazioni su testi che stavano benissimo dov'erano.
    // Il pulsante «Gioca» galleggia sopra la barra ma non le appartiene: al
    // centro della barra è LUI che si vede. Per chi legge sono la stessa cosa.
    const barra = [
      ...Array.from(document.querySelectorAll('nav[aria-label="Navigazione principale"]')),
      ...Array.from(document.querySelectorAll('a[aria-label="Gioca"]')),
    ].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.height > 0 && r.width > 0;
    });
    if (barra.length === 0) return null;
    const nav = barra[0];

    // Confrontare i rettangoli non basta e dà falsi allarmi: il riquadro della
    // barra comprende margini e sfocature trasparenti, e sotto ci si legge
    // benissimo. L'unica domanda che conta è «in quel punto, chi si vede?», e
    // a rispondere è il browser.
    const copertoIn = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) return false;
      const sopra = document.elementFromPoint(x, y);
      return sopra !== null && barra.some((b) => b === sopra || b.contains(sopra));
    };

    // Autocontrollo: al centro della barra la risposta DEVE essere «coperto».
    // Senza, una barra trasparente agli eventi renderebbe muto il test e le
    // pagine passerebbero tutte per il motivo sbagliato.
    const rn = nav.getBoundingClientRect();
    if (!copertoIn((rn.left + rn.right) / 2, (rn.top + rn.bottom) / 2)) {
      return "CONTROLLO GUASTO: la barra non risulta sopra nulla, la misura non vale";
    }

    let peggiore: string | null = null;
    const main = document.querySelector("#main-content");
    if (!main) return null;
    for (const el of Array.from(main.querySelectorAll("h1,h2,h3,p,button,a,li,span"))) {
      // Solo elementi FOGLIA: il riquadro che contiene una piastrella può
      // sporgere di qualche pixel sotto un comando flottante senza che nulla
      // di leggibile venga nascosto. Conta il testo, non i contenitori.
      if (el.children.length > 0) continue;
      // La barra non copre se stessa: se il pulsante «Gioca» vive dentro il
      // contenuto, le sue etichette non sono contenuto nascosto.
      if (barra.some((b) => b.contains(el))) continue;
      const r = el.getBoundingClientRect();
      const testo = (el.textContent ?? "").trim();
      if (!testo || r.height === 0 || r.width === 0) continue;
      // Si campiona il bordo inferiore del testo, dov'è più facile finire
      // sotto la barra, in tre punti: un testo lungo può essere coperto solo
      // da un lato.
      const y = r.bottom - 2;
      const punti = [r.left + 2, (r.left + r.right) / 2, r.right - 2];
      if (punti.some((x) => copertoIn(x, y))) {
        peggiore = `«${testo.slice(0, 40)}» è nascosto dalla barra di navigazione`;
      }
    }
    return peggiore;
  });
}

const PAGINE_PUBBLICHE = ["/", "/glossario", "/privacy"];
const PAGINE_PRIVATE = ["/gioca", "/lezioni", "/profilo", "/classifica", "/amici"];

test.describe("impaginazione — niente contenuto nascosto", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const url of PAGINE_PUBBLICHE) {
    test(`${url}: nessun contenitore taglia il proprio contenuto`, async ({ page }) => {
      await page.goto(url);
      await dismissCookieBanner(page);
      await page.waitForTimeout(2000);
      expect(
        await contenutoTagliato(page),
        "Un contenitore con overflow:hidden più basso del suo contenuto nasconde " +
          "testo senza dare modo di raggiungerlo. È il difetto che rendeva " +
          "invisibile l'intero hero della landing."
      ).toEqual([]);
    });
  }

  test("pagine autenticate: nessun contenuto tagliato né coperto dalla barra", async ({ page }) => {
    test.setTimeout(180_000);
    await login(page);
    for (const url of PAGINE_PRIVATE) {
      await page.goto(url);
      await page.waitForTimeout(2200);

      expect(await contenutoTagliato(page), `${url}: contenuto tagliato`).toEqual([]);
      expect(
        await fondoCoperto(page),
        `${url}: la barra di navigazione copre l'ultima riga di contenuto`
      ).toBeNull();
    }
  });
});
