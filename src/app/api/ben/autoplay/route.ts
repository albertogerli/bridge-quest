import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, sanitizeBenParam } from "@/lib/ben-guard";

const BEN_URL = process.env.BEN_API_URL || "http://localhost:8085";
const TIMEOUT_MS = 30000; // Autoplay can take longer

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ fallback: true, error: "Non autenticato" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const params = new URLSearchParams();
    for (const [key, target] of [
      ["deal", "deal"],
      ["dealer", "dealer"],
      ["vul", "vul"],
      ["ctx", "ctx"],
      ["board", "board_no"],
    ] as const) {
      const value = sanitizeBenParam(body[key]);
      if (value) params.set(target, value);
    }
    if (!params.has("deal")) {
      return NextResponse.json({ fallback: true, error: "Parametri non validi" }, { status: 400 });
    }

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
