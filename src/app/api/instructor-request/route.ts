import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "alberto@albertogerli.it";

/**
 * POST /api/instructor-request
 * Files (or resubmits) the current user's request to become an instructor, then
 * notifies the admin by email if RESEND_API_KEY is configured. The DB insert
 * runs as the authenticated user (RLS: self-insert only).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const message: string = typeof body.message === "string" ? body.message.slice(0, 2000) : "";
    const asdCode: string | null = typeof body.asdCode === "string" ? body.asdCode : null;

    // Upsert so a rejected user can re-apply (resets to pending).
    const { error } = await supabase
      .from("instructor_requests")
      .upsert(
        {
          user_id: user.id,
          status: "pending",
          message: message || null,
          asd_code: asdCode,
          reviewed_at: null,
          reviewed_by: null,
        },
        { onConflict: "user_id" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch a friendly name for the email.
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    await sendAdminEmail({
      applicantName: profile?.display_name ?? "Utente",
      applicantEmail: user.email ?? "(email sconosciuta)",
      message,
      asdCode,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Errore imprevisto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Sends the notification via Resend REST API. No-op (logged) if no key set. */
async function sendAdminEmail(input: {
  applicantName: string;
  applicantEmail: string;
  message: string;
  asdCode: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[instructor-request] RESEND_API_KEY non configurata: email saltata. Richiesta da",
      input.applicantEmail
    );
    return;
  }

  const from = process.env.RESEND_FROM || "BridgeLab <onboarding@resend.dev>";
  const html = `
    <h2>Nuova richiesta istruttore</h2>
    <p><strong>${escapeHtml(input.applicantName)}</strong> (${escapeHtml(input.applicantEmail)}) ha richiesto l'accesso al Portale Istruttori.</p>
    ${input.asdCode ? `<p>ASD: ${escapeHtml(input.asdCode)}</p>` : ""}
    ${input.message ? `<p>Messaggio:<br>${escapeHtml(input.message)}</p>` : ""}
    <p>Approva o rifiuta da: <a href="https://bridgelab.it/admin/istruttori">Pannello richieste istruttori</a></p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [ADMIN_EMAIL],
        subject: `Richiesta istruttore: ${input.applicantName}`,
        html,
        reply_to: input.applicantEmail,
      }),
    });
    if (!res.ok) {
      console.error("[instructor-request] Resend error", res.status, await res.text());
    }
  } catch (e) {
    console.error("[instructor-request] Resend fetch failed", e);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
