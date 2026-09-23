import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Il client del browser, uno solo per tutta l'applicazione.
 *
 * PERCHÉ UN SINGOLO ISTANZA E NON UNA PER CHIAMATA. `createClient()` è
 * invocata in centosettantasette punti, e diversi hook la chiamano NEL CORPO
 * del componente — cioè a ogni render. Ogni istanza porta con sé il proprio
 * stato interno: la coda di aggiornamento del token, i timer di rinnovo e,
 * soprattutto, il proprio trasporto Realtime.
 *
 * IL DANNO NON È LA MEMORIA, È IL REALTIME. Un tavolo d'aula apre un canale e
 * lo chiude con `removeChannel` sul client che l'ha aperto: se nel frattempo il
 * componente si è ridisegnato e il client è un altro, quel canale resta
 * appeso. Con quaranta tavoli e centosessanta persone — misurato: il tetto del
 * piano è cinquecento connessioni — moltiplicare i canali è il modo in cui una
 * serata si ferma senza che nessuno capisca perché.
 *
 * NON CAMBIA NIENTE PER CHI CHIAMA: la funzione resta, restituisce sempre lo
 * stesso oggetto. Un singleton di modulo è anche il modo che Supabase
 * raccomanda per il browser.
 *
 * SOLO BROWSER. Sul server ogni richiesta deve avere il suo client con i propri
 * cookie: quello sta in `server.ts` e non si tocca. Qui l'istanza si crea alla
 * prima chiamata, che avviene sempre dentro un componente client.
 */
let istanza: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (istanza) return istanza;
  istanza = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Keep the SDK's default session coordination. Since supabase-js
      // 2.107 it handles concurrent refreshes without navigator.locks;
      // an orphaned lock could abort initialization in 2.95.3 (Sentry
      // 148959116). Do not restore a custom/no-op lock or filter AbortError.
      cookieOptions: {
        path: "/",
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        maxAge: 400 * 24 * 60 * 60, // 400 days
      },
    }
  );
  return istanza;
}
