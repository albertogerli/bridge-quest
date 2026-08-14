import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendLifecycleEmail } from "@/lib/email/send";
import type { EmailKind } from "@/lib/email/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily re-engagement cron. Vercel Cron calls this once a day and, when
 * CRON_SECRET is set, sends `Authorization: Bearer <CRON_SECRET>` automatically.
 *
 * Flow: get_engagement_targets() picks (per eligible user) the single best
 * email to send today -> we send it via Resend -> we record it in email_events
 * so the same drip is never sent twice. Marketing consent + timing rules all
 * live in the SQL function.
 *
 * Manual trigger:
 *   curl https://bridgelab.it/api/cron/engagement?limit=50 \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET non configurato — endpoint disabilitato." },
      { status: 500 }
    );
  }

  // Solo header Authorization: il secret in query string finirebbe in access
  // log e Referer (rilievo perizia sicurezza 2026-08).
  const auth = req.headers.get("authorization");
  const authorized = auth === `Bearer ${secret}`;
  if (!authorized) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const limit = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "300", 10) || 300, 1),
    500
  );

  let supabase;
  try {
    supabase = createAdminSupabaseClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "admin client error" },
      { status: 500 }
    );
  }

  const { data: targets, error } = await supabase.rpc("get_engagement_targets", { p_limit: limit });
  if (error) {
    console.error("[cron/engagement] RPC error", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (targets ?? []) as Array<{
    user_id: string;
    email: string;
    display_name: string | null;
    profile_type: string | null;
    kind: EmailKind;
    ctx: {
      streak?: number;
      modules_done?: number;
      days_inactive?: number | null;
      licite_ferme?: number;
    } | null;
  }>;

  const byKind: Record<string, number> = {};
  let sent = 0;
  let skipped = 0;
  const errors: Array<{ user_id: string; kind: string; error: string }> = [];

  for (const r of rows) {
    const result = await sendLifecycleEmail({
      to: r.email,
      userId: r.user_id,
      kind: r.kind,
      ctx: {
        name: r.display_name,
        profileType: r.profile_type,
        streak: r.ctx?.streak ?? 0,
        modulesDone: r.ctx?.modules_done ?? 0,
        daysInactive: r.ctx?.days_inactive ?? null,
        liciteFerme: r.ctx?.licite_ferme ?? 0,
      },
    });

    if (result.ok) {
      const { error: recErr } = await supabase.from("email_events").insert({
        user_id: r.user_id,
        email_type: r.kind,
        meta: { provider_id: result.id ?? null },
      });
      if (recErr) {
        // Recorded-send mismatch is worse than a missed send: log loudly.
        console.error(`[cron/engagement] invio ok ma record fallito (${r.kind}, ${r.user_id})`, recErr.message);
      }
      sent++;
      byKind[r.kind] = (byKind[r.kind] || 0) + 1;
    } else if (result.skipped) {
      skipped++;
    } else {
      errors.push({ user_id: r.user_id, kind: r.kind, error: result.error || "unknown" });
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: rows.length,
    sent,
    skipped,
    byKind,
    errors: errors.slice(0, 20),
    errorCount: errors.length,
  });
}
