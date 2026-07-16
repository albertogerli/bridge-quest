import { NextResponse, after } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendWelcomeIfNeeded } from "@/lib/email/welcome";

/**
 * Auth callback route handler for PKCE code exchange.
 * Handles redirects from Supabase Auth after:
 * - Email confirmation
 * - Magic link login
 * - OAuth login
 * - Password reset
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Password recovery: redirect to the reset-password page instead of next
      const isRecovery = type === "recovery" || next === "/reset-password";
      const destination = isRecovery ? "/reset-password" : next;

      // First email confirmation / login: send the welcome email once, after the
      // redirect response (non-blocking). Deduped via email_events.
      if (!isRecovery) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id && user.email) {
          const uid = user.id;
          const mail = user.email;
          after(() => sendWelcomeIfNeeded(uid, mail));
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${destination}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`);
      } else {
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
