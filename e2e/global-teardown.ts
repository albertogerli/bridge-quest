import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { leggiEnv } from "./env";

/** Elimina l'utente di test creato in global-setup (cascade sui dati). */
export default async function globalTeardown() {
  const credsFile = join(__dirname, ".test-user.json");
  if (!existsSync(credsFile)) return;

  const { userId } = JSON.parse(readFileSync(credsFile, "utf8"));
  const env = leggiEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.warn(`global-teardown: eliminazione utente di test fallita: ${error.message}`);
  }
  unlinkSync(credsFile);
}
