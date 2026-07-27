/**
 * Branded, email-client-safe HTML templates for BridgeLab lifecycle emails.
 * Table-based layout + inline styles (Gmail/Outlook/Apple Mail safe).
 * All copy in Italian. Palette matches the app design system.
 */

export type EmailKind =
  | "welcome"
  | "onboarding_start"
  | "inactive_7"
  | "inactive_14"
  | "streak_risk"
  | "friend_request";

export interface EmailContext {
  name?: string | null;
  profileType?: string | null; // junior | giovane | adulto | senior
  streak?: number;
  daysInactive?: number | null;
  modulesDone?: number;
  senderName?: string | null; // friend_request: chi ha inviato la richiesta
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  /** Marketing emails carry an unsubscribe footer + List-Unsubscribe header. */
  transactional: boolean;
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(/\/$/, "");

// Palette (hex, since email clients don't support CSS vars)
const C = {
  blue: "#003DA5",
  blueLight: "#4d8fe6",
  ivory: "#F7F5F0",
  ink: "#1a1a2e",
  gold: "#c8a44e",
  goldDeep: "#a8842e",
  muted: "#6b7280",
  border: "#e7e3d8",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function greeting(name?: string | null): string {
  const n = (name || "").trim();
  return n ? `Ciao ${esc(n)}` : "Ciao";
}

/** Shared responsive shell. `unsubUrl` present -> renders marketing footer. */
function layout(opts: {
  preheader: string;
  emoji: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  unsubUrl?: string;
}): string {
  const { preheader, emoji, heading, bodyHtml, ctaLabel, ctaUrl, unsubUrl } = opts;
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.ivory};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.ivory};font-size:1px;line-height:1px;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ivory};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${C.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <!-- Header -->
      <tr><td style="background:${C.blue};background-image:linear-gradient(135deg,${C.blue},${C.blueLight});padding:26px 32px;">
        <table role="presentation" width="100%"><tr>
          <td style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.2px;">Bridge<span style="color:${C.gold};">LAB</span></td>
          <td align="right" style="font-size:12px;color:#dbe6fb;font-weight:600;">FIGB · DSA CONI</td>
        </tr></table>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 32px 8px;">
        <div style="font-size:40px;line-height:1;margin-bottom:12px;">${emoji}</div>
        <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:${C.ink};font-weight:800;letter-spacing:-0.3px;">${esc(heading)}</h1>
        <div style="font-size:16px;line-height:1.6;color:#3a3a44;">${bodyHtml}</div>
      </td></tr>
      <!-- CTA -->
      <tr><td style="padding:8px 32px 36px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="border-radius:14px;background:${C.gold};background-image:linear-gradient(135deg,${C.gold},${C.goldDeep});">
            <a href="${ctaUrl}" style="display:inline-block;padding:15px 30px;font-size:16px;font-weight:800;color:#1a1405;text-decoration:none;border-radius:14px;">${esc(ctaLabel)} →</a>
          </td>
        </tr></table>
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:22px 32px;background:${C.ivory};border-top:1px solid ${C.border};">
        <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${C.muted};">
          Bridge LAB · la scuola di bridge della Federazione Italiana Gioco Bridge (FIGB), Disciplina Sportiva Associata al CONI.
        </p>
        <p style="margin:0;font-size:12px;line-height:1.5;color:${C.muted};">
          <a href="${SITE}" style="color:${C.blue};text-decoration:none;">bridgelab.it</a>
          ${
            unsubUrl
              ? ` &nbsp;·&nbsp; <a href="${unsubUrl}" style="color:${C.muted};text-decoration:underline;">Non voglio più questi promemoria</a>`
              : ""
          }
        </p>
      </td></tr>
    </table>
    <div style="font-size:11px;color:#b7b2a4;margin-top:14px;">© Bridge LAB</div>
  </td></tr>
</table>
</body>
</html>`;
}

function textFallback(lines: string[], ctaLabel: string, ctaUrl: string, unsubUrl?: string): string {
  const out = [...lines, "", `${ctaLabel}: ${ctaUrl}`, "", "— Bridge LAB · bridgelab.it"];
  if (unsubUrl) out.push("", `Disiscriviti dai promemoria: ${unsubUrl}`);
  return out.join("\n");
}

/** Informal tone for young learners, courteous otherwise. */
function isYoung(profileType?: string | null): boolean {
  return profileType === "junior" || profileType === "giovane";
}

export function renderEmail(kind: EmailKind, ctx: EmailContext, unsubUrl?: string): RenderedEmail {
  const hi = greeting(ctx.name);
  const learn = `${SITE}/impara`;
  const daily = `${SITE}/gioca/sfida`;
  const play = `${SITE}/gioca`;

  switch (kind) {
    case "welcome": {
      const heading = "Benvenuto al tavolo! 🃏";
      const bodyHtml = `
        <p style="margin:0 0 14px;">${hi}, il tuo posto a Bridge LAB è pronto.</p>
        <p style="margin:0 0 14px;">Il bridge è il gioco di carte più affascinante del mondo — logica, memoria e gioco di squadra. Qui lo impari <strong>passo dopo passo</strong>, con lezioni brevi, mini-giochi e una sfida nuova ogni giorno.</p>
        <p style="margin:0 0 4px;">Il primo passo dura 5 minuti:</p>
        <ul style="margin:0 0 8px;padding-left:20px;color:#3a3a44;">
          <li style="margin-bottom:4px;">Fai la <strong>Lezione 1</strong> e guadagna i tuoi primi XP</li>
          <li style="margin-bottom:4px;">Sblocca la tua prima <strong>striscia 🔥</strong></li>
          <li>Prova la <strong>Sfida del Giorno</strong></li>
        </ul>`;
      return {
        subject: "Benvenuto in Bridge LAB 🃏",
        html: layout({ preheader: "Il tuo posto al tavolo è pronto — inizia dalla Lezione 1.", emoji: "🃏", heading, bodyHtml, ctaLabel: "Inizia la Lezione 1", ctaUrl: learn }),
        text: textFallback(
          [`${hi.replace(/<[^>]+>/g, "")}, benvenuto in Bridge LAB!`, "", "Impara il bridge passo dopo passo: lezioni brevi, mini-giochi e una sfida ogni giorno.", "Il primo passo dura 5 minuti: fai la Lezione 1 e guadagna i primi XP."],
          "Inizia la Lezione 1", learn
        ),
        transactional: true,
      };
    }

    case "onboarding_start": {
      const casual = isYoung(ctx.profileType);
      const heading = casual ? "La tua prima mano ti aspetta 🎴" : "Pronti a scoprire il bridge?";
      const bodyHtml = `
        <p style="margin:0 0 14px;">${hi}! Ti sei iscritto a Bridge LAB ma il bello deve ancora iniziare.</p>
        <p style="margin:0 0 14px;">Bastano <strong>5 minuti</strong> per la Lezione 1: capirai come si prende una presa e farai la tua prima mano guidata — senza pressione, al tuo ritmo.</p>
        <p style="margin:0;">Ogni lezione completata sblocca XP, badge e nuovi mini-giochi. Si parte da qui. 👇</p>`;
      return {
        subject: casual ? "La tua Lezione 1 ti aspetta 🎴" : "Inizia la tua prima lezione di bridge",
        html: layout({ preheader: "5 minuti per la Lezione 1 e la tua prima mano guidata.", emoji: "🎴", heading, bodyHtml, ctaLabel: "Fai la Lezione 1", ctaUrl: learn, unsubUrl }),
        text: textFallback(
          [`${hi.replace(/<[^>]+>/g, "")}! Ti sei iscritto a Bridge LAB ma non hai ancora iniziato.`, "", "Bastano 5 minuti per la Lezione 1 e la tua prima mano guidata."],
          "Fai la Lezione 1", learn, unsubUrl
        ),
        transactional: false,
      };
    }

    case "inactive_7": {
      const days = ctx.daysInactive ?? 7;
      const heading = "Ci manchi al tavolo 🃏";
      const streakLine =
        (ctx.streak ?? 0) > 0
          ? `<p style="margin:0 0 14px;">Avevi una striscia di <strong>${ctx.streak} giorni</strong>: riprendila oggi e non perdere lo slancio.</p>`
          : "";
      const bodyHtml = `
        <p style="margin:0 0 14px;">${hi}, sono passati ${days} giorni dall'ultima volta.</p>
        ${streakLine}
        <p style="margin:0 0 14px;">Ti basta una partita per rientrare in ritmo: la <strong>Sfida del Giorno</strong> è nuova e dura pochi minuti.</p>
        <p style="margin:0;">Riprendi da dove avevi lasciato — il tuo progresso è ancora tutto lì.</p>`;
      return {
        subject: "Ci manchi al tavolo di bridge 🃏",
        html: layout({ preheader: "La Sfida del Giorno è nuova e dura pochi minuti.", emoji: "🃏", heading, bodyHtml, ctaLabel: "Riprendi ora", ctaUrl: daily, unsubUrl }),
        text: textFallback(
          [`${hi.replace(/<[^>]+>/g, "")}, sono passati ${days} giorni.`, "", "Ti basta una partita per rientrare in ritmo: la Sfida del Giorno è nuova."],
          "Riprendi ora", daily, unsubUrl
        ),
        transactional: false,
      };
    }

    case "inactive_14": {
      const heading = "Rimettiamoci in gioco?";
      const bodyHtml = `
        <p style="margin:0 0 14px;">${hi}, è passato un po' di tempo — nessun problema, il bridge ti aspetta sempre.</p>
        <p style="margin:0 0 14px;">Abbiamo aggiunto nuove <strong>sfide</strong>, <strong>mini-giochi</strong> e mani da giocare. Riparti quando vuoi, anche solo con 5 minuti.</p>
        <p style="margin:0;">Se preferisci ripassare le basi, le lezioni sono sempre lì per te.</p>`;
      return {
        subject: "Rimettiamoci in gioco a bridge?",
        html: layout({ preheader: "Nuove sfide e mini-giochi ti aspettano. Bastano 5 minuti.", emoji: "♠️", heading, bodyHtml, ctaLabel: "Torna a giocare", ctaUrl: play, unsubUrl }),
        text: textFallback(
          [`${hi.replace(/<[^>]+>/g, "")}, è passato un po' di tempo.`, "", "Nuove sfide e mini-giochi ti aspettano. Riparti anche solo con 5 minuti."],
          "Torna a giocare", play, unsubUrl
        ),
        transactional: false,
      };
    }

    case "friend_request": {
      const sender = (ctx.senderName || "Un giocatore").trim();
      const amici = `${SITE}/amici`;
      const heading = `${sender} vuole giocare con te 🤝`; // layout() fa già esc()
      const bodyHtml = `
        <p style="margin:0 0 14px;">${hi}! <strong>${esc(sender)}</strong> ti ha inviato una richiesta di amicizia su Bridge LAB.</p>
        <p style="margin:0 0 14px;">Accettala per sfidarlo a colpi di smazzate e confrontare i vostri risultati.</p>
        <p style="margin:0;">Trovi la richiesta nella sezione <strong>Amici → Richieste</strong>.</p>`;
      return {
        subject: `${sender} ti ha inviato una richiesta di amicizia 🤝`,
        html: layout({ preheader: `Accetta la richiesta di ${sender} e sfidalo a bridge.`, emoji: "🤝", heading, bodyHtml, ctaLabel: "Vedi la richiesta", ctaUrl: amici }),
        text: textFallback(
          [`${hi.replace(/<[^>]+>/g, "")}! ${sender} ti ha inviato una richiesta di amicizia su Bridge LAB.`, "", "Accettala nella sezione Amici → Richieste per sfidarlo a bridge."],
          "Vedi la richiesta", amici
        ),
        transactional: true,
      };
    }

    case "streak_risk": {
      const s = ctx.streak ?? 3;
      const heading = `🔥 La tua striscia di ${s} giorni sta per finire`;
      const bodyHtml = `
        <p style="margin:0 0 14px;">${hi}! Non hai ancora giocato oggi e la tua striscia di <strong>${s} giorni</strong> rischia di azzerarsi a mezzanotte.</p>
        <p style="margin:0 0 14px;">Ti basta la <strong>Sfida del Giorno</strong> — pochi minuti e la striscia è salva. 💪</p>
        <p style="margin:0;">Ogni giorno consecutivo vale XP bonus: non lasciarla spezzare proprio ora.</p>`;
      return {
        subject: `🔥 Salva la tua striscia di ${s} giorni`,
        html: layout({ preheader: "Pochi minuti con la Sfida del Giorno e la striscia è salva.", emoji: "🔥", heading, bodyHtml, ctaLabel: "Gioca ora e salva la striscia", ctaUrl: daily, unsubUrl }),
        text: textFallback(
          [`${hi.replace(/<[^>]+>/g, "")}! La tua striscia di ${s} giorni rischia di azzerarsi a mezzanotte.`, "", "Ti basta la Sfida del Giorno: pochi minuti e la striscia è salva."],
          "Gioca ora", daily, unsubUrl
        ),
        transactional: false,
      };
    }
  }
}
