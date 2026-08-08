import { NextRequest, NextResponse } from "next/server";
import { pbnCardToCard } from "@/lib/ben-format";
import { isAuthenticated, sanitizeBenParam } from "@/lib/ben-guard";

const BEN_URL = process.env.BEN_API_URL || "http://localhost:8085";
const TIMEOUT_MS = 15000;

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ fallback: true, error: "Non autenticato" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const params = new URLSearchParams();
    for (const key of ["hand", "seat", "dealer", "vul", "ctx"] as const) {
      const value = sanitizeBenParam(body[key]);
      if (value) params.set(key, value);
    }
    if (!params.has("hand") || !params.has("seat")) {
      return NextResponse.json({ fallback: true, error: "Parametri non validi" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${BEN_URL}/lead?${params.toString()}`, {
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
    const cardStr = data.card || data.lead;
    if (!cardStr || typeof cardStr !== "string" || cardStr.length < 2) {
      return NextResponse.json(
        { fallback: true, error: "Invalid BEN response" },
        { status: 502 }
      );
    }

    const card = pbnCardToCard(cardStr);
    return NextResponse.json({ card, fallback: false, candidates: data.candidates });
  } catch {
    return NextResponse.json({ fallback: true, error: "BEN unavailable" }, { status: 502 });
  }
}
