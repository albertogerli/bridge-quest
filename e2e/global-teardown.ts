import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

/** Elimina l'utente di test creato in global-setup (cascade sui dati). */
export default async function globalTeardown() {
  const credsFile = join(__dirname, ".test-user.json");
  if (!existsSync(credsFile)) return;

  const { userId } = JSON.parse(readFileSync(credsFile, "utf8"));
  const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  const env = Object.fromEntries(
    raw
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
  );

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.warn(`global-teardown: eliminazione utente di test fallita: ${error.message}`);
  }
  unlinkSync(credsFile);
}
