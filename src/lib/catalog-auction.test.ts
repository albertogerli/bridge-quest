import { describe, expect, it } from "vitest";
import { auctionProblem, canonicalBid, withReviewedAuction } from "./catalog-auction";
import type { Smazzata } from "./catalog";

describe("editorial auction consistency", () => {
  it.each([["3NT", "3SA"], ["3N", "3SA"], ["4SX", "4♠X"], ["2H", "2♥"], ["Passo", "P"]])("normalizes %s", (a, b) => expect(canonicalBid(a)).toBe(b));
  it("accepts a coherent closed auction", () => {
    expect(auctionProblem({ contract: "3NT", declarer: "south", bidding: { dealer: "south", bids: ["1NT", "P", "3NT", "P", "P", "P"] } })).toBeNull();
  });
  it("rejects mismatched contracts and declarers", () => {
    const hand = { contract: "2NT", declarer: "south" as const, bidding: { dealer: "south" as const, bids: ["1NT", "P", "3NT", "P", "P", "P"] } };
    expect(auctionProblem(hand)).toBe("contract");
    expect(auctionProblem({ ...hand, contract: "3NT", declarer: "north" })).toBe("declarer");
  });
  it("rejects an illegal double and an unfinished auction", () => {
    expect(auctionProblem({ contract: "1♠", declarer: "south", bidding: { dealer: "south", bids: ["X", "P", "P", "P"] } })).toBe("illegal-auction");
    expect(auctionProblem({ contract: "1♠", declarer: "south", bidding: { dealer: "south", bids: ["1S", "P"] } })).toBe("incomplete-auction");
  });
  it("withholds a bad auction but never changes declarer, lead, DDS or the input", () => {
    const hand = Object.freeze({ contract: "3NT", declarer: "north", ddTricks: 10, openingLead: { suit: "diamond", rank: "K" },
      bidding: { dealer: "south", bids: ["1NT", "P", "3NT", "P", "P", "P"] } }) as Smazzata;
    const checked = withReviewedAuction(hand);
    expect(checked.bidding).toBeUndefined();
    expect(checked.biddingUnderReview).toBe(true);
    expect(checked.declarer).toBe(hand.declarer);
    expect(checked.openingLead).toBe(hand.openingLead);
    expect(checked.ddTricks).toBe(10);
    expect(hand.bidding).toBeDefined();
  });
});
