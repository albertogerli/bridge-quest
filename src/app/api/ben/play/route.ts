import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pbnCardToCard } from "@/lib/ben-format";
import { getAuthUserId, benParam, benParamOpt, rateLimit } from "@/lib/ben-guard";

const BEN_URL = process.env.BEN_API_URL || "http://localhost:8085";
const TIMEOUT_MS = 15000;

// Una mano può generare ~40 chiamate AI in rapida successione: limite largo.
const RATE_MAX_PER_MIN = 120;

const bodySchema = z.object({
  hand: benParam,
  seat: benParam,
  dummy: benParamOpt,
  dealer: benParamOpt,
  vul: benParamOpt,
  ctx: benParamOpt,
  played: benParamOpt,
});

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ fallback: true, error: "Non autenticato" }, { status: 401 });
  }
  if (!rateLimit(`ben-play:${userId}`, RATE_MAX_PER_MIN)) {
    return NextResponse.json({ fallback: true, error: "Troppe richieste" }, { status: 429 });
  }

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ fallback: true, error: "Parametri non validi" }, { status: 400 });
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value) params.set(key, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${BEN_URL}/play?${params.toString()}`, {
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

    // BEN returns card in format like "S7" or "HA"
    const cardStr = data.card || data.play;
    if (!cardStr || typeof cardStr !== "string" || cardStr.length < 2) {
      return NextResponse.json(
        { fallback: true, error: "Invalid BEN response" },
        { status: 502 }
      );
    }

    const card = pbnCardToCard(cardStr);
    return NextResponse.json({
      card,
      fallback: false,
      candidates: data.candidates,
      who: data.who,
    });
  } catch {
    return NextResponse.json({ fallback: true, error: "BEN unavailable" }, { status: 502 });
  }
}
