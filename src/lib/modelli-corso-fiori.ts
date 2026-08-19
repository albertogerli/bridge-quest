import type { DealConstraints } from "@/lib/deal-generator";

/**
 * Un modello di mani per ogni lezione del Corso Fiori.
 *
 * PERCHÉ QUESTO È IL PEZZO CHE CONTA. Il motore di generazione accetta vincoli
 * molto espressivi, e un insegnante che sa comporli si costruisce quello che
 * vuole. Ma nessun insegnante di primo livello aprirà il portale e comporrà un
 * vincolo la prima sera: aprirà, cercherà «la lezione di stasera», e se non la
 * trova chiuderà. Questi tredici modelli sono la differenza fra uno strumento
 * potente e uno strumento usato.
 *
 * COME SONO SCRITTI. Ogni vincolo prova a produrre la situazione DIDATTICA
 * della lezione, non una mano a caso che la riguarda. Per «Vincenti e
 * affrancabili» non basta dare punti al giocante: serve un colore lungo che si
 * possa affrancare, o l'esercizio non si presenta. Dove il vincolo non può
 * catturare l'argomento — il piano di gioco, per esempio, che sta nella testa e
 * non nelle carte — si punta alla situazione in cui quell'argomento serve.
 *
 * SUD È SEMPRE IL PROTAGONISTA, perché è il posto da cui gioca l'allievo in
 * tutto il resto dell'applicazione. Un modello che mettesse la mano
 * interessante a Ovest sarebbe corretto e inutile.
 */

export interface ModelloLezione {
  lessonId: number;
  nome: string;
  descrizione: string;
  vincoli: DealConstraints;
}

