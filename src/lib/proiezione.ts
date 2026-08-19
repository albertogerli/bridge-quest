import type { Card, Position } from "@/lib/bridge-engine";

/**
 * Il canale fra il tavolo dell'insegnante e la finestra proiettata.
 *
 * PERCHÉ NON IL REALTIME. Il tavolo condiviso passa da Supabase perché mette in
 * comunicazione persone diverse su macchine diverse. Qui le due finestre sono
 * sullo STESSO computer — è un portatile con un proiettore attaccato — e farle
 * parlare attraverso un server a Francoforte significherebbe due cose, en-
 * trambe brutte: un ritardo di rete su ogni gesto, e una classe che guarda una
 * schermata ferma se il wi-fi del circolo fa i capricci.
 *
 * `BroadcastChannel` è locale al browser: la latenza è quella di una chiamata
 * di funzione, e senza connessione funziona esattamente uguale. Il requisito
 * dei 200 ms non è un problema da risolvere, è una conseguenza.
 *
 * IL LIMITE, DETTO SUBITO: funziona fra finestre dello stesso browser. Un
 * secondo dispositivo — un tablet in fondo alla sala — non è coperto. Se
 * servirà, la strada è il tavolo condiviso che esiste già, non questo.
 *
 * ----------------------------------------------------------------------------
 * LE MANI NASCOSTE NON PARTONO
 * ----------------------------------------------------------------------------
 *
 * Il requisito dice «non nasconderle via CSS: non devono proprio arrivare al
 * client proiettato», e vale la pena spiegare perché conta in una sala e non
 * solo sulla carta. Il proiettore è collegato a una finestra vera, con i suoi
 * strumenti per sviluppatori, e capita che qualcuno la ridimensioni o la
 * sposti davanti a tutti. Ma il motivo più concreto è un altro: se le mani ci
 * fossero, prima o poi un difetto di rendering ne mostrerebbe una — e
 * succederebbe davanti a una classe, nel momento peggiore.
 *
 * `costruisciStato` è l'unico punto in cui si compone il messaggio, e toglie le
 * mani coperte PRIMA di spedirle. Chi aggiunge un campo nuovo lo aggiunge lì.
 */

export const CANALE_PROIEZIONE = "bridgelab-proiezione";

/** Cosa la classe deve vedere. Lo decide il pannello dell'insegnante. */
export interface ImpostazioniProiezione {
  /** Le posizioni scoperte. Le altre non vengono spedite. */
  scoperti: Position[];
  mostraDichiarazione: boolean;
  mostraGiocate: boolean;
  mostraDoppioMorto: boolean;
  mostraDivisioni: boolean;
}

export const IMPOSTAZIONI_INIZIALI: ImpostazioniProiezione = {
  scoperti: [],
  mostraDichiarazione: false,
  mostraGiocate: true,
  mostraDoppioMorto: false,
  mostraDivisioni: false,
};

/** Lo stato che viaggia verso la finestra proiettata. Solo il visibile. */
export interface StatoProiezione {
  titolo: string | null;
  /** SOLO le posizioni scoperte: le altre non sono qui dentro. */
  mani: Partial<Record<Position, Card[]>>;
  /** Tutte le posizioni della mano, per disegnare i riquadri coperti. */
  posizioni: Position[];
  dichiarazione: { dealer: Position; bids: string[] } | null;
  giocate: { seat: Position; card: Card }[];
  contratto: string | null;
  dichiarante: Position | null;
  /** Prese a carte scoperte, se l'insegnante ha acceso l'analisi. */
  doppioMorto: string | null;
  mostraDivisioni: boolean;
  /** Per far capire alla finestra proiettata se il comando è ancora vivo. */
  battito: number;
}

type Messaggio =
  | { tipo: "stato"; stato: StatoProiezione }
  | { tipo: "chiedi-stato" }
  | { tipo: "chiudi" };

/**
 * Compone lo stato da spedire, togliendo tutto ciò che non deve uscire.
 *
 * È l'unico punto in cui la finestra proiettata riceve dei dati: se una cosa
 * non passa di qui, alla classe non arriva.
 */
export function costruisciStato(params: {
  titolo?: string | null;
  mani: Partial<Record<Position, Card[]>>;
  impostazioni: ImpostazioniProiezione;
  dichiarazione?: { dealer: Position; bids: string[] } | null;
  giocate?: { seat: Position; card: Card }[];
  contratto?: string | null;
  dichiarante?: Position | null;
  doppioMorto?: string | null;
  battito?: number;
}): StatoProiezione {
  const { impostazioni: imp } = params;

  const mani: Partial<Record<Position, Card[]>> = {};
  for (const p of imp.scoperti) {
    const m = params.mani[p];
    if (m) mani[p] = m;
  }

  return {
    titolo: params.titolo ?? null,
    mani,
    posizioni: Object.keys(params.mani) as Position[],
    dichiarazione: imp.mostraDichiarazione ? (params.dichiarazione ?? null) : null,
    giocate: imp.mostraGiocate ? (params.giocate ?? []) : [],
    // Il contratto segue la dichiarazione: mostrarlo mentre la si nasconde
    // vorrebbe dire dare la risposta all'esercizio che si sta proponendo.
    contratto: imp.mostraDichiarazione ? (params.contratto ?? null) : null,
    dichiarante: imp.mostraDichiarazione ? (params.dichiarante ?? null) : null,
    doppioMorto: imp.mostraDoppioMorto ? (params.doppioMorto ?? null) : null,
    mostraDivisioni: imp.mostraDivisioni,
    battito: params.battito ?? 0,
  };
}

/** Il canale, o `null` dove `BroadcastChannel` non c'è (Safari vecchi, SSR). */
export function apriCanale(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(CANALE_PROIEZIONE);
}

export function spedisci(canale: BroadcastChannel | null, m: Messaggio): void {
  canale?.postMessage(m);
}

export type MessaggioProiezione = Messaggio;

/**
 * Apre la finestra da trascinare sul secondo schermo.
 *
 * Non a schermo intero e non massimizzata: il gesto giusto è trascinarla
 * sull'altro schermo e poi premere F11, e una finestra che si apre già
 * massimizzata sul monitor sbagliato è più difficile da spostare, non più
 * facile.
 */
export function apriFinestraProiezione(): Window | null {
  if (typeof window === "undefined") return null;
  return window.open(
    "/istruttori/proiezione",
    "bridgelab-proiezione",
    "width=1280,height=800",
  );
}
