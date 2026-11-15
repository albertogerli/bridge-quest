/**
 * Un contratto come lo legge un giocatore italiano: «4♠», «3SA», «4♠X».
 *
 * PERCHÉ UNA FUNZIONE SOLA. Le smazzate arrivano da fonti diverse — il seed,
 * i PBN importati, il generatore, BEN — e ognuna scrive a modo suo: «4S»,
 * «3NT», «3D», «4♠». Mostrati così com'erano, sulla stessa pagina convivevano
 * «4S» e «4♠», «3NT» e «3SA» (segnalato da un controllo esterno il
 * 28/09/2026). Si normalizza qui, una volta, e solo per mostrarlo: quello
 * salvato non si tocca, perché il motore e il database lo leggono già bene.
 */
const SEME: Record<string, string> = {
  S: "♠", H: "♥", D: "♦", C: "♣",
  "♠": "♠", "♥": "♥", "♦": "♦", "♣": "♣",
  NT: "SA", N: "SA", SA: "SA",
};

export function contrattoLeggibile(contratto: string | null | undefined): string {
  if (!contratto) return "";
  const m = /^\s*([1-7])\s*(NT|SA|N|[SHDC♠♥♦♣])\s*(XX|X|\*\*|\*)?\s*$/i.exec(contratto);
  if (!m) return contratto;
  const seme = SEME[m[2].toUpperCase()] ?? m[2];
  const contro = m[3] ? (m[3].length === 2 ? "XX" : "X") : "";
  return `${m[1]}${seme}${contro}`;
}

/**
 * Lo stesso, dentro un testo: «apri 1NT con 15-17» → «apri 1SA con 15-17».
 *
 * Per i testi italiani che arrivano dai dati scritti nel codice (quiz,
 * scenari, commenti) e che citano le dichiarazioni con la sigla inglese.
 * Si usa SOLO per mostrare: i confronti con la risposta giusta restano sui
 * valori originali. «NT» da solo, senza il livello davanti, non si tocca:
 * può essere una parola di un testo inglese.
 */
export function testoConSA(testo: string): string;
export function testoConSA(testo: string | null | undefined): string | null | undefined;
export function testoConSA(testo: string | null | undefined): string | null | undefined {
  if (!testo) return testo;
  return testo.replace(/\b([1-7])NT\b/g, "$1SA");
}
