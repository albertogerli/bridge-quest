/**
 * FIGB Bridge LAB - Eserciziario FIGB Corso Fiori
 * Extracted from "Eserciziario per il Corso Fiori" (FIGB Commissione Insegnamento, Luglio 2017)
 * All 12 Temas with exercises and solutions.
 */

import type { ContentBlock } from "./lessons";

export interface EserciziarioExercise {
  id: string;
  lesson: number;
  title: string;
  content: ContentBlock[];
}

// =============================================
// TEMA 1 - Vincenti e Affrancabili
// =============================================

const tema1: EserciziarioExercise[] = [
  {
    id: "ex-1-1",
    lesson: 1,
    title: "Domande su vincenti e scarti",
    content: [
      {
        type: "text",
        content: "Rispondete alle seguenti domande sulle carte vincenti e affrancabili.",
      },
      {
        type: "quiz",
        content: "Quand'e che un giocatore scarta?",
        options: [
          "Quando non ha piu carte per rispondere nel seme dominante della presa in corso",
          "Quando vuole liberarsi di una carta inutile",
          "Quando ha solo carte basse",
          "Mai, non e permesso scartare",
        ],
        correctAnswer: 0,
        explanation: "Si scarta quando non si hanno piu carte nel seme dominante della presa in corso.",
      },
      {
        type: "quiz",
        content: "Quand'e che il primo di mano scarta?",
        options: [
          "Quando vuole",
          "Mai! Il primo di mano gioca nel seme che preferisce",
          "Solo quando ha carte basse",
          "Solo in difesa",
        ],
        correctAnswer: 1,
        explanation: "Mai! Il primo di mano non scarta: e lui a decidere il seme della presa.",
      },
      {
        type: "quiz",
        content: "Nord ha: ♠AKQJ. Quante di queste carte sono affrancabili?",
        options: [
          "Tutte e quattro",
          "Tre",
          "Una",
          "Nessuna: sono gia tutte vincenti!",
        ],
        correctAnswer: 3,
        explanation: "Nessuna e affrancabile perche sono gia tutte vincenti! AKQJ sono le 4 carte piu alte del seme.",
      },
      {
        type: "quiz",
        content: "In una presa vengono giocati l'8, il J, la Q e l'Asso. Qual e l'ordine delle tre carte piu alte tra quelle rimaste?",
        options: ["K, 10, 9", "K, Q, J", "A, K, Q", "10, 9, 8"],
        correctAnswer: 0,
        explanation: "L'Asso, la Q e il J sono gia usciti. Le tre carte piu alte rimaste sono K, 10, 9.",
      },
      {
        type: "quiz",
        content: "L'attacco tocca al vostro compagno, e voi avete: ♠- ♥- ♦- ♣AKQJ1098765432. Quante prese farete?",
        options: ["13", "10", "7", "Nessuna"],
        correctAnswer: 3,
        explanation: "Nessuna! Il compagno attacca e non avete carte negli altri semi. Le fiori usciranno solo come scarti.",
      },
      {
        type: "quiz",
        content: "Nel corso di una presa, chi ha piu vantaggi tra i quattro giocatori?",
        options: ["Il primo", "Il secondo", "Il terzo", "Il quarto"],
        correctAnswer: 3,
        explanation: "Il quarto giocatore ha il massimo vantaggio: vede tutte le carte giocate dagli altri tre.",
      },
    ],
  },
  {
    id: "ex-1-2",
    lesson: 1,
    title: "Vincenti ed equivalenti sulla linea",
    content: [
      {
        type: "text",
        content: "Per ogni figura, indicate: a) quante carte vincenti/equivalenti ci sono sulla linea, b) quante prese sono a disposizione con certezza assoluta.",
      },
      {
        type: "quiz",
        content: "Nord: A9753 / Sud: KQ642 (1 nel mezzo). a) Vincenti? b) Prese certe?",
        options: [
          "a) 3 (AKQ), b) 5 prese",
          "a) 5, b) 3 prese",
          "a) 3, b) 3 prese",
          "a) 5, b) 5 prese",
        ],
        correctAnswer: 0,
        explanation: "a) 3: AKQ. b) 5: abbiamo 10 carte; anche se J109 fossero nella stessa mano, cadrebbero.",
      },
      {
        type: "quiz",
        content: "Nord: KQJ / Sud: A109. a) Vincenti? b) Prese certe?",
        options: [
          "a) 6 vincenti (AKQJ10,9), b) solo 3 prese",
          "a) 3, b) 3",
          "a) 4, b) 3",
          "a) 6, b) 6",
        ],
        correctAnswer: 0,
        explanation: "a) 6 vincenti/equivalenti (AKQJ109). b) Solo 3 prese perche abbiamo 3 carte per lato.",
      },
      {
        type: "quiz",
        content: "Nord: AQ5 / Sud: KJ1072. a) Vincenti? b) Prese certe?",
        options: [
          "a) 5 (AKQJ10), b) 5 prese",
          "a) 3, b) 3",
          "a) 5, b) 3",
          "a) 4, b) 4",
        ],
        correctAnswer: 0,
        explanation: "a) 5: AKQJ10. b) 5, perche Sud ha 5 carte.",
      },
      {
        type: "quiz",
        content: "Nord: KJ65 / Sud: AQ432. a) Vincenti? b) Prese certe?",
        options: [
          "a) 4 (AKQJ), b) 5 prese",
          "a) 4, b) 4",
          "a) 5, b) 5",
          "a) 3, b) 5",
        ],
        correctAnswer: 0,
        explanation: "a) 4: AKQJ. b) 5: anche se 10,9,8,7 fossero nella stessa mano, con 9 carte cadrebbero.",
      },
      {
        type: "quiz",
        content: "Nord: AKQ6543 / Sud: J2. a) Vincenti? b) Prese certe?",
        options: [
          "a) 4 (AKQJ), b) 7 prese",
          "a) 4, b) 4",
          "a) 7, b) 7",
          "a) 3, b) 2",
        ],
        correctAnswer: 0,
        explanation: "a) 4: AKQJ. b) 7: Nord ha 7 carte; anche se 10,9,8,7 fossero tutti insieme, cadrebbero.",
      },
    ],
  },
  {
    id: "ex-1-3",
    lesson: 1,
    title: "Prese immediate colore per colore",
    content: [
      {
        type: "text",
        content: "Le vostre carte sono in Sud, quelle del compagno in Nord. Quante prese avete immediatamente disponibili, colore per colore?",
      },
      {
        type: "quiz",
        content: "Nord: ♠KQ8 ♥J6 ♦AQ4 ♣K9754\nSud: ♠AJ7 ♥KQ109 ♦K43 ♣QJ102\nPrese per colore?",
        options: [
          "♠3, ♥0, ♦3, ♣0 — mancano gli assi a cuori e fiori",
          "♠3, ♥3, ♦3, ♣3",
          "♠4, ♥0, ♦3, ♣2",
          "♠3, ♥0, ♦3, ♣5",
        ],
        correctAnswer: 0,
        explanation: "3 a picche + 3 a quadri = 6 prese immediate. A cuori manca l'A, a fiori manca l'A.",
      },
      {
        type: "quiz",
        content: "Nord: ♠QJ97 ♥K32 ♦KJ76 ♣AQ\nSud: ♠AK4 ♥AQJ654 ♦Q2 ♣KJ\nPrese per colore?",
        options: [
          "♠4, ♥6, ♦2, ♣2 — abbondanza di prese",
          "♠3, ♥4, ♦2, ♣2",
          "♠4, ♥3, ♦3, ♣2",
          "♠2, ♥6, ♦4, ♣2",
        ],
        correctAnswer: 0,
        explanation: "4 a picche, 6 a cuori, 2 a quadri, 2 a fiori.",
      },
      {
        type: "quiz",
        content: "Nord: ♠AQ86 ♥K2 ♦J983 ♣863\nSud: ♠K3 ♥AQ ♦AKQ43 ♣AJ72\nPrese per colore?",
        options: [
          "♠3, ♥2, ♦5, ♣1",
          "♠4, ♥2, ♦3, ♣2",
          "♠3, ♥3, ♦5, ♣1",
          "♠2, ♥2, ♦5, ♣2",
        ],
        correctAnswer: 0,
        explanation: "3 a picche, 2 a cuori, 5 a quadri, 1 a fiori.",
      },
      {
        type: "quiz",
        content: "Nord: ♠762 ♥KJ4 ♦KQJ108 ♣Q6\nSud: ♠KQJ ♥AQ9 ♦9732 ♣KJ5\nPrese per colore?",
        options: [
          "♠0, ♥3, ♦0, ♣0 — mancano troppi assi",
          "♠3, ♥3, ♦5, ♣2",
          "♠0, ♥3, ♦5, ♣0",
          "♠0, ♥2, ♦0, ♣1",
        ],
        correctAnswer: 0,
        explanation: "0 a picche (manca l'A), 3 a cuori, 0 a quadri (manca l'A), 0 a fiori (manca l'A).",
      },
    ],
  },
  {
    id: "ex-1-4",
    lesson: 1,
    title: "Valore dei contratti a Senza Atout",
    content: [
      {
        type: "text",
        content: "Quanto valgono i seguenti contratti?",
      },
      {
        type: "quiz",
        content: "Quanto vale 1NT + 2?",
        options: ["90", "120", "150", "180"],
        correctAnswer: 2,
        explanation: "150: 40 la presa dichiarata + 60 le due prese in piu + 50 di bonus parziale.",
      },
      {
        type: "quiz",
        content: "Quanto vale 3NT in prima?",
        options: ["300", "400", "500", "600"],
        correctAnswer: 1,
        explanation: "400 in prima: 100 le prese (40+30+30) + 300 il bonus di manche.",
      },
      {
        type: "quiz",
        content: "Quanto vale 3NT in seconda?",
        options: ["400", "500", "600", "700"],
        correctAnswer: 2,
        explanation: "600 in seconda: 100 le prese + 500 il bonus di manche in zona.",
      },
      {
        type: "true-false",
        content: "2NT + 1 vale esattamente come 1NT + 2.",
        correctAnswer: 0,
        explanation: "Vero! Entrambi fanno 9 prese senza raggiungere la manche: 150 punti.",
      },
      {
        type: "quiz",
        content: "Quanto vale 6NT in prima?",
        options: ["990", "1020", "1440", "1520"],
        correctAnswer: 0,
        explanation: "990 in prima: 190 le prese + 300 bonus manche + 500 bonus Slam.",
      },
      {
        type: "quiz",
        content: "Quanto vale 6NT in seconda?",
        options: ["990", "1370", "1440", "1520"],
        correctAnswer: 2,
        explanation: "1440 in seconda: 190 le prese + 500 bonus manche + 750 bonus Slam.",
      },
    ],
  },
  {
    id: "ex-1-5",
    lesson: 1,
    title: "Attacco peggiore per il dichiarante",
    content: [
      {
        type: "text",
        content: "In Sud vedete il Morto e prevedete di fare tantissime prese. Qual e l'attacco peggiore che potreste ricevere?",
      },
      {
        type: "quiz",
        content: "Nord: ♠543 ♥543 ♦A ♣KQJ1095\nSud: ♠A762 ♥A762 ♦KQJ7 ♣A\nQual e l'attacco peggiore?",
        options: [
          "Quadri: vi obbliga a usare subito l'Asso del morto e non riuscirete a incassare tutte le fiori di Nord",
          "Picche: toglie un rientro",
          "Cuori: toglie un rientro",
          "Fiori: spreca il vostro Asso",
        ],
        correctAnswer: 0,
        explanation: "Quadri! Obbligandovi a usare subito l'Asso del morto, non riuscirete piu a incassare tutte le fiori di Nord.",
      },
    ],
  },
];

