/**
 * Traduzione dei messaggi d'errore di Supabase Auth.
 *
 * PERCHÉ ESISTE
 * Supabase risponde in inglese. Finché i casi gestiti erano due o tre, ogni
 * pagina se li mappava da sé; il 2026-08-11, attivando la protezione contro le
 * password compromesse (HaveIBeenPwned), è comparso un rifiuto nuovo che
 * nessuna delle due pagine conosceva. Il risultato era una frase inglese in
 * registrazione e, in reset password, un «Riprova» che invitava a ripetere una
 * cosa destinata a fallire per sempre.
 *
 * Il confronto è per sottostringa e non per uguaglianza: i messaggi di
 * Supabase cambiano formulazione fra le versioni, e un `includes` su una
 * porzione stabile sopravvive a un ritocco del testo.
 *
 * Il fallback NON è mai il messaggio originale: mostrare l'inglese grezzo a un
 * pubblico italiano è peggio di un messaggio generico, e in un caso — la
 * password compromessa — quel testo non spiegava nemmeno cosa fare.
 */

const GENERIC = "Si è verificato un errore. Riprova fra qualche istante.";

interface Rule {
  /** Frammenti in minuscolo: basta che uno compaia nel messaggio. */
  match: string[];
  message: string;
}

const RULES: Rule[] = [
  {
    // Protezione password compromesse (HaveIBeenPwned), attiva dall'11/08/2026.
    // Il messaggio dice cosa fare, non solo che è andata male.
    match: ["known to be weak", "pwned", "leaked password", "easy to guess"],
    message:
      "Questa password compare negli elenchi di password rubate da altri siti: chiunque potrebbe indovinarla. Scegline un'altra, anche semplice ma non comune.",
  },
  {
    match: ["should be at least", "password is too short", "minimum length"],
    message: "La password è troppo corta. Usane una di almeno 6 caratteri.",
  },
  {
    // updateUser rifiuta la nuova password se è identica a quella in uso.
    match: ["should be different from the old password", "same as the old", "new password should be different"],
    message: "La nuova password deve essere diversa da quella attuale.",
  },
  {
    match: ["rate limit", "too many requests", "over_email_send_rate_limit"],
    message: "Troppi tentativi. Attendi qualche minuto e riprova.",
  },
  {
    match: ["invalid login credentials", "invalid_credentials"],
    // Supabase restituisce lo STESSO errore per «password sbagliata» e per
    // «questa email non è registrata»: è voluto, altrimenti si potrebbe
    // scoprire chi è iscritto provando indirizzi a caso. Il prezzo è che il
    // messaggio non può dire quale dei due sia, e chi si è appena registrato
    // legge «errati» convincendosi di aver sbagliato a scegliere la password.
    // Non potendo dire la causa, si indica la via d'uscita che funziona in
    // entrambi i casi.
    message:
      "Email o password errati. Se hai appena creato l'account, usa «Password dimenticata?» qui sotto: reimpostarla è la via più rapida.",
  },
  {
    match: ["email not confirmed"],
    message:
      "Devi confermare la tua email prima di accedere. Controlla la casella di posta.",
  },
  {
    match: ["user already registered", "already registered"],
    message: "Esiste già un account con questa email.",
  },
  {
    match: ["invalid email", "unable to validate email"],
    message: "L'indirizzo email non sembra valido. Controllalo e riprova.",
  },
  {
    match: ["token has expired", "invalid token", "expired"],
    message:
      "Il collegamento è scaduto. Richiedine uno nuovo dalla pagina di accesso.",
  },
];

/**
 * Messaggio in italiano per un errore di Supabase Auth.
 * Restituisce sempre qualcosa di mostrabile, anche per input vuoti.
 */
export function authErrorMessage(raw: string | null | undefined): string {
  if (!raw) return GENERIC;
  const needle = raw.toLowerCase();
  for (const rule of RULES) {
    if (rule.match.some((fragment) => needle.includes(fragment))) return rule.message;
  }
  return GENERIC;
}

/**
 * Vero se l'errore è "esiste già un account".
 *
 * La pagina di accesso non mostra un testo per questo caso ma un blocco con i
 * pulsanti "Vai al login" e "Password dimenticata?": deve poterlo riconoscere
 * prima di chiedere la traduzione.
 */
export function isAlreadyRegistered(raw: string | null | undefined): boolean {
  return Boolean(raw && raw.toLowerCase().includes("already registered"));
}
