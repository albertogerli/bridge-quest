// Modulo senza dipendenze: si prova in un test senza browser né Supabase.
/**
 * Chi apre il link dell'aula ha già un account vero, aperto in questo browser?
 *
 * PERCHÉ SERVE. L'ingresso in aula crea un ospite e ne installa la sessione.
 * Se il browser ne aveva già una, quella veniva SOSTITUITA senza dire niente.
 * Il 28/09/2026 è successo a un insegnante che provava il proprio link:
 * è diventato l'ospite «gt», l'importazione degli allievi è fallita per RLS e,
 * ricaricata la pagina, il sito gli proponeva «Diventa istruttore». Non c'era
 * nessun errore da vedere, solo una persona che non capiva più chi fosse.
 *
 * Un ospite che riapre il link, invece, non ha niente da perdere: rientra
 * come prima.
 */
export interface UtenteInSessione {
  email?: string | null;
  user_metadata?: { ospite?: unknown } | null;
}

export function eOspite(utente: UtenteInSessione): boolean {
  return (
    utente.user_metadata?.ospite === true ||
    (utente.email ?? "").endsWith("@bridgelab-ospite.invalid")
  );
}

export function accountDaProteggere(utente: UtenteInSessione | null | undefined): boolean {
  return !!utente && !eOspite(utente);
}
