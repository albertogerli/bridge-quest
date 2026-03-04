/**
 * Share utility — Web Share API with clipboard fallback.
 *
 * Returns 'shared' when the native share sheet was used,
 * 'clipboard' when the text was copied to clipboard instead,
 * or 'cancelled' when the user dismissed the share sheet.
 */

const APP_URL = "https://bridgelab.it";

export type ShareOutcome = "shared" | "clipboard" | "cancelled";

// ─── Referral system ────────────────────────────────────────────────────────

const INVITES_SENT_KEY = "bq_invites_sent";

/**
 * Generate a short referral code from a userId.
 * Uses a simple hash (djb2) to produce an 8-char alphanumeric code.
 */
export function generateReferralCode(userId: string): string {
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) + hash + userId.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(8, "0").slice(0, 8);
}

/**
 * Get the full referral link for a user.
 * If no userId is provided, returns the base URL without referral code.
 */
export function getReferralLink(userId?: string): string {
  if (!userId) return APP_URL;
  const code = generateReferralCode(userId);
  return `${APP_URL}/?ref=${code}`;
}

/**
 * Copy the referral link to clipboard.
 */
export async function copyReferralLink(userId?: string): Promise<void> {
  const link = getReferralLink(userId);
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = link;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

/**
 * Share via WhatsApp — opens wa.me with pre-filled text and URL.
 */
export function shareViaWhatsApp(text: string, url: string): void {
  const fullMessage = `${text}\n${url}`;
  const encoded = encodeURIComponent(fullMessage);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

/**
 * Increment the invite-sent counter in localStorage.
 */
export function incrementInviteCount(): number {
  try {
    const prev = parseInt(localStorage.getItem(INVITES_SENT_KEY) || "0", 10);
    const next = prev + 1;
    localStorage.setItem(INVITES_SENT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

/**
 * Get current invite-sent count.
 */
export function getInviteCount(): number {
  try {
    return parseInt(localStorage.getItem(INVITES_SENT_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

/**
 * Share content via the Web Share API (mobile) with clipboard fallback (desktop).
 */
export async function shareContent(
  title: string,
  text: string,
  url?: string
): Promise<ShareOutcome> {
  const fullUrl = url ?? APP_URL;

  // Try native share first (primarily mobile)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url: fullUrl });
      return "shared";
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return "cancelled";
      }
      // Fall through to clipboard
    }
  }

  // Fallback: copy to clipboard
  const clipboardText = text + "\n" + fullUrl;
  try {
    await navigator.clipboard.writeText(clipboardText);
  } catch {
    // Last resort fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = clipboardText;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
  return "clipboard";
}

/**
 * Share an invite-a-friend message.
 * Awards +25 XP once per day via localStorage.
 * Returns the share outcome and whether XP was awarded.
 * If userId is provided, includes a personal referral link.
 */
export async function shareInvite(userId?: string): Promise<{
  outcome: ShareOutcome;
  xpAwarded: number;
}> {
  const referralUrl = getReferralLink(userId);
  const outcome = await shareContent(
    "Bridge LAB - Impara il Bridge",
    "Impara il Bridge con me su Bridge LAB! L'app ufficiale della FIGB per imparare a giocare a bridge.",
    referralUrl
  );

  let xpAwarded = 0;
  if (outcome !== "cancelled") {
    xpAwarded = awardShareXp();
    incrementInviteCount();
  }

  return { outcome, xpAwarded };
}

/**
 * Share a completed badge/achievement.
 */
export async function shareBadge(badgeName: string): Promise<ShareOutcome> {
  return shareContent(
    `Badge sbloccato - Bridge LAB`,
    `Ho sbloccato il badge "${badgeName}" su Bridge LAB!`
  );
}

/**
 * Share a game result from "Mano del Giorno" or similar.
 */
export async function shareGameResult(
  tricks: number,
  label: string
): Promise<ShareOutcome> {
  return shareContent(
    "Il mio risultato - Bridge LAB",
    `Ho fatto ${tricks} prese nella ${label} su Bridge LAB! Riesci a fare meglio?`
  );
}

// ─── Internal: XP for sharing (once per day) ───────────────────────────────

const SHARE_XP_KEY = "bq_share_xp_date";
const XP_KEY = "bq_xp";
const SHARE_XP_AMOUNT = 25;

function awardShareXp(): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const lastAward = localStorage.getItem(SHARE_XP_KEY);
    if (lastAward === today) return 0; // Already awarded today

    const prev = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
    localStorage.setItem(XP_KEY, String(prev + SHARE_XP_AMOUNT));
    localStorage.setItem(SHARE_XP_KEY, today);
    return SHARE_XP_AMOUNT;
  } catch {
    return 0;
  }
}
