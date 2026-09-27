/**
 * Quale richiesta mostrare nella home — UNA, non tutte quelle che valgono.
 *
 * COSA SUCCEDEVA. Le condizioni erano quattro, scritte in quattro punti
 * diversi del JSX, e nessuna sapeva delle altre. Un utente registrato,
 * avviato e senza ASD ne vedeva DUE in fila — «attiva i promemoria» e
 * «trova un circolo» — più il banner del consenso sovrapposto in basso.
 * Tre cose che chiedono, nella schermata che dovrebbe dare.
 *
 * Non è che ognuna fosse sbagliata: era sbagliato che nessuno contasse
 * quante ne arrivavano insieme. Una regola sparsa in quattro punti non è una
 * regola, è quattro decisioni che si scoprono di essere in disaccordo solo
 * guardando lo schermo di qualcuno.
 *
 * L'ORDINE È PER URGENZA DI CHI GUARDA, non per importanza per noi:
 *  1. non sa cos'è          — chi non ha fatto l'introduzione non capisce il resto
 *  2. sta per perdere tutto — l'ospite gioca su un account che svanisce
 *  3. gli manca il circolo  — il collegamento alla FIGB, che è il punto
 *  4. i promemoria          — utile, e l'unica che può aspettare domani
 *
 * IL CONSENSO NON È IN ELENCO apposta: è un obbligo di legge, sta in un
 * riquadro fisso suo e non compete per lo stesso posto. Ma è il motivo per
 * cui le altre devono essere una: sopra ce n'è già una che non si può
 * togliere.
 */
export type RichiestaHome = "prima-mano" | "ospite" | "trova-asd" | "notifiche" | null;

export function richiestaDaMostrare(stato: {
  /** Non ha fatto l'introduzione, e non la sta facendo adesso. */
  nonAvviato: boolean;
  /** Ospite senza nessun progresso: quello che fa lo perde. */
  ospiteDaSalvare: boolean;
  /** Registrato e senza circolo. */
  senzaCircolo: boolean;
  /** Registrato: i promemoria si possono proporre. */
  autenticato: boolean;
}): RichiestaHome {
  if (stato.nonAvviato) return "prima-mano";
  if (stato.ospiteDaSalvare) return "ospite";
  if (stato.autenticato && stato.senzaCircolo) return "trova-asd";
  if (stato.autenticato) return "notifiche";
  return null;
}
