import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "./test";
import { leggiEnv } from "./env";
import { login, testCreds } from "./helpers";
import { assertTestTarget } from "../scripts/test-target.mjs";

test("risultato: risposta persa, retry in due schede e isolamento proprietario", async ({ page, context }) => {
  test.setTimeout(90_000);
  const env = leggiEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  assertTestTarget(env.NEXT_PUBLIC_SUPABASE_URL, env.BRIDGELAB_TEST_SUPABASE_URL);
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const owner = testCreds().userId;
  expect(owner).toBeTruthy();
  const id = randomUUID(), otherId = randomUUID(), otherOwner = randomUUID();
  const key = `bq_game_result_v2:${id}`, otherKey = `bq_game_result_v2:${otherId}`;
  let delivered = false;
  const pattern = "**/rest/v1/game_results*";
  try {
    await login(page);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("bq_progress_owner"))).toBe(owner);
    // Simulate a connection lost AFTER the server commits. Further attempts
    // remain offline until explicitly restored below. This is not a mock DB.
    await context.route(pattern, async route => {
      if (route.request().method() !== "POST") return route.continue();
      if (!delivered) {
        const response = await route.fetch();
        expect(response.ok()).toBeTruthy();
        delivered = true;
      }
      await route.abort("connectionreset");
    });
    await page.evaluate(({ id, owner, otherId, otherOwner, key, otherKey }) => {
      const base = { gameType: "memory", score: 7, timestamp: new Date().toISOString(), platform: "web", details: { synthetic: true } };
      localStorage.setItem(key, JSON.stringify({ ...base, id, owner }));
      localStorage.setItem(otherKey, JSON.stringify({ ...base, id: otherId, owner: otherOwner }));
      window.dispatchEvent(new Event("bq_sync_retry"));
    }, { id, owner, otherId, otherOwner, key, otherKey });
    await expect(page.getByText("Salvataggio online non confermato. Non cancellare i dati di questo dispositivo.")).toBeVisible();
    await expect.poll(async () => {
      const { count, error } = await admin.from("game_results").select("id", { count: "exact", head: true }).eq("id", id).eq("user_id", owner!);
      if (error) throw error;
      return count;
    }).toBe(1);
    expect(await page.evaluate(key => localStorage.getItem(key) !== null, key)).toBe(true);
    const second = await context.newPage();
    await second.goto("/gioca");
    await expect.poll(() => second.evaluate(() => localStorage.getItem("bq_progress_owner"))).toBe(owner);
    await context.unroute(pattern);
    await Promise.all([page, second].map(p => p.evaluate(() => window.dispatchEvent(new Event("bq_sync_retry")))));
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
    const { count, error } = await admin.from("game_results").select("id", { count: "exact", head: true }).eq("id", id);
    if (error) throw error;
    expect(count).toBe(1);
    expect(await page.evaluate(key => localStorage.getItem(key) !== null, otherKey)).toBe(true);
    const other = await admin.from("game_results").select("id", { count: "exact", head: true }).eq("id", otherId);
    if (other.error) throw other.error;
    expect(other.count).toBe(0);
    await expect(page.getByText("Salvataggio online non confermato. Non cancellare i dati di questo dispositivo.")).toBeHidden();
    await second.close();
  } finally {
    await context.unroute(pattern);
    const { error } = await admin.from("game_results").delete().eq("id", id).eq("user_id", owner!);
    if (error) throw error;
  }
});