// =============================================
// TEMA 2 - Il punto di vista dei difensori
// =============================================

const tema2: EserciziarioExercise[] = [
  {
    id: "ex-2-1",
    lesson: 2,
    title: "Attacchi e sequenze in difesa",
    content: [
      {
        type: "text",
        content: "Domande sull'attacco e la difesa.",
      },
      {
        type: "quiz",
        content: "Un giocatore possiede ♣KQJ53. Che carta deve giocare se e primo di mano? E se e terzo?",
        options: [
          "Primo: il K. Terzo: il J",
          "Primo: il J. Terzo: il K",
          "Sempre il K",
          "Sempre il J",
        ],
        correctAnswer: 0,
        explanation: "Il Re quando e in prima posizione (alto dalla sequenza), il Fante quando e in terza posizione (basso dalla sequenza).",
      },
      {
        type: "quiz",
        content: "Che carta promette l'attacco di J?",
        options: [
          "Il 10 (sequenza J-10)",
          "La Q sopra",
          "Il K e la Q",
          "Nulla di specifico",
        ],
        correctAnswer: 0,
        explanation: "L'attacco del J promette il 10.",
      },
      {
        type: "quiz",
        content: "Quale carta esclude chi attacca con la Q?",
        options: ["Il K (Re)", "L'Asso", "Il Fante", "Il 10"],
        correctAnswer: 0,
        explanation: "Chi attacca con la Dama esclude il Re. Se avesse KQ, attaccherebbe dal Re.",
      },
      {
        type: "true-false",
        content: "L'attacco con il J mostra che quel giocatore NON possiede carte piu alte del Fante.",
        correctAnswer: 1,
        explanation: "Falso! Potrebbe avere AJ10x o KJ10x. Quel che e certo e che non ha la Dama.",
      },
    ],
  },
  {
    id: "ex-2-2",
    lesson: 2,
    title: "Scelta del colore d'attacco",
    content: [
      {
        type: "text",
        content: "Nei seguenti esempi (contratto a Senza), che colore scegliete per l'attacco e che carta?",
      },
      {
        type: "bid-select",
        content: "♠AJ3 ♥KQ5 ♦72 ♣QJ983. Quale colore attaccate?",
        options: ["♣ Fiori (Q♣)", "♥ Cuori (K♥)", "♠ Picche (J♠)", "♦ Quadri (7♦)"],
        correctAnswer: 0,
        explanation: "Q♣: colore piu lungo con sequenza QJ.",
      },
      {
        type: "bid-select",
        content: "♠KJ5 ♥AQ ♦9764 ♣K854. Quale colore attaccate?",
        options: ["♦ Quadri (4♦)", "♣ Fiori (4♣)", "♠ Picche (J♠)", "♥ Cuori (A♥)"],
        correctAnswer: 0,
        explanation: "4♦: colore lungo senza onori toccati, la scelta piu sicura.",
      },
      {
        type: "bid-select",
        content: "♠863 ♥KQJ2 ♦AK ♣J1054. Quale colore attaccate?",
        options: ["♥ Cuori (K♥)", "♦ Quadri (A♦)", "♣ Fiori (J♣)", "♠ Picche (8♠)"],
        correctAnswer: 0,
        explanation: "K♥: bella sequenza KQJ nel colore quarto.",
      },
      {
        type: "bid-select",
        content: "♠87 ♥AQ ♦Q10654 ♣K853. Quale colore attaccate?",
        options: ["♦ Quadri (4♦)", "♣ Fiori (3♣)", "♥ Cuori (A♥)", "♠ Picche (8♠)"],
        correctAnswer: 0,
        explanation: "4♦: colore quinto con possibilita di affrancamento.",
      },
    ],
  },
  {
    id: "ex-2-3",
    lesson: 2,
    title: "Gioco del terzo di mano",
    content: [
      {
        type: "text",
        content: "Siete in Est, il compagno ha attaccato con una cartina. Il morto gioca piccola. Che carta giocate?",
      },
      {
        type: "card-select",
        content: "Nord: 865. Ovest attacca il 2. Est ha KJ4. Il morto gioca piccola.",
        cards: "KJ4",
        correctCard: "K",
        explanation: "Il K. Terzo di mano gioca alto.",
      },
      {
        type: "card-select",
        content: "Nord: Q97. Ovest attacca il 2. Est ha KJ10. Il morto gioca piccola.",
        cards: "KJ10",
        correctCard: "10",
        explanation: "Il 10. La Q del morto copre il J, basta il 10.",
      },
      {
        type: "card-select",
        content: "Nord: 863. Ovest attacca il 2. Est ha QJ94. Il morto gioca piccola.",
        cards: "QJ94",
        correctCard: "J",
        explanation: "Il J. Con Q-J basta il J per testare la posizione.",
      },
      {
        type: "card-select",
        content: "Nord: J65. Ovest attacca il 2. Est ha KQ10. Il morto gioca piccola.",
        cards: "KQ10",
        correctCard: "10",
        explanation: "Il 10. Il J del morto copre Q e K; il 10 forza l'Asso.",
      },
      {
        type: "card-select",
        content: "Nord: 974. Ovest attacca il 2. Est ha AK5. Il morto gioca piccola.",
        cards: "AK5",
        correctCard: "K",
        explanation: "Il K. Con AK si gioca il Re per segnalare.",
      },
      {
        type: "card-select",
        content: "Nord: Q103. Ovest attacca il 2. Est ha KJ9. Il morto gioca piccola.",
        cards: "KJ9",
        correctCard: "9",
        explanation: "Il 9. La Q del morto copre il J e il K; il 9 e sufficiente.",
      },
    ],
  },
  {
    id: "ex-2-4",
    lesson: 2,
    title: "Chi ha sbagliato tra Est e Ovest?",
    content: [
      {
        type: "text",
        content: "Analizzate le seguenti prese e dite chi ha sbagliato.",
      },
      {
        type: "quiz",
        content: "Nord: J43, Ovest: K10965, Est: Q72, Sud: A8.\nLa giocata: 5...3...Q...A.\nSud ha fatto una seconda presa con il J. Ha sbagliato Est o Ovest?",
        options: [
          "Ha sbagliato Ovest: doveva attaccare con il 10 (sequenza), non con il 5",
          "Ha sbagliato Est: doveva giocare il K",
          "Nessuno ha sbagliato",
          "Hanno sbagliato entrambi",
        ],
        correctAnswer: 0,
        explanation: "Ovest ha sbagliato attaccando con il 5 anziche il 10 (sequenza). Se avesse giocato il 10, Est avrebbe salvato la Dama.",
      },
      {
        type: "quiz",
        content: "Nord: 854, Ovest: AJ1062, Est: K93, Sud: Q7.\nLa presa: J...4...3...Q.\nSud ha fatto una presa impossibile! Ha sbagliato Est o Ovest?",
        options: [
          "Ha sbagliato Est: la Dama e in mano a Sud, quindi DEVE mettere il Re!",
          "Ha sbagliato Ovest",
          "Nessuno ha sbagliato",
          "Hanno sbagliato entrambi",
        ],
        correctAnswer: 0,
        explanation: "Est! Sa perfettamente che la Dama e in mano a Sud (l'attacco di J la nega), quindi DEVE mettere il Re!",
      },
      {
        type: "quiz",
        content: "Nord: 754, Ovest: A10862, Est: KJ3, Sud: Q9.\nLa presa: 2...4...J...Q.\nSud ha fatto una presa impossibile. Errore di...?",
        options: [
          "Est: non sono affatto equivalenti Re e Fante; deve giocare il Re (la carta piu alta)",
          "Ovest",
          "Nessuno",
          "Entrambi",
        ],
        correctAnswer: 0,
        explanation: "Est! Re e Fante non sono equivalenti. Poiche e suo dovere cercare di vincere la presa, la carta da giocare e quella piu alta: il Re.",
      },
    ],
  },
  {
    id: "ex-2-5",
    lesson: 2,
    title: "Quiz sulla posizione delle carte",
    content: [
      {
        type: "text",
        content: "Rispondete a questi quiz sulla posizione delle carte.",
      },
      {
        type: "quiz",
        content: "Siete Ovest con K764. Nord: J83, Est: ...10, Sud: ...A.\nAvete attaccato il 4. Nord mette il 3, Est il 10, Sud prende con l'A. Chi ha la Q?",
        options: [
          "La Q e in Est (Sud con AQ avrebbe preso con la Q)",
          "La Q e in Sud",
          "Impossibile dirlo",
          "La Q e in Nord",
        ],
        correctAnswer: 0,
        explanation: "Sud con AQ avrebbe preso con la Dama. Quindi la Q e in Est. Il 9 e in Sud, perche Est con 10 e 9 avrebbe giocato il 9.",
      },
      {
        type: "quiz",
        content: "Siete Ovest con Q8632. Nord: 754, Est: ...J, Sud: ...A.\nAvete attaccato il 2. Nord mette il 4, Est il J, Sud prende con l'A. Chi ha il K?",
        options: [
          "Il K e in Sud (se Est avesse K e J avrebbe giocato il Re)",
          "Il K e in Est",
          "Impossibile dirlo",
          "Il K e in Nord",
        ],
        correctAnswer: 0,
        explanation: "Se Est avesse avuto K e J, avrebbe giocato il Re. Quindi il Re e in Sud. Anche il 10 e in Sud.",
      },
    ],
  },
  {
    id: "ex-2-6",
    lesson: 2,
    title: "Prese minime per il difensore",
    content: [
      {
        type: "text",
        content: "Siete Ovest e vedete le carte del morto in Nord. Supponendo che tutti i valori mancanti siano in mano al giocante, quante prese minime vi spettano?",
      },
      {
        type: "hand-eval",
        content: "Nord: 643, Ovest: AQ10. Prese minime?",
        cards: "AQ10",
        correctValue: 3,
        explanation: "3: sempre che non ci muoviamo per primi. Il giocante non puo evitare di darci 3 prese.",
      },
      {
        type: "hand-eval",
        content: "Nord: A65, Ovest: Q102. Prese minime?",
        cards: "Q102",
        correctValue: 1,
        explanation: "1: se Sud gioca il Fante, bastera coprirlo con la Dama.",
      },
      {
        type: "hand-eval",
        content: "Nord: J10, Ovest: AQ94. Prese minime?",
        cards: "AQ94",
        correctValue: 3,
        explanation: "3: Asso e Dama sono evidenti, ma faremo anche il 9.",
      },
      {
        type: "hand-eval",
        content: "Nord: QJ, Ovest: A1062. Prese minime?",
        cards: "A1062",
        correctValue: 2,
        explanation: "2: anche il 10 vincera la sua presa, comunque giochi Sud.",
      },
      {
        type: "hand-eval",
        content: "Nord: AK7, Ovest: QJ9. Prese minime?",
        cards: "QJ9",
        correctValue: 1,
        explanation: "1: bastera giocare il 9 se Sud muove piccola, e coprire con un pezzo se Sud muove il 10.",
      },
      {
        type: "hand-eval",
        content: "Nord: 543, Ovest: AJ108. Prese minime?",
        cards: "AJ108",
        correctValue: 3,
        explanation: "3: l'Asso mangia un pezzo grosso, poi J e 10 sono vincenti.",
      },
    ],
  },
];

