/**
 * Le smazzate delle lezioni 17 e 18 del programma, che la Commissione ha
 * lasciato «da generare BridgeLab» (Trevissoi, 03/11/2026):
 *
 *   17 · Sviluppo delle aperture di 1 a colore
 *   18 · Apertura di 2♣, sottoaperture e richiesta d'assi
 *
 * Otto mani per lezione, una per sequenza da insegnare. Per ognuna: i vincoli
 * delle quattro mani, la licita, il contratto e un commento che racconta la
 * licita con i punti e le lunghezze della mano vera.
 *
 * IL CONTRATTO SI VERIFICA A CARTE SCOPERTE. Una mano si tiene solo se il
 * contratto della licita mantiene con il miglior gioco di tutti, e se non
 * rende ridicola la licita: un parziale che fa la manche, una manche che fa
 * lo slam, il «5♥ fermato dalla Blackwood» che fa lo slam lo stesso, non
 * insegnano niente. Gli avversari passano sempre: niente mani da intervento.
 *
 *   node scripts/materiali/programma/mani-17-18.mjs
 *
 * Lo stesso seme dà sempre le stesse mani. Scrive in public/materiali/programma/.
 */
import fs from "node:fs";
import path from "node:path";
import { loadDds, Dds } from "../../dds.mjs";

const uscita = path.resolve(import.meta.dirname, "../../../public/materiali/programma");
fs.mkdirSync(uscita, { recursive: true });
const dds = new Dds(await loadDds());

// ── Carte e mani ─────────────────────────────────────────────────────────────
const SEMI = ["S", "H", "D", "C"];
const RANGHI = "AKQJT98765432";
const POSTI = ["N", "E", "S", "W"];
const NOME = { N: "Nord", E: "Est", S: "Sud", W: "Ovest" };
const SIMBOLO = { S: "♠", H: "♥", D: "♦", C: "♣", NT: "SA" };
const PUNTI = { A: 4, K: 3, Q: 2, J: 1 };

function rng(seme) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smazza(caso) {
  const mazzo = SEMI.flatMap((s) => [...RANGHI].map((r) => s + r));
  for (let i = mazzo.length - 1; i > 0; i--) {
    const j = Math.floor(caso() * (i + 1));
    [mazzo[i], mazzo[j]] = [mazzo[j], mazzo[i]];
  }
  const mani = {};
  POSTI.forEach((p, i) => (mani[p] = mazzo.slice(i * 13, i * 13 + 13)));
  return mani;
}

const punti = (m) => m.reduce((n, c) => n + (PUNTI[c[1]] ?? 0), 0);
const lung = (m, s) => m.filter((c) => c[0] === s).length;
const sagoma = (m) => SEMI.map((s) => lung(m, s)).sort((a, b) => b - a).join("");
const bilanciata = (m) => ["4333", "4432", "5332"].includes(sagoma(m));
const assi = (m) => m.filter((c) => c[1] === "A").length;
const onori = (m, s) => m.filter((c) => c[0] === s && "AKQJT".includes(c[1])).length;
const tra = (x, a, b) => x >= a && x <= b;
const pbnMano = (m) => SEMI.map((s) => m.filter((c) => c[0] === s).map((c) => c[1]).sort((a, b) => RANGHI.indexOf(a) - RANGHI.indexOf(b)).join("")).join(".");

/** Gli avversari passano: pochi punti e nessun colore da intervento. */
const passa = (m) => punti(m) <= 10 && Math.max(...SEMI.map((s) => lung(m, s))) <= 5;

// ── Posti relativi all'apertore (il mazziere) ────────────────────────────────
const dopo = (p, n) => POSTI[(POSTI.indexOf(p) + n) % 4];
const parole = (n) => ["zero", "una", "due", "tre", "quattro", "cinque", "sei", "sette", "otto"][n];

// Board 1–8: mazziere e zona secondo la numerazione standard delle smazzate.
const MAZZIERE = ["N", "E", "S", "W", "N", "E", "S", "W"];
const ZONA = ["None", "NS", "EW", "All", "NS", "EW", "All", "None"];

/**
 * Una sequenza: `mani(a, r)` controlla apertore e rispondente; `licita` è la
 * sequenza dell'apertore e del rispondente (gli avversari passano in mezzo);
 * `giocante` è "a" o "r"; `prese(n)` dice se il risultato a carte scoperte va
 * bene per questa sequenza; `commento(a, r, A, R)` scrive il racconto.
 */
