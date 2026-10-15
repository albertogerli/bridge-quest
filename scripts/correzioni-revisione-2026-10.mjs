/**
 * Correzioni dalla revisione esperta del documento «Revisione_Contenuti_BridgeLab.docx»
 * (estratto dal database l'11/08/2026, annotato a mano e restituito il 15/10/2026).
 *
 * COSA NON C'È, E PERCHÉ
 *  - Le risposte Vero/Falso evidenziate: il documento le stampava rovesciate
 *    (scripts/genera-docx-revisione.py leggeva 1 = Vero, nel DB 1 = Falso). Il
 *    revisore le ha corrette a mano e ogni sua correzione coincide con il DB.
 *  - «Mancano le risposte» su Scelta della carta / Valutazione della mano: sono
 *    blocchi interattivi (si tocca la carta, si scrive il numero), le opzioni non
 *    esistono. Il documento non poteva mostrarle.
 *  - Le voci «esercizio ex-…»: tabella eserciziario_exercises, archivio che l'app
 *    non legge più. Valgono solo dove esiste il modulo canonico corrispondente.
 *  - Lez. 202, Texas: il revisore indica «Transfer poi 3♦». Il testo FIGB del Corso
 *    Cuori Licita (Le Texas su 1NT e 2NT) dice l'opposto, con questa stessa mano:
 *    dopo il transfer 3♦ non è forzante, la via giusta è la Stayman. Resta com'è.
 *  - Eserciziario 3-7, Q5 / A8763: il revisore indica «in Est», la soluzione
 *    ufficiale FIGB (Tema 3, es. 8, fig. 5) dice «in Ovest», come il DB.
 *
 * Dove il revisore e l'eserciziario ufficiale concordano contro il DB, vince la
 * coppia: sono le correzioni sotto.
 *
 * Uso:
 *   node scripts/correzioni-revisione-2026-10.mjs           # prova: mostra, non scrive
 *   node scripts/correzioni-revisione-2026-10.mjs --apply   # scrive
 *
 * Ogni correzione ha una guardia: un frammento che deve esserci nel blocco attuale,
 * altrimenti salta. Rilanciarla dopo l'applicazione non cambia nulla.
 */
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("Mancano le variabili Supabase"); process.exit(1); }
const APPLY = process.argv.includes("--apply");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

/**
 * it / en: (blocco) => blocco nuovo. guard / guardEn: frammento atteso nel
 * contenuto attuale; se manca la correzione è già fatta o il DB è cambiato.
 * L'indice inglese si cerca per guardia e non per posizione: in alcuni moduli i
 * due array non hanno la stessa lunghezza.
 */
