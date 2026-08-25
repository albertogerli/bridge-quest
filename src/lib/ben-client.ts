/**
 * BEN Bridge Engine Neural - TypeScript client
 * Calls our Next.js API routes which proxy to the BEN server
 */

import type { Card, Position, GameState } from "./bridge-engine";
import type { Vulnerability, BiddingData } from "@/lib/catalog";
import {
  handToPBN,
  positionToBEN,
  vulToBEN,
  biddingToCTX,
  gameStateToPBNPlayed,
  benSeatParams,
} from "./ben-format";

// --- Types ---

export interface BenPlayRequest {
  gameState: GameState;
  position: Position;
  dealer: Position;
  vulnerability: Vulnerability;
  bidding?: BiddingData;
}

export interface BenPlayResponse {
  card: Card;
  fallback: boolean;
  error?: string;
}

export interface BenHealthResponse {
  available: boolean;
  latency?: number;
}

// --- API calls ---

/** Check if BEN server is running */
export async function checkBenHealth(): Promise<BenHealthResponse> {
  try {
    const res = await fetch("/api/ben/health", { cache: "no-store" });
    if (!res.ok) return { available: false };
    const data = await res.json();
    return { available: data.available === true, latency: data.latency };
  } catch {
    return { available: false };
  }
}

/** Ask BEN to play a card */
export async function benPlay(req: BenPlayRequest): Promise<BenPlayResponse> {
  try {
    const { gameState, position, dealer, vulnerability, bidding } = req;

    // Mani ORIGINALI da tredici carte, e il caso del morto: vedi
    // `benSeatParams`. Con le mani correnti BEN rispondeva «Hand should have
    // 13 cards» — e con HTTP 200, quindi il proxy lo leggeva come un
    // fallimento e ripiegava in silenzio: BEN non veniva mai usato e nulla lo
    // segnalava.
    const { hand, dummy, seat } = benSeatParams(gameState, position);
    const dealerBen = positionToBEN(dealer);
    const vul = vulToBEN(vulnerability);
    const ctx = biddingToCTX(bidding);
    const played = gameStateToPBNPlayed(gameState);

    const res = await fetch("/api/ben/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hand, dummy, seat, dealer: dealerBen, vul, ctx, played }),
    });

    if (!res.ok) {
      return { card: null as unknown as Card, fallback: true, error: "API error" };
    }

    const data = await res.json();
    if (data.fallback) {
      return { card: null as unknown as Card, fallback: true, error: data.error };
    }

    return { card: data.card, fallback: false };
  } catch {
    return { card: null as unknown as Card, fallback: true, error: "Network error" };
  }
}

/** Ask BEN for an opening lead */
export async function benLead(
  hand: Card[],
  position: Position,
  dealer: Position,
  vulnerability: Vulnerability,
  bidding?: BiddingData,
): Promise<BenPlayResponse> {
  try {
    const res = await fetch("/api/ben/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hand: handToPBN(hand),
        seat: positionToBEN(position),
        dealer: positionToBEN(dealer),
        vul: vulToBEN(vulnerability),
        ctx: biddingToCTX(bidding),
      }),
    });

    if (!res.ok) {
      return { card: null as unknown as Card, fallback: true, error: "API error" };
    }

    const data = await res.json();
    if (data.fallback) {
      return { card: null as unknown as Card, fallback: true, error: data.error };
    }

    return { card: data.card, fallback: false };
  } catch {
    return { card: null as unknown as Card, fallback: true, error: "Network error" };
  }
}

/**
 * Perché il motore non ha dichiarato. Non è un dettaglio da diagnostica: da
 * questo dipende se riprovare serve a qualcosa.
 *
 *   `attesa`        BEN c'è ma ci ha messo troppo. Riprovare può funzionare.
 *   `irraggiungibile` il server non risponde affatto. Riprovare subito no.
 *   `server`        BEN ha risposto con un errore suo.
 *   `risposta`      ha risposto qualcosa che non è una dichiarazione.
 *   `limite`        troppe richieste al minuto: è il RIPROVA stesso a
 *                   causarlo, e l'unica cosa che aiuta è aspettare.
 *   `sessione`      la sessione è scaduta: si rientra e riparte.
 *   `richiesta`     parametri rifiutati — un difetto nostro, riprovare non
 *                   cambierà niente.
 *   `autorizzazione` il segreto con cui parliamo a BEN non combacia: la
 *                   guardia risponde 404 apposta. È configurazione, non un
 *                   guasto, e nessun tentativo la sistema.
 *   `rete`          la connessione del browser.
 */
export type MotivoBen =
  | "attesa"
  | "irraggiungibile"
  | "server"
  | "risposta"
  | "limite"
  | "sessione"
  | "richiesta"
  | "autorizzazione"
  | "rete";

/** True se ha senso offrire «riprova»: per le altre cause non cambierebbe nulla. */
export function riprovareServe(motivo: MotivoBen): boolean {
  return motivo === "attesa" || motivo === "rete" || motivo === "irraggiungibile";
}

