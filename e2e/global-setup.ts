import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Crea un utente di test usa-e-getta via service role (email confermata,
 * nessuna email reale inviata). Le credenziali passano ai test via file
 * temporaneo; global-teardown elimina l'utente (cascade su profiles & co.).
 */

export const CREDS_FILE = join(__dirname, ".test-user.json");

function loadEnv(): Record<string, string> {
  const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  return Object.fromEntries(
    raw
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
  );
}

export default async function globalSetup() {
  const env = loadEnv();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const email = `e2e-${Date.now()}@bridgelab-test.invalid`;
  const password = `E2e!${Math.random().toString(36).slice(2, 12)}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Utente E2E" },
  });
  if (error || !data.user) {
    throw new Error(`global-setup: creazione utente di test fallita: ${error?.message}`);
  }

  writeFileSync(CREDS_FILE, JSON.stringify({ email, password, userId: data.user.id }));
}
