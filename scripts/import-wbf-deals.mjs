import { writeFileSync } from "fs";
const tokens = `sSaWwM8K A9Wmxq2z ZAuYeQ9R kQaDPAYC 8Ei6GyUh 7MrZG4mV 8dxvPgH7 tyATsUBm CAtbVXGy 7ikV5MLJ jp4AqQnR TribXajp r8HvhkAb 6zFHMwJr ikANdxur GhFQAS7z urxX3ckd hZwtSxVE CvmcBzr7 iZBRJYuh RGb7TmX4 CnVYSLQN Zq6vTSMU deBTbz8w pJFfqysX QRJgeKBv CDciRnxU YpgKAzBt iFKLnXMs zZgpBfh3 bRzKTWjf WjQPXEzm dWSCUkru LDH7K5EN RH8EGAmw KysFQRr4 6PdLbgjv XSDV6z8g dpzHm2Fr qSs4W7dC gXmueRHt XQuH9dPG 2J9P8vSQ fLBwCpzq gmBx6spS sy7V6d3G TkcqGazQ Ye7aCcE5 9GUvb4Fi qeUiT2wf sXWfpe6c pER23xnJ 2nLBmSdD qJK4TnCG gebiW3RJ xeJLchtg JjTxBgRZ zEkL9DTv tceSKWq7 xZCUFVLp asjrP7Lp T6mFUBDj DnQqdYkx fsCbnVHF Zs78wWtp Xs2NJ7rT cMQ3Hsn9 fbM2XDe7 n2FhtqsW WafmTSaq HkZntxTA WTh6GduR UWXrNkzT`.split(/\s+/);
const sessionsSpec = [["1.2",4],["1.3",4],["2.1",4],["2.2",4],["2.3",4],["T1",4],["3.1",4],["3.2",4],["3.3",4],["4.1",4],["4.2",4],["4.3",4],["T2",4],["5.1",4],["5.2",4],["5.3",4],["6.1",4],["6.2",5]];
const sessions=[]; for(const [s,n] of sessionsSpec) for(let i=1;i<=n;i++) sessions.push({s,deal:i});
const SUIT={S:"spade",H:"heart",D:"diamond",C:"club"}, POS={N:"north",E:"east",S:"south",W:"west"};
const rk=r=> r==="T"?"10":r;
const sym={S:"♠",H:"♥",D:"♦",C:"♣"};
function toHand(byPos){const out={}; for(const [p,suits] of Object.entries(byPos)){const cards=[]; for(const su of ["S","H","D","C"]) for(const ch of (suits[su]||"")) cards.push({suit:SUIT[su],rank:rk(ch)}); out[POS[p]]=cards;} return out;}
function contractUni(c){ if(!c) return c; const m=c.match(/^(\d)(NT|N|S|H|D|C)/i); if(!m) return c; const lv=m[1], st=m[2].toUpperCase(); return (st==="NT"||st==="N")?`${lv}NT`:`${lv}${sym[st]}`; }
const strip=h=> (h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[]; const fails=[];
for(let i=0;i<tokens.length;i++){
  const tok=tokens[i]; const meta=sessions[i]||{s:"?",deal:i+1};
  try{
    const r=await fetch(`https://bridge-training.com/shorten.php?code=${tok}&lang=en`,{headers:{"User-Agent":"Mozilla/5.0"}});
    const txt=await r.text();
    const j=JSON.parse(Buffer.from(txt,"base64").toString("utf8"));
    const hands=toHand(j.cards);
    const sizes=Object.values(hands).map(h=>h.length);
    const ok = sizes.length===4 && sizes.every(s=>s===13);
    if(!ok){ fails.push({tok,meta,reason:"hand sizes "+sizes.join(",")}); continue; }
    out.push({ id:`wbf-${meta.s}-${meta.deal}`, token:tok, session:meta.s, deal:meta.deal, teaching:j.teaching||null, contract:contractUni(j.contract), declarer:POS[j.declarer]||null, resultTricks:j.result?Number(j.result):null, review:strip(j.review), pbn:j.pbn||null, hands });
  }catch(e){ fails.push({tok,meta,reason:e.message}); }
  await sleep(120);
}
writeFileSync("/tmp/wbf-deals.json", JSON.stringify(out,null,2));
console.log("OK deals:", out.length, "/ 73");
console.log("FAILS:", fails.length); fails.forEach(f=>console.log("  ",f.meta.s,f.meta.deal,f.tok,"-",f.reason));
// sample teaching distribution
const byT={}; out.forEach(d=>byT[d.teaching]=(byT[d.teaching]||0)+1); console.log("teaching modes:", byT);
console.log("=== sample deal ==="); console.log(JSON.stringify(out[0],null,1).slice(0,700));