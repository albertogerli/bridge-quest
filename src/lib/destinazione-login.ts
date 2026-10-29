/**
 * Dove mandare qualcuno dopo il login, quando la destinazione arriva
 * dall'indirizzo.
 *
 * IL PROBLEMA. `?redirect=` è scritto nell'URL, quindi lo sceglie chi manda il
 * collegamento, non noi. Finiva dritto in `window.location.href`: bastava
 * `bridgelab.it/login?redirect=https://qualcosa-di-brutto` per costruire un
 * link che PARTE dal nostro dominio, mostra la nostra pagina di accesso, e a
 * login fatto scarica la persona altrove. Il valore di quel link, per chi lo
 * spedisce, è tutto lì: comincia con bridgelab.it.
 *
 * LA REGOLA. Si accettano solo percorsi interni: iniziano con una barra sola e
 * non ne hanno una seconda subito dopo. `//evil.example` è un indirizzo
 * assoluto senza schema — il browser lo segue fuori — e somiglia troppo a un
 * percorso per lasciarlo passare a occhio. Tutto il resto torna alla home:
 * meglio la pagina sbagliata che un sito sbagliato.
 */
export function destinazioneSicura(grezza: string | null | undefined): string {
  if (!grezza) return "/";
  // Gli spazi bianchi in testa ingannano i controlli sul primo carattere:
  // "\n//evil.example" comincia con una barra solo dopo la ripulitura.
  const p = grezza.trim();
  if (!p.startsWith("/")) return "/";
  if (p.startsWith("//")) return "/";
  // `/\evil.example` viene normalizzato da alcuni browser come `//evil…`.
  if (p.startsWith("/\\")) return "/";
  return p;
}

/**
 * Le pagine d'ingresso di una sezione che non vale la pena di riaprire dopo
 * il login. Si arriva al login da lì quando il browser completa da solo
 * l'indirizzo (`bridgelab.it/f…` → `/forum`): la persona non le ha chieste, e
 * a login fatto si ritrovava nel Forum invece che nella sua home — insegnante
 * e allievo, anche in una finestra in incognito (Trevissoi, 29/10/2026).
 *
 * Solo la pagina d'ingresso: `/forum/29` è un collegamento a un post preciso
 * e resta dov'è.
 */
const INGRESSI_DA_NON_RIAPRIRE = ["/forum", "/amici", "/classifica", "/negozio", "/collezione", "/obiettivi"];

/**
 * Dove andare a login fatto: la destinazione chiesta, se è sicura e se è
 * qualcosa di preciso; altrimenti la home (nella lingua dell'indirizzo).
 */
export function destinazioneDopoLogin(grezza: string | null | undefined): string {
  const sicura = destinazioneSicura(grezza);
  const [percorso] = sicura.split(/[?#]/);
  const inglese = percorso === "/en" || percorso.startsWith("/en/");
  const senzaPrefisso = inglese ? percorso.slice(3) || "/" : percorso;
  const pulito = senzaPrefisso.length > 1 ? senzaPrefisso.replace(/\/+$/, "") : senzaPrefisso;
  if (INGRESSI_DA_NON_RIAPRIRE.includes(pulito)) return inglese ? "/en" : "/";
  return sicura;
}
