import { astaFinita, dichiarazioniLecite, dichiarante, ultimoContratto, GIRO } from "./asta";
import type { Smazzata } from "./catalog";

export function canonicalBid(raw: string): string {
  const upper = raw.trim().toUpperCase().replace(/\s/g, "");
  if (["P", "PASS", "PASSO"].includes(upper)) return "P";
  if (["DBL", "X"].includes(upper)) return "X";
  if (["RDBL", "XX"].includes(upper)) return "XX";
  return upper.replace(/NT|SA|N(?=X|$)/g, "SA").replace(/S(?!A)/g, "♠").replace(/H/g, "♥").replace(/D/g, "♦").replace(/C/g, "♣");
}

export function auctionProblem(hand: Pick<Smazzata, "bidding" | "contract" | "declarer">): string | null {
  if (!hand.bidding) return null;
  const { dealer } = hand.bidding;
  if (!GIRO.includes(dealer)) return "dealer";
  const bids = hand.bidding.bids.map(canonicalBid);
  for (let i = 0; i < bids.length; i++) {
    const allowed = dichiarazioniLecite(dealer, bids.slice(0, i));
    const b = bids[i];
    if (!(b === "P" ? allowed.passo : b === "X" ? allowed.contro : b === "XX" ? allowed.surcontro : allowed.contratti.includes(b))) return "illegal-auction";
  }
  if (!astaFinita(bids)) return "incomplete-auction";
  const last = ultimoContratto(bids);
  if (!last) return "passed-out";
  const tail = bids.slice(last.indice + 1);
  const contract = last.bid + (tail.includes("XX") ? "XX" : tail.includes("X") ? "X" : "");
  if (contract !== canonicalBid(hand.contract)) return "contract";
  if (dichiarante(dealer, bids) !== hand.declarer) return "declarer";
  return null;
}

/** Do not alter the teaching position or its DDS to match an unreliable auction. */
export function withReviewedAuction(hand: Smazzata): Smazzata {
  return auctionProblem(hand) ? { ...hand, bidding: undefined, biddingUnderReview: true } : hand;
}
