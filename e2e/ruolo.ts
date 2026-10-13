import { createClient } from "@supabase/supabase-js";
import { leggiEnv } from "./env";
import { testCreds } from "./helpers";

/**
 * Rende insegnante l'utente di prova per la durata di un file, e poi lo
 * rimette com'era.
 *
 * PERCHÉ IL RIPRISTINO. L'utente di prova è uno solo per tutto il giro e i
 * file girano in fila: un ruolo lasciato addosso da un file arriva a tutti
 * quelli dopo. Finché il ruolo cambiava solo cosa si poteva aprire non se ne
 * accorgeva nessuno; da quando la home di chi insegna è in «modalità corso»
 * (ottobre 2026, niente navigazione laterale) le prove sulla lingua di
 * `lingua.spec.ts` cercavano la navigazione su una home che non l'ha più.
 *
 *   test.beforeAll(async () => { ripristina = await comeInsegnante(); });
 *   test.afterAll(async () => { await ripristina?.(); });
 */
export async function comeInsegnante(): Promise<() => Promise<void>> {
  const env = leggiEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { email } = testCreds();
  // L'id si prende da `auth.users`: `profiles` non ha la colonna email, e
  // cercarlo lì fallirebbe in silenzio lasciando il test senza ruolo.
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  const id = data?.users.find((u) => u.email === email)?.id;
  if (!id) return async () => {};

  const { data: prima } = await admin.from("profiles").select("role").eq("id", id).maybeSingle();
  const ruoloPrima = (prima?.role as string | undefined) ?? "user";
  await admin.from("profiles").update({ role: "instructor" }).eq("id", id);
  return async () => {
    await admin.from("profiles").update({ role: ruoloPrima }).eq("id", id);
  };
}
