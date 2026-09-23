/** Editorial hands for LOCAL workflow tests, not a BEN quality benchmark.
 * DDS is calculated from the actual cards. No invented expected-value score:
 * empty distributions only mark eligibility; valore_atteso remains null.
 */
import { createHash } from 'node:crypto';
import { loadDds, Dds } from './dds.mjs';

export async function tournamentTestFixture(content) {
  const dds = new Dds(await loadDds());
  const seats = ['north', 'east', 'south', 'west'];
  const suits = ['spade', 'heart', 'diamond', 'club'];
  const ranks = ['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
  return content.smazzate.slice().sort((a,b)=>a.id.localeCompare(b.id,'en')).slice(0,32).map(hand => {
    const h = createHash('sha256').update('bridgelab-local-tournament:'+hand.id).digest('hex');
    const id = `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
    const cards = `N:${seats.map(seat => suits.map(suit=>hand.hands[seat].filter(c=>c.suit===suit)
      .sort((a,b)=>ranks.indexOf(a.rank)-ranks.indexOf(b.rank)).map(c=>c.rank==='10'?'T':c.rank).join('')).join('.')).join(' ')}`;
    const table = dds.CalcDDTablePBN({cards});
    const par = dds.DealerPar(table,0,{none:0,both:1,ns:2,ew:3}[hand.vulnerability]);
    return {id,hands:hand.hands,dealer:'north',vulnerability:hand.vulnerability,
      dd_table:Object.fromEntries([...suits,'notrump'].map((s,i)=>[s,Object.fromEntries(seats.map((p,j)=>[p,table.resTable[i][j]]))])),
      par_contracts:par.contracts,par_score:par.score,valore_atteso:null,distribuzioni:{ns:{},ew:{},prove:0}};
  });
}
