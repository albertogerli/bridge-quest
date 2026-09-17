/**
 * L'unico errore di BEN che la rotta può ritentare senza tenere bloccata la
 * schermata per decine di secondi.
 *
 * Il 16/09/2026 Railway ha registrato la richiesta come 200, conclusa in
 * 5.767 ms, mentre al chiamante ha restituito 502 con corpo `upstream error`.
 * Era quindi un guasto transitorio dell'edge DOPO che BEN aveva lavorato, non
 * un errore del motore. Un tentativo nuovo ha senso; ripetere invece un vero
 * timeout da 22 secondi raddoppierebbe soltanto l'attesa.
 *
 * Otto secondi comprendono l'evento misurato con margine e lasciano ancora
 * spazio nel tetto complessivo di 26 secondi della rotta.
 */
export function erroreUpstreamRitentabile(
  stato: number,
  corpo: string,
  durataMs: number,
): boolean {
  return (
    stato === 502 &&
    corpo.trim().toLowerCase() === "upstream error" &&
    durataMs <= 8_000
  );
}
