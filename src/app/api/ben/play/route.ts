import { NextRequest, NextResponse } from "next/server";
import { pbnCardToCard } from "@/lib/ben-format";

const BEN_URL = process.env.BEN_API_URL || "http://localhost:8085";
const TIMEOUT_MS = 5000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hand, dummy, seat, dealer, vul, ctx, played } = body;

    // Build BEN query params
    const params = new URLSearchParams();
    if (hand) params.set("hand", hand);
    if (dummy) params.set("dummy", dummy);
    if (seat) params.set("pos", seat);
    if (dealer) params.set("dealer", dealer);
    if (vul) params.set("vul", vul);
    if (ctx) params.set("ctx", ctx);
    if (played) params.set("played", played);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${BEN_URL}/play?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ fallback: true, error: `BEN returned ${res.status}` });
    }

    const data = await res.json();

    // BEN returns card in format like "S7" or "HA"
    const cardStr = data.card || data.play;
    if (!cardStr || typeof cardStr !== "string" || cardStr.length < 2) {
      return NextResponse.json({ fallback: true, error: "Invalid BEN response" });
    }

    const card = pbnCardToCard(cardStr);
    return NextResponse.json({
      card,
      fallback: false,
      candidates: data.candidates,
      who: data.who,
    });
  } catch {
    return NextResponse.json({ fallback: true, error: "BEN unavailable" });
  }
}
