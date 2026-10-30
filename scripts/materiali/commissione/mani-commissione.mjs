/**
 * Le smazzate delle lezioni della Commissione che nel catalogo non ci sono.
 *
 * Il corso 2026 della Commissione (zip mandato da Trevissoi il 27/10/2026) ha
 * dieci lezioni da otto smazzate. Quelle delle lezioni 01, 02, 04, 05, 08 e 09
 * sono già nel database (lezioni BridgeLab 1, 3, 2, 4, 5, 6, con il commento);
 * le 32 delle lezioni 03, 06, 07 e 10 no, e la Commissione le dà senza
 * commento, solo con il contratto.
 *
 * Diventano file PBN in `public/materiali/gioco-della-carta/`, che
 * l'insegnante aggiunge a un compito da «Nuovo compito». Il PBN è il formato
 * che la pagina sa già leggere; il LIN il sito lo sa solo scrivere.
 *
 *   node scripts/materiali/commissione/mani-commissione.mjs <cartella «Corso fiori 2026»>
 *
 * Si ferma se una mano non ha 13 carte, se una carta compare due volte o se
 * un contratto, con il miglior gioco di tutti, va sotto di tre prese o più:
 * vorrebbe dire che il contratto è stato trascritto male (seme o giocante).
 * Una o due prese sotto in double dummy sono normali nelle mani didattiche:
 * un'impasse che va male, una difesa che vede tutte le carte.
 */
import fs from "node:fs";
import path from "node:path";
import { loadDds, Dds } from "../../dds.mjs";

const LEZIONI = [
  { num: "03", file: "mani-introduzione-del-morto.pbn", titolo: "Introduzione del morto",
    contratti: ["3NT N", "6NT E", "3NT S", "3NT W", "3NT N", "3NT E", "3NT S", "3NT W"] },
  { num: "06", file: "mani-piano-di-gioco-a-senza-atout-2.pbn", titolo: "Il piano di gioco a senz'atout (2)",
    contratti: ["6NT N", "7NT E", "3NT S", "3NT W", "6NT N", "3NT E", "3NT S", "6NT W"] },
  { num: "07", file: "mani-tutoraggio-gioco-a-senza.pbn", titolo: "Tutoraggio: il gioco a senz'atout",
    contratti: ["5NT N", "3NT E", "3NT S", "3NT W", "1NT N", "1NT E", "6NT S", "1NT W"] },
  // Nei PDF i semi sono in italiano: P picche, C cuori, Q quadri, F fiori.
  { num: "10", file: "mani-tutoraggio-senza-e-atout.pbn", titolo: "Tutoraggio: a senz'atout e ad atout",
    contratti: ["3NT N", "3D E", "4S S", "2H W", "4S N", "4S E", "6S S", "6H W"] },
];

const radice = process.argv[2];
if (!radice) throw new Error("Manca la cartella «Corso fiori 2026»");
const uscita = path.resolve(import.meta.dirname, "../../../public/materiali/gioco-della-carta");
const dds = new Dds(await loadDds());

// LIN: md|<mazziere 1=S 2=W 3=N 4=E><S>,<W>,<N>[,<E>]|  sv|o/n/e/b|
const MAZZIERE = { 1: "S", 2: "W", 3: "N", 4: "E" };
const ZONA = { o: "None", n: "NS", e: "EW", b: "All", "0": "None" };
const SEMI = "SHDC";
const RANGHI = "AKQJT98765432";

function manoDaLin(s) {
  const semi = { S: "", H: "", D: "", C: "" };
  let seme = null;
  for (const ch of s) {
    if (SEMI.includes(ch)) seme = ch;
    else semi[seme] += ch;
  }
  for (const k of SEMI) semi[k] = [...semi[k]].sort((a, b) => RANGHI.indexOf(a) - RANGHI.indexOf(b)).join("");
  return semi;
}

function quartaMano(mani) {
  const viste = new Set(mani.flatMap((m) => SEMI.split("").flatMap((k) => [...m[k]].map((r) => k + r))));
  const semi = { S: "", H: "", D: "", C: "" };
  for (const k of SEMI) for (const r of RANGHI) if (!viste.has(k + r)) semi[k] += r;
  return semi;
}

const pbnMano = (m) => SEMI.split("").map((k) => m[k]).join(".");

for (const lez of LEZIONI) {
  const cartella = fs.readdirSync(radice).find((d) => d.startsWith(`Lezione ${lez.num} `));
  const lin = fs.readdirSync(path.join(radice, cartella)).find((f) => /\.lin$/i.test(f));
  const testo = fs.readFileSync(path.join(radice, cartella, lin), "latin1");
  const board = [...testo.matchAll(/md\|(\d)([^|]*)\|.*?sv\|(\w)\|/gs)];
  if (board.length !== 8) throw new Error(`Lezione ${lez.num}: ${board.length} smazzate, attese 8`);

  const righe = [`% ${lez.titolo} — Commissione Insegnamento FIGB, corso di Primo Livello 2026`, ""];
  board.forEach(([, mazz, mani, sv], i) => {
    const [s, w, n, e] = mani.split(",").map(manoDaLin);
    const tutte = { S: s, W: w, N: n, E: e ?? quartaMano([s, w, n]) };
    const carte = Object.values(tutte).flatMap((m) => SEMI.split("").flatMap((k) => [...m[k]].map((r) => k + r)));
    if (carte.length !== 52 || new Set(carte).size !== 52) throw new Error(`Lezione ${lez.num} board ${i + 1}: carte sbagliate`);

    const [contratto, giocante] = lez.contratti[i].split(" ");
    const deal = `N:${["N", "E", "S", "W"].map((p) => pbnMano(tutte[p])).join(" ")}`;
    const tavola = dds.CalcDDTablePBN({ cards: deal }).resTable;
    const strain = ["S", "H", "D", "C", "NT"].indexOf(contratto.slice(1));
    const prese = tavola[strain]["NESW".indexOf(giocante)];
    const servono = Number(contratto[0]) + 6;
    console.log(`${lez.num}/${i + 1} ${contratto} ${giocante}: ${prese} prese DD (${prese - servono >= 0 ? "+" : ""}${prese - servono})`);
    if (prese < servono - 2) throw new Error(`Lezione ${lez.num} board ${i + 1}: ${contratto} ${giocante} fa solo ${prese} prese`);

    righe.push(
      `[Event "${lez.titolo}"]`,
      `[Board "${i + 1}"]`,
      `[Dealer "${MAZZIERE[mazz]}"]`,
      `[Vulnerable "${ZONA[sv.toLowerCase()]}"]`,
      `[Deal "${deal}"]`,
      `[Declarer "${giocante}"]`,
      `[Contract "${contratto}"]`,
      "",
    );
  });
  fs.writeFileSync(path.join(uscita, lez.file), righe.join("\n"));
}