const L17 = [
  {
    nome: "Appoggio semplice",
    mani: (a, r) =>
      tra(punti(a), 12, 14) && lung(a, "H") === 5 && lung(a, "S") <= 3 &&
      tra(punti(r), 6, 9) && lung(r, "H") === 3 && lung(r, "S") <= 3,
    licita: ["1H", "2H", "Pass"], contratto: "2H", giocante: "a",
    prese: (n) => tra(n, 8, 9),
    commento: (a, r, A, R) =>
      `${NOME[A]}, ${punti(a)} punti e cinque cuori, apre 1♥. ${NOME[R]} ha ${punti(r)} punti e tre cuori: il fit c'è, i punti per la manche no, e la risposta è l'appoggio semplice, 2♥ (6–10 punti). ${NOME[A]} è al minimo: in linea non ci sono i 25 punti della manche, e passa.`,
  },
  {
    nome: "Appoggio a salto, invitante",
    mani: (a, r) =>
      tra(punti(a), 15, 16) && lung(a, "S") === 5 && lung(a, "H") <= 3 &&
      tra(punti(r), 11, 12) && lung(r, "S") === 4 && lung(r, "H") <= 4,
    licita: ["1S", "3S", "4S"], contratto: "4S", giocante: "a",
    prese: (n) => tra(n, 10, 11),
    commento: (a, r, A, R) =>
      `${NOME[A]} apre 1♠ con ${punti(a)} punti e cinque picche. ${NOME[R]}, ${punti(r)} punti e quattro picche, salta a 3♠: è l'appoggio limite, 11–12 punti, e chiede all'apertore se è sopra il minimo. ${NOME[A]} lo è, ${punti(a)} punti: in linea ce ne sono ${punti(a) + punti(r)}, e dichiara la manche.`,
  },
  {
    nome: "Ridichiarazione di 1SA e manche a senza",
    mani: (a, r) =>
      tra(punti(a), 12, 14) && bilanciata(a) && lung(a, "C") >= 4 && lung(a, "D") <= 3 && lung(a, "H") <= 3 && lung(a, "S") <= 3 &&
      tra(punti(r), 13, 15) && lung(r, "H") === 4 && lung(r, "S") <= 3 && bilanciata(r),
    licita: ["1C", "1H", "1NT", "3NT"], contratto: "3NT", giocante: "a",
    prese: (n) => tra(n, 9, 11),
    commento: (a, r, A, R) =>
      `${NOME[A]} ha ${punti(a)} punti bilanciati, troppo pochi per 1SA (15–17): apre 1♣, il colore più lungo. ${NOME[R]} risponde 1♥, il suo colore di quattro carte. ${NOME[A]} non ha quattro cuori né quattro picche e ridichiara 1SA: mano bilanciata di 12–14. ${NOME[R]}, con ${punti(r)}, sa che i punti per la manche ci sono e che il fit a cuori non c'è: 3SA.`,
  },
  {
    nome: "Appoggio del colore del rispondente",
    mani: (a, r) =>
      tra(punti(a), 12, 14) && lung(a, "D") >= 4 && lung(a, "S") === 4 && lung(a, "H") <= 3 && lung(a, "D") >= lung(a, "C") &&
      tra(punti(r), 13, 15) && lung(r, "S") >= 4 && lung(r, "S") <= 5 && lung(r, "H") <= 3,
    licita: ["1D", "1S", "2S", "4S"], contratto: "4S", giocante: "a",
    prese: (n) => tra(n, 10, 11),
    commento: (a, r, A, R) =>
      `${NOME[A]} apre 1♦ con ${punti(a)} punti. ${NOME[R]} risponde 1♠ con ${parole(lung(r, "S"))} carte di picche. ${NOME[A]} ne ha quattro: il fit è trovato e lo dice subito, 2♠, mano minima. ${NOME[R]} ha ${punti(r)} punti: con i 12–14 dell'apertore si arriva a 25, e chiude a 4♠.`,
  },
  {
    nome: "Risposta a livello 2 e appoggio",
    mani: (a, r) =>
      tra(punti(a), 12, 14) && lung(a, "S") === 5 && lung(a, "H") === 3 &&
      tra(punti(r), 12, 15) && lung(r, "H") >= 5 && lung(r, "S") <= 2,
    licita: ["1S", "2H", "3H", "4H"], contratto: "4H", giocante: "r",
    prese: (n) => tra(n, 10, 11),
    commento: (a, r, A, R) =>
      `${NOME[A]} apre 1♠. ${NOME[R]}, ${punti(r)} punti e ${parole(lung(r, "H"))} cuori, senza appoggio a picche, dichiara il suo colore a livello 2: 2♥ promette almeno 11 punti. ${NOME[A]} ha tre cuori e appoggia, 3♥. ${NOME[R]} ha i punti per la manche: 4♥.`,
  },
  {
    nome: "Risposta di 1SA",
    mani: (a, r) =>
      tra(punti(a), 12, 14) && lung(a, "H") === 5 && bilanciata(a) && lung(a, "S") <= 3 &&
      tra(punti(r), 6, 9) && lung(r, "H") <= 2 && lung(r, "S") <= 3 && Math.max(lung(r, "D"), lung(r, "C")) <= 5,
    licita: ["1H", "1NT", "Pass"], contratto: "1NT", giocante: "r",
    prese: (n) => tra(n, 7, 8),
    commento: (a, r, A, R) =>
      `${NOME[A]} apre 1♥ con ${punti(a)} punti e una mano bilanciata. ${NOME[R]} ha ${punti(r)} punti, ${parole(lung(r, "H"))} cuori e nessun colore da dichiarare a livello 1: risponde 1SA, 6–10 punti senza appoggio. ${NOME[A]}, al minimo e bilanciato, passa.`,
  },
  {
    nome: "Ridichiarazione del proprio colore",
    mani: (a, r) =>
      tra(punti(a), 12, 14) && lung(a, "C") === 6 && lung(a, "S") <= 3 && lung(a, "H") <= 3 && lung(a, "D") <= 3 &&
      tra(punti(r), 6, 9) && lung(r, "S") === 4 && lung(r, "H") <= 4 && lung(r, "C") <= 2,
    licita: ["1C", "1S", "2C", "Pass"], contratto: "2C", giocante: "a",
    prese: (n) => tra(n, 8, 10),
    commento: (a, r, A, R) =>
      `${NOME[A]} apre 1♣ con ${punti(a)} punti e sei fiori. ${NOME[R]} risponde 1♠. ${NOME[A]} non ha quattro picche per appoggiare né una mano bilanciata: ridichiara le fiori, 2♣, colore lungo e mano minima. ${NOME[R]}, con ${punti(r)} punti, non vede la manche e passa.`,
  },
  {
    nome: "Salto a 2SA dell'apertore",
    mani: (a, r) =>
      tra(punti(a), 18, 20) && bilanciata(a) && lung(a, "D") >= 4 && lung(a, "H") <= 3 && lung(a, "S") <= 3 && lung(a, "C") <= lung(a, "D") &&
      tra(punti(r), 6, 9) && lung(r, "H") >= 4 && lung(r, "H") <= 5 && lung(r, "S") <= 3,
    licita: ["1D", "1H", "2NT", "3NT"], contratto: "3NT", giocante: "a",
    prese: (n) => tra(n, 9, 11),
    commento: (a, r, A, R) =>
      `${NOME[A]} ha ${punti(a)} punti bilanciati: troppi per 1SA, troppo pochi per 2SA. Apre 1♦ e, dopo la risposta di 1♥, salta a 2SA: è il modo di mostrare 18–20 bilanciati. ${NOME[R]}, con ${punti(r)}, completa i 25 punti e dichiara 3SA.`,
  },
];

