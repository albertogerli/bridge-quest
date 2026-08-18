/**
 * Avvolge in `t("…")` i testi italiani di un file, e aggiunge quel che serve
 * perché `t` esista.
 *
 *   node scripts/avvolgi-stringhe.mjs src/app/gioca/licita/page.tsx     # prova
 *   node scripts/avvolgi-stringhe.mjs --scrivi src/components/bridge    # esegue
 *
 * PERCHÉ UNO STRUMENTO E NON LE MANI. Restano circa millequattrocento stringhe
 * in duecento file: fatto a mano è lavoro in cui si sbaglia per stanchezza, e
 * gli errori sono silenziosi — un `>` spostato non rompe la compilazione,
 * rompe una pagina. Qui la trasformazione è una sola, applicata sempre uguale,
 * e quello che non è sicuro NON viene toccato.
 *
 * COSA TOCCA, e solo questo:
 *   - il testo fra due tag sulla stessa riga: `<p>Ciao</p>`;
 *   - se comincia per maiuscola o accento, perché le sigle e i simboli no;
 *   - se non contiene `{`, `}`, `&`: espressioni ed entità JSX vanno fatte a
 *     mano, sono il posto dove un'automazione fa danni.
 *
 * COSA NON TOCCA MAI:
 *   - i file senza `"use client"`: `useT` è un hook, in un componente server
 *     non gira e la pagina esplode;
 *   - gli attributi (`aria-label`, `title`, `placeholder`): vanno tradotti
 *     anche quelli, ma uno per uno — un `aria-label` sbagliato non si vede;
 *   - i file di prova e i motori in `src/lib`, che non parlano all'utente.
 *
 * `t` viene inserita in OGNI componente del file che ne ha bisogno, non solo
 * nel primo: un file con tre componenti e una sola `t` compila e poi fallisce
 * a schermo, che è il modo peggiore di sbagliare.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const SCRIVI = args.includes("--scrivi");
const BERSAGLI = args.filter((a) => !a.startsWith("--"));

if (!BERSAGLI.length) {
  console.error("Serve almeno un file o una cartella. Vedi l'intestazione.");
  process.exit(1);
}

/** Testo fra tag, su una riga, che vale la pena tradurre. */
const TESTO = />(\s*)([A-ZÀ-Ù][^<>{}\n&]{3,160}?)(\s*)</g;

/**
 * Gli attributi che l'utente legge o SENTE.
 *
 * `aria-label` e `alt` non si vedono a schermo, e per questo si dimenticano:
 * ma sono esattamente ciò che arriva a chi naviga con un lettore di schermo.
 * Un sito tradotto che li lascia in italiano dice «Learn» a chi guarda e
 * «Impara» a chi ascolta — la traduzione peggiore, perché sembra completa.
 *
 * `title` e `placeholder` invece si vedono eccome.
 */
const ATTRIBUTI = /\b(placeholder|title|aria-label|alt)="([A-ZÀ-Ù][^"{}]{3,160}?)"/g;

function elencaFile(percorso) {
  // Un percorso che non c'è si salta con un avviso: passare più cartelle in
  // una volta è il modo normale di usarlo, e una sola sbagliata non deve far
  // cadere tutto il giro.
  if (!existsSync(percorso)) {
    console.log(`(salto ${percorso}: non esiste)`);
    return [];
  }
  if (statSync(percorso).isFile()) return [percorso];
  const trovati = [];
  const cammina = (d) => {
    for (const v of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, v.name);
      // `components/ui` è la libreria shadcn, non roba nostra: il suo «Close»
      // non è testo di BridgeLab, e tradurlo lì dentro significa mettere le
      // mani in casa d'altri — si perde al primo aggiornamento del pacchetto.
      if (v.isDirectory()) {
        if (!/\/components\/ui$/.test(p)) cammina(p);
        continue;
      }
      if (/\.tsx$/.test(v.name) && !/\.test\.tsx$/.test(v.name)) trovati.push(p);
    }
  };
  cammina(percorso);
  return trovati;
}

/**
 * Inserisce `const t = useT();` all'inizio di ogni componente che contiene una
 * `t("…")` e non ha già la dichiarazione.
 *
 * Si riconosce un componente dal nome che comincia per maiuscola: è la regola
 * di React, e vale anche per chi legge.
 */