const EDITS = [
  {
    label: "Lez. 0 — il morto è il compagno del giocante",
    lesson_id: 0, module_id: "0-3", index: 1,
    guard: "uno dei 4 giocatori",
    it: (b) => ({ ...b, content: "A bridge si gioca sempre con il morto: il compagno del giocante, dopo l'attacco, depone scoperte sul tavolo le sue carte, ordinate e divise per seme, e non partecipa più alla smazzata." }),
    guardEn: "one of the 4 players",
    en: (b) => ({ ...b, content: "In bridge, the dummy is always in play: declarer's partner, after the opening lead, lays their cards face up on the table, sorted and divided by suit, and takes no further part in the deal." }),
  },
  {
    label: "Lez. 0 — tagliare non è un obbligo",
    lesson_id: 0, module_id: "0-4", index: 4,
    guard: "puoi tagliare con una carta di atout",
    it: (b) => ({ ...b, explanation: "Se non hai carte del seme giocato e c'è un atout, puoi tagliare con una carta di atout per vincere la presa. Non è un obbligo: puoi anche scartare una carta di un altro seme." }),
    guardEn: "you can ruff with a trump card",
    en: (b) => ({ ...b, explanation: "If you have no cards in the led suit and there is a trump suit, you can ruff with a trump to win the trick. It is not compulsory: you may also discard a card from another suit." }),
  },
  {
    // Anche «Passo» è una dichiarazione valida: la domanda aveva due risposte giuste.
    label: "Lez. 0 — dichiarazione valida: Passo era anch'esso valido",
    lesson_id: 0, module_id: "0-5", index: 7,
    guard: "Quale di queste dichiarazioni è VALIDA?",
    it: (b) => ({
      ...b,
      content: "L'avversario apre 1♦. Tu hai una bella mano e vuoi dichiarare un colore a livello 1. Quale di queste dichiarazioni è valida?",
      explanation: "1♥ è valida perché le Cuori hanno rango superiore alle Quadri. 1♣ e 1♦ sarebbero allo stesso livello o più in basso. Passo si può sempre dire, ma non è una dichiarazione di colore e con una bella mano rinunci a farti sentire.",
    }),
    guardEn: "Which of these bids is VALID?",
    en: (b) => ({
      ...b,
      content: "The opponent opens 1♦. You have a good hand and want to bid a suit at the one level. Which of these bids is valid?",
      explanation: "1♥ is valid because Hearts rank higher than Diamonds. 1♣ and 1♦ would be at the same level or lower. Pass is always allowed, but it is not a suit bid, and with a good hand you would be giving up your chance to show it.",
    }),
  },
  {
    label: "Lez. 1 — prima affrancare, poi incassare",
    lesson_id: 1, module_id: "1-2", index: 4,
    guard: "carte da affrancare.",
    it: (b) => b.content.includes("Prima affrancare") ? b : ({ ...b, content: b.content + " Prima affrancare, poi incassare." }),
    guardEn: "cards to establish.",
    en: (b) => b.content.includes("establish first") ? b : ({ ...b, content: b.content + " Establish first, cash later." }),
  },
  {
    label: "Lez. 1 — refuso «affranqueranno»",
    lesson_id: 1, module_id: "1-3", index: 1,
    guard: "affranqueranno",
    it: (b) => ({ ...b, content: b.content.replace("affranqueranno", "affrancheranno") }),
  },
  {
    // Soluzione ufficiale FIGB, Tema 2, es. 1e: «Q, 4, K, 4». A parità di
    // lunghezza si attacca nel colore più onorato, come dice il modulo 2-2.
    label: "Lez. 2 eserciziario — attacco con KJ5 AQ 9764 K854: fiori",
    lesson_id: 2, module_id: "eserciziario-2-2", index: 2,
    guard: "♠KJ5 ♥AQ ♦9764 ♣K854",
    it: (b) => ({
      ...b,
      options: ["♦ Quadri (7♦)", "♣ Fiori (4♣)", "♠ Picche (J♠)", "♥ Cuori (A♥)"],
      correctAnswer: 1,
      explanation: "4♣: quadri e fiori sono entrambe quarte, e a parità di lunghezza si attacca nel colore più onorato. Da K854 si attacca con la quarta carta dall'alto, il 4.",
    }),
    guardEn: "♠KJ5 ♥AQ ♦9764 ♣K854",
    en: (b) => ({
      ...b,
      options: ["♦ Diamonds (7♦)", "♣ Clubs (4♣)", "♠ Spades (J♠)", "♥ Hearts (A♥)"],
      correctAnswer: 1,
      explanation: "4♣: diamonds and clubs are both four cards long, and with equal length you lead the suit with more honours. From K854 you lead the fourth highest, the 4.",
    }),
  },
  {
    label: "Lez. 3 — impasse: la forchetta",
    lesson_id: 3, module_id: "3-2", index: 2,
    guard: "protetto da una carta superiore)",
    it: (b) => ({ ...b, content: b.content.replace("protetto da una carta superiore)", "protetto da una carta superiore: la cosiddetta forchetta)") }),
    guardEn: "protected by a higher card)",
    en: (b) => ({ ...b, content: b.content.replace("protected by a higher card)", "protected by a higher card: the so-called tenace)") }),
  },
  {
    // Tema 3, es. 5: «quali carte potrebbero darvi una presa supplementare».
    // Soluzione ufficiale fig. 4: la Dama di Sud. La riscrittura «il 7 di Nord»
    // rispondeva a un'altra domanda (da dove si muove).
    label: "Lez. 3 eserciziario — 762 / AQ54: la carta che può fare presa è la Dama",
    lesson_id: 3, module_id: "eserciziario-3-5", index: 4,
    guard: "Il 7 di Nord!",
    it: (b) => ({
      ...b,
      content: "Nord: 762 / Sud: AQ54. Quale carta può dare una presa in più?",
      options: ["La Q di Sud", "L'A di Sud", "Nessuna", "Il 7 di Nord"],
      correctAnswer: 0,
      explanation: "La Dama di Sud: se il Re è in Est. Si gioca piccola da Nord verso AQ: Est gioca prima di Sud e, se sta basso, la Dama vince la presa con l'impasse.",
    }),
    guardEn: "The 7 from North!",
    en: (b) => ({
      ...b,
      content: "North: 762 / South: AQ54. Which card can give you an extra trick?",
      options: ["The Q from South", "The A from South", "None", "The 7 from North"],
      correctAnswer: 0,
      explanation: "South's Queen, if the King is with East. Lead low from North towards the AQ: East plays before South and, if he plays low, the Queen wins the trick with the finesse.",
    }),
  },
  {
    // Tema 3, es. 6, fig. 2: soluzione ufficiale c, tirare l'Asso.
    label: "Lez. 3 eserciziario — A9763 / Q8542: si tira l'Asso",
    lesson_id: 3, module_id: "eserciziario-3-6", index: 2,
    guard: "Nord: A9763 / Sud: Q8542",
    it: (b) => ({
      ...b,
      options: [
        "Da Sud: gioco la Dama per l'impasse al Re",
        "Da Nord: gioco piccola verso la Dama",
        "Gioco piccola da entrambe le parti e aspetto il Re",
        "Tiro l'Asso, sperando che il Re cada; poi piccola verso la Dama",
      ],
      correctAnswer: 3,
      explanation: "Mancano solo tre carte, K, J e 10. Tirando l'Asso si cattura il Re ogni volta che è secco, in Est o in Ovest; se non cade, si gioca piccola verso la Dama e si fa presa lo stesso quando il Re è in Est. L'impasse diretto (b) rinuncia al Re secco in Ovest.",
    }),
    guardEn: "North: A9763 / South: Q8542",
    en: (b) => ({
      ...b,
      options: [
        "From South: play the Queen for the finesse against the King",
        "From North: play a small card towards the Queen",
        "Duck from both hands and wait for the King",
        "Cash the Ace hoping the King drops, then lead small towards the Queen",
      ],
      correctAnswer: 3,
      explanation: "Only three cards are missing: K, J and 10. Cashing the Ace catches the King whenever it is singleton, in East or West; if it does not drop, lead small towards the Queen, which still scores when the King is in East. The direct finesse (b) gives up on a singleton King in West.",
    }),
  },
  {
    // Tema 3, es. 6, fig. 3: soluzione ufficiale c, Asso e Re.
    label: "Lez. 3 eserciziario — J653 / AK42: Asso e Re",
    lesson_id: 3, module_id: "eserciziario-3-6", index: 3,
    guard: "Nord: J653 / Sud: AK42",
    it: (b) => ({
      ...b,
      options: [
        "Da Nord: gioco il J per l'impasse alla Dama",
        "Da Sud: l'Asso e il Re, sperando che la Dama cada; poi piccola verso il Fante",
        "Indifferente",
        "Da Nord: gioco piccola",
      ],
      correctAnswer: 1,
      explanation: "Asso e Re. Muovere il Fante da Nord non è un impasse: se Est ha la Dama la copre, e il Fante, senza il 10 accanto, non promuove niente. Si incassano Asso e Re sperando nella Dama seconda; se non cade, si gioca piccola verso il Fante, che fa presa se la Dama è in Ovest.",
    }),
    guardEn: "North: J653 / South: AK42",
    en: (b) => ({
      ...b,
      options: [
        "From North: play the J for the finesse against the Queen",
        "From South: cash the Ace and King hoping the Queen drops, then lead small towards the Jack",
        "Indifferent",
        "From North: play a small card",
      ],
      correctAnswer: 1,
      explanation: "Ace and King. Leading the Jack from North is not a finesse: if East has the Queen he covers, and the Jack, without the 10 beside it, promotes nothing. Cash Ace and King hoping for a doubleton Queen; if it does not drop, lead small towards the Jack, which scores when the Queen is in West.",
    }),
  },
  {
    // Tema 3, es. 8, fig. 2: «Re in Est; faremo l'impasse più volte».
    label: "Lez. 3 eserciziario — QJ65 / A1093: Re in Est",
    lesson_id: 3, module_id: "eserciziario-3-7", index: 2,
    guard: "Nord: QJ65 / Sud: A1093",
    it: (b) => ({
      ...b,
      options: ["In Ovest", "In Est: ripetiamo l'impasse", "Indifferente", "In nessuno dei due"],
      correctAnswer: 1,
      explanation: "K in Est. Si muove la Dama da Nord: se Est copre, l'Asso la cattura e J, 10 e 9 sono vincenti; se non copre, si ripete con il Fante. Si fanno tutte le prese. Col Re in Ovest, che gioca prima di Nord, il Re prima o poi fa presa.",
    }),
    guardEn: "North: QJ65 / South: A1093",
    en: (b) => ({
      ...b,
      options: ["In West", "In East: we repeat the finesse", "Indifferent", "In neither"],
      correctAnswer: 1,
      explanation: "King in East. Lead the Queen from North: if East covers, the Ace captures it and J, 10 and 9 are winners; if not, repeat with the Jack. You take every trick. With the King in West, who plays before North, the King scores sooner or later.",
    }),
  },
  {
    // Con la 4-4 non c'è una mano corta: un taglio guadagna una presa da
    // qualunque parte lo si faccia.
    label: "Lez. 6 eserciziario — fit 4-4: non fa differenza",
    lesson_id: 6, module_id: "eserciziario-6-1", index: 3,
    guard: "Con fit 4-4 in atout",
    it: (b) => ({
      ...b,
      options: ["Nel morto", "Nella mano del giocante", "Non fa differenza", "In nessuna delle due"],
      correctAnswer: 2,
      explanation: "Con il fit 4-4 le due mani sono lunghe uguali: non c'è una parte corta. Un taglio, da qualunque parte lo si faccia, aggiunge una presa alle quattro che le atout darebbero comunque.",
    }),
    guardEn: "With a 4-4 trump fit",
    en: (b) => ({
      ...b,
      options: ["In the dummy", "In the declarer's hand", "It makes no difference", "In neither hand"],
      correctAnswer: 2,
      explanation: "With a 4-4 fit both hands are the same length: there is no short side. A ruff in either hand adds one trick to the four the trumps would make anyway.",
    }),
  },
  {
    label: "Lez. 8 — la Stayman è l'unica risposta forzante",
    lesson_id: 8, module_id: "8-3", index: 1,
    guard: "quali colori nobili quarti possiede.",
    it: (b) => b.content.includes("unica dichiarazione forzante") ? b : ({ ...b, content: b.content + " Il 2♣ Stayman è l'unica dichiarazione forzante dopo l'apertura di 1NT." }),
    guardEn: "which major suits they hold four cards in.",
    en: (b) => b.content.includes("only forcing") ? b : ({ ...b, content: b.content + " The 2♣ Stayman is the only forcing response to a 1NT opening." }),
  },
  {
    // Il Corso Fiori non insegna i transfer: su 1NT, 2♠ è conclusivo (modulo 8-2).
    label: "Lez. 8 eserciziario — niente transfer nel Corso Fiori: 2♠",
    lesson_id: 8, module_id: "eserciziario-8-1", index: 2,
    guard: "transfer di Jacoby",
    it: (b) => ({
      ...b,
      options: ["2♠ (conclusivo: si gioca un parziale a Picche)", "Passo", "3♠", "2♣ Stayman"],
      correctAnswer: 0,
      explanation: "2♠. Con mano debole e cinque Picche si dichiara direttamente il colore: è una risposta conclusiva, l'apertore passa. Giocare 2♠ è molto meglio che lasciare il compagno a 1NT con le vostre Picche inutilizzate.",
    }),
    guardEn: "Jacoby transfer",
    en: (b) => ({
      ...b,
      options: ["2♠ (sign-off: play a part score in Spades)", "Pass", "3♠", "2♣ Stayman"],
      correctAnswer: 0,
      explanation: "2♠. With a weak hand and five Spades, bid the suit directly: it is a sign-off and opener passes. Playing 2♠ is much better than leaving partner in 1NT with your Spades wasted.",
    }),
  },
];