const L18 = [
  {
    nome: "2♣ e poi 2SA",
    mani: (a, r) =>
      tra(punti(a), 23, 24) && bilanciata(a) &&
      tra(punti(r), 3, 7) && Math.max(lung(r, "S"), lung(r, "H")) <= 4,
    licita: ["2C", "2D", "2NT", "3NT"], contratto: "3NT", giocante: "a",
    prese: (n) => tra(n, 9, 11),
    commento: (a, r, A, R) =>
      `${NOME[A]} ha ${punti(a)} punti bilanciati: oltre i 21–22 dell'apertura di 2SA, apre 2♣, l'apertura forte. ${NOME[R]} dà la risposta d'attesa, 2♦. ${NOME[A]} ridichiara 2SA: mostra la bilanciata di 23–24. ${NOME[R]} ha ${punti(r)} punti, quanto basta per la manche: 3SA.`,
  },
  {
    nome: "2♣, appoggio e richiesta d'assi",
    mani: (a, r) =>
      tra(punti(a), 21, 24) && lung(a, "S") >= 6 && assi(a) === 3 && onori(a, "S") >= 3 &&
      tra(punti(r), 6, 9) && lung(r, "S") >= 3 && assi(r) === 0,
    licita: ["2C", "2D", "2S", "3S", "4NT", "5C", "6S"], contratto: "6S", giocante: "a",
    prese: (n) => n === 12,
    commento: (a, r, A, R) =>
      `${NOME[A]}, ${punti(a)} punti e ${parole(lung(a, "S"))} picche, apre 2♣. Sulla risposta d'attesa, 2♦, dichiara le picche, e ${NOME[R]} le appoggia: 3♠. Con il colore trovato, ${NOME[A]} ha tre assi e chiede il quarto: 4SA, la richiesta d'assi. 5♣ vuol dire nessun asso (o tutti e quattro, che qui non può essere): ne manca uno solo, e lo slam si dichiara. 6♠.`,
  },
  {
    nome: "Sottoapertura di 2♥",
    mani: (a, r) =>
      tra(punti(a), 6, 10) && lung(a, "H") === 6 && onori(a, "H") >= 2 && lung(a, "S") <= 3 &&
      tra(punti(r), 8, 13) && lung(r, "H") <= 2,
    licita: ["2H", "Pass"], contratto: "2H", giocante: "a",
    prese: (n) => tra(n, 8, 9),
    commento: (a, r, A, R) =>
      `${NOME[A]} ha ${punti(a)} punti e sei buone cuori: non abbastanza per aprire di 1, abbastanza per la sottoapertura, 2♥ (6–10 punti, sei carte). ${NOME[R]} ha ${punti(r)} punti e ${parole(lung(r, "H"))} cuori: la manche è lontana, e passa.`,
  },
  {
    nome: "Sottoapertura di 2♠ e manche",
    mani: (a, r) =>
      tra(punti(a), 7, 10) && lung(a, "S") === 6 && onori(a, "S") >= 2 && lung(a, "H") <= 3 &&
      tra(punti(r), 16, 19) && lung(r, "S") >= 3,
    licita: ["2S", "4S"], contratto: "4S", giocante: "a",
    prese: (n) => tra(n, 10, 11),
    commento: (a, r, A, R) =>
      `${NOME[A]} sottoapre 2♠: ${punti(a)} punti e sei picche. ${NOME[R]} ha ${punti(r)} punti e ${parole(lung(r, "S"))} picche: il fit c'è, e contando le prese della mano del compagno la manche è a portata. Chiude a 4♠.`,
  },
  {
    nome: "Sottoapertura a livello 3",
    mani: (a, r) =>
      tra(punti(a), 6, 10) && lung(a, "D") === 7 && onori(a, "D") >= 2 && lung(a, "S") <= 3 && lung(a, "H") <= 3 &&
      tra(punti(r), 8, 13) && lung(r, "D") >= 1,
    licita: ["3D", "Pass"], contratto: "3D", giocante: "a",
    prese: (n) => tra(n, 9, 10),
    commento: (a, r, A, R) =>
      `${NOME[A]} ha sette quadri e ${punti(a)} punti: apre 3♦, la sottoapertura di livello 3, e toglie spazio agli avversari. ${NOME[R]}, ${punti(r)} punti, non ha né i punti né il fit per la manche: passa.`,
  },
  {
    nome: "Richiesta d'assi e slam",
    mani: (a, r) =>
      tra(punti(a), 17, 20) && lung(a, "S") >= 5 && !bilanciata(a) && assi(a) === 2 &&
      tra(punti(r), 11, 12) && lung(r, "S") === 4 && assi(r) === 2,
    licita: ["1S", "3S", "4NT", "5H", "6S"], contratto: "6S", giocante: "a",
    prese: (n) => n === 12,
    commento: (a, r, A, R) =>
      `${NOME[A]} apre 1♠ e ${NOME[R]} appoggia a salto, 3♠: 11–12 punti e quattro picche. ${NOME[A]}, ${punti(a)} punti e una mano sbilanciata, pensa allo slam: prima di dichiararlo chiede gli assi, 4SA. 5♥ ne mostra due: in linea ci sono tutti e quattro, e ${NOME[A]} dichiara 6♠.`,
  },
  {
    nome: "Richiesta d'assi e fermata a livello 5",
    mani: (a, r) =>
      tra(punti(a), 17, 20) && lung(a, "H") >= 6 && assi(a) === 1 &&
      tra(punti(r), 11, 12) && lung(r, "H") >= 4 && assi(r) === 1,
    licita: ["1H", "3H", "4NT", "5D", "5H"], contratto: "5H", giocante: "a",
    prese: (n) => n === 11,
    commento: (a, r, A, R) =>
      `${NOME[A]} apre 1♥ e ${NOME[R]} appoggia a salto, 3♥. ${NOME[A]}, ${punti(a)} punti e ${parole(lung(a, "H"))} cuori, chiede gli assi: 4SA. 5♦ ne mostra uno solo. Con un asso a testa ne mancano due, e lo slam non si chiama: ${NOME[A]} si ferma a 5♥. È a questo che serve la richiesta d'assi: a non dichiarare uno slam che gli avversari battono con due assi.`,
  },
  {
    nome: "Sottoapertura di 3♠ e manche",
    mani: (a, r) =>
      tra(punti(a), 6, 10) && lung(a, "S") === 7 && onori(a, "S") >= 2 && lung(a, "H") <= 3 &&
      tra(punti(r), 14, 18) && lung(r, "S") >= 2,
    licita: ["3S", "4S"], contratto: "4S", giocante: "a",
    prese: (n) => tra(n, 10, 11),
    commento: (a, r, A, R) =>
      `${NOME[A]} apre 3♠: sette picche e ${punti(a)} punti. ${NOME[R]} ha ${punti(r)} punti e ${parole(lung(r, "S"))} picche: sa che il compagno ha poco fuori dal colore, ma le sue carte bastano per la decima presa. 4♠.`,
  },
];

