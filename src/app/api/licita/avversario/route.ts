import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { benEndpoint, rateLimit } from "@/lib/ben-guard";
import { biddingToCTX, handToPBN, positionToBEN } from "@/lib/ben-format";
import type { Card, Position } from "@/lib/bridge-engine";

/**
 * Più corto del tetto della funzione, altrimenti non serve a niente: quando
 * BEN è lento la piattaforma abbatte la funzione prima che il timeout scatti,
 * e al browser arriva una pagina di errore invece del ripiego. Qui la licita
 * a due resterebbe ferma per sempre, perché nessuno la sblocca.
 */
export const maxDuration = 30;

const TIMEOUT_MS = 8000;
const ORDINE: Position[] = ["north", "east", "south", "west"];

const bodySchema = z.object({ sessionId: z.string().uuid() });

/**
 * Fa dichiarare gli avversari, dal SERVER.
 *
 * PERCHÉ NON DAL BROWSER
 * Perché il browser non ha le mani di Est e Ovest, ed è tutto il punto: se le
 * avesse, i due amici potrebbero leggerle e la licita non varrebbe niente.
 * Il primo tentativo era proprio questo, e chiedeva a BEN di dichiarare con
 * una mano vuota — avrebbe risposto a caso senza che nulla lo segnalasse.
 *
 * Qui la mano dell'avversario non lascia mai il server: si legge, si manda a
 * BEN, si scrive la dichiarazione. Al browser torna solo cosa hanno detto.
 *
 * Chi chiama deve far parte della licita: lo si verifica con la SUA sessione,
 * non con la chiave di servizio, altrimenti chiunque potrebbe far dichiarare
 * la licita di altri.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  if (!rateLimit(`licita-avv:${user.id}`, 120)) {
    return NextResponse.json({ error: "Troppe richieste" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });
  }

  // La verifica di appartenenza passa dalla sessione di chi chiama: la
  // funzione restituisce `null` a chi non c'entra.
  const { data: vista } = await supabase.rpc("bidding_session_view", {
    p_id: parsed.data.sessionId,
  });
  if (!vista) {
    return NextResponse.json({ error: "Licita non trovata" }, { status: 404 });
  }

  const admin = createAdminSupabaseClient();
  const { data: riga } = await admin
    .from("bidding_sessions")
    .select("hands, bids, dealer, closed_at")
    .eq("id", parsed.data.sessionId)
    .single();
  if (!riga) {
    return NextResponse.json({ error: "Licita non trovata" }, { status: 404 });
  }

  let bids: string[] = (riga.bids as string[]) ?? [];
  const dealer = riga.dealer as Position;
  const hands = riga.hands as Record<Position, Card[]>;
  let chiusa = riga.closed_at !== null;

  const turnoDi = (b: string[]) => ORDINE[(ORDINE.indexOf(dealer) + b.length) % 4];
  const finita = (b: string[]) => {
    const ultimo = b.map((x) => x !== "P").lastIndexOf(true);
    return ultimo < 0 ? b.length >= 4 : b.length - ultimo - 1 >= 3;
  };

  // Si va avanti finché tocca agli avversari. Al massimo quattro giri: un
  // limite serve, perché una licita che non si chiude bloccherebbe la
  // richiesta invece di restituire un errore.
  for (let giro = 0; giro < 16 && !chiusa; giro++) {
    const chi = turnoDi(bids);
    if (chi === "north" || chi === "south") break;

    let scelta = "P";
    try {
      const params = new URLSearchParams({
        hand: handToPBN(hands[chi]),
        seat: positionToBEN(chi),
        dealer: positionToBEN(dealer),
        vul: "None",
        ctx: biddingToCTX({ dealer, bids }),
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const { url: benUrl, headers: benHeaders } = benEndpoint();
      const res = await fetch(`${benUrl}/bid?${params.toString()}`, {
        signal: controller.signal,
        headers: benHeaders,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const dati = await res.json();
        const grezzo = typeof dati.bid === "string" ? dati.bid : "";
        scelta = benBidItaliano(grezzo);
      }
    } catch {
      // Avversario silenzioso: passa. Meglio una licita che va avanti con un
      // avversario prudente che una licita bloccata.
    }

    const { data: esito } = await admin.rpc("bidding_session_bid_server", {
      p_id: parsed.data.sessionId,
      p_bid: scelta,
    });
    if (!esito || (esito as { ok?: boolean }).ok !== true) break;
    bids = [...bids, scelta];
    chiusa = finita(bids);
  }

  return NextResponse.json({ bids, chiusa });
}

/** Da "1S"/"PASS"/"X" alla forma della schermata. */
function benBidItaliano(bid: string): string {
  const b = bid.trim().toUpperCase();
  if (b === "PASS" || b === "P" || b === "--" || b === "") return "P";
  if (b === "X" || b === "DBL") return "X";
  if (b === "XX" || b === "RDBL") return "XX";
  const m = b.match(/^([1-7])(NT|N|S|H|D|C)$/);
  if (!m) return "P";
  const simbolo: Record<string, string> = {
    S: "♠", H: "♥", D: "♦", C: "♣", N: "SA", NT: "SA",
  };
  return `${m[1]}${simbolo[m[2]]}`;
}