/**
 * ESEMPI CON UNA MANO SOLA. Il revisore segnala che manca il morto (o il
 * giocante): senza, l'esempio parla di carte che l'allievo non vede. Le mani
 * vengono dai diagrammi dei testi FIGB (Corso Fiori 2017/2022, Corso Cuori
 * Gioco), non sono ricostruite: per ognuna la fonte è nel commento.
 *
 * Il formato «Nord (morto): … | Sud (giocante): …» è quello che CardDisplay
 * divide in mani con etichetta.
 */
const MANI = {
  it: { N: "Nord", S: "Sud", E: "Est", O: "Ovest", morto: "morto", giocante: "giocante", voi: "voi" },
  en: { N: "North", S: "South", E: "East", O: "West", morto: "dummy", giocante: "declarer", voi: "you" },
};
/** [[posto, ruolo, carte], …] → stringa per `cards`, nella lingua data. */
function mani(lingua, ...elenco) {
  const t = MANI[lingua];
  return elenco.map(([posto, ruolo, carte]) => `${t[posto]} (${t[ruolo]}): ${carte}`).join(" | ");
}
/** Esempio: sostituisce le carte e, se dato, il testo. Già fatto = invariato. */
function esempio({ label, lesson_id, module_id, index, carte, carteEn, elenco, it, en, tipo }) {
  const fatto = (b) => typeof b.cards === "string" && b.cards.includes("|");
  return {
    label, lesson_id, module_id, index,
    guard: carte,
    guardEn: carteEn ?? carte,
    it: (b) => fatto(b) ? b : ({ ...b, ...(tipo ? { type: tipo } : {}), cards: mani("it", ...elenco), ...(it ? { content: it(b.content) } : {}) }),
    en: (b) => fatto(b) ? b : ({ ...b, ...(tipo ? { type: tipo } : {}), cards: mani("en", ...elenco), ...(en ? { content: en(b.content) } : {}) }),
  };
}

