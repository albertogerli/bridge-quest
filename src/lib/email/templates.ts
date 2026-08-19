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
  | "friend_request"
  | "turno_licita"
  | "compito_assegnato"
  | "compito_in_scadenza";

export interface EmailContext {
  name?: string | null;
  profileType?: string | null; // junior | giovane | adulto | senior
  /**
   * In che lingua scrivere. Arriva da `profiles.lingua`, perché quando parte
   * un'email non c'è nessun indirizzo da cui dedurla: la persona non sta
   * navigando, è proprio per questo che le stiamo scrivendo.
   */
  lingua?: "it" | "en" | null;
  streak?: number;
  daysInactive?: number | null;
  modulesDone?: number;
  senderName?: string | null; // friend_request: chi ha inviato la richiesta
  /** turno_licita: quante licite aperte stanno aspettando una tua risposta. */
  liciteFerme?: number;
  /** compito_*: il titolo del compito, così com'è stato scritto dall'insegnante. */
  compitoTitolo?: string | null;
  /** compito_*: dove si va a farlo. */
  compitoUrl?: string | null;
  /** compito_*: la classe, per dire da chi arriva. */
  classeNome?: string | null;
  /** compito_assegnato: quante mani, per far capire quanto ci vuole. */
  compitoMani?: number;
  /** compito_in_scadenza: fra quanti giorni scade. 0 = oggi. */
  giorniAllaScadenza?: number;
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
/**
 * L'involucro comune a tutte le email.
 *
 * LA LINGUA ARRIVA FIN QUI, e prima non ci arrivava: ogni singola email era
 * bilingue grazie al suo `T(it, en)`, ma l'intestazione, il piè di pagina e il
 * collegamento di disiscrizione stavano in questa funzione, scritti in
 * italiano fisso. Chi legge in inglese riceveva un messaggio inglese che si
 * chiudeva con «Non voglio più questi promemoria» — e quel collegamento è
 * proprio quello che deve capire, perché l'alternativa a capirlo è segnare il
 * messaggio come indesiderato.
 *
 * Anche `lang="it"` era fisso: i lettori di schermo lo usano per scegliere la
 * pronuncia, e leggere l'inglese con la fonetica italiana è peggio che non
 * leggerlo.
 */
function layout(opts: {
  preheader: string;
  emoji: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  unsubUrl?: string;
  lingua?: "it" | "en" | null;
}): string {
  const { preheader, emoji, heading, bodyHtml, ctaLabel, ctaUrl, unsubUrl } = opts;
  const inglese = opts.lingua === "en";
  const L = <V,>(it: V, en: V): V => (inglese ? en : it);
  return `<!doctype html>
<html lang="${inglese ? "en" : "it"}">
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
          ${L(
            "Bridge LAB · la scuola di bridge della Federazione Italiana Gioco Bridge (FIGB), Disciplina Sportiva Associata al CONI.",
            "Bridge LAB · the bridge school of the Italian Bridge Federation (FIGB), a sports discipline associated with the Italian Olympic Committee.",
          )}
        </p>
        <p style="margin:0;font-size:12px;line-height:1.5;color:${C.muted};">
          <a href="${SITE}" style="color:${C.blue};text-decoration:none;">bridgelab.it</a>
          ${
            unsubUrl
              ? ` &nbsp;·&nbsp; <a href="${unsubUrl}" style="color:${C.muted};text-decoration:underline;">${L("Non voglio più questi promemoria", "I don't want these reminders")}</a>`
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

function textFallback(
  lines: string[],
  ctaLabel: string,
  ctaUrl: string,
  unsubUrl?: string,
  lingua?: "it" | "en" | null,
): string {
  const out = [...lines, "", `${ctaLabel}: ${ctaUrl}`, "", "— Bridge LAB · bridgelab.it"];
  // Anche la versione testuale: è quella che vedono i client che non caricano
  // l'HTML, e ha lo stesso collegamento di disiscrizione.
  if (unsubUrl) {
    out.push(
      "",
      `${lingua === "en" ? "Unsubscribe from reminders" : "Disiscriviti dai promemoria"}: ${unsubUrl}`,
    );
  }
  return out.join("\n");
}

/** Informal tone for young learners, courteous otherwise. */
function isYoung(profileType?: string | null): boolean {
  return profileType === "junior" || profileType === "giovane";
}

export function renderEmail(kind: EmailKind, ctx: EmailContext, unsubUrl?: string): RenderedEmail {
  /**
   * Il testo nella lingua giusta, con le due versioni AFFIANCATE.
   *
   * Per un'email il dizionario esterno è la scelta sbagliata: il testo è
   * dentro l'HTML, spezzato fra tag, e chi lo rilegge deve poter vedere le due
   * lingue nello stesso punto — altrimenti si corregge l'italiano e ci si
   * dimentica dell'inglese, che è esattamente il difetto che la traduzione
   * porta con sé. Con sette email e poche frasi ciascuna, questa è la forma
   * che si controlla a colpo d'occhio.
   */
  const T = <V,>(it: V, en: V): V => (ctx.lingua === "en" ? en : it);
  const hi = greeting(ctx.name);
  const learn = `${SITE}/impara`;
  const daily = `${SITE}/gioca/sfida`;
  const play = `${SITE}/gioca`;

  switch (kind) {
    case "welcome": {
      const heading = T("Benvenuto al tavolo! 🃏", "Welcome to the table! 🃏");
      const bodyHtml = T(
        `
        <p style="margin:0 0 14px;">${hi}, il tuo posto a Bridge LAB è pronto.</p>
        <p style="margin:0 0 14px;">Il bridge è il gioco di carte più affascinante del mondo — logica, memoria e gioco di squadra. Qui lo impari <strong>passo dopo passo</strong>, con lezioni brevi, mini-giochi e una sfida nuova ogni giorno.</p>
        <p style="margin:0 0 4px;">Il primo passo dura 5 minuti:</p>
        <ul style="margin:0 0 8px;padding-left:20px;color:#3a3a44;">
          <li style="margin-bottom:4px;">Fai la <strong>Lezione 1</strong> e guadagna i tuoi primi XP</li>
          <li style="margin-bottom:4px;">Sblocca la tua prima <strong>striscia 🔥</strong></li>
          <li>Prova la <strong>Sfida del Giorno</strong></li>
        </ul>`,
        `
        <p style="margin:0 0 14px;">${hi}, your seat at Bridge LAB is ready.</p>
        <p style="margin:0 0 14px;">Bridge is the most fascinating card game there is — logic, memory and teamwork. Here you learn it <strong>step by step</strong>, with short lessons, mini-games and a new challenge every day.</p>
        <p style="margin:0 0 4px;">The first step takes 5 minutes:</p>
        <ul style="margin:0 0 8px;padding-left:20px;color:#3a3a44;">
          <li style="margin-bottom:4px;">Do <strong>Lesson 1</strong> and earn your first XP</li>
          <li style="margin-bottom:4px;">Start your first <strong>streak 🔥</strong></li>
          <li>Try the <strong>Daily Challenge</strong></li>
        </ul>`
      );
      return {
        subject: T("Benvenuto in Bridge LAB 🃏", "Welcome to Bridge LAB 🃏"),
        html: layout({
          preheader: T(
            "Il tuo posto al tavolo è pronto — inizia dalla Lezione 1.",
            "Your seat at the table is ready — start with Lesson 1."
          ),
          emoji: "🃏", heading, bodyHtml,
          ctaLabel: T("Inizia la Lezione 1", "Start Lesson 1"), ctaUrl: learn,
          lingua: ctx.lingua,
        }),
        text: textFallback(
          T(
            [`${hi.replace(/<[^>]+>/g, "")}, benvenuto in Bridge LAB!`, "", "Impara il bridge passo dopo passo: lezioni brevi, mini-giochi e una sfida ogni giorno.", "Il primo passo dura 5 minuti: fai la Lezione 1 e guadagna i primi XP."],
            [`${hi.replace(/<[^>]+>/g, "")}, welcome to Bridge LAB!`, "", "Learn bridge step by step: short lessons, mini-games and a challenge every day.", "The first step takes 5 minutes: do Lesson 1 and earn your first XP."]
          ),
          T("Inizia la Lezione 1", "Start Lesson 1"), learn
        ),
        transactional: true,
      };
    }

    case "onboarding_start": {
      const casual = isYoung(ctx.profileType);
      const heading = casual
        ? T("La tua prima mano ti aspetta 🎴", "Your first hand is waiting 🎴")
        : T("Pronti a scoprire il bridge?", "Ready to discover bridge?");
      const bodyHtml = T(
        `
        <p style="margin:0 0 14px;">${hi}! Ti sei iscritto a Bridge LAB ma il bello deve ancora iniziare.</p>
        <p style="margin:0 0 14px;">Bastano <strong>5 minuti</strong> per la Lezione 1: capirai come si prende una presa e farai la tua prima mano guidata — senza pressione, al tuo ritmo.</p>
        <p style="margin:0;">Ogni lezione completata sblocca XP, badge e nuovi mini-giochi. Si parte da qui. 👇</p>`,
        `
        <p style="margin:0 0 14px;">${hi}! You signed up for Bridge LAB, but the good part hasn't started yet.</p>
        <p style="margin:0 0 14px;">Lesson 1 takes <strong>5 minutes</strong>: you'll see how a trick is won and play your first guided hand — no pressure, at your own pace.</p>
        <p style="margin:0;">Every lesson you finish unlocks XP, badges and new mini-games. It starts here. 👇</p>`
      );
      return {
        subject: casual
          ? T("La tua Lezione 1 ti aspetta 🎴", "Your Lesson 1 is waiting 🎴")
          : T("Inizia la tua prima lezione di bridge", "Start your first bridge lesson"),
        html: layout({
          preheader: T("5 minuti per la Lezione 1 e la tua prima mano guidata.", "5 minutes for Lesson 1 and your first guided hand."),
          emoji: "🎴", heading, bodyHtml,
          ctaLabel: T("Fai la Lezione 1", "Do Lesson 1"), ctaUrl: learn, unsubUrl,
          lingua: ctx.lingua,
        }),
        text: textFallback(
          T(
            [`${hi.replace(/<[^>]+>/g, "")}! Ti sei iscritto a Bridge LAB ma non hai ancora iniziato.`, "", "Bastano 5 minuti per la Lezione 1 e la tua prima mano guidata."],
            [`${hi.replace(/<[^>]+>/g, "")}! You signed up for Bridge LAB but haven't started yet.`, "", "Lesson 1 takes 5 minutes, and your first guided hand comes with it."]
          ),
          T("Fai la Lezione 1", "Do Lesson 1"), learn, unsubUrl, ctx.lingua
        ),
        transactional: false,
      };
    }

    case "inactive_7": {
      const days = ctx.daysInactive ?? 7;
      const heading = T("Ci manchi al tavolo 🃏", "We miss you at the table 🃏");
      const streakLine =
        (ctx.streak ?? 0) > 0
          ? T(
              `<p style="margin:0 0 14px;">Avevi una striscia di <strong>${ctx.streak} giorni</strong>: riprendila oggi e non perdere lo slancio.</p>`,
              `<p style="margin:0 0 14px;">You had a <strong>${ctx.streak}-day streak</strong>: pick it back up today and keep the momentum.</p>`
            )
          : "";
      const bodyHtml = T(
        `
        <p style="margin:0 0 14px;">${hi}, sono passati ${days} giorni dall'ultima volta.</p>
        ${streakLine}
        <p style="margin:0 0 14px;">Ti basta una partita per rientrare in ritmo: la <strong>Sfida del Giorno</strong> è nuova e dura pochi minuti.</p>
        <p style="margin:0;">Riprendi da dove avevi lasciato — il tuo progresso è ancora tutto lì.</p>`,
        `
        <p style="margin:0 0 14px;">${hi}, it's been ${days} days since your last hand.</p>
        ${streakLine}
        <p style="margin:0 0 14px;">One game is enough to get back into it: the <strong>Daily Challenge</strong> is new and takes a few minutes.</p>
        <p style="margin:0;">Pick up where you left off — your progress is all still there.</p>`
      );
      return {
        subject: T("Ci manchi al tavolo di bridge 🃏", "We miss you at the bridge table 🃏"),
        html: layout({
          preheader: T("La Sfida del Giorno è nuova e dura pochi minuti.", "The Daily Challenge is new and takes a few minutes."),
          emoji: "🃏", heading, bodyHtml,
          ctaLabel: T("Riprendi ora", "Pick it back up"), ctaUrl: daily, unsubUrl,
          lingua: ctx.lingua,
        }),
        text: textFallback(
          T(
            [`${hi.replace(/<[^>]+>/g, "")}, sono passati ${days} giorni.`, "", "Ti basta una partita per rientrare in ritmo: la Sfida del Giorno è nuova."],
            [`${hi.replace(/<[^>]+>/g, "")}, it's been ${days} days.`, "", "One game is enough to get back into it: the Daily Challenge is new."]
          ),
          T("Riprendi ora", "Pick it back up"), daily, unsubUrl, ctx.lingua
        ),
        transactional: false,
      };
    }

    case "inactive_14": {
      const heading = T("Rimettiamoci in gioco?", "Shall we get back to it?");
      const bodyHtml = T(
        `
        <p style="margin:0 0 14px;">${hi}, è passato un po' di tempo — nessun problema, il bridge ti aspetta sempre.</p>
        <p style="margin:0 0 14px;">Abbiamo aggiunto nuove <strong>sfide</strong>, <strong>mini-giochi</strong> e mani da giocare. Riparti quando vuoi, anche solo con 5 minuti.</p>
        <p style="margin:0;">Se preferisci ripassare le basi, le lezioni sono sempre lì per te.</p>`,
        `
        <p style="margin:0 0 14px;">${hi}, it's been a while — no problem, bridge waits for you.</p>
        <p style="margin:0 0 14px;">We've added new <strong>challenges</strong>, <strong>mini-games</strong> and hands to play. Start again whenever you like, even with just 5 minutes.</p>
        <p style="margin:0;">And if you'd rather review the basics, the lessons are always there.</p>`
      );
      return {
        subject: T("Rimettiamoci in gioco a bridge?", "Shall we get back to bridge?"),
        html: layout({
          preheader: T("Nuove sfide e mini-giochi ti aspettano. Bastano 5 minuti.", "New challenges and mini-games are waiting. Five minutes is enough."),
          emoji: "♠️", heading, bodyHtml,
          ctaLabel: T("Torna a giocare", "Come back and play"), ctaUrl: play, unsubUrl,
          lingua: ctx.lingua,
        }),
        text: textFallback(
          T(
            [`${hi.replace(/<[^>]+>/g, "")}, è passato un po' di tempo.`, "", "Nuove sfide e mini-giochi ti aspettano. Riparti anche solo con 5 minuti."],
            [`${hi.replace(/<[^>]+>/g, "")}, it's been a while.`, "", "New challenges and mini-games are waiting. Five minutes is enough to start again."]
          ),
          T("Torna a giocare", "Come back and play"), play, unsubUrl, ctx.lingua
        ),
        transactional: false,
      };
    }

    case "friend_request": {
      const sender = (ctx.senderName || T("Un giocatore", "A player")).trim();
      const amici = `${SITE}/amici`;
      const heading = T(
        `${sender} vuole giocare con te 🤝`,
        `${sender} wants to play with you 🤝`
      ); // layout() fa già esc()
      const bodyHtml = T(
        `
        <p style="margin:0 0 14px;">${hi}! <strong>${esc(sender)}</strong> ti ha inviato una richiesta di amicizia su Bridge LAB.</p>
        <p style="margin:0 0 14px;">Accettala per sfidarlo a colpi di smazzate e confrontare i vostri risultati.</p>
        <p style="margin:0;">Trovi la richiesta nella sezione <strong>Amici → Richieste</strong>.</p>`,
        `
        <p style="margin:0 0 14px;">${hi}! <strong>${esc(sender)}</strong> sent you a friend request on Bridge LAB.</p>
        <p style="margin:0 0 14px;">Accept it to challenge them deal by deal and compare your results.</p>
        <p style="margin:0;">You'll find the request under <strong>Friends → Requests</strong>.</p>`
      );
      return {
        subject: T(
          `${sender} ti ha inviato una richiesta di amicizia 🤝`,
          `${sender} sent you a friend request 🤝`
        ),
        html: layout({
          preheader: T(
            `Accetta la richiesta di ${sender} e sfidalo a bridge.`,
            `Accept ${sender}'s request and challenge them to bridge.`
          ),
          emoji: "🤝", heading, bodyHtml,
          ctaLabel: T("Vedi la richiesta", "See the request"), ctaUrl: amici,
          lingua: ctx.lingua,
        }),
        text: textFallback(
          T(
            [`${hi.replace(/<[^>]+>/g, "")}! ${sender} ti ha inviato una richiesta di amicizia su Bridge LAB.`, "", "Accettala nella sezione Amici → Richieste per sfidarlo a bridge."],
            [`${hi.replace(/<[^>]+>/g, "")}! ${sender} sent you a friend request on Bridge LAB.`, "", "Accept it under Friends → Requests to challenge them to bridge."]
          ),
          T("Vedi la richiesta", "See the request"), amici
        ),
        transactional: true,
      };
    }

    /**
     * «Tocca a te»: una licita a due aperta aspetta una tua dichiarazione.
     *
     * È TRANSAZIONALE, non promozionale: riguarda una partita che hai
     * cominciato tu e una persona che sta aspettando. Per questo non chiede il
     * consenso al marketing e non porta il piè di pagina di disiscrizione — e
     * per lo stesso motivo il testo non prova a vendere nient'altro: dice chi
     * aspetta e dove si va a rispondere.
     */
    case "turno_licita": {
      const quante = Math.max(1, ctx.liciteFerme ?? 1);
      const licite = `${SITE}/gioca/licita-amico`;
      const quali = quante === 1
        ? T("una licita", "one auction")
        : T(`${quante} licite`, `${quante} auctions`);
      const heading = quante === 1
        ? T("Tocca a te 🂡", "Your turn 🂡")
        : T(`Tocca a te in ${quante} licite 🂡`, `Your turn in ${quante} auctions 🂡`);
      const bodyHtml = T(
        `
        <p style="margin:0 0 14px;">${hi}! ${quante === 1 ? "C'è" : "Ci sono"} <strong>${quali}</strong> in cui il tuo compagno ha già dichiarato e sta aspettando la tua risposta.</p>
        <p style="margin:0 0 14px;">Ci vuole un minuto: vedi la tua mano, scegli la dichiarazione, e la parola torna a lui.</p>
        <p style="margin:0;">Non serve essere collegati insieme — ma se nessuno dei due torna, la licita resta lì.</p>`,
        `
        <p style="margin:0 0 14px;">${hi}! There ${quante === 1 ? "is" : "are"} <strong>${quali}</strong> where your partner has already bid and is waiting for your call.</p>
        <p style="margin:0 0 14px;">It takes a minute: look at your hand, choose your bid, and it's back to them.</p>
        <p style="margin:0;">You don't have to be online at the same time — but if neither of you comes back, the auction just sits there.</p>`
      );
      return {
        subject: quante === 1
          ? T("Tocca a te: una licita ti aspetta 🂡", "Your turn: an auction is waiting 🂡")
          : T(`Tocca a te: ${quante} licite ti aspettano 🂡`, `Your turn: ${quante} auctions are waiting 🂡`),
        html: layout({
          preheader: T(
            "Il tuo compagno ha dichiarato e aspetta la tua risposta.",
            "Your partner has bid and is waiting for your call."
          ),
          emoji: "🂡", heading, bodyHtml,
          ctaLabel: T("Rispondi ora", "Bid now"), ctaUrl: licite,
          lingua: ctx.lingua,
        }),
        text: textFallback(
          T(
            [`${hi.replace(/<[^>]+>/g, "")}! ${quante === 1 ? "C'è una licita" : `Ci sono ${quante} licite`} in cui il tuo compagno sta aspettando la tua dichiarazione.`, "", "Ci vuole un minuto: vedi la tua mano, dichiara, e la parola torna a lui."],
            [`${hi.replace(/<[^>]+>/g, "")}! ${quante === 1 ? "There's one auction" : `There are ${quante} auctions`} where your partner is waiting for your bid.`, "", "It takes a minute: look at your hand, bid, and it's back to them."]
          ),
          T("Rispondi ora", "Bid now"), licite
        ),
        transactional: true,
      };
    }


    /**
     * L'insegnante ha assegnato un compito.
     *
     * TRANSAZIONALE, e non è una forzatura: la persona si è iscritta a una
     * classe con un codice che le ha dato il suo insegnante, e questo messaggio
     * è la conseguenza diretta di quel gesto. Non chiede il consenso al
     * marketing e non porta il piè di pagina di disiscrizione — chi non vuole
     * più i compiti esce dalla classe, che è la stessa cosa detta bene.
     *
     * Non dice quali mani sono, e nemmeno il numero della lezione: se lo
     * dicesse, l'allievo saprebbe cosa lo aspetta prima di aprire. Dice il
     * titolo che l'insegnante ha scelto e quante mani sono, che serve solo a
     * capire se c'è tempo adesso o stasera.
     */
    case "compito_assegnato": {
      const titolo = esc(ctx.compitoTitolo ?? T("Nuovo compito", "New homework"));
      const dove = ctx.compitoUrl ?? `${SITE}/classi`;
      const classe = ctx.classeNome ? esc(ctx.classeNome) : null;
      const mani = ctx.compitoMani ?? 0;
      const quante = mani > 0
        ? T(`${mani} ${mani === 1 ? "mano" : "mani"}`, `${mani} ${mani === 1 ? "hand" : "hands"}`)
        : null;
      const bodyHtml = T(
        `
        <p style="margin:0 0 14px;">${hi}! Il tuo insegnante${classe ? ` di <strong>${classe}</strong>` : ""} ti ha assegnato <strong>${titolo}</strong>${quante ? ` — ${quante}` : ""}.</p>
        <p style="margin:0;">Le soluzioni si aprono dopo che hai giocato: prima provaci, poi leggi il commento del maestro.</p>`,
        `
        <p style="margin:0 0 14px;">${hi}! Your teacher${classe ? ` of <strong>${classe}</strong>` : ""} has assigned you <strong>${titolo}</strong>${quante ? ` — ${quante}` : ""}.</p>
        <p style="margin:0;">The solutions open after you play: try first, then read the analysis.</p>`
      );
      return {
        subject: T(`Nuovo compito: ${ctx.compitoTitolo ?? "da fare"} 📘`, `New homework: ${ctx.compitoTitolo ?? "to do"} 📘`),
        html: layout({
          preheader: T("Il tuo insegnante ti ha assegnato delle mani.", "Your teacher has assigned you some hands."),
          emoji: "📘",
          heading: T("Hai un compito", "You have homework"),
          bodyHtml,
          ctaLabel: T("Vai al compito", "Go to the homework"),
          ctaUrl: dove,
          lingua: ctx.lingua,
        }),
        text: textFallback(
          T(
            [`${hi.replace(/<[^>]+>/g, "")}! Il tuo insegnante ti ha assegnato "${ctx.compitoTitolo ?? "un compito"}"${quante ? ` — ${quante}` : ""}.`, "", "Le soluzioni si aprono dopo che hai giocato."],
            [`${hi.replace(/<[^>]+>/g, "")}! Your teacher has assigned you "${ctx.compitoTitolo ?? "some homework"}"${quante ? ` — ${quante}` : ""}.`, "", "The solutions open after you play."]
          ),
          T("Vai al compito", "Go to the homework"), dove
        ),
        transactional: true,
      };
    }

    /**
     * La scadenza si avvicina, e il compito non è finito.
     *
     * Si manda SOLO a chi non ha finito — chi ha già giocato tutte le mani non
     * deve ricevere niente, o il promemoria diventa rumore e la prossima volta
     * non lo legge nessuno. Il filtro sta in chi chiama, non qui.
     */
    case "compito_in_scadenza": {
      const titolo = esc(ctx.compitoTitolo ?? T("Il tuo compito", "Your homework"));
      const dove = ctx.compitoUrl ?? `${SITE}/classi`;
      const g = ctx.giorniAllaScadenza ?? 1;
      const quando = g <= 0
        ? T("scade oggi", "is due today")
        : g === 1
          ? T("scade domani", "is due tomorrow")
          : T(`scade fra ${g} giorni`, `is due in ${g} days`);
      const bodyHtml = T(
        `
        <p style="margin:0 0 14px;">${hi}! <strong>${titolo}</strong> ${quando}, e non l'hai ancora finito.</p>
        <p style="margin:0;">Sono poche mani: se le fai adesso, alla prossima lezione sai già di cosa si parla.</p>`,
        `
        <p style="margin:0 0 14px;">${hi}! <strong>${titolo}</strong> ${quando}, and you haven't finished it.</p>
        <p style="margin:0;">It's only a few hands: do them now and you'll know what the next lesson is about.</p>`
      );
      return {
        subject: g <= 0
          ? T(`Ultimo giorno: ${ctx.compitoTitolo ?? "il tuo compito"} ⏳`, `Last day: ${ctx.compitoTitolo ?? "your homework"} ⏳`)
          : T(`${ctx.compitoTitolo ?? "Il tuo compito"} ${quando} ⏳`, `${ctx.compitoTitolo ?? "Your homework"} ${quando} ⏳`),
        html: layout({
          preheader: T("Ti mancano ancora delle mani.", "You still have hands to play."),
          emoji: "⏳",
          heading: T("Non l'hai ancora finito", "You haven't finished it"),
          bodyHtml,
          ctaLabel: T("Finiscilo", "Finish it"),
          ctaUrl: dove,
          lingua: ctx.lingua,
        }),
        text: textFallback(
          T(
            [`${hi.replace(/<[^>]+>/g, "")}! "${ctx.compitoTitolo ?? "Il tuo compito"}" ${quando}, e non l'hai ancora finito.`],
            [`${hi.replace(/<[^>]+>/g, "")}! "${ctx.compitoTitolo ?? "Your homework"}" ${quando}, and you haven't finished it.`]
          ),
          T("Finiscilo", "Finish it"), dove
        ),
        transactional: true,
      };
    }

    case "streak_risk": {
      const s = ctx.streak ?? 3;
      const heading = T(
        `🔥 La tua striscia di ${s} giorni sta per finire`,
        `🔥 Your ${s}-day streak is about to end`
      );
      const bodyHtml = T(
        `
        <p style="margin:0 0 14px;">${hi}! Non hai ancora giocato oggi e la tua striscia di <strong>${s} giorni</strong> rischia di azzerarsi a mezzanotte.</p>
        <p style="margin:0 0 14px;">Ti basta la <strong>Sfida del Giorno</strong> — pochi minuti e la striscia è salva. 💪</p>
        <p style="margin:0;">Ogni giorno consecutivo vale XP bonus: non lasciarla spezzare proprio ora.</p>`,
        `
        <p style="margin:0 0 14px;">${hi}! You haven't played today, and your <strong>${s}-day streak</strong> resets at midnight.</p>
        <p style="margin:0 0 14px;">The <strong>Daily Challenge</strong> is all it takes — a few minutes and the streak is safe. 💪</p>
        <p style="margin:0;">Every day in a row is worth bonus XP: don't let it break now.</p>`
      );
      return {
        subject: T(`🔥 Salva la tua striscia di ${s} giorni`, `🔥 Save your ${s}-day streak`),
        html: layout({
          preheader: T(
            "Pochi minuti con la Sfida del Giorno e la striscia è salva.",
            "A few minutes with the Daily Challenge and the streak is safe."
          ),
          emoji: "🔥", heading, bodyHtml,
          ctaLabel: T("Gioca ora e salva la striscia", "Play now and save your streak"), ctaUrl: daily, unsubUrl,
          lingua: ctx.lingua,
        }),
        text: textFallback(
          T(
            [`${hi.replace(/<[^>]+>/g, "")}! La tua striscia di ${s} giorni rischia di azzerarsi a mezzanotte.`, "", "Ti basta la Sfida del Giorno: pochi minuti e la striscia è salva."],
            [`${hi.replace(/<[^>]+>/g, "")}! Your ${s}-day streak resets at midnight.`, "", "The Daily Challenge is all it takes: a few minutes and the streak is safe."]
          ),
          T("Gioca ora", "Play now"), daily, unsubUrl, ctx.lingua
        ),
        transactional: false,
      };
    }
  }
}
