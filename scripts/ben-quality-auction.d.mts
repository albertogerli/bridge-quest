export function normalizeBenBid(raw: unknown): string;
export function benchmarkAuction(dealer: string, bids: unknown[], requireComplete?: boolean): { complete: boolean; contract: string; declarer: string | null; doubled: number };
