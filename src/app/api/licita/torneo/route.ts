import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/ben-guard";
import { biddingToCTX, handToPBN, positionToBEN, vulToBEN } from "@/lib/ben-format";
import { benBidToItaliano } from "@/lib/ben-client";
import { chiediBidABen } from "@/lib/ben-bid-server";
import { astaChiusa, turnoDi } from "@/lib/licita-mano";
import { reportError } from "@/lib/report-error";
import {
  dichiarazioneDiSudAmmessa,
  vistaAperta,
  votoMano,
  type ManoTorneo,
} from "@/lib/torneo-licita-server";

/**
 * Una dichiarazione di BEN può durare fino a 26 s (`BEN_BID_TIMEOUT_MS`):
 * la funzione deve vivere di più, altrimenti la piattaforma la abbatte e al
 * browser arriva una pagina d'errore invece del passo d'ufficio.
 */
export const maxDuration = 30;

const bodySchema = z.object({
  torneoId: z.string().uuid(),
  /**
   * `stato`  la mano da dichiarare e l'asta fin qui;
   * `dichiara` la dichiarazione di Sud (`bid`);
   * `robot`  UNA dichiarazione del posto di turno, chiesta a BEN.
   * Una per chiamata e non tutte insieme: così la pagina può dire chi sta
   * pensando, e nessuna richiesta somma tre attese di BEN.
   */
  azione: z.enum(["stato", "dichiara", "robot"]),
  bid: z.string().max(4).optional(),
});

/**
 * Il torneo di licita, con l'asta tenuta dal server. Vedi
 * `src/lib/torneo-licita-server.ts` per il perché.
 *
 * Chi chiama si identifica con la propria sessione; mani, asta e risultato
 * passano dalla chiave di servizio (`torneo_mano_per`, `aste_torneo_in_corso`,
 * `risultati_torneo`), che il browser non può più usare direttamente
 * (`scripts/sql/torneo-licita-server-2-2026-10.sql`).
 *
 * `{ nonPronto: true }` vuol dire che `torneo-licita-server-1` non è ancora
 * stato eseguito: la pagina torna al flusso di prima.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  if (!rateLimit(`torneo-licita:${user.id}`, 120)) {
    return NextResponse.json({ error: "Troppe richieste" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });
  const { torneoId, azione, bid } = parsed.data;

  const admin = createAdminSupabaseClient();
  const { data: dati, error: erroreMano } = await admin.rpc("torneo_mano_per", {
    p_torneo: torneoId,
    p_user: user.id,
  });
  if (erroreMano) {
    if (erroreMano.code === "PGRST202") return NextResponse.json({ nonPronto: true });
    reportError("api:torneo-licita", erroreMano);
    return NextResponse.json({ error: "Mano non disponibile" }, { status: 500 });
  }
  const mano = dati as ManoTorneo | null;
  if (!mano) return NextResponse.json({ finito: true });

  const chiave = { torneo_id: torneoId, mano_id: mano.id, user_id: user.id };
  const { data: riga, error: erroreAsta } = await admin
    .from("aste_torneo_in_corso")
    .select("asta")
    .match(chiave)
    .maybeSingle();
  if (erroreAsta) {
    reportError("api:torneo-licita", erroreAsta);
    return NextResponse.json({ error: "Asta non disponibile" }, { status: 500 });
  }
  let bids: string[] = (riga?.asta as string[] | undefined) ?? [];

  let avversarioMuto = false;
  if (azione === "dichiara") {
    if (!bid || !dichiarazioneDiSudAmmessa(mano.dealer, bids, bid)) {
      return NextResponse.json({ error: "Dichiarazione non ammessa", ...vistaAperta(mano, bids) }, { status: 409 });
    }
    bids = [...bids, bid];
  } else if (azione === "robot") {
    const chi = turnoDi(mano.dealer, bids);
    if (astaChiusa(bids) || chi === "south") {
      // Niente da fare: succede quando due schede chiedono insieme. Si
      // restituisce lo stato, che è ciò che serve a chi ha chiesto.
      return NextResponse.json(vistaAperta(mano, bids));
    }
    const esito = await chiediBidABen({
      hand: handToPBN(mano.hands[chi]),
      seat: positionToBEN(chi),
      dealer: positionToBEN(mano.dealer),
      vul: vulToBEN(mano.vulnerability),
      ctx: biddingToCTX({ dealer: mano.dealer, bids }),
    });
    if (!esito.ok) {
      if (chi === "north") {
        // Senza il compagno l'esercizio non esiste: niente passo d'ufficio,
        // si dice perché e si lascia riprovare (come prima, nella pagina).
        return NextResponse.json({
          ...vistaAperta(mano, bids),
          compagnoMuto: true,
          benStatus: esito.status,
          benErrore: esito.error,
        });
      }
      avversarioMuto = true;
      bids = [...bids, "P"];
    } else {
      bids = [...bids, benBidToItaliano(esito.bid)];
    }
  }

  if (azione !== "stato") {
    const { error } = await admin
      .from("aste_torneo_in_corso")
      .upsert({ ...chiave, asta: bids, aggiornata_at: new Date().toISOString() });
    if (error) {
      reportError("api:torneo-licita", error);
      return NextResponse.json({ error: "Asta non salvata" }, { status: 500 });
    }
  }

  if (!astaChiusa(bids)) {
    return NextResponse.json({ ...vistaAperta(mano, bids), avversarioMuto });
  }

  // ── Asta chiusa: il voto lo calcola il server, e lo scrive lui. ──────────
  const v = votoMano(mano, bids);
  if (!v) {
    reportError("api:torneo-licita", new Error(`Mano ${mano.id} senza tabella double dummy`));
    return NextResponse.json({ error: "Mano senza tabella" }, { status: 500 });
  }
  // Vale il primo risultato: un secondo arrivo non sovrascrive niente
  // (stessa regola di prima, ora applicata dal server).
  const { data: scritte, error: erroreRisultato } = await admin
    .from("risultati_torneo")
    .upsert(
      {
        ...chiave,
        asta: bids,
        contratto: v.esito?.contratto ?? null,
        dichiarante: v.esito?.declarer ?? null,
        punteggio: v.esito?.punteggio ?? 0,
        stelle: v.voto.stelle,
      },
      { onConflict: "torneo_id,mano_id,user_id", ignoreDuplicates: true },
    )
    .select("mano_id");
  if (erroreRisultato) {
    reportError("api:torneo-licita", erroreRisultato);
    return NextResponse.json({ error: "Risultato non salvato", registrazione: "errore" }, { status: 500 });
  }
  await admin.from("aste_torneo_in_corso").delete().match(chiave);

  return NextResponse.json({
    chiusa: true,
    mano,
    bids,
    avversarioMuto,
    registrazione: (scritte?.length ?? 0) > 0 ? "salvato" : "gia-presente",
  });
}