function motivoDa(status: number, errore: unknown): MotivoBen {
  if (status === 401) return "sessione";
  if (status === 429) return "limite";
  if (status === 400) return "richiesta";
  const testo = typeof errore === "string" ? errore : "";
  // `ben unavailable` è il 502 che la GUARDIA davanti a BEN restituisce quando
  // ha smesso di aspettarlo. Non è BEN che sbaglia: è BEN che ci mette troppo,
  // e in produzione succede mentre il contenitore si sveglia — dopodiché le
  // stesse richieste tornano a rispondere in mezzo secondo (misurato il
  // 24/08/2026). Quindi è un'attesa, e riprovare ha davvero senso: leggerlo
  // come «errore del server» toglieva all'utente l'unica mossa che funziona.
  if (/ben unavailable/i.test(testo)) return "attesa";
  if (/ben timeout/i.test(testo)) return "attesa";
  if (/timeout|scaduto/i.test(testo)) return "attesa";
  if (/non raggiungibile/i.test(testo)) return "irraggiungibile";
  if (/non valida/i.test(testo)) return "risposta";

  // Lo stato con cui ha risposto BEN, quando lo sappiamo.
  const suo = testo.match(/BEN returned (\d{3})/);
  if (suo) {
    const stato = Number(suo[1]);
    // 404 ha un significato preciso e VOLUTO: la guardia davanti a BEN
    // risponde 404 — non 401 — a chi non ha il segreto giusto, per non
    // confermare nemmeno che ci sia qualcosa da indovinare
    // (`deploy/ben-railway/guard.py`). Se arriva questo, il token della
    // piattaforma e quello del server non coincidono: non è BEN a stare male.
    if (stato === 404) return "autorizzazione";
    // Un 5xx del motore è transitorio per definizione. In produzione sono i
    // risvegli del contenitore: la stessa richiesta, mezzo minuto dopo,
    // risponde in mezzo secondo.
    if (stato >= 500) return "attesa";
    return "server";
  }

  // NON SAPPIAMO. Succede quando la risposta non è JSON leggibile, e in
  // Sentry si presentava come «server (HTTP 502)» — una diagnosi che il
  // client si era inventato non avendo dati.
  //
  // Nel dubbio si sceglie l'ipotesi TRANSITORIA, perché il danno non è
  // simmetrico: dire «riprova» quando non serviva costa un tocco a vuoto,
  // mentre NON dirlo quando serviva lascia la mano bloccata e l'esercizio
  // finito lì. Il 502 questa rotta lo emette solo per problemi del motore,
  // che sono quasi sempre passeggeri. La causa vera adesso la riferisce il
  // server (`api:ben-bid`), che è l'unico a conoscerla davvero.
  if (status === 502) return "attesa";
  return "server";
}

/**
 * La dichiarazione del compagno, dal modello neurale di BEN.
 *
 * Restituisce `fallback: true` quando BEN non risponde: chi chiama decide
 * cosa fare, e nell'esercizio di licita il compagno passa — dicendolo. Fingere
 * che abbia scelto di passare sarebbe peggio del silenzio.
 *
 * IL MOTIVO VIENE FUORI, e prima non usciva. Ogni causa — sessione scaduta,
 * limite di richieste, BEN spento, risposta malformata — arrivava a chi chiama
 * come lo stesso identico `fallback: true`, e la schermata ne concludeva
 * sempre «non ha risposto in tempo». Spesso era falso, e soprattutto
 * nascondeva l'unica informazione che serve all'utente: se riprovare abbia
 * una speranza. Con il limite di richieste è perfino il riprova a causare
 * l'errore successivo.
 */
export async function benBid(req: {
  hand: Card[];
  seat: Position;
  dealer: Position;
  vulnerability: Vulnerability;
  bidding?: BiddingData;
}): Promise<{ bid: string; fallback: boolean; motivo?: MotivoBen; dettaglio?: string }> {
  try {
    const res = await fetch("/api/ben/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hand: handToPBN(req.hand),
        seat: positionToBEN(req.seat),
        dealer: positionToBEN(req.dealer),
        vul: vulToBEN(req.vulnerability),
        ctx: biddingToCTX(req.bidding),
      }),
    });
    // SI LEGGE IL TESTO, POI SI PROVA A INTERPRETARLO. Con `res.json()` diretto,
    // una risposta non-JSON spariva senza lasciare niente e restava solo
    // «HTTP 502»: il corpo c'era e lo buttavamo via prima di guardarlo.
    const grezzo = await res.text().catch(() => "");
    let data: { error?: unknown; fallback?: unknown; bid?: unknown } | null = null;
    try {
      data = grezzo ? JSON.parse(grezzo) : null;
    } catch {
      data = null;
    }
    const dettaglio =
      typeof data?.error === "string"
        ? data.error
        : grezzo.trim().slice(0, 120) || `HTTP ${res.status} senza corpo`;
    if (!res.ok || data?.fallback || typeof data?.bid !== "string") {
      return { bid: "P", fallback: true, motivo: motivoDa(res.status, data?.error), dettaglio };
    }
    return { bid: benBidToItaliano(data.bid), fallback: false };
  } catch {
    return { bid: "P", fallback: true, motivo: "rete", dettaglio: "fetch fallita nel browser" };
  }
}

/** Da "1S"/"PASS"/"X" alla forma usata nella schermata ("1♠", "P", "X"). */
export function benBidToItaliano(bid: string): string {
  const b = bid.trim().toUpperCase();
  if (b === "PASS" || b === "P" || b === "--") return "P";
  if (b === "X" || b === "DBL") return "X";
  if (b === "XX" || b === "RDBL") return "XX";
  const m = b.match(/^([1-7])(NT|N|S|H|D|C)$/);
  if (!m) return "P";
  const simbolo: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣", N: "SA", NT: "SA" };
  return `${m[1]}${simbolo[m[2]]}`;
}
