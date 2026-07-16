import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendLifecycleEmail } from "./send";

/**
 * Sends the branded welcome email exactly once per user (transactional).
 * Safe to call on every auth callback: the email_events one-shot unique index
 * + the pre-check here guarantee no duplicates. Never throws.
 */
export async function sendWelcomeIfNeeded(userId: string, email: string): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: already } = await supabase
      .from("email_events")
      .select("id")
      .eq("user_id", userId)
      .eq("email_type", "welcome")
      .maybeSingle();
    if (already) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, profile_type")
      .eq("id", userId)
      .maybeSingle();

    const result = await sendLifecycleEmail({
      to: email,
      userId,
      kind: "welcome",
      ctx: { name: profile?.display_name ?? null, profileType: profile?.profile_type ?? null },
    });

    if (result.ok) {
      await supabase
        .from("email_events")
        .insert({ user_id: userId, email_type: "welcome", meta: { provider_id: result.id ?? null } });
    }
  } catch (e) {
    console.error("[welcome] invio fallito", e);
  }
}
