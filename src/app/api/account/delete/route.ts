import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/delete — eliminazione completa del PROPRIO account.
 *
 * Perché server-side: la cancellazione dal client non poteva essere completa.
 * `game_results` e `challenges` referenziano `auth.users` (non `profiles`) e le
 * RLS di `game_results` non prevedono DELETE, quindi le partite sopravvivevano
 * a un'operazione dichiarata "elimina tutti i dati".
 *
 * Eliminando l'utente di autenticazione, la cascata copre tutto in una volta:
 *   auth.users -> profiles -> completed_modules, badges, review_items,
 *                             forum_posts/comments/likes, login_history,
 *                             email_events, tournament_results
 *              -> game_results, challenges, friendships, push_subscriptions,
 *                 forum_poll_votes, classes, class_members,
 *                 instructor_requests, class_messages
 *
 * SICUREZZA: l'id da eliminare viene SOLO dalla sessione. Nessun parametro del
 * client viene letto: non è possibile far cancellare l'account di un altro.
 */
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch (e) {
    console.error("[account/delete] admin client non disponibile", e);
    return NextResponse.json({ error: "Servizio non disponibile" }, { status: 500 });
  }

  // `instructor_requests.reviewed_by` è l'unica dipendenza NO ACTION su
  // auth.users: se questo utente ha revisionato richieste altrui, la
  // cancellazione fallirebbe. Si sgancia il riferimento (la richiesta resta,
  // senza più il revisore).
  const { error: unlinkError } = await admin
    .from("instructor_requests")
    .update({ reviewed_by: null })
    .eq("reviewed_by", user.id);

  if (unlinkError) {
    console.error("[account/delete] unlink reviewed_by", unlinkError.message);
    return NextResponse.json(
      { error: "Eliminazione non riuscita. Riprova più tardi." },
      { status: 500 }
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account/delete] deleteUser", error.message);
    return NextResponse.json(
      { error: "Eliminazione non riuscita. Riprova più tardi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
