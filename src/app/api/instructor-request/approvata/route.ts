import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendLifecycleEmail } from "@/lib/email/send";
import { reportError } from "@/lib/report-error";

export const dynamic = "force-dynamic";

/**
 * POST /api/instructor-request/approvata { requestId }
 *
 * Avvisa per email chi è appena stato approvato come insegnante. Prima
 * l'approvazione era muta: chi aveva chiesto doveva tornare da sé sulla
 * pagina per scoprirlo.
 *
 * SOLO AMMINISTRATORI, e solo per una richiesta che risulta davvero approvata:
 * la rotta non approva niente, racconta un fatto già scritto nel database.
 * Una approvazione si annuncia una volta sola — la chiave è la data della
 * revisione, così una seconda approvazione dopo un rifiuto riparte.
 */
export async function POST(req: NextRequest) {
  const parsed = z
    .object({ requestId: z.string().uuid() })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "requestId mancante" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: isAdmin, error: erroreRuolo } = await supabase.rpc("is_admin");
  if (erroreRuolo) {
    reportError("api:insegnante-approvato", erroreRuolo);
    return NextResponse.json({ error: "Verifica del ruolo non riuscita" }, { status: 500 });
  }
  if (!isAdmin) return NextResponse.json({ error: "Solo amministratori" }, { status: 403 });

  try {
    const db = createAdminSupabaseClient();
    const { data: richiesta } = await db
      .from("instructor_requests")
      .select("user_id, status, reviewed_at, review_message")
      .eq("id", parsed.data.requestId)
      .maybeSingle();
    if (!richiesta || richiesta.status !== "approved") {
      return NextResponse.json({ sent: false, reason: "non-approvata" });
    }

    const { data: gia } = await db
      .from("email_events")
      .select("id")
      .eq("user_id", richiesta.user_id)
      .eq("email_type", "insegnante_approvato")
      .eq("meta->>reviewed_at", richiesta.reviewed_at)
      .limit(1);
    if (gia && gia.length) return NextResponse.json({ sent: false, reason: "gia-inviata" });

    const { data: utente } = await db.auth.admin.getUserById(richiesta.user_id);
    const to = utente?.user?.email;
    if (!to) return NextResponse.json({ sent: false, reason: "no-email" });

    const { data: profilo } = await db
      .from("profiles")
      .select("display_name")
      .eq("id", richiesta.user_id)
      .maybeSingle();

    const esito = await sendLifecycleEmail({
      to,
      userId: richiesta.user_id,
      kind: "insegnante_approvato",
      ctx: { name: profilo?.display_name ?? null, messaggioRevisione: richiesta.review_message },
    });
    if (esito.ok) {
      await db.from("email_events").insert({
        user_id: richiesta.user_id,
        email_type: "insegnante_approvato",
        meta: { reviewed_at: richiesta.reviewed_at, provider_id: esito.id ?? null },
      });
    }
    return NextResponse.json({ sent: esito.ok, skipped: esito.skipped });
  } catch (err) {
    reportError("api:insegnante-approvato", err);
    return NextResponse.json({ error: "Invio non riuscito" }, { status: 500 });
  }
}