// =============================================
// TEMA 3 - Affrancamenti di lunga e posizione
// =============================================

const tema3: EserciziarioExercise[] = [
  {
    id: "ex-3-1",
    lesson: 3,
    title: "Divisione dei resti",
    content: [
      {
        type: "text",
        content: "Tra mano e morto avete il numero di carte indicato; scrivete le due divisioni dei resti piu probabili.",
      },
      {
        type: "quiz",
        content: "7 carte in linea (ne mancano 6). Divisioni piu probabili?",
        options: ["3-3 e 4-2", "5-1 e 6-0", "4-2 e 5-1", "2-4 e 1-5"],
        correctAnswer: 0,
        explanation: "Con 6 carte mancanti: divisioni piu probabili 3-3 e 4-2.",
      },
      {
        type: "quiz",
        content: "6 carte in linea (ne mancano 7). Divisioni piu probabili?",
        options: ["4-3 e 5-2", "3-4 e 6-1", "5-2 e 6-1", "3-3 e 4-2"],
        correctAnswer: 0,
        explanation: "Con 7 carte mancanti: 4-3 e 5-2.",
      },
      {
        type: "quiz",
        content: "9 carte in linea (ne mancano 4). Divisioni piu probabili?",
        options: ["2-2 e 3-1", "3-1 e 4-0", "1-3 e 0-4", "2-2 e 4-0"],
        correctAnswer: 0,
        explanation: "Con 4 carte mancanti: 2-2 e 3-1.",
      },
      {
        type: "quiz",
        content: "8 carte in linea (ne mancano 5). Divisioni piu probabili?",
        options: ["3-2 e 4-1", "2-3 e 5-0", "4-1 e 5-0", "3-2 e 5-0"],
        correctAnswer: 0,
        explanation: "Con 5 carte mancanti: 3-2 e 4-1.",
      },
      {
        type: "quiz",
        content: "10 carte in linea (ne mancano 3). Divisioni possibili?",
        options: ["2-1 e 3-0", "1-1 e 2-0", "Solo 2-1", "Solo 3-0"],
        correctAnswer: 0,
        explanation: "Con 3 carte mancanti: uniche divisioni possibili 2-1 e 3-0.",
      },
    ],
  },
  {
    id: "ex-3-2",
    lesson: 3,
    title: "Affrancamento di lunga",
    content: [
      {
        type: "text",
        content: "E possibile affrancare prese di lunga? Quante con la divisione dei resti piu vantaggiosa?",
      },
      {
        type: "quiz",
        content: "Nord: A9753 / Sud: K8642. Affrancamento di lunga?",
        options: [
          "Si, TRE se diviso 2-1",
          "Si, UNA se diviso 2-1",
          "No",
          "Si, QUATTRO",
        ],
        correctAnswer: 0,
        explanation: "Si, TRE prese di lunga se diviso 2-1 (10 carte, ne mancano solo 3).",
      },
      {
        type: "quiz",
        content: "Nord: KQ42 / Sud: A853. Affrancamento di lunga?",
        options: [
          "Si, UNA se diviso 3-2",
          "No",
          "Si, DUE",
          "Si, TRE",
        ],
        correctAnswer: 0,
        explanation: "UNA presa di lunga, se diviso 3-2.",
      },
      {
        type: "quiz",
        content: "Nord: AQ54 / Sud: K2. Affrancamento di lunga?",
        options: [
          "Nessuna (anche con divisione 4-3 non affranchiamo la quarta carta)",
          "UNA",
          "DUE",
          "TRE",
        ],
        correctAnswer: 0,
        explanation: "Nessuna! Con solo 2 carte in Sud, anche se il colore fosse 4-3 non affranchiamo la quarta carta di Nord.",
      },
      {
        type: "quiz",
        content: "Nord: KQ5 / Sud: A432. Affrancamento di lunga?",
        options: [
          "Si, UNA se diviso 3-3",
          "No",
          "Si, DUE",
          "Si, TRE",
        ],
        correctAnswer: 0,
        explanation: "UNA presa di lunga se diviso 3-3.",
      },
      {
        type: "quiz",
        content: "Nord: AK7654 / Sud: 832. Affrancamento di lunga?",
        options: [
          "Si, QUATTRO se diviso 2-2",
          "Si, TRE",
          "Si, DUE",
          "Si, UNA",
        ],
        correctAnswer: 0,
        explanation: "QUATTRO prese di lunga se diviso 2-2.",
      },
    ],
  },
  {
    id: "ex-3-3",
    lesson: 3,
    title: "Forza, lunga e influenza dei resti",
    content: [
      {
        type: "text",
        content: "a) Quante prese di forza? b) Quante di lunga al meglio? c) La divisione dei resti influisce?",
      },
      {
        type: "quiz",
        content: "Nord: K8763 / Sud: A642. Forza? Lunga? Resti influiscono?",
        options: [
          "a) Nessuna, b) 4 se 2-2, c) Si",
          "a) Due, b) 3, c) No",
          "a) Una, b) 2, c) Si",
          "a) Nessuna, b) 2 se 3-2, c) No",
        ],
        correctAnswer: 0,
        explanation: "a) Nessuna di forza (mancano Q e J). b) 4 se 2-2. c) Si.",
      },
      {
        type: "quiz",
        content: "Nord: KQ742 / Sud: J65. Forza? Lunga? Resti?",
        options: [
          "a) Due (KQJ), b) DUE se 3-2, c) Si",
          "a) Una, b) TRE, c) No",
          "a) Nessuna, b) UNA, c) Si",
          "a) Tre, b) Nessuna, c) No",
        ],
        correctAnswer: 0,
        explanation: "a) Due (abbiamo KQJ). b) DUE se 3-2. c) Si.",
      },
      {
        type: "quiz",
        content: "Nord: AK873 / Sud: Q2. Forza? Lunga? Resti?",
        options: [
          "a) Nessuna, b) DUE se 3-3, c) Si",
          "a) QUATTRO, b) Nessuna, c) No",
          "a) Due, b) UNA, c) Si",
          "a) Nessuna, b) TRE, c) No",
        ],
        correctAnswer: 0,
        explanation: "a) Nessuna di forza extra. b) DUE se 3-3. c) Si.",
      },
      {
        type: "quiz",
        content: "Nord: KQ9 / Sud: J10862. Forza? Lunga? Resti?",
        options: [
          "a) QUATTRO, b) Nessuna (coincidono con forza), c) No",
          "a) Due, b) DUE, c) Si",
          "a) Tre, b) UNA, c) Si",
          "a) QUATTRO, b) UNA, c) Si",
        ],
        correctAnswer: 0,
        explanation: "a) QUATTRO (manca solo l'A). b) Nessuna in piu. c) No.",
      },
      {
        type: "quiz",
        content: "Nord: QJ94 / Sud: 10865. Forza? Lunga? Resti?",
        options: [
          "a) DUE, b) Nessuna (coincidono), c) No",
          "a) Nessuna, b) DUE, c) Si",
          "a) Una, b) UNA, c) Si",
          "a) TRE, b) UNA, c) No",
        ],
        correctAnswer: 0,
        explanation: "a) DUE (QJ contro AK). b) Nessuna in piu. c) No.",
      },
    ],
  },
  {
    id: "ex-3-4",
    lesson: 3,
    title: "Chi ha il fermo?",
    content: [
      {
        type: "text",
        content: "Quale dei giocatori in E-O ha il 'fermo' nel colore mosso da N-S?",
      },
      {
        type: "quiz",
        content: "Nord: K75, Sud: AQ64. Ovest: 9832, Est: J10. Chi ha il fermo?",
        options: ["Ovest", "Est", "Nessuno", "Entrambi"],
        correctAnswer: 1,
        explanation: "Est con J10 dietro alla forchetta AQ di Sud.",
      },
      {
        type: "quiz",
        content: "Nord: A72, Sud: K9843. Ovest: QJ, Est: 1065. Chi ha il fermo?",
        options: ["Est", "Ovest", "Nessuno", "Entrambi"],
        correctAnswer: 1,
        explanation: "Ovest con QJ davanti al Re di Sud.",
      },
      {
        type: "quiz",
        content: "Nord: K86432, Sud: A10. Ovest: 975, Est: QJ. Chi ha il fermo?",
        options: ["Ovest", "Est", "Nessuno", "Entrambi"],
        correctAnswer: 1,
        explanation: "Est con QJ seduto dietro al Re di Nord.",
      },
    ],
  },
  {
    id: "ex-3-5",
    lesson: 3,
    title: "Carte che danno una presa supplementare",
    content: [
      {
        type: "text",
        content: "Indicate le carte che potrebbero darvi una presa in piu (oltre a quelle franche).",
      },
      {
        type: "quiz",
        content: "Nord: KJ5 / Sud: A64. Quale carta puo dare una presa in piu?",
        options: ["Il J di Nord", "Il K di Nord", "Il 6 di Sud", "Nessuna"],
        correctAnswer: 0,
        explanation: "Il Fante di Nord: se la Q e in Ovest, con l'impasse il J diventa vincente.",
      },
      {
        type: "quiz",
        content: "Nord: Q432 / Sud: A765. Quale carta?",
        options: ["La Q di Nord", "Il 7 di Sud", "Nessuna", "L'A di Sud"],
        correctAnswer: 0,
        explanation: "La Dama di Nord: se il K e in Ovest.",
      },
      {
        type: "quiz",
        content: "Nord: K762 / Sud: 43. Quale carta?",
        options: ["Il K di Nord", "Il 7", "Nessuna", "Il 4 di Sud"],
        correctAnswer: 0,
        explanation: "Il Re di Nord: se l'A e in Ovest.",
      },
      {
        type: "quiz",
        content: "Nord: 762 / Sud: AQ54. Quale carta?",
        options: ["La Q di Sud", "L'A di Sud", "Nessuna", "Il 7 di Nord"],
        correctAnswer: 0,
        explanation: "La Dama di Sud: se il K e in Ovest.",
      },
      {
        type: "quiz",
        content: "Nord: AK5 / Sud: J643. Quale carta?",
        options: ["Il J di Sud", "L'A di Nord", "Nessuna", "Il 6 di Sud"],
        correctAnswer: 0,
        explanation: "Il Fante di Sud: se la Q cade sotto AK, o se e in posizione favorevole.",
      },
    ],
  },
  {
    id: "ex-3-6",
    lesson: 3,
    title: "Impasse: da che lato iniziare",
    content: [
      {
        type: "text",
        content: "Volendo fare il massimo di prese, da dove iniziate: da Sud o da Nord?",
      },
      {
        type: "quiz",
        content: "Nord: AQ963 / Sud: 7542. Da dove iniziate?",
        options: [
          "Da Sud: gioco la dama per far scendere il Re (impasse)",
          "Da Nord: tiro l'Asso",
          "Indifferente: tiro l'A e spero che il K cada",
          "Da Nord: gioco piccola",
        ],
        correctAnswer: 0,
        explanation: "a) Inizio da Nord e gioco la Dama per fare l'impasse al Re. b) Inizio da Sud e gioco il 2 per provare a mettere la Dama. c) Indifferente: tiro l'A e spero che il Re cada.",
      },
      {
        type: "quiz",
        content: "Nord: A9763 / Sud: Q8542. Da dove?",
        options: [
          "Da Sud: gioco la Dama per l'impasse al Re",
          "Da Nord: gioco piccola verso la Dama",
          "Indifferente: tiro l'Asso",
          "Da Nord: Asso e poi piccola",
        ],
        correctAnswer: 1,
        explanation: "a) Inizio da Sud e gioco la Dama. b) Inizio da Nord e gioco piccola verso la Dama. c) Tiro l'A e spero.",
      },
      {
        type: "quiz",
        content: "Nord: J653 / Sud: AK42. Da dove?",
        options: [
          "Da Nord: gioco il J per l'impasse alla Dama",
          "Da Sud: l'Asso e il Re e spero",
          "Indifferente",
          "Da Nord: gioco piccola",
        ],
        correctAnswer: 0,
        explanation: "a) Inizio da Nord e gioco il Fante per l'impasse alla Dama. b) Da Sud e gioco piccola verso il Fante. c) Tiro l'A e il Re e spero che la Dama cada.",
      },
    ],
  },
  {
    id: "ex-3-7",
    lesson: 3,
    title: "Dove vorreste il Re avversario?",
    content: [
      {
        type: "text",
        content: "Negli esempi che seguono, vorreste che il K fosse in Est o in Ovest?",
      },
      {
        type: "quiz",
        content: "Nord: AQ5 / Sud: 642. Preferite il K in Est o Ovest?",
        options: [
          "In Est: faremo l'impasse dalla Dama",
          "In Ovest",
          "Indifferente",
          "In nessuno dei due",
        ],
        correctAnswer: 0,
        explanation: "K in Est! Giocheremo piccole verso la Dama, e faremo l'impasse.",
      },
      {
        type: "quiz",
        content: "Nord: QJ65 / Sud: A1093. Preferite il K...?",
        options: [
          "In Est: faremo l'impasse ripetutamente",
          "In Ovest",
          "Indifferente",
          "Non importa",
        ],
        correctAnswer: 0,
        explanation: "K in Est: faremo l'impasse piu volte e realizzeremo tutte le prese.",
      },
      {
        type: "quiz",
        content: "Nord: Q8762 / Sud: A9543. Preferite il K...?",
        options: [
          "Dovunque, purche secco!",
          "In Est",
          "In Ovest",
          "Non importa",
        ],
        correctAnswer: 0,
        explanation: "Dovunque, purche secco! Con 10 carte, il K cadra sotto l'A.",
      },
      {
        type: "quiz",
        content: "Nord: A92 / Sud: Q54. Preferite il K...?",
        options: [
          "In Ovest: giocheremo cartina verso la Dama",
          "In Est",
          "Indifferente",
          "Non importa",
        ],
        correctAnswer: 0,
        explanation: "In Ovest! Giocheremo cartina verso la Dama: Est fara il suo Re, o subito o dopo, ma la Dama si affranchera.",
      },
      {
        type: "quiz",
        content: "Nord: Q5 / Sud: A8763. Preferite il K...?",
        options: [
          "In Ovest: giocheremo piccola verso la Dama",
          "In Est",
          "Indifferente",
          "Non importa",
        ],
        correctAnswer: 0,
        explanation: "In Ovest: giocheremo piccola verso la Dama. Ovest fara il Re, ma la Dama si affranchera.",
      },
    ],
  },
  {
    id: "ex-3-8",
    lesson: 3,
    title: "Onore da perdere e onore da non perdere",
    content: [
      {
        type: "text",
        content: "Guardate questi esempi e dite: quale onore perderete certamente? E quale dovreste evitare di pagare?",
      },
      {
        type: "quiz",
        content: "Nord: KQ96 / Sud: 10542. Onore da perdere? Onore da evitare?",
        options: [
          "Perdere l'A sempre; evitare di dare la presa al FANTE",
          "Perdere il K; evitare il 10",
          "Perdere la Q; evitare il J",
          "Nessun onore da perdere",
        ],
        correctAnswer: 0,
        explanation: "Dovremo sempre perdere l'Asso; speriamo di non dover dare la presa al Fante.",
      },
      {
        type: "quiz",
        content: "Nord: J1094 / Sud: K642. Onore da perdere? Onore da evitare?",
        options: [
          "Perdere l'A sempre; evitare di dare la presa alla DAMA",
          "Perdere il K; evitare il J",
          "Perdere il 10; evitare l'A",
          "Nessun onore da perdere",
        ],
        correctAnswer: 0,
        explanation: "Dovremo sempre perdere l'Asso; speriamo di non dover dare la presa alla Dama.",
      },
      {
        type: "quiz",
        content: "Nord: Q965 / Sud: J43. Onore da perdere? Onore da evitare?",
        options: [
          "Perdere A e K sempre; evitare di dare la presa al DIECI",
          "Perdere l'A; evitare la Q",
          "Perdere il K; evitare il J",
          "Nessun onore da perdere",
        ],
        correctAnswer: 0,
        explanation: "Dovremo perdere A e K; speriamo di non dover dare la presa al 10.",
      },
    ],
  },
];