EDITS.push(
  // Corso Fiori 2017, Lezione 1: la smazzata delle Fiori sorgente di prese.
  esempio({
    label: "Lez. 1 — Fiori sorgente di prese: aggiunta la mano di Sud",
    lesson_id: 1, module_id: "1-3", index: 4,
    carte: "♠AQ8 ♥76 ♦K65 ♣K10932",
    elenco: [["N", "morto", "♠AQ8 ♥76 ♦K65 ♣K10932"], ["S", "giocante", "♠K62 ♥A982 ♦A43 ♣QJ6"]],
  }),
  // Lezione 4, «A volte il colore di sviluppo è uno solo». Nella fonte il morto
  // ha ♣872 (dodici carte) e Sud ♣A654 (quattordici), in tutte le edizioni: il
  // DB aveva già spostato una fiori a Nord, Sud scende a ♣A65. Il testo diceva che Sud rifiuta due volte a Cuori;
  // nella fonte sono i difensori a rifiutare a Quadri, e Sud prende con l'Asso.
  esempio({
    label: "Lez. 4 — salvaguardare il rientro: mano di Sud e testo come nella fonte",
    lesson_id: 4, module_id: "4-2", index: 3,
    carte: "♠86 ♥K5 ♦KQ1075 ♣8732",
    elenco: [["N", "morto", "♠86 ♥K5 ♦KQ1075 ♣8732"], ["S", "giocante", "♠AKQ3 ♥A72 ♦J32 ♣A65"]],
    it: () => "Sud gioca 3NT. Attacco ♥2. Sud conta 3 vincenti a Picche, 2 a Cuori e 1 a Fiori: le 3 prese che mancano possono venire solo dalle Quadri. Se però gli avversari rifiutano di prendere a Quadri per due volte, per incassare le quadri franche Sud dovrà raggiungere Nord, e l'unico ingresso è il K♥. Per questo deve vincere la prima presa con l'Asso e non con il Re.",
    en: () => "South plays 3NT. Opening lead ♥2. South counts 3 winners in Spades, 2 in Hearts and 1 in Clubs: the 3 missing tricks can only come from Diamonds. But if the opponents refuse to win a Diamond twice, South will need to reach North to cash the established diamonds, and the only entry is the K♥. So South must win the first trick with the Ace, not the King.",
  }),
  esempio({
    label: "Lez. 4 — da che parte muovere le Fiori: aggiunta la mano di Sud",
    lesson_id: 4, module_id: "4-4", index: 2,
    carte: "♠763 ♥864 ♦A653 ♣QJ3",
    elenco: [["N", "morto", "♠763 ♥864 ♦A653 ♣QJ3"], ["S", "giocante", "♠AKQ ♥A32 ♦K8 ♣A10985"]],
  }),
  // Lezione 6: nella fonte Sud ha dodici carte (♠KJ1063 ♥A8 ♦85 ♣KQ2) e il ♣2
  // è anche nel morto (♣AJ1082), in tutte le edizioni. Sud diventa ♣KQ3 e ♥A83:
  // non una quadri (Sud taglia il terzo giro); il piano resta 5♠ + 5♣ + 1♥.
  esempio({
    label: "Lez. 6 — lunghe o tagli: aggiunta la mano del giocante",
    lesson_id: 6, module_id: "6-1", index: 4,
    carte: "♠AQ8 ♥54 ♦432 ♣AJ1082",
    elenco: [["N", "morto", "♠AQ8 ♥54 ♦432 ♣AJ1082"], ["S", "giocante", "♠KJ1063 ♥A83 ♦85 ♣KQ3"]],
  }),
  // Corso Cuori Gioco, lezione 2 (Fit 5-3 e 4-4).
  esempio({
    label: "Lez. 101 — tagli incrociati: aggiunta la mano di Est",
    lesson_id: 101, module_id: "101-1", index: 5,
    carte: "♠Q ♥AQ104 ♦AK54 ♣A732",
    elenco: [["O", "morto", "♠Q ♥AQ104 ♦AK54 ♣A732"], ["E", "giocante", "♠A8765 ♥KJ93 ♦J32 ♣4"]],
    it: (c) => c.replace("Est gioca 6♥.", "Est gioca 6♥, attacco J♣."),
    en: (c) => c.replace("East plays 6♥.", "East plays 6♥, opening lead J♣."),
  }),
  esempio({
    label: "Lez. 101 — accorciamento: aggiunta la mano di Est",
    lesson_id: 101, module_id: "101-3", index: 3,
    carte: "♠7643 ♥K53 ♦KQ2 ♣763",
    elenco: [["O", "morto", "♠7643 ♥K53 ♦KQ2 ♣763"], ["E", "giocante", "♠A52 ♥AQJ10 ♦AJ1087 ♣2"]],
  }),
  // Lezione 4 (Difesa: colori da muovere con urgenza). Il testo del DB non
  // corrispondeva alla smazzata: nella fonte l'attacco è a cuori, tagliato.
  esempio({
    label: "Lez. 103 — non muovere quadri: aggiunto il morto, testo come nella fonte",
    lesson_id: 103, module_id: "103-3", index: 2,
    carte: "♠A103 ♥98732 ♦Q104 ♣86",
    elenco: [["N", "morto", "♠J42 ♥J6 ♦K86 ♣AKQJ10"], ["O", "voi", "♠A103 ♥98732 ♦Q104 ♣86"]],
    it: () => "Siete Ovest. Sud gioca 4♠ dopo l'apertura di 1NT di Nord e l'intervento a 2♥ di Est. Il vostro attacco a cuori viene tagliato; Sud gioca picche al Fante e ancora picche, Est scarta il 10 di cuori (preferenza a quadri) e voi prendete con l'Asso. Contate: Sud ha 6 picche e nessuna cuori, quindi 7 carte tra fiori e quadri. Le fiori del morto non devono far paura: se Sud ha 3 quadri e 4 fiori non ha scarti, se ha 4 quadri e 3 fiori ne scarta 2 ma gliene restano 2. Non è urgente muovere quadri: tornate a picche o a fiori, e Sud va sotto.",
    en: () => "You are West. South plays 4♠ after North's 1NT opening and East's 2♥ overcall. Your heart lead is ruffed; South plays a spade to the Jack and another spade, East discards the 10 of hearts (suit preference for diamonds) and you win with the Ace. Count: South has 6 spades and no hearts, so 7 cards between clubs and diamonds. Dummy's clubs are no threat: with 3 diamonds and 4 clubs South has no discard, with 4 diamonds and 3 clubs he discards 2 but still has 2 left. Leading diamonds is not urgent: return a spade or a club, and South goes down.",
  }),
  esempio({
    label: "Lez. 104 — gioco di sicurezza a fiori: aggiunta la mano di Est",
    lesson_id: 104, module_id: "104-3", index: 2,
    carte: "♠K83 ♥62 ♦K62 ♣AQ953",
    elenco: [["O", "morto", "♠K83 ♥62 ♦K62 ♣AQ953"], ["E", "giocante", "♠A654 ♥K54 ♦AQ4 ♣K102"]],
    it: (c) => c.replace(/^3NT\./, "3NT in Est, attacco ♠Q."),
    en: (c) => c.replace(/^3NT\./, "3NT by East, opening lead ♠Q."),
  }),
  esempio({
    label: "Lez. 105 — impasse o divisione: aggiunta la mano di Est",
    lesson_id: 105, module_id: "105-2", index: 2,
    carte: "♠AQJ ♥654 ♦A943 ♣762",
    elenco: [["O", "morto", "♠AQJ ♥654 ♦A943 ♣762"], ["E", "giocante", "♠K1094 ♥AKQ2 ♦QJ ♣Q104"]],
    it: (c) => c.replace("3NT in Est.", "3NT in Est. Attacco a fiori: la difesa incassa le prime quattro prese."),
    en: (c) => c.replace("3NT by East.", "3NT by East. A club is led and the defence takes the first four tricks."),
  }),
  esempio({
    label: "Lez. 107 — eliminazione a 4♠: aggiunta la mano di Sud",
    lesson_id: 107, module_id: "107-3", index: 1,
    carte: "♠109xx ♥AQx ♦Jxxx ♣Kx",
    elenco: [["N", "morto", "♠109xx ♥AQx ♦Jxxx ♣Kx"], ["S", "giocante", "♠AKQJx ♥xx ♦Qxx ♣AQx"]],
  }),
  esempio({
    label: "Lez. 107 — eliminazione a 3NT: aggiunta la mano di Sud",
    lesson_id: 107, module_id: "107-3", index: 3,
    carte: "♠xxx ♥AJ9 ♦xxx ♣AQxx",
    elenco: [["N", "morto", "♠xxx ♥AJ9 ♦xxx ♣AQxx"], ["S", "giocante", "♠Kxx ♥K10x ♦AQ9 ♣KJxx"]],
  }),
  esempio({
    label: "Lez. 108 — 6♠ con picche 3-3: aggiunte le due mani",
    lesson_id: 108, module_id: "108-1", index: 4,
    carte: "Un altro esempio: Est gioca 6♠",
    carteEn: "Another example: East plays 6♠",
    elenco: [["O", "morto", "♠AQJ ♥7642 ♦AK2 ♣QJ7"], ["E", "giocante", "♠K543 ♥3 ♦QJ93 ♣AK42"]],
    tipo: "example",
  }),
  esempio({
    label: "Lez. 108 — impasse alla Q♥: aggiunta la mano di Est",
    lesson_id: 108, module_id: "108-2", index: 2,
    carte: "♠K4 ♥A875 ♦AJ1053 ♣AQ",
    elenco: [["O", "morto", "♠K4 ♥A875 ♦AJ1053 ♣AQ"], ["E", "giocante", "♠QJ9 ♥KJ62 ♦KQ4 ♣J92"]],
  }),
  esempio({
    label: "Lez. 108 — 6♣ con atout 4-1: aggiunta la mano di Est",
    lesson_id: 108, module_id: "108-3", index: 2,
    carte: "♠96 ♥AQ94 ♦AQ7 ♣AK52",
    elenco: [["O", "morto", "♠96 ♥AQ94 ♦AQ7 ♣AK52"], ["E", "giocante", "♠A82 ♥KJ7 ♦K5 ♣J9764"]],
  }),
  esempio({
    label: "Lez. 109 — deduzioni dall'attacco: aggiunta la mano di Sud",
    lesson_id: 109, module_id: "109-1", index: 2,
    carte: "♠AJ6 ♥J74 ♦1087 ♣A652",
    elenco: [["N", "morto", "♠AJ6 ♥J74 ♦1087 ♣A652"], ["S", "giocante", "♠K10972 ♥52 ♦AK ♣KJ73"]],
  }),
  // Lezione 10 (Deduzioni del giocante). Nella fonte Est mostra ♠A, ♦A e la ♠Q,
  // non A♥ e K♠; con la Q♣ avrebbe 12 punti, non 13. Il contratto è 5♦ di Sud.
  esempio({
    label: "Lez. 109 — chi ha la Q♣: aggiunta la mano di Sud, testo come nella fonte",
    lesson_id: 109, module_id: "109-2", index: 2,
    carte: "♠4 ♥J854 ♦KJ964 ♣AJ9",
    elenco: [["N", "morto", "♠4 ♥J854 ♦KJ964 ♣AJ9"], ["S", "giocante", "♠J93 ♥AK ♦Q10852 ♣K102"]],
    it: () => "Est, mazziere, passa; Sud gioca 5♦. Attacco 2♠: Est vince con l'Asso e torna cuori. Sud muove atout, Est prende con l'Asso e gioca ancora cuori. Chi ha la Q♣? A♠ e Q♠ sono in Est e il K♠ in Ovest (con KQ Ovest avrebbe attaccato di Re). Est ha già mostrato due Assi e certamente la Q♠: con anche la Q♣ avrebbe avuto 12 punti e avrebbe aperto. Impasse a fiori su Ovest.",
    en: () => "East, the dealer, passes; South plays 5♦. Opening lead 2♠: East wins with the Ace and returns a heart. South plays trumps, East wins with the Ace and plays another heart. Who has the Q♣? A♠ and Q♠ are with East and the K♠ with West (with KQ West would have led the King). East has already shown two Aces and surely the Q♠: with the Q♣ as well he would have had 12 points and would have opened. Finesse in clubs through West.",
  }),
  {
    label: "Lez. 109 — regola: i conti dei punti come nell'esempio",
    lesson_id: 109, module_id: "109-2", index: 1,
    guard: "non può avere in più SIA un Re SIA una Dama",
    it: (b) => ({ ...b, content: "Prima, ovvia e importante deduzione: l'avversario che ha passato NON HA L'APERTURA (meno di 12 punti)! Sommate le figure che mostra durante il gioco: quando i punti visti si avvicinano a quella soglia, le figure che mancano sono del suo compagno. È così che si sceglie da che parte fare l'impasse." }),
    guardEn: "they cannot also have BOTH a King AND a Queen",
    en: (b) => ({ ...b, content: "First, obvious and important deduction: the opponent who passed DOES NOT HAVE AN OPENING HAND (fewer than 12 points)! Add up the honours they show during the play: when the points seen approach that threshold, the missing honours are with their partner. That is how you choose which way to take a finesse." }),
  },
  esempio({
    label: "Lez. 109 — Q♠ terza in Est: aggiunta la mano di Sud",
    lesson_id: 109, module_id: "109-3", index: 2,
    carte: "♠864 ♥J73 ♦A9532 ♣64",
    elenco: [["N", "morto", "♠864 ♥J73 ♦A9532 ♣64"], ["S", "giocante", "♠AK5 ♥AK62 ♦864 ♣AKJ"]],
  }),
);

