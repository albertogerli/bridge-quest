import { reportError } from "@/lib/report-error";

/**
 * Unicità del nome BBO (`profiles.bbo_username`).
 *
 * Il campo è FACOLTATIVO — su 1085 profili, 410 non hanno un handle BBO — ma
 * quando è valorizzato deve identificare un solo account: è l'identità
 * dell'iscritto su BridgeBase Online e l'app la usa per riconoscerlo.
 *
 * Il confronto ignora maiuscole/minuscole e spazi ai bordi, come l'indice
 * unico parziale previsto lato database (vedi
 * `scripts/sql/bbo-username-unique-2026-08.sql`).
 */

/** Messaggio unico mostrato all'utente quando l'handle è già di un altro account. */
export const BBO_USERNAME_TAKEN_MESSAGE =
  "Questo nome BBO è già associato a un altro account";

/**
 * Forma canonica per il confronto: `lower(btrim(...))`, la stessa usata dalla
 * funzione SQL `is_bbo_username_taken`. Un valore assente diventa stringa vuota.
 */
export function normalizeBboUsername(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

/**
 * Un handle vuoto (o fatto di soli spazi) è sempre valido: chi non gioca su
 * BBO lascia il campo vuoto e non va bloccato.
 */
export function isBboUsernameBlank(raw: string | null | undefined): boolean {
  return normalizeBboUsername(raw) === "";
}

/**
 * `true` solo se il valore digitato è davvero diverso da quello già salvato.
 *
 * Serve a non far scattare il controllo quando l'utente ri-salva il proprio
 * stesso handle, nemmeno se ne cambia solo maiuscole/minuscole o spazi: fra i
 * profili esistenti ci sono 18 handle storicamente duplicati e chi li possiede
 * deve poter continuare a modificare il resto del profilo.
 */
export function bboUsernameChanged(
  next: string | null | undefined,
  current: string | null | undefined
): boolean {
  return normalizeBboUsername(next) !== normalizeBboUsername(current);
}

/**
 * `true` se il controllo di unicità va eseguito: solo per un handle non vuoto
 * e realmente cambiato rispetto a quello salvato.
 */
export function shouldCheckBboUsername(
  next: string | null | undefined,
  current: string | null | undefined
): boolean {
  return !isBboUsernameBlank(next) && bboUsernameChanged(next, current);
}

/** Il minimo che serve per invocare la RPC: rende la funzione testabile senza Supabase. */
export interface BboRpcClient {
  rpc(
    fn: string,
    args?: Record<string, unknown>
  ): PromiseLike<{ data: unknown; error: unknown }>;
}

/**
 * Chiede al database se l'handle è già di un ALTRO account.
 *
 * Passa dalla RPC `is_bbo_username_taken` perché `profiles.bbo_username` non è
 * leggibile sugli altri utenti (privilegi di colonna) e in registrazione il
 * chiamante è ancora anonimo. La funzione SQL restituisce solo un booleano e
 * esclude da sola il profilo di `auth.uid()`: nessun id viaggia dal client, e
 * nessun dato personale torna indietro.
 *
 * In caso di errore di trasporto NON blocca l'utente (`taken: false`): un
 * problema di rete non deve impedire di salvare il profilo o di registrarsi.
 * È un fail-open consapevole — la garanzia forte è l'indice unico parziale
 * lato database, non ancora applicato.
 */
export async function isBboUsernameTaken(
  client: BboRpcClient,
  raw: string | null | undefined,
  scope: string
): Promise<boolean> {
  if (isBboUsernameBlank(raw)) return false;

  const { data, error } = await client.rpc("is_bbo_username_taken", {
    p_bbo_username: normalizeBboUsername(raw),
  });

  if (error) {
    reportError(scope, error);
    return false;
  }

  return data === true;
}