// =============================================
// TEMA 4 - Gioco con Atout
// =============================================

const tema4: EserciziarioExercise[] = [
  {
    id: "ex-4-1",
    lesson: 4,
    title: "Taglio e atout",
    content: [
      {
        type: "text",
        content: "Esercizi sulla tecnica di taglio e gestione dell'atout.",
      },
      {
        type: "quiz",
        content: "Quando conviene tirare atout subito?",
        options: [
          "Quando abbiamo abbastanza vincenti e non ci servono tagli",
          "Sempre, prima di fare qualsiasi altra cosa",
          "Mai, meglio tagliare prima",
          "Solo quando abbiamo 10+ atout",
        ],
        correctAnswer: 0,
        explanation: "Si tirano le atout quando abbiamo vincenti sufficienti e non ci servono tagli nel morto.",
      },
      {
        type: "quiz",
        content: "Nord: ♠AKQ74 / Sud: ♠J1063. Quante volte dobbiamo battere atout se gli avversari ne hanno 3?",
        options: [
          "Una volta (se sono 3-0 o 2-1)",
          "Sempre tre volte",
          "Dipende dalla divisione: se 2-1 bastano 2 giri, se 3-0 ne servono 3",
          "Non serve battere atout",
        ],
        correctAnswer: 2,
        explanation: "Con 3 atout avversarie: se dividono 2-1 (78%) bastano 2 giri; se 3-0 servono 3 giri.",
      },
      {
        type: "quiz",
        content: "Che cos'e il 'taglio'?",
        options: [
          "Giocare una carta di atout quando non si ha il seme giocato",
          "Scartare una carta bassa",
          "Giocare l'Asso",
          "Passare il turno",
        ],
        correctAnswer: 0,
        explanation: "Il taglio (ruff) e giocare una carta di atout quando non si possiede il seme della presa.",
      },
      {
        type: "quiz",
        content: "Conviene tagliare nella mano lunga di atout?",
        options: [
          "No, di solito non conviene: quelle atout avrebbero vinto comunque",
          "Si, sempre",
          "Solo con 8+ atout in linea",
          "Solo in difesa",
        ],
        correctAnswer: 0,
        explanation: "Tagliare nella mano lunga non crea prese extra. E meglio tagliare nella mano corta.",
      },
    ],
  },
  {
    id: "ex-4-2",
    lesson: 4,
    title: "Piano di gioco ad atout",
    content: [
      {
        type: "text",
        content: "Pianificazione del gioco in un contratto a colore.",
      },
      {
        type: "quiz",
        content: "In un contratto ad atout, qual e il primo passo del piano di gioco?",
        options: [
          "Contare le perdenti (nella mano lunga di atout)",
          "Tirare subito le atout",
          "Tagliare nel morto",
          "Giocare le vincenti laterali",
        ],
        correctAnswer: 0,
        explanation: "In un contratto ad atout si contano le perdenti nella mano del giocante (mano lunga di atout).",
      },
      {
        type: "quiz",
        content: "Con 4♠ come contratto, quante perdenti possiamo permetterci?",
        options: [
          "3 (dobbiamo fare 10 prese, ne possiamo perdere 3)",
          "4",
          "2",
          "0",
        ],
        correctAnswer: 0,
        explanation: "4♠ = 10 prese necessarie, quindi possiamo perdere al massimo 3 prese.",
      },
      {
        type: "quiz",
        content: "Come si elimina una perdente?",
        options: [
          "Con l'impasse, il taglio nel morto, o lo scarto su una vincente laterale",
          "Solo con l'impasse",
          "Solo tirando atout",
          "Non si puo eliminare una perdente",
        ],
        correctAnswer: 0,
        explanation: "Le perdenti si eliminano con: impasse, taglio nel morto, scarto su vincenti laterali, affrancamento.",
      },
    ],
  },
];

