import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { leggiEnv } from "./env";
import { assertTestTarget } from "../scripts/test-target.mjs";

/** Elimina l'utente di test creato in global-setup (cascade sui dati). */
export default async function globalTeardown() {
  const credsFile = join(__dirname, ".test-user.json");
  if (!existsSync(credsFile)) return;

  const { userId, target } = JSON.parse(readFileSync(credsFile, "utf8"));
  const env = leggiEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  assertTestTarget(env.NEXT_PUBLIC_SUPABASE_URL, env.BRIDGELAB_TEST_SUPABASE_URL);
  if (target !== env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Teardown: destinazione diversa dal setup, nessuna cancellazione eseguita");

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error("Teardown: eliminazione fallita, credenziali di test conservate per il recupero");
  }
  unlinkSync(credsFile);
}
