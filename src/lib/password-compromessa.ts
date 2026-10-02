/**
 * Quante volte una password compare negli elenchi di password rubate
 * (Have I Been Pwned), SENZA mandarla a nessuno.
 *
 * Si manda solo l'inizio (5 caratteri) dell'impronta SHA-1; il servizio
 * risponde con tutte le impronte che cominciano così, e il confronto si fa
 * qui. È il metodo «k-anonymity» pensato apposta.
 *
 * Serve a un AVVISO, non a un blocco: chi sceglie una password debole viene
 * informato e decide. Se il servizio non risponde si restituisce `null` e non
 * si mostra niente: un avviso mancato non deve impedire di registrarsi.
 */

/** Dalla risposta del servizio, quante volte compare il resto dell'impronta. */
export function occorrenzeNelRange(risposta: string, coda: string): number {
  const cercata = coda.toUpperCase();
  for (const riga of risposta.split("\n")) {
    const [suffisso, conteggio] = riga.trim().split(":");
    if (suffisso?.toUpperCase() === cercata) return Number(conteggio) || 0;
  }
  return 0;
}

async function sha1Esadecimale(testo: string): Promise<string> {
  const byte = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(testo));
  return [...new Uint8Array(byte)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export async function volteCompromessa(password: string, segnale?: AbortSignal): Promise<number | null> {
  if (password.length < 6) return null;
  try {
    const impronta = await sha1Esadecimale(password);
    const risposta = await fetch(`https://api.pwnedpasswords.com/range/${impronta.slice(0, 5)}`, {
      headers: { "Add-Padding": "true" },
      signal: segnale,
    });
    if (!risposta.ok) return null;
    return occorrenzeNelRange(await risposta.text(), impronta.slice(5));
  } catch {
    return null;
  }
}