// =============================================
// TEMA 5 - Piano di Gioco a SA
// =============================================

const tema5: EserciziarioExercise[] = [
  {
    id: "ex-5-1",
    lesson: 5,
    title: "Contare le vincenti a SA",
    content: [
      {
        type: "text",
        content: "Esercizi sul piano di gioco a Senza Atout.",
      },
      {
        type: "quiz",
        content: "In un contratto a SA, qual e il primo passo del piano di gioco?",
        options: [
          "Contare le vincenti immediate",
          "Contare le perdenti",
          "Giocare le carte alte",
          "Affrancamento di un colore lungo",
        ],
        correctAnswer: 0,
        explanation: "A SA si contano le vincenti (non le perdenti). Se ne mancano, si cercano fonti extra.",
      },
      {
        type: "quiz",
        content: "Nord: ♠A65 / Sud: ♠K74. Quante vincenti in Picche?",
        options: [
          "2 (Asso e Re)",
          "3",
          "1",
          "0",
        ],
        correctAnswer: 0,
        explanation: "Asso e Re sono 2 vincenti immediate. Le altre carte sono basse.",
      },
      {
        type: "quiz",
        content: "Perche a SA e importante l'affrancamento?",
        options: [
          "Perche non possiamo tagliare: l'unico modo per creare prese extra e affrancare un colore lungo",
          "Per divertimento",
          "Per confondere gli avversari",
          "Non e importante a SA",
        ],
        correctAnswer: 0,
        explanation: "Senza atout non si puo tagliare, quindi l'affrancamento e la tecnica principale per creare prese.",
      },
      {
        type: "quiz",
        content: "Nord: ♦KQJ109 / Sud: ♦A2. Quante prese possiamo fare in Quadri?",
        options: [
          "5 (tutte: A al Sud, poi KQJT9 al Nord dopo aver incassato l'A)",
          "2",
          "3",
          "4",
        ],
        correctAnswer: 0,
        explanation: "Incassiamo l'A al Sud, poi entriamo al Nord e le 4 carte alte di Quadri sono tutte vincenti = 5 prese.",
      },
    ],
  },
  {
    id: "ex-5-2",
    lesson: 5,
    title: "Comunicazioni e rientri",
    content: [
      {
        type: "quiz",
        content: "Cosa si intende per 'rientro' (entry)?",
        options: [
          "Una carta alta che permette di passare il gioco all'altra mano della linea",
          "L'apertura dell'asta",
          "La prima carta giocata",
          "Un tipo di impasse",
        ],
        correctAnswer: 0,
        explanation: "Un rientro e una carta alta in una mano che ci consente di trasferire il gioco a quella mano.",
      },
      {
        type: "quiz",
        content: "Perche i rientri sono fondamentali a SA?",
        options: [
          "Per poter incassare le carte affrancate: senza rientro le vincenti nel morto sono irraggiungibili",
          "Non sono fondamentali",
          "Solo per fare impasse",
          "Solo in difesa",
        ],
        correctAnswer: 0,
        explanation: "Senza rientri, le carte affrancate nel morto non si possono incassare. I rientri sono vitali.",
      },
    ],
  },
];

