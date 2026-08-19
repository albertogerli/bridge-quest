import type { Card, Position, Suit } from "@/lib/bridge-engine";

/**
 * Come si dividono, probabilmente, le carte che mancano in un colore.
 *
 * PERCHÉ NON UNA TABELLA. Le probabilità di divisione si trovano stampate su
 * ogni manuale — 3-2 al 68%, 4-1 al 28% — e sono giuste all'inizio della mano,
 * quando degli avversari non si sa niente. Ma la domanda al tavolo arriva
 * sempre DOPO: si è giocato un giro, è caduta una carta da una parte, e
 * l'insegnante vuole far vedere come sono cambiate le probabilità. Una tabella
 * statica risponde alla domanda sbagliata, e insegna a non aggiornarla.
 *
 * Qui il conto si fa sulle carte che mancano DAVVERO in quel momento e sui
 * posti liberi che restano nelle due mani avversarie. È la stessa formula, ma
 * applicata alla posizione invece che alla partenza.
 *
 * LA FORMULA. Con `m` carte mancanti da distribuire in due mani che hanno `a` e
 * `b` posti liberi, la probabilità che ne finiscano esattamente `k` nella prima
 * è ipergeometrica: C(a,k)·C(b,m−k)/C(a+b,m). È il modello giusto perché tutte
 * le disposizioni delle carte non viste sono equiprobabili — che è vero finché
 * non si tiene conto delle dichiarazioni, e infatti nessun conteggio di questo
 * tipo lo fa.
 *
 * DUE DIVISIONI SPECULARI SONO LA STESSA COSA per chi gioca: 4-1 e 1-4 vanno
 * sommate, perché la domanda è «reggerà il colore», non «da che parte».
 * Restano distinte solo quando i posti liberi nelle due mani sono diversi — e
 * in quel caso la differenza è proprio l'informazione che si vuole mostrare.
 */

export interface Divisione {
  /** Carte al primo avversario. */
  sinistra: number;
  /** Carte al secondo. */
  destra: number;
  /** Fra 0 e 1. */
  probabilita: number;
  /**
   * Vero se questa riga comprende anche la divisione speculare. Succede solo
   * quando i due avversari hanno gli stessi posti liberi: altrimenti le due
   * orientazioni hanno probabilità diverse e restano separate.
   */
  simmetrica: boolean;
}

export interface DivisioniColore {
  /** Quante carte del colore non si vedono. */
  mancanti: number;
  /** Posti liberi nelle due mani avversarie. */
  postiSinistra: number;
  postiDestra: number;
  divisioni: Divisione[];
}

/** Coefficiente binomiale. Numeri piccoli: nessun rischio di trabocco. */
function binomiale(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/**
 * Le divisioni possibili delle carte mancanti, con la loro probabilità.
 *
 * `postiSinistra` e `postiDestra` sono le carte ANCORA IN MANO ai due
 * avversari, di qualunque colore: è quello che vincola la distribuzione. A
 * inizio mano sono tredici e tredici; dopo qualche presa, e soprattutto dopo
 * che uno dei due ha mostrato un vuoto in un altro colore, cambiano — ed è
 * lì che il conto smette di somigliare alla tabella del manuale.
 */
export function divisioniPossibili(
  mancanti: number,
  postiSinistra: number,
  postiDestra: number,
): DivisioniColore {
  const totale = binomiale(postiSinistra + postiDestra, mancanti);
  const divisioni: Divisione[] = [];

  /**
   * SI SOMMANO LE SPECULARI SOLO QUANDO I DUE AVVERSARI HANNO GLI STESSI POSTI.
   *
   * A mani pari «4-1» e «1-4» hanno la stessa probabilità e la stessa risposta
   * — il colore non regge — quindi tenerle separate raddoppierebbe le righe
   * senza dire niente: il manuale infatti le somma.
   *
   * Quando i posti sono diversi non sono più la stessa cosa, ed è esattamente
   * lì che questo pannello serve: se Ovest ha già mostrato di essere corto
   * altrove, «tre a Est» e «tre a Ovest» hanno probabilità molto diverse, e la
   * differenza è l'informazione che l'insegnante vuole far vedere. Sommarle la
   * cancellerebbe proprio nel caso interessante.
   */
  const pari = postiSinistra === postiDestra;

  if (totale > 0) {
    for (let k = mancanti; k >= 0; k--) {
      const altra = mancanti - k;
      if (pari && k < altra) continue;

      let p = (binomiale(postiSinistra, k) * binomiale(postiDestra, altra)) / totale;
      const sommata = pari && k !== altra;
      if (sommata) {
        p += (binomiale(postiSinistra, altra) * binomiale(postiDestra, k)) / totale;
      }
      if (p > 0) {
        divisioni.push({ sinistra: k, destra: altra, probabilita: p, simmetrica: sommata });
      }
    }
  }

  divisioni.sort((a, b) => b.probabilita - a.probabilita);
  return { mancanti, postiSinistra, postiDestra, divisioni };
}

/**
 * Le divisioni di un colore nella posizione corrente del tavolo.
 *
 * Guarda le mani che si conoscono — la propria e quella del morto, o tutte e
 * quattro se è l'insegnante — e conta cosa manca. Le carte già giocate sono
 * tolte da entrambi i conti: sono viste, quindi non sono più incognite.
 */
export function divisioniAlTavolo(params: {
  colore: Suit;
  /** Le mani note a chi guarda, nella posizione corrente. */
  noti: Partial<Record<Position, Card[]>>;
  /** Le carte già giocate da tutti. */
  giocate?: { seat: Position; card: Card }[];
  /** Chi sono i due avversari, in ordine. */
  avversari: [Position, Position];
}): DivisioniColore {
  const { colore, noti, giocate = [], avversari } = params;

  const nelColore = (c: Card) => c.suit === colore;

  /**
   * Le carte del colore che si vedono: quelle nelle mani note più quelle già
   * cadute. Una carta in una mano nota è anche fisicamente lì, quindi non va
   * contata due volte se compare pure fra le giocate — per questo si conta per
   * rango e non per occorrenze.
   */
  const viste = new Set<string>();
  for (const [pos, mano] of Object.entries(noti)) {
    // Le mani degli avversari, se per caso sono note, NON contano come viste:
    // sono proprio quelle di cui si vuole stimare la divisione.
    if (avversari.includes(pos as Position)) continue;
    for (const c of mano ?? []) if (nelColore(c)) viste.add(c.rank);
  }
  for (const g of giocate) if (nelColore(g.card)) viste.add(g.card.rank);

  const mancanti = Math.max(0, 13 - viste.size);

  /**
   * I posti liberi: tredici meno le carte che quell'avversario ha già giocato,
   * di qualunque colore. È l'unica informazione certa che si ha sulle loro mani
   * senza guardarle.
   */
  const postiDi = (p: Position) => 13 - giocate.filter((g) => g.seat === p).length;

  return divisioniPossibili(mancanti, postiDi(avversari[0]), postiDi(avversari[1]));
}

/**
 * `4-1`, per l'etichetta.
 *
 * Quando la riga comprende anche la speculare si scrive nella forma d'uso, col
 * numero più alto davanti: è come si dice al tavolo, «un quattro-uno».
 * Quando invece le due orientazioni sono distinte l'ordine è quello vero —
 * sinistra a sinistra — o si perderebbe proprio la cosa che le tiene separate.
 */
export function etichettaDivisione(d: Divisione): string {
  if (!d.simmetrica) return `${d.sinistra}-${d.destra}`;
  return `${Math.max(d.sinistra, d.destra)}-${Math.min(d.sinistra, d.destra)}`;
}
