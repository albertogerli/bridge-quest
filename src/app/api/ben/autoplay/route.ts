import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId, benParam, benParamOpt, rateLimit } from "@/lib/ben-guard";

const BEN_URL = process.env.BEN_API_URL || "http://localhost:8085";
const TIMEOUT_MS = 30000; // Autoplay can take longer
const RATE_MAX_PER_MIN = 10; // chiamata pesante lato BEN

const bodySchema = z.object({
  deal: benParam,
  dealer: benParamOpt,
  vul: benParamOpt,
  ctx: benParamOpt,
  board: benParamOpt,
});

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ fallback: true, error: "Non autenticato" }, { status: 401 });
  }
  if (!rateLimit(`ben-autoplay:${userId}`, RATE_MAX_PER_MIN)) {
    return NextResponse.json({ fallback: true, error: "Troppe richieste" }, { status: 429 });
  }

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ fallback: true, error: "Parametri non validi" }, { status: 400 });
    }

    const params = new URLSearchParams();
    const { deal, dealer, vul, ctx, board } = parsed.data;
    params.set("deal", deal);
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
      return NextResponse.json(
        { fallback: true, error: `BEN returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ fallback: false, ...data });
  } catch {
    return NextResponse.json({ fallback: true, error: "BEN unavailable" }, { status: 502 });
  }
}
