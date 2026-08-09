/**
 * Tipi della Mano del Giorno.
 *
 * Estratti da `src/app/gioca/mano-del-giorno/page.tsx` (refactoring a
 * comportamento invariato): la cartella `_types`/`_components` con underscore
 * non produce rotte in App Router, quindi resta colocata alla pagina che la usa.
 */

/** Esito della mano di una giornata, salvato su `bq_daily_hand_<data>`. */
export interface DailyResult {
  played: true;
  tricks: number;
  made: boolean;
  result: number; // +N or -N relative to contract
  stars: number;
  xpEarned: number;
}
