import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url),"utf8").split("\n").filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>[l.slice(0,l.indexOf("=")).trim(),l.slice(l.indexOf("=")+1).trim()]));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });

// due utenti di test: A riceve, B invia
const mk = async (tag) => {
  const email = `rt-${tag}-${Date.now()}@bridgelab-test.invalid`;
  const password = `Rt!${Math.random().toString(36).slice(2,12)}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  return { id: data.user.id, email, password };
};
const A = await mk("a"), B = await mk("b");

const userA = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth:{persistSession:false} });
await userA.auth.signInWithPassword({ email: A.email, password: A.password });

async function probe(table, filter, insertRow) {
  return new Promise(async (resolve) => {
    let got = false;
    const ch = userA.channel(`probe-${table}-${Date.now()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table, filter }, () => { got = true; })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await new Promise(r => setTimeout(r, 800));
        const { error } = await admin.from(table).insert(insertRow);
        if (error) { console.log(`  (insert ${table} fallita: ${error.message})`); }
        setTimeout(async () => { await userA.removeChannel(ch); resolve(got); }, 5000);
      });
  });
}

const rFriend = await probe("friendships", `friend_id=eq.${A.id}`, { user_id: B.id, friend_id: A.id, status: "pending" });
console.log(`friendships  -> evento realtime ricevuto: ${rFriend ? "SI" : "NO"}`);

const rChal = await probe("challenges", `opponent_id=eq.${A.id}`, { challenger_id: B.id, opponent_id: A.id, status: "pending", smazzata_id: 1 });
console.log(`challenges   -> evento realtime ricevuto: ${rChal ? "SI" : "NO"}`);

await admin.from("friendships").delete().eq("friend_id", A.id);
await admin.from("challenges").delete().eq("opponent_id", A.id);
await admin.auth.admin.deleteUser(A.id); await admin.auth.admin.deleteUser(B.id);
console.log("utenti di test eliminati");
process.exit(0);
