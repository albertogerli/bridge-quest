import { NextResponse } from "next/server";

const BEN_URL = process.env.BEN_API_URL || "http://localhost:8085";

export async function GET() {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${BEN_URL}/`, { signal: controller.signal });
    clearTimeout(timeout);

    const latency = Date.now() - start;
    return NextResponse.json({
      available: res.ok,
      latency,
      status: res.status,
    });
  } catch {
    return NextResponse.json({
      available: false,
      latency: Date.now() - start,
      error: "BEN server not reachable",
    });
  }
}