/**
 * ERRORI CHE LA REVISIONE NON HA SEGNALATO, trovati confrontando le versioni
 * della stessa domanda tra loro e con il testo FIGB del Corso Fiori:
 *  - obbligo di risposta: «NON DITE MAI PASSO SE AVETE 5+ PUNTI» (Lezione 9);
 *  - risposta 1NT: 5-10 (Lezione 9, e il modulo 9-4);
 *  - intervento a colore a livello 1: 8-16, al massimo 16/17 (Lezione 11).
 * Le fasce dell'eserciziario (6+, 6-9, 8-15) contraddicevano la lezione.
 */
/** Sostituzioni testuali su tutto il blocco (domanda, opzioni, spiegazione). */
function sostituisci(coppie) {
  return (b) => {
    let s = JSON.stringify(b);
    for (const [da, a] of coppie) s = s.split(da).join(a);
    return JSON.parse(s);
  };
}
EDITS.push(
  {
    label: "Lez. 1 — refuso «affranqueranno» (spiegazione del 1-1)",
    lesson_id: 1, module_id: "1-1", index: 6,
    guard: "affranqueranno",
    it: sostituisci([["affranqueranno", "affrancheranno"]]),
  },
  {
    label: "Lez. 9 eserciziario — obbligo di risposta: 5+ punti",
    lesson_id: 9, module_id: "eserciziario-9-1", index: 1,
    guard: "Con 6+ PO (obbligo di risposta)",
    it: (b) => ({
      ...b,
      options: ["Con 5+ PO (obbligo di risposta)", "Con 10+ PO", "Con 12+ PO", "Con 8+ PO"],
      explanation: "Quando il compagno apre di 1 a colore non si dice mai Passo con 5 o più punti. Con meno di 5 si può passare.",
    }),
    guardEn: "With 6+ HCP (obligation to respond)",
    en: (b) => ({
      ...b,
      options: ["With 5+ HCP (obligation to respond)", "With 10+ HCP", "With 12+ HCP", "With 8+ HCP"],
      explanation: "When partner opens one of a suit you never pass with 5 or more points. With fewer than 5 you may pass.",
    }),
  },
  {
    label: "Lez. 9 eserciziario — risposta 1NT: 5-10 punti",
    lesson_id: 9, module_id: "eserciziario-9-1", index: 4,
    guard: "1SA = 6-9 PO",
    it: sostituisci([["6-9 PO", "5-10 PO"]]),
    guardEn: "1NT = 6-9 HCP",
    en: sostituisci([["6-9 HCP", "5-10 HCP"]]),
  },
  {
    label: "Lez. 11 eserciziario — intervento a colore: 8-16 punti",
    lesson_id: 11, module_id: "eserciziario-11-1", index: 2,
    guard: "8-15 PO",
    it: sostituisci([["8-15 PO", "8-16 PO"]]),
    guardEn: "8-15 HCP",
    en: sostituisci([["8-15 HCP", "8-16 HCP"]]),
  },
  // Lezione 12, «L'apertore in situazione competitiva»: il DB aveva fuso due
  // esempi della fonte (♠x ♥xx ♦AKJxx ♣KQJxx → 2♣ e ♠xx ♥xx ♦AKJ10xx ♣KQx → 2♦)
  // in una mano di dodici carte. Resta il secondo, quello del «signor colore».
  {
    label: "Lez. 12 — mano di 12 carte: l'esempio del «signor colore» come nella fonte",
    lesson_id: 12, module_id: "12-4", index: 6,
    guard: "♠x ♥xx ♦AKJxxx ♣AQx",
    it: (b) => ({ ...b, cards: "♠xx ♥xx ♦AKJ10xx ♣KQx" }),
    guardEn: "♠x ♥xx ♦AKJxxx ♣AQx",
    en: (b) => ({ ...b, cards: "♠xx ♥xx ♦AKJ10xx ♣KQx" }),
  },
  {
    label: "Lez. 12 — il commento segue la mano corretta",
    lesson_id: 12, module_id: "12-4", index: 7,
    guard: "ci sono ottimi colori da dire velocemente",
    it: (b) => ({ ...b, content: "2♦: le quadri sono sei, e belle. Un colore ridichiarato spontaneamente è sempre un 'signor colore'." }),
    guardEn: "there are excellent suits to bid quickly",
    en: (b) => ({ ...b, content: "2♦: six good diamonds. A suit rebid freely is always a really good suit." }),
  },
);

