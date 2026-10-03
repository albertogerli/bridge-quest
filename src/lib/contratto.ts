/**
 * Legge un contratto scritto in qualunque delle forme che circolano nel
 * progetto: «4S», «4♠», «3NT», «3SA», «4SX», «4♠X», «2HXX», con o senza spazi.
 *
 * PERCHÉ UN MODULO A PARTE, SENZA IMPORT. Lo usano sia il motore di gioco sia
 * il solutore DDS, che gira in un worker e non può tirarsi dietro il motore.
 * Prima c'erano due copie dello stesso parser, ed entrambe sbagliavano allo
 * stesso modo: il contro non lo toglievano. «4♠X» cercava il seme «♠X», non lo
 * trovava e ripiegava sul senz'atout — senza errori, con la smazzata giocata a
 * un altro contratto. Il taglio del giocante perdeva la presa (ottobre 2026,
 * segnalato da un'allieva sulla mano del giorno, smazzata Q11-7).
 *
 * UN SEME NON RICONOSCIUTO È UN ERRORE, NON UN SENZ'ATOUT: il senz'atout va
 * scritto (NT, SA, N). `leggiContratto` lancia; `parseContract` del motore,
 * chiamato durante il render, ripiega sul senz'atout solo per stringhe che
 * non sono affatto contratti.
 */
export type SemeContratto = "spade" | "heart" | "diamond" | "club";

export interface ContrattoLetto {
  level: number;
  /** null = senz'atout */
  trumpSuit: SemeContratto | null;
  tricksNeeded: number;
  /** 0 nessun contro, 1 contrato, 2 surcontrato */
  contro: 0 | 1 | 2;
}

const SEMI: Record<string, SemeContratto | null> = {
  NT: null,
  SA: null,
  N: null,
  S: "spade",
  "♠": "spade",
  H: "heart",
  "♥": "heart",
  D: "diamond",
  "♦": "diamond",
  C: "club",
  "♣": "club",
};

export function leggiContratto(contratto: string): ContrattoLetto {
  // U+FE0F: il selettore di variante che alcune tastiere attaccano ai simboli.
  const pulito = contratto.replace(/[\s️]/g, "").toUpperCase();
  const m = pulito.match(/^([1-7])(.+?)(XX|X)?$/);
  if (!m || !(m[2] in SEMI)) {
    throw new Error(`Contratto non riconosciuto: «${contratto}»`);
  }
  const level = Number(m[1]);
  return {
    level,
    trumpSuit: SEMI[m[2]],
    tricksNeeded: level + 6,
    contro: m[3] === "XX" ? 2 : m[3] === "X" ? 1 : 0,
  };
}
