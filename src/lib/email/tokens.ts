import crypto from "crypto";

/**
 * HMAC secret for one-click unsubscribe links. Prefers a dedicated EMAIL_SECRET,
 * falls back to the service-role key so links are stable without extra config.
 * Server-only — this module must never be imported from client code.
 */
function secret(): string {
  return (
    process.env.EMAIL_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "bridgelab-dev-secret-change-me"
  );
}

/** Short, URL-safe signature over the user id for unsubscribe links. */
export function makeUnsubToken(userId: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(userId)
    .digest("base64url")
    .slice(0, 24);
}

/** Constant-time verification of an unsubscribe token. */
export function verifyUnsubToken(userId: string, token: string): boolean {
  const expected = makeUnsubToken(userId);
  if (typeof token !== "string" || token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
