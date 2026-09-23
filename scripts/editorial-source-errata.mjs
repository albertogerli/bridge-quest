/** Additional source errata, kept separate from the already-applied 97-position patch. */
import {readFileSync,writeFileSync} from 'node:fs';
import {buildSync} from 'esbuild';
import {Dds,loadDds} from './dds.mjs';
const root='docs/attuazione-qualita-2026-09-23/';
const current=JSON.parse(readFileSync(root+'contenuti-finali/contenuti.json')).smazzate;
const source=JSON.parse(readFileSync(root+'fonti-smazzate/confronto.json'));
const mod={exports:{}};new Function('module',buildSync({entryPoints:['src/lib/catalog-auction.ts'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text)(mod);
const dds=new Dds(await loadDds());
const seats=['north','east','south','west'],suits=['spade','heart','diamond','club'],ranks=['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
const notes={
 'CG2-8':['La fonte duplica il 2♦ e omette il 3♦. Si conserva la correzione già presente nella mano corrispondente del catalogo: ♦83 in Sud; ripristinati Ovest ed Est sulla linea dichiarante.','Est gioca 4♠, con otto atout in linea ma senza AKQJ10. Dopo l’attacco Q♥, prende al morto e muove subito picche, continuando a ogni occasione: deve perdere tre prese di atout, ma evita che la difesa ne ottenga altre con i tagli. Le vincenti laterali consentono poi dieci prese. Errata della dispensa: ♦82 in Sud duplica il 2♦ di Ovest; qui Sud ha ♦83, come nella mano valida già archiviata prima del ripristino dei posti.','East plays 4♠ with eight combined trumps but none of the top five honors. Win the heart-queen lead in dummy and lead trumps immediately, continuing whenever possible. Three trump tricks must be lost, but drawing trumps prevents extra defensive ruffs. The side-suit winners then provide ten tricks. Source erratum: South’s ♦82 duplicates West’s diamond two; South has ♦83 here, retaining the valid holding from the archived deal before restoring the seats.'],
 'CG7-1':['La fonte mostra 14 carte in Sud e duplica il 2♠ di Ovest. Si conserva ♠763 in Sud, già valido nel catalogo; asta originale ripristinata.','Nord incassa le prime quattro quadri e continua con il 10♠. Ovest deve cercare quattro prese a cuori. Quando parte la Q♥ dal morto, Sud non deve coprire: se mette subito il Re, il dichiarante prende con l’Asso e può catturare il 10♥ di Nord. Sud conserva invece il Re per il secondo onore contiguo, proteggendo il 10 del compagno e assicurando la quinta presa difensiva. Non c’è alcuna promozione di atout: si gioca a senza atout. Errata della fonte: il 2♠ duplicato rende Sud di 14 carte; si conserva la sua mano valida di 13 carte, con ♠763.','North cashes four diamonds and switches to the spade ten. West needs four heart tricks. When dummy leads the heart queen, South must not cover: covering immediately lets declarer win the ace and capture North’s heart ten. Instead retain the king for the second touching honor, protecting partner’s ten and ensuring a fifth defensive trick. There is no trump promotion in a notrump contract. Source erratum: a duplicated spade two gives South fourteen cards; the valid thirteen-card holding with ♠763 is retained.'],
 'CG9-4':['Errata dedotta dal mazzo e dalla soluzione: 10♥ duplicato, 5♥ assente. Il 10♥ deve restare in Sud per ottenere le tre prese descritte a cuori; Ovest diventa ♥8765.','Nord gioca 7♣ e sull’attacco 10♠ conta undici prese immediate: sei fiori, tre quadri e due Assi nei nobili. Per arrivare a tredici deve ricavare tre prese dalle cuori: gioca come se il Re fosse in Est, nell’impasse favorevole. Prende quindi l’attacco con l’Asso di picche, batte le atout e muove Q♥, conservando i rientri per ripetere la manovra se Est non copre. Rischiare prima l’impasse a picche aggiungerebbe un rischio inutile. Errata dedotta: il 10♥ è duplicato nella fonte; resta in Sud, indispensabile alla manovra, e il 5♥ mancante va in Ovest (♥8765).','North plays 7♣ and counts eleven immediate tricks on the spade-ten lead: six clubs, three diamonds and the two major-suit aces. Making thirteen requires three heart tricks, so play as if East holds the heart king, onside for the finesse. Win the spade ace, draw trumps and lead the heart queen, preserving entries to repeat the finesse if East ducks. Taking a spade finesse first adds an unnecessary risk. Inferred source correction: the duplicated heart ten remains with South, where the plan requires it; the missing heart five goes to West (♥8765).'],
 'CG9-5':['La fonte duplica il 2♦ e omette il 3♦. Assunzione editoriale esplicita: Ovest ♦93, Sud ♦86542. Verificare anche variante Ovest ♦92/Sud ♦86543: identico valore DDS e identica manovra a cuori/picche.','Ovest gioca 6♠ dopo il barrage di 3♥ di Nord e il contro forte di Est. Nord prende con A♥ e vede al morto tutte vincenti: la possibilità di battere il contratto è promuovere un’atout di Sud, che deve avere J♠ terzo o più. Continua quindi cuori, costringendo il morto a tagliare prima di Sud: un taglio basso può essere superato, uno alto accorcia gli onori che controllano il Fante. Si difende come se questa unica possibilità esistesse. La fonte duplica il 2♦: per completare il mazzo si assume Ovest ♦93 e Sud ♦86542. Scambiare il 2 e il 3 tra questi due giocatori non cambia il tema né le prese double-dummy verificate.','West plays 6♠ after North’s 3♥ preempt and East’s strong double. North wins the heart ace and sees a dummy full of winners. The chance to defeat the contract is to promote South’s trump jack, which must be at least three cards long. Continue hearts, forcing dummy to ruff before South: a low ruff can be overruffed, while a high ruff uses an honor needed to control the jack. Defend as though this necessary position exists. The source duplicates the diamond two; the completed deck assumes West ♦93 and South ♦86542. Swapping the diamond two and three between those players changes neither the theme nor the verified double-dummy trick count.'],
};
const changes=[];
function solve(row){
 const cards=Object.values(row.hands).flat();
 if(cards.length!==52||new Set(cards.map(c=>c.suit+c.rank)).size!==52||Object.values(row.hands).some(h=>h.length!==13))throw Error(`Invalid deck ${row.id}`);
 if(mod.exports.auctionProblem(row))throw Error(`Invalid auction ${row.id}`);
 const leader=seats[(seats.indexOf(row.declarer)+1)%4];
 if(!row.hands[leader].some(c=>c.suit===row.opening_lead.suit&&c.rank===row.opening_lead.rank))throw Error('Invalid lead');
 const pbn='N:'+seats.map(p=>suits.map(s=>ranks.filter(r=>row.hands[p].some(c=>c.suit===s&&c.rank===r)).map(r=>r==='10'?'T':r).join('')).join('.')).join(' ');
 const f=dds.SolveBoardPBN({trump:['S','H','D','C','NT'].indexOf(row.contract.slice(1)),first:seats.indexOf(leader),currentTrickSuit:[],currentTrickRank:[],remainCards:pbn},-1,3,1);
 const rank=14-ranks.indexOf(row.opening_lead.rank),suit=suits.indexOf(row.opening_lead.suit);
 for(let i=0;i<f.cards;i++)if(f.suit[i]===suit&&(f.rank[i]===rank||(f.equals[i]&(1<<rank))))return 13-f.score[i];
 throw Error('DDS missing lead');
}
for(const [id,[reason,it,en]]of Object.entries(notes)){
 const before=current.find(x=>x.id===id),src=source.find(x=>x.id===id);
 const after={...structuredClone(before),...structuredClone(src.proposed),commentary:it,commentary_en:en};
 if(id==='CG2-8'){after.hands.south=after.hands.south.map(c=>c.suit==='diamond'&&c.rank==='2'?{...c,rank:'3'}:c);after.opening_lead={suit:'heart',rank:'Q'};}
 if(id==='CG7-1'){after.hands.south=after.hands.south.filter(c=>c.suit!=='spade'||c.rank!=='2');after.opening_lead={suit:'diamond',rank:'A'};}
 if(id==='CG9-4'){after.hands.west=after.hands.west.map(c=>c.suit==='heart'&&c.rank==='10'?{...c,rank:'5'}:c);after.opening_lead={suit:'spade',rank:'10'};}
 if(id==='CG9-5'){after.hands.west=after.hands.west.map(c=>c.suit==='diamond'&&c.rank==='2'?{...c,rank:'3'}:c);after.opening_lead={suit:'heart',rank:'A'};}
 after.dd_tricks=solve(after);
 let alternateDds=null;
 if(id==='CG9-5'){
  const alternate=structuredClone(after);
  alternate.hands.west=alternate.hands.west.map(c=>c.suit==='diamond'&&c.rank==='3'?{...c,rank:'2'}:c);
  alternate.hands.south=alternate.hands.south.map(c=>c.suit==='diamond'&&c.rank==='2'?{...c,rank:'3'}:c);
  alternateDds=solve(alternate);if(alternateDds!==after.dd_tricks)throw Error('Ambiguous spot card changes solver result');
 }
 changes.push({id,source:{file:src.source,page:src.page},reason,alternateDds,before,after});
}
const fields=['contract','declarer','hands','bidding','opening_lead','dd_tricks','commentary','commentary_en'];
const q=s=>"'"+s.replaceAll("'","''")+"'";
const val=v=>v===null?'NULL':typeof v==='object'?q(JSON.stringify(v))+'::jsonb':typeof v==='number'?String(v):q(v);
let sql="BEGIN;\nSET LOCAL lock_timeout='3s';\nSET LOCAL statement_timeout='20s';\n";
for(const c of changes){const eq=o=>fields.map(f=>`${f} IS NOT DISTINCT FROM ${val(o[f])}`).join(' AND ');sql+=`DO $patch$ BEGIN UPDATE public.smazzate SET ${fields.map(f=>`${f}=${val(c.after[f])}`).join(',')} WHERE id=${q(c.id)} AND ${eq(c.before)}; IF NOT FOUND AND NOT EXISTS(SELECT FROM public.smazzate WHERE id=${q(c.id)} AND ${eq(c.after)}) THEN RAISE EXCEPTION 'Position changed: ${c.id}'; END IF; END $patch$;\n`;}
sql+='COMMIT;\n';
writeFileSync(root+'smazzate-errata-prima-dopo.json',JSON.stringify(changes,null,2)+'\n');
writeFileSync(root+'smazzate-errata.sql',sql);
console.log(JSON.stringify(changes.map(x=>({id:x.id,dds:x.after.dd_tricks,alternateDds:x.alternateDds,valid:true}))));