// Prima applicazione (15/10) con le mani della fonte tali e quali: Sud aveva
// 14 carte nel 4-2 e il ♣2 doppio nel 6-1. Qui si corregge quanto già scritto.
EDITS.push(
  {
    label: "Lez. 4 — Sud da 14 a 13 carte",
    lesson_id: 4, module_id: "4-2", index: 3,
    guard: "♣A654",
    it: sostituisci([["♦J32 ♣A654", "♦J32 ♣A65"]]),
    guardEn: "♣A654",
    en: sostituisci([["♦J32 ♣A654", "♦J32 ♣A65"]]),
  },
  {
    label: "Lez. 6 — ♣2 doppio e mano di Sud da 12 carte",
    lesson_id: 6, module_id: "6-1", index: 4,
    guard: "♦85 ♣KQ2",
    it: sostituisci([["♦85 ♣KQ2", "♦85 ♣KQ3"]]),
    guardEn: "♦85 ♣KQ2",
    en: sostituisci([["♦85 ♣KQ2", "♦85 ♣KQ3"]]),
  },
);

/** Glossario: il campo `cards` disegna la mano, e aveva perso una carta. */
const GLOSSARIO = [
  { label: "Glossario «Apertura» — mano di 12 carte", id: "apertura", da: "♠AK854 ♥Q3 ♦KJ7 ♣95", a: "♠AK854 ♥Q3 ♦KJ7 ♣952" },
  // Senza il ♣J la mano aveva 11 punti onori e il testo ne dichiara 12.
  { label: "Glossario «Punti distribuzione» — mano di 12 carte, 11 PO", id: "punti_distribuzione", da: "♠AK854 ♥3 ♦KJ75 ♣95", a: "♠AK854 ♥3 ♦KJ75 ♣J95" },
];

