import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId, benParam, benParamOpt, rateLimit } from "@/lib/ben-guard";
import { reportError } from "@/lib/report-error";
import { measureBenRoute, type BenMetricContext } from "@/lib/ben-metrics";
import { chiediBidABen } from "@/lib/ben-bid-server";

/** Il tetto della funzione: il timeout di `chiediBidABen` deve starci sotto. */
export const maxDuration = 30;

const RATE_MAX_PER_MIN = 60;

const bodySchema = z.object({
  hand: benParam,
  seat: benParam,
  dealer: benParamOpt,
  vul: benParamOpt,
  ctx: benParamOpt,
});

/**
 * La dichiarazione del compagno, dal modello neurale di BEN.
 *
 * È lo stesso motore che gioca la carta: `/bid` usa una rete addestrata sulla
 * licita, e stava già acceso sul nostro server senza che nessuno la usasse.
 *
 * SI DEGRADA IN SILENZIO come gli altri: se BEN non risponde si torna
 * `fallback: true` e chi chiama decide cosa fare. Un esercizio di licita che
 * si blocca perché un server è occupato è peggio di un esercizio senza
 * compagno.
 */
export async function POST(req: NextRequest) {
  return measureBenRoute("bid", req, handlePost);
}

async function handlePost(req: NextRequest, metric: BenMetricContext) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ fallback: true, error: "Non autenticato" }, { status: 401 });
  }
  if (!rateLimit(`ben-bid:${userId}`, RATE_MAX_PER_MIN)) {
    return NextResponse.json({ fallback: true, error: "Troppe richieste" }, { status: 429 });
  }

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ fallback: true, error: "Parametri non validi" }, { status: 400 });
    }

    const esito = await chiediBidABen(parsed.data, metric);
    return esito.ok
      ? NextResponse.json(esito.cache ? { bid: esito.bid, fallback: false, cache: true } : { bid: esito.bid, fallback: false })
      : NextResponse.json({ fallback: true, error: esito.error }, { status: esito.status });
  } catch (err) {
    reportError("api:ben-bid", err);
    return NextResponse.json({ fallback: true, error: "BEN non raggiungibile" }, { status: 502 });
  }
}
