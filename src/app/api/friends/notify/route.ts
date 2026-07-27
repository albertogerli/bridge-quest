import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendLifecycleEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

/**
 * Notifica via email il destinatario di una richiesta di amicizia appena
 * inviata. Chiamata fire-and-forget dal client dopo l'insert riuscito.
 *
 * Sicurezza: il chiamante deve essere autenticato ED essere il mittente
 * (user_id) della friendship indicata, ancora in stato pending. L'email del
 * destinatario si ottiene solo server-side (admin client) e non viene mai
 * esposta al client.
 */
export async function POST(req: NextRequest) {
  const { friendshipId } = (await req.json().catch(() => ({}))) as {
    friendshipId?: number;
  };
  if (!friendshipId || typeof friendshipId !== "number") {
    return NextResponse.json({ error: "friendshipId mancante" }, { status: 400 });
  }

  // Chi chiama deve essere loggato
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "admin client error" },
      { status: 500 }
    );
  }

  // La friendship deve esistere, essere pending e avere il chiamante come mittente
  const { data: friendship, error: fErr } = await admin
    .from("friendships")
    .select("id, user_id, friend_id, status")
    .eq("id", friendshipId)
    .maybeSingle();
  if (fErr || !friendship) {
    return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
  }
  const f = friendship as {
    id: number;
    user_id: string;
    friend_id: string;
    status: string;
  };
  if (f.user_id !== user.id || f.status !== "pending") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  // Email del destinatario + nomi per il template
  const { data: recipient, error: rErr } = await admin.auth.admin.getUserById(
    f.friend_id
  );
  const to = recipient?.user?.email;
  if (rErr || !to) {
    return NextResponse.json({ sent: false, reason: "no-email" });
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", [f.user_id, f.friend_id]);
  const nameOf = new Map(
    ((profiles ?? []) as { id: string; display_name: string | null }[]).map(
      (p) => [p.id, p.display_name]
    )
  );

  const result = await sendLifecycleEmail({
    to,
    userId: f.friend_id,
    kind: "friend_request",
    ctx: {
      name: nameOf.get(f.friend_id) ?? null,
      senderName: nameOf.get(f.user_id) ?? null,
    },
  });

  return NextResponse.json({ sent: result.ok, skipped: result.skipped });
}
