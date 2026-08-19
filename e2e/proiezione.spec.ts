import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { leggiEnv } from "./env";
import { login, testCreds } from "./helpers";

/**
 * La vista proiezione, con due finestre vere.
 *
 * PERCHÉ NON BASTA IL TEST DI UNITÀ. `proiezione.test.ts` verifica che
 * `costruisciStato` non metta le mani coperte nel messaggio, e quella è la
 * garanzia forte. Ma fra quella funzione e il proiettore in aula ci sono un
 * canale, una seconda finestra e un componente che disegna: questo prova la
 * catena intera, che è quella che sta davanti alla classe.
 *
 * L'utente di prova nasce senza ruolo, e `/istruttori` è dietro un controllo di
 * ruolo lato server: qui lo si promuove a insegnante. Non serve rimetterlo
 * com'era — `global-teardown` lo cancella comunque a fine giro.
 */
test.beforeAll(async () => {
  const env = leggiEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { email } = testCreds();
  const { data } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  const id = data?.id ?? (await trovaIdPerEmail(admin, email));
  if (id) await admin.from("profiles").update({ role: "instructor" }).eq("id", id);
});

async function trovaIdPerEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  // `profiles` può non avere la colonna email: in quel caso l'id sta in auth.
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  return data?.users.find((u) => u.email === email)?.id ?? null;
}

test("alla finestra proiettata arrivano solo le mani scoperte", async ({ page, context }) => {
  await login(page);
  await page.goto("/istruttori/lavagna");
  await expect(page.getByRole("button", { name: /Apri vista proiezione/i })).toBeVisible({
    timeout: 20_000,
  });

  const [proiezione] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: /Apri vista proiezione/i }).click(),
  ]);
  await proiezione.waitForLoadState("domcontentloaded");

  // Tutte coperte: quattro riquadri, nessuna carta.
  await expect(proiezione.getByText("coperta")).toHaveCount(4, { timeout: 15_000 });

  /**
   * LA VERIFICA CHE CONTA, e non è quella visiva: le carte non devono proprio
   * esserci nella pagina. Se un giorno qualcuno le spedisse tutte e le
   * nascondesse con il CSS, i quattro «coperta» resterebbero lì e questo
   * controllo cadrebbe — che è esattamente il punto.
   */
  const html = await proiezione.content();
  expect(html).not.toMatch(/font-mono text-5xl/);

  // Scopro Nord dal pannello dell'insegnante.
  await page.getByRole("button", { name: "Mostra Nord alla classe" }).click();
  await expect(proiezione.getByText("coperta")).toHaveCount(3, { timeout: 10_000 });

  // Scopro tutte.
  await page.getByRole("button", { name: "Mostra tutte le mani alla classe" }).click();
  await expect(proiezione.getByText("coperta")).toHaveCount(0, { timeout: 10_000 });

  // E le ricopro: la proiezione deve tornare indietro, non restare aperta.
  await page.getByRole("button", { name: "Copri tutte le mani" }).click();
  await expect(proiezione.getByText("coperta")).toHaveCount(4, { timeout: 10_000 });

  await proiezione.close();
});