export const MODELLI_CORSO_FIORI: ModelloLezione[] = [
  {
    lessonId: 0,
    nome: "Prime prese",
    descrizione:
      "Mani piatte e senza sorprese: si contano le prese e basta. Nessuno dei quattro ha una lunga da sfruttare.",
    // Tutti bilanciati: nessun colore lungo da affrancare, nessuna taglia. La
    // mano si gioca contando gli onori, che è tutto quello che si sa alla
    // prima lezione.
    vincoli: {
      north: { balanced: true },
      south: { balanced: true },
      east: { balanced: true },
      west: { balanced: true },
      nsHcp: { min: 20, max: 24 },
    },
  },
  {
    lessonId: 1,
    nome: "Vincenti e affrancabili",
    descrizione:
      "Sud ha un colore lungo con onori spaiati: le prese ci sono ma vanno affrancate, non raccolte.",
    // Il punto della lezione è la differenza fra una presa che c'è già e una
    // che va costruita: serve un colore di cinque carte con dentro degli onori
    // ma non tutti, o non ci sarebbe niente da affrancare.
    vincoli: {
      south: { hcp: { min: 12, max: 17 }, spade: { min: 5 }, qualita: [{ suit: "spade", minOnori: 2 }] },
      north: { spade: { min: 2, max: 3 } },
      nsHcp: { min: 22, max: 27 },
    },
  },
  {
    lessonId: 2,
    nome: "Il punto di vista dei difensori",
    descrizione:
      "La mano è degli avversari: Nord-Sud difendono, con abbastanza carte da poter sbagliare l'attacco.",
    // La linea dell'allievo NON deve giocare: è l'unica lezione in cui la mano
    // buona va data agli altri, o l'esercizio non esiste.
    vincoli: {
      ewHcp: { min: 24, max: 30 },
      south: { hcp: { min: 6, max: 11 } },
    },
  },
  {
    lessonId: 3,
    nome: "Affrancamenti di lunga e di posizione",
    descrizione:
      "Una lunga di sei carte in mano al giocante, con l'onore mancante da posizionare: si sceglie da che parte giocare.",
    vincoli: {
      south: { hcp: { min: 12, max: 18 }, heart: { min: 6 }, qualita: [{ suit: "heart", minOnori: 2 }] },
      nsHcp: { min: 23, max: 28 },
    },
  },
  {
    lessonId: 4,
    nome: "Il piano di gioco a senz'atout",
    descrizione:
      "Nord-Sud bilanciati con i punti della manche a senz'atout: nessun fit, si contano le prese prima di partire.",
    // Niente fit maggiore: se ci fosse, la mano si giocherebbe a colore e il
    // piano a senz'atout non si porrebbe.
    vincoli: {
      north: { balanced: true, spade: { max: 4 }, heart: { max: 4 } },
      south: { balanced: true, spade: { max: 4 }, heart: { max: 4 } },
      nsHcp: { min: 25, max: 29 },
    },
  },
  {
    lessonId: 5,
    nome: "Il gioco con l'atout",
    descrizione:
      "Fit di nove carte a cuori e una corta dalla parte giusta: l'atout serve a tagliare, non solo a proteggere.",
    vincoli: {
      south: { hcp: { min: 11, max: 17 }, heart: { min: 5 } },
      north: { heart: { min: 4 }, cortezze: [{ max: 2 }] },
      nsHcp: { min: 23, max: 28 },
    },
  },
  {
    lessonId: 6,
    nome: "Il piano di gioco con l'atout",
    descrizione:
      "Manche a colore con un colore laterale da affrancare: prima si conta, poi si tira atout — o non si tira.",
    vincoli: {
      south: { hcp: { min: 13, max: 19 }, spade: { min: 5 }, diamond: { min: 4 } },
      north: { spade: { min: 3 } },
      nsHcp: { min: 25, max: 30 },
    },
  },
  {
    lessonId: 7,
    nome: "La valutazione della mano",
    descrizione:
      "Mani sulla soglia, 11-13 punti, dove il conteggio secco non basta: si valuta la distribuzione.",
    // La zona in cui la scelta è difficile: con 8 punti o con 20 non c'è
    // niente da valutare.
    vincoli: {
      south: { hcp: { min: 11, max: 13 } },
      north: { hcp: { min: 10, max: 13 } },
    },
  },
  {
    lessonId: 8,
    nome: "L'apertura e la risposta",
    descrizione:
      "Sud apre di 1SA con 15-17 bilanciati e Nord ha di che rispondere: la sequenza più frequente del corso.",
    vincoli: {
      south: { hcp: { min: 15, max: 17 }, balanced: true },
      north: { hcp: { min: 8, max: 14 } },
    },
  },
  {
    lessonId: 9,
    nome: "Aperture di 1 a colore. Le risposte",
    descrizione:
      "Sud apre di 1 in un colore — nobile o minore — e Nord ha i punti per parlare.",
    vincoli: {
      south: {
        hcp: { min: 12, max: 19 },
        // «Apre 1♠ oppure 1♥ oppure 1♦»: è un esercizio solo, e l'OR del
        // generatore serve esattamente a questo.
        oppure: [{ spade: { min: 5 } }, { heart: { min: 5 } }, { diamond: { min: 4 } }],
      },
      north: { hcp: { min: 6, max: 12 } },
    },
  },
  {
    lessonId: 10,
    nome: "L'apertore descrive",
    descrizione:
      "Sud apre bicolore, 5-4: la seconda dichiarazione racconta la mano invece di ripetere il primo colore.",
    vincoli: {
      south: {
        hcp: { min: 12, max: 18 },
        spade: { min: 5 },
        heart: { min: 4 },
        piuLungo: [["spade", "heart"]],
      },
      north: { hcp: { min: 6, max: 12 } },
    },
  },
  {
    lessonId: 11,
    nome: "L'intervento",
    descrizione:
      "Gli avversari aprono e Sud ha un colore per intervenire: punti giusti e un colore che regge.",
    // Est ha i punti per aprire, Sud abbastanza per parlare ma non per
    // dominare: è la situazione dell'intervento, non della manche.
    vincoli: {
      east: { hcp: { min: 12, max: 18 } },
      south: { hcp: { min: 8, max: 15 }, spade: { min: 5 }, qualita: [{ suit: "spade", minOnori: 2 }] },
    },
  },
  {
    lessonId: 12,
    nome: "Sviluppi dopo l'intervento avversario",
    descrizione:
      "Nord-Sud aprono, gli avversari intervengono: la sequenza continua in competizione, con i punti divisi.",
    vincoli: {
      south: { hcp: { min: 12, max: 17 }, heart: { min: 5 } },
      west: { hcp: { min: 10, max: 15 }, spade: { min: 5 } },
      north: { hcp: { min: 6, max: 11 } },
    },
  },
];

/** Il modello ufficiale di una lezione, se c'è. */
export function modelloDellaLezione(lessonId: number): ModelloLezione | undefined {
  return MODELLI_CORSO_FIORI.find((m) => m.lessonId === lessonId);
}