function dichiaraT(testo) {
  /**
   * Dove comincia il corpo di una funzione.
   *
   * Non si può cercare `function Nome(...)` con un'espressione regolare: i
   * parametri sono tipizzati e i tipi contengono parentesi — `onDichiara: (d:
   * string) => void` — così `[^)]*` si ferma alla prima chiusura sbagliata e
   * il componente non viene riconosciuto. Il risultato è una `t` usata dove
   * non è dichiarata: compila male e si scopre solo dal messaggio del
   * compilatore, o peggio a schermo. Qui le parentesi si contano davvero.
   */
  const corpoDa = (da) => {
    let i = testo.indexOf("(", da);
    if (i < 0) return -1;
    let livello = 0;
    for (; i < testo.length; i++) {
      if (testo[i] === "(") livello++;
      else if (testo[i] === ")") {
        livello--;
        if (livello === 0) break;
      }
    }
    const graffa = testo.indexOf("{", i);
    return graffa < 0 ? -1 : graffa + 1;
  };

  const nomi = /(?:export\s+(?:default\s+)?)?function\s+([A-Z]\w*)/g;
  const inizi = [];
  for (const m of testo.matchAll(nomi)) {
    const da = corpoDa(m.index);
    if (da > 0) inizi.push({ da, nome: m[1] });
  }
  if (!inizi.length) return { testo, aggiunte: 0 };

  // Dal fondo verso l'inizio: inserire sposta gli indici di tutto ciò che segue.
  let risultato = testo;
  let aggiunte = 0;
  for (let i = inizi.length - 1; i >= 0; i--) {
    const { da } = inizi[i];
    const fine = i + 1 < inizi.length ? inizi[i + 1].da : risultato.length;
    const corpo = risultato.slice(da, fine);
    if (!/\bt\(\s*["\'`]/.test(corpo)) continue; // qui `t` non serve
    if (/const\s+t\s*=\s*useT\(\)/.test(corpo)) continue; // c'è già
    risultato = risultato.slice(0, da) + "\n  const t = useT();" + risultato.slice(da);
    aggiunte++;
  }
  return { testo: risultato, aggiunte };
}

let fileToccati = 0;
let fraseTotali = 0;
const nonClient = [];

for (const bersaglio of BERSAGLI) {
  for (const file of elencaFile(bersaglio)) {
    const originale = readFileSync(file, "utf8");

    if (!/^["']use client["']/m.test(originale)) {
      if (TESTO.test(originale)) nonClient.push(file);
      TESTO.lastIndex = 0;
      continue;
    }

    let frasi = 0;
    let convertito = originale.replace(ATTRIBUTI, (intero, attributo, frase) => {
      const pulita = frase.trim();
      if (!/[a-zà-ù]/.test(pulita)) return intero;
      // Il nome del prodotto resta il nome del prodotto, in ogni lingua.
      if (/^(BridgeLab|Bridge LAB|FIGB|CONI)$/.test(pulita)) return intero;
      frasi++;
      return `${attributo}={t("${pulita.replace(/"/g, '\\"')}")}`;
    });

    convertito = convertito.replace(TESTO, (intero, pre, frase, post) => {
      const pulita = frase.trim();
      // Un testo di sole cifre, simboli o una parola sola maiuscola (sigle
      // come «IMP», «FIGB») non è una frase da tradurre.
      if (!/[a-zà-ù]/.test(pulita)) return intero;
      frasi++;
      return `>${pre}{t("${pulita.replace(/"/g, '\\"')}")}${post}<`;
    });

    if (!frasi) continue;

    const conT = dichiaraT(convertito);
    convertito = conT.testo;

    if (!/from "@\/contexts\/traduzioni-provider"/.test(convertito)) {
      // L'import va DOPO l'ultimo import completo, e gli import possono
      // occupare più righe: `^import .*$` ne prende solo la prima, e la riga
      // nuova finisce in mezzo a una graffa aperta — un file che non compila
      // più (successo su `asta.tsx`). Serve un'espressione che arrivi fino al
      // `from "…";` di chiusura.
      const ultimoImport = [
        ...convertito.matchAll(/^import[\s\S]*?from\s+["'][^"']+["'];/gm),
      ].pop();
      if (ultimoImport) {
        const p = ultimoImport.index + ultimoImport[0].length;
        convertito =
          convertito.slice(0, p) +
          '\nimport { useT } from "@/contexts/traduzioni-provider";' +
          convertito.slice(p);
      }
    }

    fileToccati++;
    fraseTotali += frasi;
    console.log(`${frasi.toString().padStart(4)} frasi  ${file.replace(/.*\/src\//, "src/")}`);
    if (SCRIVI) writeFileSync(file, convertito);
  }
}

console.log(`\n${fraseTotali} frasi in ${fileToccati} file${SCRIVI ? " — scritte" : " (prova: niente è stato scritto)"}`);
if (nonClient.length) {
  console.log(
    `\n${nonClient.length} file con testo ma SENZA "use client": vanno fatti a mano,\n` +
      "perché `useT` è un hook e in un componente server non gira."
  );
  for (const f of nonClient.slice(0, 8)) console.log(`  ${f.replace(/.*\/src\//, "src/")}`);
}