// =============================================
// TEMA 6 - Piano di Gioco ad Atout
// =============================================

const tema6: EserciziarioExercise[] = [
  {
    id: "ex-6-1",
    lesson: 6,
    title: "Quando tirare atout e quando no",
    content: [
      {
        type: "text",
        content: "Esercizi sulla decisione di tirare o meno le atout.",
      },
      {
        type: "quiz",
        content: "Se il mio piano prevede di tagliare nel morto, quando devo tirare atout?",
        options: [
          "DOPO aver effettuato i tagli necessari",
          "PRIMA di tagliare",
          "Non fa differenza",
          "Mai",
        ],
        correctAnswer: 0,
        explanation: "Se servono tagli nel morto, devo conservare le atout del morto. Tiro atout solo dopo i tagli.",
      },
      {
        type: "quiz",
        content: "Se ho vincenti sufficienti e non mi servono tagli, cosa faccio?",
        options: [
          "Tiro atout subito per evitare che gli avversari taglino le mie vincenti laterali",
          "Aspetto",
          "Taglio lo stesso nel morto",
          "Gioco le vincenti laterali prima",
        ],
        correctAnswer: 0,
        explanation: "Se non servono tagli, meglio togliere le atout agli avversari subito per proteggere le vincenti.",
      },
      {
        type: "quiz",
        content: "Con fit 4-4 in atout, e piu vantaggioso tagliare dove?",
        options: [
          "Nel morto (la mano corta tagliando crea prese extra)",
          "Nella mano del giocante",
          "Non fa differenza",
          "In entrambe le mani",
        ],
        correctAnswer: 0,
        explanation: "Con fit 4-4, tagliare nella mano corta (morto) crea prese extra. La mano lunga le aveva gia.",
      },
    ],
  },
];

