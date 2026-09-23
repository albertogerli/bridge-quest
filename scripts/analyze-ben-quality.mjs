/** Local comparison only: DDS hindsight is not an information-set quality score. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {transform} from 'esbuild';
import {loadDds,Dds} from './dds.mjs';
import {benchmarkAuction} from './ben-quality-auction.mjs';
const root='docs/attuazione-qualita-2026-09-23';
const read=file=>JSON.parse(readFileSync(file));
const a=read(`${root}/ben-200-locale.json`),b=read(`${root}/ben-75-locale.json`);
const ma=read(`${root}/ben-200-locale.json.meta.json`),mb=read(`${root}/ben-75-locale.json.meta.json`);
if(ma.corpusHash!==mb.corpusHash||a.length!==ma.requested||b.length!==mb.requested||a.some(x=>x.errore)||b.some(x=>x.errore))throw Error('Incomplete or incomparable runs');
const fixture=read('e2e/fixtures/editorial.json');
const dds=new Dds(await loadDds());
const {code}=await transform(readFileSync('src/lib/scoring.ts','utf8'),{loader:'ts',format:'esm'});
const {scoreContract}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const seats=['north','east','south','west'],abbreviated=['N','E','S','W'],suits=['spade','heart','diamond','club'];
const ranks=['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
const differences=[];let sameAuction=0,sameFinalDifferentAuction=0;
for(const x of a){
 const y=b.find(r=>r.id===x.id);if(!y)throw Error('Missing hand');
 const fa=benchmarkAuction(x.dealer,x.bids),fb=benchmarkAuction(y.dealer,y.bids);
 if(JSON.stringify(fa)===JSON.stringify(fb)){
  if(JSON.stringify(x.bids)===JSON.stringify(y.bids))sameAuction++;else sameFinalDifferentAuction++;
  continue;
 }
 const hand=fixture.smazzate.find(r=>r.id===x.id);
 const cards='N:'+seats.map(seat=>suits.map(suit=>hand.hands[seat].filter(c=>c.suit===suit).sort((a,b)=>ranks.indexOf(a.rank)-ranks.indexOf(b.rank)).map(c=>c.rank==='10'?'T':c.rank).join('')).join('.')).join(' ');
 const table=dds.CalcDDTablePBN({cards}).resTable;
 function evaluate(final){
  if(final.contract==='passata')return {...final,nsScore:0};
  const seat=abbreviated.indexOf(final.declarer),strain=['S','H','D','C','NT'].indexOf(final.contract.slice(1));
  const vulnerable=hand.vulnerability==='both'||(hand.vulnerability==='ns'?seat%2===0:hand.vulnerability==='ew'&&seat%2===1);
  const result=scoreContract({level:Number(final.contract[0]),strain:['spade','heart','diamond','club','nt'][strain],tricksMade:table[strain][seat],vulnerable,doppio:final.doubled});
  return {...final,ddsTricks:table[strain][seat],made:result.made,declaringScore:result.score,nsScore:result.score*(seat%2===0?1:-1)};
 }
 differences.push({id:x.id,vulnerability:hand.vulnerability,baseline:evaluate(fa),reduced:evaluate(fb),bids200:x.bids,bids75:y.bids});
}
const paths=['../ben/src/config/default_api.conf','tmp/ben-quality-75.conf','../ben/models/TF2models/GIB-BBO-8730_2025-04-19-E30.keras','../ben/models/TF2models/GIB-BBOInfo-8730_2025-04-19-E30.keras'];
const evidence={at:new Date().toISOString(),command:'node scripts/analyze-ben-quality.mjs',
 runtime:'Local macOS arm64; Python 3.12.12, TensorFlow 2.19.1, Keras 3.6.0, NumPy 2.1.3, DDS 2.9.0; BEN startup reports seed 42. Not the Railway runtime.',
 benCommit:'a5ef8866e0884a3c064581a276b79693185579f7',
 configurations:{baseline:{sample_hands_auction:200,sample_boards_for_auction:30000},reduced:{sample_hands_auction:75,sample_boards_for_auction:11000}},
 files:paths.map(file=>({file,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')})),
 corpusHash:ma.corpusHash,completed:a.length,sameAuction,sameFinalDifferentAuction,differentFinal:differences.length,differences,
 limits:['All four seats are robots; a changed early call changes later information.','First 30 lexically ordered editorial IDs, not a random or comprehensive production sample.','DDS assumes all cards visible and perfect play/defense; it is not the expected value at bidding time.','No latency comparison with production; no production engine setting changed.']};
writeFileSync(`${root}/ben-confronto-locale.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({completed:a.length,sameAuction,sameFinalDifferentAuction,differentFinal:differences.length,differences:differences.map(x=>({id:x.id,a:x.baseline,b:x.reduced}))},null,2));
