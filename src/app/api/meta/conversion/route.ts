import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildCapiEvent,
  CAPI_EVENTS,
  clientIpFrom,
  readFbCookies,
} from "@/lib/meta-capi";
import { reportError } from "@/lib/report-error";

export const dynamic = "force-dynamic";

const GRAPH_VERSION = "v21.0";

const bodySchema = z.object({
  event: z.enum(CAPI_EVENTS),
  eventId: z.string().min(1).max(100),
  sourceUrl: z.string().url().max(2000).optional(),
});

/**
 * Copia server-side degli eventi del Meta Pixel (Conversions API).
 *
 * Perché esiste: adblocker e restrizioni iOS fanno sparire una quota rilevante
 * degli eventi inviati dal browser. Questa copia arriva comunque. Le due copie
 * condividono `event_id` e Meta ne conta una sola — senza, ogni conversione
 * varrebbe due volte e i costi per acquisizione delle campagne sarebbero
 * sistematicamente dimezzati.
 *
 * Sicurezza e dati personali:
 *   * L'endpoint accetta solo i nomi di evento di un elenco chiuso: un nome
 *     libero finirebbe pari pari nei dati di Meta.
 *   * Non accetta MAI dati sull'utente dal corpo della richiesta. L'unico dato
 *     personale possibile è l'email, che viene letta dalla sessione lato
 *     server e cifrata — e solo se META_CAPI_HASH_EMAIL è attivo. Così un
 *     chiamante non può usare questa rotta per far arrivare a Meta l'indirizzo
 *     di qualcun altro.
 *   * Il token di accesso resta server-side. Se manca, la rotta non fa nulla e
 *     risponde comunque 200: il tracciamento non deve rompere la
 *     registrazione.
 */
export async function POST(req: NextRequest) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  // Non configurato: silenzio, non errore. Vale per gli ambienti di sviluppo e
  // per il periodo fra il rilascio del codice e la creazione del Pixel.
  if (!pixelId || !accessToken) {
    return NextResponse.json({ ok: true, skipped: "non configurato" });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "richiesta non valida" }, { status: 400 });
  }
  const { event, eventId, sourceUrl } = parsed.data;

  // L'email non arriva mai dal client: si prende dalla sessione, e solo se la
  // sua trasmissione è stata abilitata esplicitamente. Vedi meta-capi.ts.
  let email: string | undefined;
  if (process.env.META_CAPI_HASH_EMAIL === "true") {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      email = user?.email ?? undefined;
    } catch {
      // Sessione assente o illeggibile: l'evento parte senza email.
    }
  }

  const { fbp, fbc } = readFbCookies(req.headers.get("cookie"));
  const payload = {
    data: [
      buildCapiEvent({
        event,
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        sourceUrl,
        clientIp: clientIpFrom(req.headers.get("x-forwarded-for")),
        userAgent: req.headers.get("user-agent") ?? undefined,
        fbp,
        fbc,
        email,
      }),
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      // Il corpo della risposta di Meta non contiene dati personali nostri,
      // ma potrebbe contenere il token in un messaggio di errore: si registra
      // solo lo stato.
      reportError("meta-capi", new Error(`Meta CAPI ha risposto ${res.status}`));
      return NextResponse.json({ ok: false }, { status: 202 });
    }
  } catch (err) {
    reportError("meta-capi", err);
    return NextResponse.json({ ok: false }, { status: 202 });
  }

  return NextResponse.json({ ok: true });
}
