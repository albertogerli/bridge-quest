import { NextRequest, NextResponse } from "next/server";

const BEN_URL = process.env.BEN_API_URL || "http://localhost:8085";
const TIMEOUT_MS = 30000; // Autoplay can take longer

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deal, dealer, vul, ctx, board } = body;

    const params = new URLSearchParams();
    if (deal) params.set("deal", deal);
    if (dealer) params.set("dealer", dealer);
    if (vul) params.set("vul", vul);
    if (ctx) params.set("ctx", ctx);
    if (board) params.set("board_no", board);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${BEN_URL}/autoplay?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ fallback: true, error: `BEN returned ${res.status}` });
    }

    const data = await res.json();
    return NextResponse.json({ fallback: false, ...data });
  } catch {
    return NextResponse.json({ fallback: true, error: "BEN unavailable" });
  }
}