/** Commenti delle smazzate (tabella smazzate, campo commentary). */
const SMAZZATE = [
  {
    label: "Smazzata 1-2 — l'attacco di Dama promette il Fante",
    id: "1-2",
    guard: "questo attacco promuove il Fante",
    it: (s) => s.replace("questo attacco promuove il Fante", "questo attacco promette il Fante"),
    guardEn: "this opening lead promotes the Jack",
    en: (s) => s.replace("this opening lead promotes the Jack", "this opening lead promises the Jack"),
  },
  {
    label: "Smazzata 8-5 — refuso «è lo farà»",
    id: "8-5",
    guard: "è lo farà",
    it: (s) => s.replace("è lo farà", "e lo farà"),
  },
];

async function leggiModulo(lesson_id, module_id) {
  const r = await fetch(
    `${URL}/rest/v1/lesson_modules?select=content,content_en&lesson_id=eq.${lesson_id}&module_id=eq.${encodeURIComponent(module_id)}`,
    { headers: H }
  );
  if (!r.ok) throw new Error(`lettura ${lesson_id}/${module_id}: ${r.status}`);
  const [riga] = await r.json();
  return riga;
}

function corrisponde(blocco, frammento) {
  return JSON.stringify(blocco ?? {}).includes(frammento);
}