// =============================================
// TEMA 7 - Valutazione della Mano
// =============================================

const tema7: EserciziarioExercise[] = [
  {
    id: "ex-7-1",
    lesson: 7,
    title: "Punti onore e punti distribuzione",
    content: [
      {
        type: "text",
        content: "Esercizi sulla valutazione della mano per la dichiarazione.",
      },
      {
        type: "hand-eval",
        content: "Quanti punti onore (PO) ha questa mano? ♠AKJ5 ♥Q83 ♦K72 ♣J64",
        cards: "♠AKJ5 ♥Q83 ♦K72 ♣J64",
        correctValue: 14,
        explanation: "♠A(4)+K(3)+J(1) = 8, ♥Q(2) = 2, ♦K(3) = 3, ♣J(1) = 1. Totale: 14 PO.",
      },
      {
        type: "hand-eval",
        content: "Quanti punti onore ha questa mano? ♠Q1074 ♥AK ♦9843 ♣A52",
        cards: "♠Q1074 ♥AK ♦9843 ♣A52",
        correctValue: 13,
        explanation: "♠Q(2) = 2, ♥A(4)+K(3) = 7, ♣A(4) = 4. Totale: 13 PO.",
      },
      {
        type: "quiz",
        content: "Con quale minimo di PO si apre in prima/seconda posizione?",
        options: [
          "12 PO (a volte 11 con buona distribuzione)",
          "15 PO",
          "10 PO",
          "8 PO",
        ],
        correctAnswer: 0,
        explanation: "L'apertura richiede almeno 12 PO, talvolta 11 con distribuzione favorevole.",
      },
      {
        type: "quiz",
        content: "Quanti punti totali nel mazzo?",
        options: [
          "40 punti onore",
          "52 punti",
          "37 punti",
          "48 punti",
        ],
        correctAnswer: 0,
        explanation: "4 Assi (16) + 4 Re (12) + 4 Donne (8) + 4 Fanti (4) = 40 punti onore totali.",
      },
    ],
  },
  {
    id: "ex-7-2",
    lesson: 7,
    title: "Scelta dell'apertura",
    content: [
      {
        type: "bid-select",
        content: "♠AK843 ♥72 ♦KQ5 ♣J93 — Con 13 PO e 5 Picche, cosa apri?",
        options: ["1♠", "1♦", "1SA", "Passo"],
        correctAnswer: 0,
        explanation: "13 PO e un colore quinto nobile: apertura di 1♠.",
      },
      {
        type: "bid-select",
        content: "♠KJ5 ♥A83 ♦KQ72 ♣Q64 — Con 15 PO e mano bilanciata, cosa apri?",
        options: ["1SA", "1♦", "1♣", "Passo"],
        correctAnswer: 0,
        explanation: "15-17 PO e distribuzione bilanciata (4-3-3-3): apertura 1SA.",
      },
      {
        type: "bid-select",
        content: "♠Q7 ♥KJ965 ♦A83 ♣K104 — Con 13 PO e 5 Cuori, cosa apri?",
        options: ["1♥", "1♦", "1SA", "Passo"],
        correctAnswer: 0,
        explanation: "13 PO e colore quinto: si apre nel colore quinto, 1♥.",
      },
    ],
  },
];

// =============================================
// TEMA 8 - Aperture e Risposte
// =============================================

const tema8: EserciziarioExercise[] = [
  {
    id: "ex-8-1",
    lesson: 8,
    title: "Risposte all'apertura di 1SA",
    content: [
      {
        type: "text",
        content: "Esercizi sulle risposte all'apertura di 1 Senza Atout.",
      },
      {
        type: "quiz",
        content: "Il partner apre 1SA (15-17). Voi avete 8 PO. Cosa rispondete?",
        options: [
          "3SA (con 8 PO + almeno 15 del partner = 23+ punti totali in linea)",
          "Passo",
          "2SA",
          "2♣ Stayman",
        ],
        correctAnswer: 0,
        explanation: "Con 8+ PO di fronte a 1SA (15-17), si hanno 23+ punti in linea: si va a manche 3SA.",
      },
      {
        type: "quiz",
        content: "Il partner apre 1SA. Voi avete ♠Q9843 ♥72 ♦J64 ♣852 (3 PO). Cosa fate?",
        options: [
          "2♠ (transfer: mostrate le 5+ Picche e giocate in parziale)",
          "Passo",
          "3♠",
          "2♣ Stayman",
        ],
        correctAnswer: 0,
        explanation: "Con mano debole e 5 carte a Picche, si usa il transfer 2♠ per giocare un parziale a Picche.",
      },
      {
        type: "quiz",
        content: "Quando si usa la Stayman 2♣ su apertura 1SA?",
        options: [
          "Quando si ha un colore quarto nobile (4♥ o 4♠) e almeno 8+ PO",
          "Sempre con 10+ PO",
          "Solo con 4-4 nei nobili",
          "Mai senza 12 PO",
        ],
        correctAnswer: 0,
        explanation: "Stayman cerca un fit 4-4 in un nobile. Serve almeno un quarto nobile e 8+ PO.",
      },
    ],
  },
];

// =============================================
// TEMA 9 - Risposte ad Apertura a Colore
// =============================================

const tema9: EserciziarioExercise[] = [
  {
    id: "ex-9-1",
    lesson: 9,
    title: "Risposte all'apertura di 1 a colore",
    content: [
      {
        type: "text",
        content: "Esercizi sulle risposte all'apertura di 1 a colore.",
      },
      {
        type: "quiz",
        content: "Il partner apre 1♥. Con quanti PO siete obbligati a rispondere?",
        options: [
          "Con 6+ PO (obbligo di risposta)",
          "Con 10+ PO",
          "Con 12+ PO",
          "Con 8+ PO",
        ],
        correctAnswer: 0,
        explanation: "Con 6+ PO si risponde sempre all'apertura del partner. Sotto i 6 PO si passa.",
      },
      {
        type: "quiz",
        content: "Partner apre 1♥. Avete ♠K742 ♥Q83 ♦964 ♣J75 (6 PO e 3 carte ♥). Risposta?",
        options: [
          "2♥ (appoggio con 3+ carte nel seme del partner e 6-9 PO)",
          "1♠",
          "1SA",
          "Passo",
        ],
        correctAnswer: 0,
        explanation: "Con 3+ carte nel seme del partner e 6-9 PO si da l'appoggio semplice (2♥).",
      },
      {
        type: "quiz",
        content: "Partner apre 1♦. Avete ♠AQ85 ♥KJ3 ♦72 ♣10964 (10 PO). Risposta?",
        options: [
          "1♠ (si nomina il proprio colore quarto nobile dal basso)",
          "1SA",
          "2♣",
          "2♦",
        ],
        correctAnswer: 0,
        explanation: "Con un quarto nobile e 6+ PO, si nomina il proprio colore a livello 1 (1♠).",
      },
      {
        type: "quiz",
        content: "Qual e il significato della risposta 1SA sull'apertura 1 a colore?",
        options: [
          "6-9 PO, nessun fit con il partner, nessun colore quarto nominabile a livello 1",
          "10-12 PO bilanciati",
          "Proposta di manche a SA",
          "Obbligo per una volta",
        ],
        correctAnswer: 0,
        explanation: "1SA = 6-9 PO, risposta di ripiego quando non si puo appoggiare ne nominare un colore.",
      },
    ],
  },
];

