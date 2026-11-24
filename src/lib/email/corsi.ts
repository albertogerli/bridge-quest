/**
 * Le due mail dei corsi: «c'è un corso da approvare» all'amministratore, e
 * l'esito a chi l'ha caricato. Solo server (usa la chiave Resend).
 *
 * Una mail che non parte non deve far fallire il salvataggio: il corso resta
 * nella coda di /admin/corsi, che è la fonte di verità.
 */

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "alberto@albertogerli.it";
const SITO = "https://bridgelab.it";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function invia(to: string, subject: string, html: string, replyTo?: string): Promise<void> {
  if ((process.env.EMAIL_ENABLED || "").toLowerCase() === "false") return;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[corsi] RESEND_API_KEY assente: mail saltata");
    return;
  }
  const from = process.env.RESEND_FROM || "BridgeLab <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) console.warn("[corsi] Resend", res.status);
  } catch {
    console.warn("[corsi] invio mail non riuscito");
  }
}

export async function avvisaAdminNuovoCorso(c: {
  circolo: string;
  tipo: string;
  maestro: string;
  primaLezione: string;
  modifica: boolean;
  haClasse: boolean;
  emailAutore: string | null;
}): Promise<void> {
  const html = `
    <h2>${c.modifica ? "Modifica a un corso pubblicato" : "Nuovo corso da approvare"}</h2>
    <p><strong>${escapeHtml(c.circolo)}</strong> · ${escapeHtml(c.tipo)}</p>
    <p>Maestro: ${escapeHtml(c.maestro)} · prima lezione ${escapeHtml(c.primaLezione)}</p>
    ${c.tipo === "Bridge 5.0" && !c.haClasse ? "<p><strong>Attenzione:</strong> dichiarato Bridge 5.0, ma chi l'ha caricato non ha classi su BridgeLab.</p>" : ""}
    <p><a href="${SITO}/admin/corsi">Apri la coda dei corsi</a></p>
  `;
  await invia(ADMIN_EMAIL, `Corso da approvare: ${c.circolo}`, html, c.emailAutore ?? undefined);
}

export async function avvisaAutoreEsito(c: {
  to: string;
  esito: "pubblicato" | "da-modificare" | "rifiutato";
  circolo: string;
  idCorso: string;
  messaggio: string | null;
}): Promise<void> {
  const titolo =
    c.esito === "pubblicato"
      ? "Il tuo corso è online"
      : c.esito === "da-modificare"
        ? "Il tuo corso ha bisogno di una modifica"
        : "Il tuo corso non è stato pubblicato";
  const link =
    c.esito === "pubblicato"
      ? `<p><a href="${SITO}/corsi/${c.idCorso}">Guarda la pagina del corso</a>: puoi stamparne il link o condividerlo.</p>`
      : c.esito === "da-modificare"
        ? `<p><a href="${SITO}/corsi/nuovo?da=${c.idCorso}">Correggi e rimanda il corso</a></p>`
        : "";
  const html = `
    <h2>${titolo}</h2>
    <p>${escapeHtml(c.circolo)}</p>
    ${c.messaggio ? `<p>Messaggio dall'amministratore:<br>${escapeHtml(c.messaggio).replace(/\n/g, "<br>")}</p>` : ""}
    ${link}
    <p>BridgeLab · <a href="${SITO}/corsi">Corsi di bridge</a></p>
  `;
  await invia(c.to, `${titolo}: ${c.circolo}`, html);
}
