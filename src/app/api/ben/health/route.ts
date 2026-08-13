import { NextResponse } from "next/server";
import { getAuthUserId, rateLimit, benEndpoint } from "@/lib/ben-guard";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ available: false, error: "Non autenticato" }, { status: 401 });
  }
  if (!rateLimit(`ben-health:${userId}`, 30)) {
    return NextResponse.json({ available: false, error: "Troppe richieste" }, { status: 429 });
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const { url: benUrl, headers: benHeaders } = benEndpoint();
    const res = await fetch(`${benUrl}/`, { signal: controller.signal, headers: benHeaders });
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
