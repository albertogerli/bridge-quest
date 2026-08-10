/**
 * Suggerimento di correzione per i refusi nel dominio dell'email.
 *
 * PERCHÉ ESISTE (caso reale, non ipotetico)
 * Un utente si è iscritto tre volte con lo stesso indirizzo scritto su tre
 * domini: `yahoo.it`, `yaoo.it`, `uahoo.it`. Gli ultimi due dichiarano un null
 * MX (RFC 7505): rifiutano formalmente ogni messaggio. Quella persona non ha
 * mai potuto ricevere un reset password ed è tornata a iscriversi, lasciando
 * tre profili con lo stesso nome BBO — che a loro volta hanno rotto la ricerca
 * degli amici. Al 2026-08-10 gli account con un dominio non recapitabile erano
 * 9, per 15.685 XP complessivi: progressi che i legittimi proprietari non
 * possono più raggiungere se perdono la password.
 *
 * COSA FA E COSA NON FA
 * Restituisce un suggerimento, mai un blocco. I domini legittimi rari sono la
 * norma qui (studi legali, scuole, domini personali): impedire l'iscrizione a
 * chi ha un indirizzo insolito sarebbe molto peggio del problema che si sta
 * risolvendo. La decisione resta all'utente.
 *
 * SOGLIA
 * Un solo errore di battitura (sostituzione, inserimento, cancellazione o
 * scambio di due lettere vicine) rispetto a un dominio noto. Allargare a due
 * errori sembra allettante ma qui è dannoso: `tim.it` e `tin.it` sono ENTRAMBI
 * provider italiani reali e distano un solo carattere. Per questo un dominio
 * presente nell'elenco non viene mai segnalato, qualunque cosa gli somigli.
 *
 * Il caso `me.it` (dominio senza MX, verosimilmente un refuso di `me.com`)
 * resta fuori portata: dista tre caratteri. Preferiamo mancarlo piuttosto che
 * abbassare la soglia e iniziare a infastidire chi ha un indirizzo valido.
 */

/**
 * Provider di posta diffusi fra gli iscritti. Un indirizzo su uno di questi
 * domini è corretto per definizione e non viene mai segnalato.
 */
const KNOWN_DOMAINS = [
  "gmail.com",
  "yahoo.it",
  "yahoo.com",
  "hotmail.it",
  "hotmail.com",
  "hotmail.fr",
  "outlook.it",
  "outlook.com",
  "libero.it",
  "alice.it",
  "virgilio.it",
  "tiscali.it",
  "tin.it",
  "tim.it",
  "fastwebnet.it",
  "inwind.it",
  "iol.it",
  "icloud.com",
  "me.com",
  "live.it",
  "msn.com",
  "proton.me",
] as const;

/**
 * Vero se si passa da `a` a `b` con una sola modifica: sostituzione,
 * inserimento, cancellazione o scambio di due caratteri adiacenti.
 *
 * Scritto a mano invece di una matrice di Levenshtein perché la soglia è fissa
 * a 1: qui basta una scansione lineare, e il codice dice esattamente quali
 * quattro casi considera un refuso.
 */
export function isOneEditApart(a: string, b: string): boolean {
  if (a === b) return false; // identici: nessun refuso da segnalare
  const diff = a.length - b.length;
  if (diff > 1 || diff < -1) return false;

  if (diff === 0) {
    // Stessa lunghezza: una sostituzione, oppure due lettere scambiate.
    const mismatches: number[] = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        mismatches.push(i);
        if (mismatches.length > 2) return false;
      }
    }
    if (mismatches.length === 1) return true;
    if (mismatches.length === 2) {
      const [i, j] = mismatches;
      return j === i + 1 && a[i] === b[j] && a[j] === b[i];
    }
    return false;
  }

  // Lunghezze diverse di 1: il più corto deve essere il più lungo meno un
  // carattere. Si avanza in parallelo e si concede un solo salto.
  const [longer, shorter] = diff === 1 ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let skipped = false;
  while (i < longer.length && j < shorter.length) {
    if (longer[i] === shorter[j]) {
      i++;
      j++;
    } else {
      if (skipped) return false;
      skipped = true;
      i++;
    }
  }
  return true;
}

/** Parte dopo la @, in minuscolo. Stringa vuota se l'indirizzo è malformato. */
function domainOf(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email.slice(at + 1).trim().toLowerCase();
}

/**
 * Dominio corretto suggerito per un indirizzo, o `null` se non c'è nulla da
 * segnalare (dominio noto, dominio plausibile ma sconosciuto, o input
 * incompleto mentre l'utente sta ancora scrivendo).
 */
export function suggestEmailDomain(email: string): string | null {
  const domain = domainOf(email);
  if (!domain) return null;
  if ((KNOWN_DOMAINS as readonly string[]).includes(domain)) return null;

  // Dominio senza punto: quasi sempre un indirizzo troncato ("mario@gmail").
  // Due account reali risultavano su "gmail", con 12.520 XP complessivi.
  if (!domain.includes(".")) {
    const completion = KNOWN_DOMAINS.find(
      (known) => known.slice(0, known.indexOf(".")) === domain
    );
    return completion ?? null;
  }

  return KNOWN_DOMAINS.find((known) => isOneEditApart(domain, known)) ?? null;
}

/**
 * Indirizzo con il dominio corretto, pronto da mostrare come "forse intendevi".
 * `null` quando non c'è alcun suggerimento.
 */
export function suggestEmailCorrection(email: string): string | null {
  const suggestion = suggestEmailDomain(email);
  if (!suggestion) return null;
  const at = email.lastIndexOf("@");
  return `${email.slice(0, at).trim()}@${suggestion}`;
}
