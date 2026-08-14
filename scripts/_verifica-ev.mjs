import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const E = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split("\n").filter(l=>l.includes("=")&&!l.startsWith("#"))
  .map(l=>[l.slice(0,l.indexOf("=")).trim(), l.slice(l.indexOf("=")+1).trim()]));
const admin = createClient(E.NEXT_PUBLIC_SUPABASE_URL, E.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
const { data } = await admin.from("mani_generate")
  .select("id, vulnerability, distribuzioni, valore_atteso, par_score")
  .not("distribuzioni","is",null).limit(1).single();
const d = data.distribuzioni.ns.spade.south;
console.log("istogramma 4♠ di Sud:", JSON.stringify(d));
const MIN=new Set(["club","diamond"]);
const tv=(s)=>s==="nt"?30:MIN.has(s)?20:30;
const cp=(l,s)=>s==="nt"?40+30*(l-1):tv(s)*l;
function score(l,s,t,vul){const need=l+6;const base=cp(l,s);
 if(t<need)return -((need-t)*(vul?100:50));
 const over=t-need;const game=base>=100?(vul?500:300):50;
 const slam=l===7?(vul?1500:1000):l===6?(vul?750:500):0;
 return base+game+slam+over*tv(s);}
let tot=0,n=0;
d.forEach((q,t)=>{ if(q){ tot+=score(4,"spade",t,false)*q; n+=q; } });
console.log("ev 4♠:", Math.round(tot/n), "su", n, "prove");
console.log("valore_atteso.ns:", JSON.stringify(data.valore_atteso.ns), "par:", data.par_score);
