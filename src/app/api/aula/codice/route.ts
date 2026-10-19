import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/ben-guard";
import { clientIpFrom } from "@/lib/meta-capi";
import { reportError } from "@/lib/report-error";

export const dynamic = "force-dynamic";

/**
 * Dal codice di sei cifre al link dell'aula.
 *
 * Il codice è la versione da dettare del link (Trevissoi, feedback 5): qui lo
 * si traduce nel gettone e basta. Entrare resta compito di `/aula/<gettone>` e
 * di `/api/aula/entra`, con le loro guardie — scadenza, revoca, tetto di
 * ospiti. Questa rotta non crea niente e non apre niente.
 *
 * LIMITE DI TENTATIVI. Sei cifre sono un milione di combinazioni, e gli inviti
 * attivi in un giorno sono pochi: chi provasse a caso troverebbe un'aula in
 * qualche decina di migliaia di tentativi. Dieci al minuto per indirizzo
 * rendono la cosa inutile, e a un allievo che sbaglia una cifra bastano.
 */
export async function GET(req: NextRequest) {
  const codice = (req.nextUrl.searchParams.get("c") ?? "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(codice)) {
    return NextResponse.json({ errore: "Il codice ha sei cifre." }, { status: 400 });
  }
  const ip = clientIpFrom(req.headers.get("x-forwarded-for")) ?? "sconosciuto";
  if (!rateLimit(`aula-codice:${ip}`, 10)) {
    return NextResponse.json({ errore: "Troppi tentativi: aspetta un minuto." }, { status: 429 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("inviti_aula")
      .select("token")
      .eq("codice", codice)
      .eq("revocato", false)
      .gt("scade_il", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    // Colonna non ancora creata (`codice-aula-2026-10.sql` da eseguire): non è
    // un guasto da segnalare, semplicemente nessun invito ha ancora un codice.
    if (error && error.code !== "42703") throw error;
    if (!data) {
      return NextResponse.json(
        { errore: "Nessuna aula aperta con questo codice. Controlla le cifre, o chiedi all'insegnante." },
        { status: 404 },
      );
    }
    return NextResponse.json({ token: data.token });
  } catch (err) {
    reportError("api:aula-codice", err);
    return NextResponse.json({ errore: "Non riesco a controllare il codice adesso." }, { status: 500 });
  }
}