const STRAIN = { S: 0, H: 1, D: 2, C: 3, NT: 4 };

function genera(lezione, sequenze, seme) {
  const caso = rng(seme);
  const righe = [`% Lezione ${lezione.numero} · ${lezione.titolo} — BridgeLab, mani generate per il Corso di Primo Livello`, ""];
  sequenze.forEach((seq, i) => {
    const A = MAZZIERE[i];
    const R = dopo(A, 2);
    for (let tentativo = 0; tentativo < 20_000_000; tentativo++) {
      const m = smazza(caso);
      if (!seq.mani(m[A], m[R])) continue;
      if (!passa(m[dopo(A, 1)]) || !passa(m[dopo(A, 3)])) continue;
      const giocante = seq.giocante === "a" ? A : R;
      const deal = `N:${POSTI.map((p) => pbnMano(m[p])).join(" ")}`;
      const strain = seq.contratto.replace(/^\d/, "");
      const prese = dds.CalcDDTablePBN({ cards: deal }).resTable[STRAIN[strain]][POSTI.indexOf(giocante)];
      if (!seq.prese(prese)) continue;

      // La licita completa: gli avversari passano fra una chiamata e l'altra.
      const chiamate = [];
      seq.licita.forEach((c, k) => {
        if (k > 0) chiamate.push("Pass");
        chiamate.push(c);
      });
      while (chiamate.slice(-3).join(" ") !== "Pass Pass Pass") chiamate.push("Pass");
      const commento = seq.commento(m[A], m[R], A, R);
      console.log(`${lezione.numero}/${i + 1} ${seq.nome}: ${seq.contratto} ${giocante}, ${prese} prese (${tentativo} tentativi)`);
      righe.push(
        `[Event "${seq.nome}"]`,
        `[Board "${i + 1}"]`,
        `[Dealer "${A}"]`,
        `[Vulnerable "${ZONA[i]}"]`,
        `[Deal "${deal}"]`,
        `[Declarer "${giocante}"]`,
        `[Contract "${seq.contratto}"]`,
        `[Auction "${A}"]`,
        ...Array.from({ length: Math.ceil(chiamate.length / 4) }, (_, k) => chiamate.slice(k * 4, k * 4 + 4).join(" ")),
        `{${commento}}`,
        "",
      );
      return;
    }
    throw new Error(`Lezione ${lezione.numero}, mano ${i + 1} (${seq.nome}): nessuna smazzata trovata`);
  });
  fs.writeFileSync(path.join(uscita, `mani-lezione-${lezione.numero}.pbn`), righe.join("\n"));
}

genera({ numero: 17, titolo: "Sviluppo delle aperture di 1 a colore" }, L17, 17_2026);
genera({ numero: 18, titolo: "Apertura di 2♣, sottoaperture e richiesta d'assi" }, L18, 18_2026);
