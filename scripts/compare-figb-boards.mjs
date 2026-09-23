/** Compare source extractions with current editorial data. No remote writes. */
import { readFileSync,writeFileSync } from 'node:fs';
import { buildSync } from 'esbuild';
const base='docs/attuazione-qualita-2026-09-23/';
const sources=JSON.parse(readFileSync(base+'fonti-smazzate/estrazione.json'));
const live=JSON.parse(readFileSync(base+'contenuti-dopo/contenuti.json')).smazzate;
const mod={exports:{}};
new Function('module',buildSync({entryPoints:['src/lib/catalog-auction.ts'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text)(mod);
const {auctionProblem,canonicalBid}=mod.exports;
const seats=['north','east','south','west'],suits={S:'spade',H:'heart',D:'diamond',C:'club'};
const signature=hands=>seats.map(p=>Object.entries(suits).map(([,s])=>hands[p].filter(c=>c.suit===s).map(c=>c.rank).sort().join(',')).join('.')).join(' ');
const report=[];
for(const source of sources){
 const before=live.find(s=>s.id===source.id); if(!before)continue;
 const hands=Object.fromEntries(seats.map(p=>[p,Object.entries(source.hands[p]).flatMap(([s,ranks])=>[...ranks].map(rank=>({suit:suits[s],rank:rank==='T'?'10':rank})))]));
 const cards=Object.values(hands).flat();
 const handValid=cards.length===52&&new Set(cards.map(c=>c.suit+c.rank)).size===52&&Object.values(hands).every(h=>h.length===13);
 const steps=source.auction;
 const dealer=steps[0]?.seat;
 const consecutive=steps.every((b,i)=>b.seat===seats[(seats.indexOf(dealer)+i)%4]);
 const bids=steps.map(b=>b.bid==='-'?'P':b.bid);
 if(bids.some(b=>b!=='P'))while(!bids.slice(-3).every(b=>b==='P')||bids.length<4)bids.push('P');
 const proposed={contract:source.contract,declarer:source.declarer,bidding:{dealer,bids}};
 const problem=source.contract&&source.declarer?auctionProblem(proposed):'missing-source-contract';
 const diffs=[];
 if(canonicalBid(before.contract)!==canonicalBid(source.contract??''))diffs.push('contract');
 if(before.declarer!==source.declarer)diffs.push('declarer');
 if(signature(before.hands)!==signature(hands))diffs.push('hands');
 if(before.bidding?.dealer!==proposed.bidding.dealer||before.bidding?.bids.map(canonicalBid).join(',')!==bids.map(canonicalBid).join(','))diffs.push('bidding');
 report.push({id:source.id,source:source.file,page:source.page,handValid,consecutive,problem,diffs,before:{contract:before.contract,declarer:before.declarer,bidding:before.bidding},proposed:{...proposed,hands},text:source.text});
}
writeFileSync(base+'fonti-smazzate/confronto.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({compared:report.length,invalid:report.filter(r=>!r.handValid||!r.consecutive||r.problem).map(({id,handValid,consecutive,problem})=>({id,handValid,consecutive,problem})),differences:report.filter(r=>r.diffs.length).map(({id,diffs})=>({id,diffs}))},null,2));
