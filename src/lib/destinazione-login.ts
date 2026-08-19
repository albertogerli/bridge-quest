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
