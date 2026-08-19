import type { Card, Position, Rank, Suit } from "@/lib/bridge-engine";

/**
 * Le combinazioni classiche del programma di primo livello.
 *
 * PERCHÉ ESISTONO COME POSIZIONI PARZIALI. Metà della didattica del gioco della
 * carta si fa su quattro carte, non su tredici: «AQ in mano e 32 al morto, come
 * fai due prese» è una lezione intera, e darla dentro una smazzata completa
 * significa nasconderla dentro dodici prese che non c'entrano. La posizione
 * parziale è la lezione, senza il rumore.
 *
 * TUTTE E QUATTRO LE MANI CI SONO, con lo stesso numero di carte. Non è una
 * formalità: il motore fa giocare quattro persone a turno, e una posizione in
 * cui due hanno tre carte e due ne hanno due non è una posizione di bridge.
 * Le carte degli avversari sono quelle che rendono la combinazione quella che
 * è — l'impasse funziona o no a seconda di dove sta il Re.
 */

export interface Combinazione {
  id: string;
  nome: string;
  descrizione: string;
  /** Cosa si chiede di ottenere. */
  obiettivo: string;
  atout: Suit | null;
  hands: Record<Position, Card[]>;
  /** Da quale posto si ragiona. */
  posizione: Position;
}

const c = (suit: Suit, rank: Rank): Card => ({ suit, rank });

export const COMBINAZIONI: Combinazione[] = [
  {
    id: "impasse-semplice",
    nome: "L'impasse semplice",
    descrizione:
      "Asso e Dama in mano, due piccole al morto. Il Re è a sinistra o a destra: da una parte si fanno due prese, dall'altra una.",
    obiettivo: "Fai due prese a picche.",
    atout: null,
    posizione: "south",
    hands: {
      // Sud ha A Q, Nord due piccole: si parte dal morto verso la Dama.
      south: [c("spade", "A"), c("spade", "Q"), c("heart", "2")],
      north: [c("spade", "3"), c("spade", "2"), c("heart", "3")],
      west: [c("spade", "K"), c("spade", "5"), c("heart", "4")],
      east: [c("spade", "9"), c("spade", "4"), c("heart", "5")],
    },
  },
  {
    id: "doppio-impasse",
    nome: "Il doppio impasse",
    descrizione:
      "Asso, Dama e Fante contro Re e Dieci: due impasse di fila, e bisogna cominciare dalla parte giusta.",
    obiettivo: "Fai tre prese a picche.",
    atout: null,
    posizione: "south",
    hands: {
      south: [c("spade", "A"), c("spade", "Q"), c("spade", "J"), c("heart", "2")],
      north: [c("spade", "4"), c("spade", "3"), c("spade", "2"), c("heart", "3")],
      west: [c("spade", "K"), c("spade", "8"), c("spade", "7"), c("heart", "4")],
      east: [c("spade", "10"), c("spade", "9"), c("spade", "6"), c("heart", "5")],
    },
  },
  {
    id: "taglio-in-mano",
    nome: "Il taglio in mano",
    descrizione:
      "Una perdente a quadri e una corta al morto: la si taglia con l'atout invece di regalarla.",
    obiettivo: "Fai tre prese: taglia la quadri perdente.",
    atout: "spade",
    posizione: "south",
    hands: {
      south: [c("spade", "A"), c("diamond", "8"), c("diamond", "7")],
      north: [c("spade", "K"), c("spade", "2"), c("diamond", "2")],
      west: [c("diamond", "A"), c("diamond", "K"), c("heart", "4")],
      east: [c("diamond", "Q"), c("diamond", "J"), c("heart", "5")],
    },
  },
  {
    id: "muovere-la-lunga",
    nome: "Muovere il colore lungo",
    descrizione:
      "Cinque carte contro tre: si perde la prima presa per farne due, invece di tenersi gli onori e non fare niente.",
    obiettivo: "Fai due prese a fiori dopo averne ceduta una.",
    atout: null,
    posizione: "south",
    hands: {
      south: [c("club", "A"), c("club", "5"), c("club", "4")],
      north: [c("club", "K"), c("club", "3"), c("club", "2")],
      west: [c("club", "Q"), c("club", "9"), c("club", "8")],
      east: [c("club", "J"), c("club", "10"), c("club", "7")],
    },
  },
];

/** Quante carte ha ogni posto: una posizione valida ne ha lo stesso numero. */
export function lunghezze(hands: Record<Position, Card[]>): number[] {
  return (["north", "east", "south", "west"] as Position[]).map((p) => hands[p]?.length ?? 0);
}

export interface ProblemaPosizione {
  campo: "lunghezza" | "doppioni" | "vuota";
  messaggio: string;
}

/**
 * Cosa non va in una posizione composta a mano.
 *
 * Si controlla PRIMA di far giocare, perché gli errori qui non si vedono: una
 * carta ripetuta in due mani non dà nessun errore al motore, semplicemente
 * produce un gioco impossibile — e chi lo scopre è l'allievo, davanti a una
 * combinazione che non torna.
 */
export function problemiDi(hands: Record<Position, Card[]>): ProblemaPosizione[] {
  const problemi: ProblemaPosizione[] = [];
  const l = lunghezze(hands);

  if (l.every((x) => x === 0)) {
    problemi.push({ campo: "vuota", messaggio: "Non c'è nessuna carta." });
    return problemi;
  }
  if (new Set(l).size > 1) {
    problemi.push({
      campo: "lunghezza",
      messaggio: `Ogni posto deve avere lo stesso numero di carte: adesso sono ${l.join(", ")}.`,
    });
  }

  const viste = new Set<string>();
  const doppie: string[] = [];
  for (const p of ["north", "east", "south", "west"] as Position[]) {
    for (const carta of hands[p] ?? []) {
      const k = `${carta.suit}-${carta.rank}`;
      if (viste.has(k)) doppie.push(k);
      viste.add(k);
    }
  }
  if (doppie.length > 0) {
    problemi.push({
      campo: "doppioni",
      messaggio: `Queste carte compaiono in più di una mano: ${doppie.length}.`,
    });
  }

  return problemi;
}