// =============================================
// TEMA 10 - Ridichiara dell'Apertore
// =============================================

const tema10: EserciziarioExercise[] = [
  {
    id: "ex-10-1",
    lesson: 10,
    title: "La ridichiara",
    content: [
      {
        type: "text",
        content: "Esercizi sulla ridichiara dell'apertore dopo la risposta del partner.",
      },
      {
        type: "quiz",
        content: "Avete aperto 1♥ con 14 PO. Il partner risponde 1♠ (6+ PO). Che fascia siete?",
        options: [
          "Fascia minima (12-15 PO): ridichiara al livello piu basso possibile",
          "Fascia intermedia (16-18 PO)",
          "Fascia massima (19+ PO)",
          "Non devo ridichiarare",
        ],
        correctAnswer: 0,
        explanation: "Con 14 PO siete in fascia minima (12-15). Ridichiarate al livello piu basso senza forzare.",
      },
      {
        type: "quiz",
        content: "Avete aperto 1♦ con 17 PO. Partner risponde 1♠. Come ridichiarate?",
        options: [
          "Con un salto (es. 2SA o 3♦) per mostrare 16-18 PO: fascia intermedia",
          "Passo",
          "Al livello minimo",
          "4♠ direttamente",
        ],
        correctAnswer: 0,
        explanation: "Con 17 PO siete in fascia intermedia (16-18): ridichiarate con un salto per comunicarlo.",
      },
      {
        type: "quiz",
        content: "Cosa significa quando l'apertore ripete il proprio colore (es. 1♥ - 1♠ - 2♥)?",
        options: [
          "Ha almeno 6 carte nel colore e fascia minima",
          "Ha 4 carte",
          "Ha 5 carte e tanti punti",
          "Vuole giocare a SA",
        ],
        correctAnswer: 0,
        explanation: "La ripetizione del colore a livello minimo mostra 6+ carte e fascia minima (12-15 PO).",
      },
    ],
  },
];

// =============================================
// TEMA 11 - L'Intervento
// =============================================

const tema11: EserciziarioExercise[] = [
  {
    id: "ex-11-1",
    lesson: 11,
    title: "Intervento e contre",
    content: [
      {
        type: "text",
        content: "Esercizi sull'intervento e il contro informativo.",
      },
      {
        type: "quiz",
        content: "L'avversario destro apre 1♥. Cos'e un 'intervento'?",
        options: [
          "Una dichiarazione fatta dopo l'apertura avversaria per competere nell'asta",
          "Un tipo di giocata in difesa",
          "Una penalita",
          "Una convenzione",
        ],
        correctAnswer: 0,
        explanation: "L'intervento e una dichiarazione competitiva fatta dopo l'apertura dell'avversario.",
      },
      {
        type: "quiz",
        content: "Quando e opportuno intervenire a colore?",
        options: [
          "Con un buon colore quinto+ e 8-15 PO circa",
          "Solo con 12+ PO",
          "Con qualsiasi mano",
          "Mai, e rischioso",
        ],
        correctAnswer: 0,
        explanation: "L'intervento a colore richiede un buon colore quinto (o sesto) e circa 8-15 PO.",
      },
      {
        type: "quiz",
        content: "Cos'e il 'Contre' (X) informativo?",
        options: [
          "Un Contre che chiede al partner di dichiarare il suo colore migliore tra quelli non nominati",
          "Un Contre di penalita",
          "Un raddoppio del punteggio",
          "Una richiesta di passo",
        ],
        correctAnswer: 0,
        explanation: "Il Contre informativo chiede al partner di scegliere tra i colori non nominati dall'avversario.",
      },
      {
        type: "quiz",
        content: "Requisiti per il Contre informativo su apertura 1♥?",
        options: [
          "12+ PO e supporto (almeno 3 carte) nei colori non dichiarati (♠, ♦, ♣)",
          "16+ PO qualsiasi mano",
          "Solo con 4-4 nei minori",
          "8+ PO e 5 carte a Picche",
        ],
        correctAnswer: 0,
        explanation: "Il Contre informativo richiede 12+ PO e supporto nei colori non dichiarati dall'avversario.",
      },
    ],
  },
];

// =============================================
// TEMA 12 - Dichiarazione Competitiva
// =============================================

const tema12: EserciziarioExercise[] = [
  {
    id: "ex-12-1",
    lesson: 12,
    title: "Sviluppi dopo l'intervento",
    content: [
      {
        type: "text",
        content: "Esercizi sulla dichiarazione competitiva e gli sviluppi dopo l'intervento avversario.",
      },
      {
        type: "quiz",
        content: "Il partner apre 1♥, l'avversario interviene 1♠. Con ♥K843 e 8 PO, cosa fate?",
        options: [
          "2♥ (appoggio semplice, come senza intervento)",
          "Passo obbligato",
          "Contre",
          "2♠",
        ],
        correctAnswer: 0,
        explanation: "Con fit e 6-9 PO si da appoggio semplice, come senza intervento.",
      },
      {
        type: "quiz",
        content: "Cos'e il 'Contre' del rispondente sull'intervento avversario?",
        options: [
          "Un Contre che mostra 9+ PO e valori nei colori non dichiarati (Contre negativo)",
          "Un Contre di penalita",
          "Una richiesta di passo",
          "Significa che odia l'apertura del partner",
        ],
        correctAnswer: 0,
        explanation: "Il Contre del rispondente (negativo) mostra PO e valori, specialmente nei colori non nominati.",
      },
      {
        type: "quiz",
        content: "Perche la dichiarazione competitiva e importante?",
        options: [
          "Perche in molte mani entrambe le coppie possono fare un parziale: chi dichiara di piu vince",
          "Non e importante",
          "Solo per confondere gli avversari",
          "Solo quando si ha 20+ PO in linea",
        ],
        correctAnswer: 0,
        explanation: "In mani competitive (20 PO per parte), chi dichiara meglio conquista il parziale e i punti.",
      },
    ],
  },
];

// =============================================
// EXPORT: Convert to LessonModule format for integration with lessons.ts
// =============================================

import type { LessonModule } from "./lessons";

function toModules(exercises: EserciziarioExercise[], lessonNum: number): LessonModule[] {
  return exercises.map((ex, idx) => ({
    id: `eserciziario-${lessonNum}-${idx + 1}`,
    title: `\u{1F4DD} ${ex.title}`,
    duration: "5 min",
    type: "exercise" as const,
    content: ex.content,
    xpReward: 40,
  }));
}

export const eserciziarioModules: Record<number, LessonModule[]> = {
  1: toModules(tema1, 1),
  2: toModules(tema2, 2),
  3: toModules(tema3, 3),
  4: toModules(tema4, 4),
  5: toModules(tema5, 5),
  6: toModules(tema6, 6),
  7: toModules(tema7, 7),
  8: toModules(tema8, 8),
  9: toModules(tema9, 9),
  10: toModules(tema10, 10),
  11: toModules(tema11, 11),
  12: toModules(tema12, 12),
};

export function getEserciziarioForLesson(lessonId: number): LessonModule[] {
  return eserciziarioModules[lessonId] || [];
}

export const allExercises: EserciziarioExercise[] = [
  ...tema1, ...tema2, ...tema3, ...tema4,
  ...tema5, ...tema6, ...tema7, ...tema8,
  ...tema9, ...tema10, ...tema11, ...tema12,
];
