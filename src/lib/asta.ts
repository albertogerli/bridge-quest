/**
 * Le regole della dichiarazione: cosa si può dire, e quando finisce.
 *
 * PERCHÉ IN UN POSTO SOLO
 * La griglia d'asta compare in «Licita e vediamo», in «Licita con un amico» e
 * comparirà in tutto ciò che il piano prevede sopra. Se ogni schermata
 * decidesse per conto suo quali dichiarazioni sono lecite, prima o poi due
 * direbbero cose diverse — e l'utente si vedrebbe rifiutare dal server una
 * dichiarazione che l'interfaccia gli aveva offerto, che è il modo peggiore di
 * sbagliare.
 */

export type Posto = "north" | "east" | "south" | "west";

/** L'ordine in cui si parla: orario, a partire dal mazziere. */
export const GIRO: Posto[] = ["north", "east", "south", "west"];

/** Le denominazioni in ordine di forza. */
export const DENOMINAZIONI = ["♣", "♦", "♥", "♠", "SA"] as const;
export type Denominazione = (typeof DENOMINAZIONI)[number];

/** Tutte le dichiarazioni di contratto, dalla più bassa alla più alta. */
export const CONTRATTI: string[] = [1, 2, 3, 4, 5, 6, 7].flatMap((l) =>
  DENOMINAZIONI.map((d) => `${l}${d}`)
);

export const PASSO = "P";
export const CONTRO = "X";
export const SURCONTRO = "XX";

/** Quanto vale una dichiarazione nell'ordine crescente; -1 se non è un contratto. */
export function rango(bid: string): number {
  return CONTRATTI.indexOf(bid);
}

/** Chi parla adesso, viste le dichiarazioni già fatte. */
export function turno(dealer: Posto, bids: readonly string[]): Posto {
  return GIRO[(GIRO.indexOf(dealer) + bids.length) % 4];
}

/** L'ultimo contratto nominato, con la posizione nell'asta. */
export function ultimoContratto(
  bids: readonly string[]
): { bid: string; indice: number } | null {
  for (let i = bids.length - 1; i >= 0; i--) {
    if (rango(bids[i]) >= 0) return { bid: bids[i], indice: i };
  }
  return null;
}

/**
 * L'asta è finita: tre passi dopo una dichiarazione, o quattro passi in tutto.
 * (Contro e surcontro non chiudono: dopo di loro servono ancora tre passi.)
 */
export function astaFinita(bids: readonly string[]): boolean {
  if (bids.length < 4) return false;
  const ultimi = bids.slice(-3);
  if (!ultimi.every((b) => b === PASSO)) return false;
  // Quattro passi secchi: smazzata passata.
  if (bids.length === 4 && bids.every((b) => b === PASSO)) return true;
  return bids.length > 3;
}

/** Chi ha dichiarato l'ultimo contratto, e quindi la linea che gioca. */
function lineaDi(p: Posto): "ns" | "ew" {
  return p === "north" || p === "south" ? "ns" : "ew";
}

/**
 * Il dichiarante: il primo della linea vincente ad aver nominato quel seme.
 * Non è chi ha detto l'ultima parola — è una regola che si sbaglia spesso, e
 * cambia chi attacca.
 */
export function dichiarante(dealer: Posto, bids: readonly string[]): Posto | null {
  const ultimo = ultimoContratto(bids);
  if (!ultimo) return null;
  const chiHaChiuso = turno(dealer, bids.slice(0, ultimo.indice));
  const linea = lineaDi(chiHaChiuso);
  const seme = ultimo.bid.slice(1);
  for (let i = 0; i <= ultimo.indice; i++) {
    const chi = turno(dealer, bids.slice(0, i));
    if (lineaDi(chi) === linea && bids[i].slice(1) === seme) return chi;
  }
  return chiHaChiuso;
}

/**
 * Le dichiarazioni lecite adesso.
 *
 * Il contro si può dire solo sull'ultimo contratto degli AVVERSARI e se non è
 * già contrato; il surcontro solo su un contro degli avversari. Sono le due
 * regole che un cassetto delle dichiarazioni sbaglia più spesso, e sbagliarle
 * insegna una cosa falsa.
 */
export function dichiarazioniLecite(
  dealer: Posto,
  bids: readonly string[]
): { contratti: string[]; passo: boolean; contro: boolean; surcontro: boolean } {
  if (astaFinita(bids)) {
    return { contratti: [], passo: false, contro: false, surcontro: false };
  }

  const ultimo = ultimoContratto(bids);
  const contratti = ultimo ? CONTRATTI.slice(rango(ultimo.bid) + 1) : [...CONTRATTI];

  const chiParla = turno(dealer, bids);
  const miaLinea = lineaDi(chiParla);

  // Che cosa è stato detto dopo l'ultimo contratto.
  const dopo = ultimo ? bids.slice(ultimo.indice + 1) : [];
  const contrato = dopo.includes(CONTRO);
  const surcontrato = dopo.includes(SURCONTRO);

  let contro = false;
  let surcontro = false;
  if (ultimo && !surcontrato) {
    const lineaDelContratto = lineaDi(turno(dealer, bids.slice(0, ultimo.indice)));
    if (!contrato) {
      // Si contra solo il contratto degli avversari.
      contro = lineaDelContratto !== miaLinea;
    } else {
      // Si surcontra solo il contro degli avversari, cioè quando il contratto
      // contrato è il nostro.
      surcontro = lineaDelContratto === miaLinea;
    }
  }

  return { contratti, passo: true, contro, surcontro };
}

export interface RigaAsta {
  north: string | null;
  east: string | null;
  south: string | null;
  west: string | null;
}

/**
 * L'asta disposta in righe di quattro, con i posti nelle colonne fisse.
 * Le caselle prima del mazziere restano vuote: è così che si legge un'asta su
 * carta, e cambiarlo confonderebbe chi il bridge lo sa già.
 */
export function righeAsta(dealer: Posto, bids: readonly string[]): RigaAsta[] {
  const salto = GIRO.indexOf(dealer);
  const celle: (string | null)[] = [...Array(salto).fill(null), ...bids];
  const righe: RigaAsta[] = [];
  for (let i = 0; i < celle.length; i += 4) {
    righe.push({
      north: celle[i] ?? null,
      east: celle[i + 1] ?? null,
      south: celle[i + 2] ?? null,
      west: celle[i + 3] ?? null,
    });
  }
  return righe;
}