let fatte = 0, saltate = 0;

// Raggruppo per modulo: due correzioni sullo stesso modulo devono finire nella
// stessa scrittura, o la seconda cancellerebbe la prima.
const perModulo = new Map();
for (const e of EDITS) {
  const k = `${e.lesson_id}|${e.module_id}`;
  if (!perModulo.has(k)) perModulo.set(k, []);
  perModulo.get(k).push(e);
}

for (const [k, edits] of perModulo) {
  const [lesson_id, module_id] = k.split("|");
  const riga = await leggiModulo(lesson_id, module_id);
  if (!riga) { console.log(`✗ ${k}: modulo non trovato`); saltate += edits.length; continue; }
  const it = structuredClone(riga.content);
  const en = Array.isArray(riga.content_en) ? structuredClone(riga.content_en) : null;
  let cambiato = false;

  for (const e of edits) {
    const prima = it[e.index];
    if (!corrisponde(prima, e.guard)) {
      console.log(`– ${e.label}: guardia assente (già fatta o DB cambiato)`);
      saltate++;
      continue;
    }
    it[e.index] = e.it(prima);
    if (JSON.stringify(it[e.index]) === JSON.stringify(prima)) {
      console.log(`– ${e.label}: già applicata`);
      saltate++;
      continue;
    }
    cambiato = true;
    let notaEn = "";
    if (e.en && en) {
      const iEn = en.findIndex((b) => corrisponde(b, e.guardEn));
      if (iEn < 0) notaEn = " · EN: guardia assente";
      else { en[iEn] = e.en(en[iEn]); cambiato = true; notaEn = ` · EN #${iEn}`; }
    }
    console.log(`✓ ${e.label}${notaEn}`);
    console.log(`    prima: ${JSON.stringify(prima).slice(0, 220)}`);
    console.log(`    dopo:  ${JSON.stringify(it[e.index]).slice(0, 220)}`);
    fatte++;
  }

  if (cambiato && APPLY) {
    const body = en ? { content: it, content_en: en } : { content: it };
    const r = await fetch(
      `${URL}/rest/v1/lesson_modules?lesson_id=eq.${lesson_id}&module_id=eq.${encodeURIComponent(module_id)}`,
      { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(body) }
    );
    if (!r.ok) { console.error(`  ✗ scrittura ${k}: ${r.status} ${await r.text()}`); process.exitCode = 1; }
  }
}

for (const s of SMAZZATE) {
  const r = await fetch(`${URL}/rest/v1/smazzate?select=commentary,commentary_en&id=eq.${encodeURIComponent(s.id)}`, { headers: H });
  const [riga] = await r.json();
  if (!riga || !riga.commentary?.includes(s.guard)) { console.log(`– ${s.label}: guardia assente`); saltate++; continue; }
  const body = { commentary: s.it(riga.commentary) };
  if (s.en && riga.commentary_en?.includes(s.guardEn)) body.commentary_en = s.en(riga.commentary_en);
  console.log(`✓ ${s.label}${body.commentary_en ? " · EN" : ""}`);
  fatte++;
  if (APPLY) {
    const w = await fetch(`${URL}/rest/v1/smazzate?id=eq.${encodeURIComponent(s.id)}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(body),
    });
    if (!w.ok) { console.error(`  ✗ scrittura smazzata ${s.id}: ${w.status} ${await w.text()}`); process.exitCode = 1; }
  }
}

for (const g of GLOSSARIO) {
  const r = await fetch(`${URL}/rest/v1/glossary?select=cards&id=eq.${encodeURIComponent(g.id)}`, { headers: H });
  const [riga] = await r.json();
  if (riga?.cards !== g.da) { console.log(`– ${g.label}: guardia assente`); saltate++; continue; }
  console.log(`✓ ${g.label}`);
  fatte++;
  if (APPLY) {
    const w = await fetch(`${URL}/rest/v1/glossary?id=eq.${encodeURIComponent(g.id)}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ cards: g.a }),
    });
    if (!w.ok) { console.error(`  ✗ scrittura glossario ${g.id}: ${w.status} ${await w.text()}`); process.exitCode = 1; }
  }
}

console.log(`\n${fatte} da applicare, ${saltate} saltate. ${APPLY ? "SCRITTE." : "Prova: niente scritto (usa --apply)."}`);
