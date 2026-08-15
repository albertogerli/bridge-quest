import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId, benParam, benParamOpt, rateLimit, benEndpoint } from "@/lib/ben-guard";

/**
 * Quanto si aspetta BEN prima di rinunciare, e perché questo numero conta.
 *
 * DEV'ESSERE PIÙ CORTO DEL LIMITE DELLA FUNZIONE, altrimenti non serve a
 * niente: quando BEN è lento la piattaforma abbatte la funzione prima che il
 * nostro timeout scatti, e al browser arriva una pagina di errore invece del
 * ripiego pulito. È successo in produzione il 15/08/2026: l'asta
 * «P 1♦ 1♠ contro P» faceva impiegare a BEN più di dodici secondi, ogni volta,
 * e l'esercizio di licita si interrompeva con «mano annullata» — mentre con un
 * ripiego onesto sarebbe potuto continuare.
 *
 * `maxDuration` è dichiarato qui sotto proprio per non doverlo indovinare.
 */
/** Il tetto della funzione: il timeout qui sopra deve starci sotto. */
export const maxDuration = 30;

const TIMEOUT_MS = 20000;
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

    const { url: benUrl, headers: benHeaders } = benEndpoint();
    const res = await fetch(`${benUrl}/autoplay?${params.toString()}`, {
      signal: controller.signal,
      headers: benHeaders,
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
