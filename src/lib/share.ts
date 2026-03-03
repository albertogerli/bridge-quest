/**
 * Share utility — Web Share API with clipboard fallback.
 *
 * Returns 'shared' when the native share sheet was used,
 * 'clipboard' when the text was copied to clipboard instead,
 * or 'cancelled' when the user dismissed the share sheet.
 */

const APP_URL = "https://bridgelab.figb.it";

export type ShareOutcome = "shared" | "clipboard" | "cancelled";

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
 */
export async function shareInvite(): Promise<{
  outcome: ShareOutcome;
  xpAwarded: number;
}> {
  const outcome = await shareContent(
    "Bridge LAB - Impara il Bridge",
    "Impara il Bridge con me su Bridge LAB! L'app ufficiale della FIGB per imparare a giocare a bridge."
  );

  let xpAwarded = 0;
  if (outcome !== "cancelled") {
    xpAwarded = awardShareXp();
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
