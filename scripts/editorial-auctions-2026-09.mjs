/** Source-backed repairs of the 46 audited positions. Generates a guarded patch, never applies it. */
import {readFileSync,writeFileSync} from 'node:fs';
import {buildSync} from 'esbuild';
import {Dds,loadDds} from './dds.mjs';
import {additionalIds,leads,extraComments} from './editorial-additional-positions.mjs';
import {revisedComments} from './editorial-position-comments.mjs';
const base='docs/attuazione-qualita-2026-09-23/';
const live=JSON.parse(readFileSync(base+'contenuti-dopo/contenuti.json'));
const source=JSON.parse(readFileSync(base+'fonti-smazzate/confronto.json'));
const ids=[...new Set([...JSON.parse(readFileSync(base+'contenuti-dopo/risultati.json')).issues.filter(x=>x.kind.startsWith('auction-')).map(x=>x.where.split('/')[1]),...additionalIds])];
const mod={exports:{}};new Function('module',buildSync({entryPoints:['src/lib/catalog-auction.ts'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text)(mod);
const {auctionProblem}=mod.exports;
const seats=['north','east','south','west'],suits=['spade','heart','diamond','club'],ranks=['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
const commentary={
 'CG2-7': ['Dopo tre giri di picche e il ritorno a quadri, Sud può giocare a morto rovesciato: tagliare tre quadri in mano con A, K e Q di cuori, conservando J109 del morto per battere le atout. Il piano cerca tre prese di atout al morto, tre tagli in mano, l’Asso di quadri e tre prese a fiori. Richiede atout 3–2; non dipende dalla divisione 3–3 delle fiori. Le tre prese laterali sicure sono a fiori, non a picche.', 'After three rounds of spades and a diamond return, South can reverse dummy: ruff three diamonds in hand with the heart ace, king and queen, retaining dummy’s J109 to draw trumps. The plan seeks three trump tricks in dummy, three ruffs in hand, the diamond ace and three club tricks. It requires trumps 3–2 rather than clubs 3–3. The three outside winners are clubs, not spades.'],
 'CG4-1': ['La Dama di fiori del morto vince l’attacco e Nord segue basso, mostrando AKx a fiori. Dalla licita e dalle carte note Est ricostruisce cinque cuori, quattro quadri, tre fiori e una sola picche in Nord. Entrato in presa a cuori, deve muovere quadri: Ovest ha la Dama singola. Quando Est prenderà con l’Asso di cuori, potrà incassare il Re di quadri e dare un taglio al compagno, battendo 4♥. La quarta laterale di Nord è a quadri, non a picche.', 'Dummy’s club queen wins the lead and North follows low, indicating AKx in clubs. From the auction and visible cards East can place five hearts, four diamonds, three clubs and one spade with North. On winning a heart trick East must lead a diamond: West has the singleton queen. On later winning the heart ace, East can cash the diamond king and give partner a ruff to defeat 4♥. North’s side four-card suit is diamonds, not spades.'],
 'CG4-5': ['Est prende l’attacco con il Re di cuori, incassa l’Asso e continua cuori per far tagliare il morto. Ovest deve conservare l’Asso di picche fino al terzo giro di atout. Quando il morto sarà senza atout, un altro giro di cuori costringerà Sud a usare la sua ultima picche e promuoverà la quarta atout di Ovest: una sotto. Non è taglio e scarto, perché Sud ha ancora il Fante di cuori. Refuso nella dispensa: il 5♣ compare due volte; si conserva la distribuzione completa e univoca con ♣43 in Ovest.', 'East wins the lead with the heart king, cashes the ace and continues hearts to make dummy ruff. West must retain the spade ace until the third round of trumps. Once dummy is out of trumps, another heart forces South’s last spade and promotes West’s fourth trump: down one. This is not a ruff and discard because South still holds the heart jack. The source repeats the club five; the complete, unique deck is retained with ♣43 in West.'],
 'CG5-4': ['Nord deve realizzare 6♠ e affrontare entrambi i Re neri. Prima verifica l’impasse a fiori, che in questa posizione riesce. Può quindi permettersi di perdere una presa a picche: incassa l’Asso di picche, proteggendosi dal Re singolo in Ovest, e prosegue secondo la divisione delle atout. Le carte originali hanno K♠ in Ovest e J♣ in Sud. Il testo su tre quadri da cedere apparteneva a un’altra mano e non è pertinente.', 'North plays 6♠ and must deal with both black kings. First test the club finesse, which succeeds in this position. North can then afford to lose one spade trick: cash the spade ace to guard against West’s singleton king, then continue according to the trump split. In the source deal West holds the spade king and South the club jack. The previous discussion of losing three diamonds belonged to another deal.'],
 'CG5-7': ['Dopo il contro di riapertura di Nord, Sud ripete le fiori e poi appoggia le picche con tre carte. Nord gioca 4♠ nella 4–3. Est, non Ovest, incassa A, K e Q di cuori: Nord deve evitare di accorciarsi tagliando dalla parte lunga e scartare una quadri. Potrà tagliare un eventuale quarto giro di cuori con una picche alta del morto, conservando il controllo delle atout.', 'After North’s reopening double, South rebids clubs and later raises spades with three-card support. North plays 4♠ in the 4–3 fit. East, not West, cashes the heart ace, king and queen. North should avoid shortening the long trump hand and discard a diamond instead. A fourth heart can be ruffed with a high spade in dummy, preserving trump control.'],
 'CG5-8': ['Nel sistema Puppet Stayman di questa lezione, dopo 2SA–3♣–3♦ Ovest dichiara 3♠ per mostrare quattro cuori; Est conclude a 4♥. Il riquadro della dispensa riporta 3♥, ma l’asta e il testo che ricerca la decima presa indicano 4♥. Est deve affrancare le fiori prima di esaurire le atout: cede l’Asso di fiori, conservando le atout necessarie per un taglio. Poi può battere due giri di atout e incassare le vincenti. Non si tratta della Stayman a quattro risposte del corso Fiori.', 'Under this lesson’s Puppet Stayman agreement, after 2NT–3♣–3♦ West bids 3♠ to show four hearts; East concludes with 4♥. The source’s contract box says 3♥, but its auction and discussion of finding a tenth trick indicate 4♥. Establish clubs before exhausting the trumps: concede the club ace while retaining trumps for a ruff, then draw two rounds and cash winners. This is not the Fiori course’s four-response Stayman.'],
 'CG6-8': ['Ovest gioca 4♠ con dieci atout complessive. Dopo due fiori e il ritorno a quadri, deve raggiungere il morto per muovere la Dama di picche: può farlo giocando una cuori verso J10. L’impasse al Re di picche è preferibile alla semplice battuta dell’Asso in assenza di altre informazioni. Ripristinati i posti della dispensa: Ovest ha cinque picche, Sud tre. Corretto il suo doppio 6♥ con il 4♥ mancante: Ovest KQ743, Nord A652. Non usare questa mano per dedurre che l’impasse sia obbligatoria qualunque sia la licita.', 'West plays 4♠ with ten combined trumps. After two club tricks and a diamond return, West must reach dummy to lead the spade queen; a heart toward J10 provides the entry. Without further information, finessing the spade king is preferable to simply cashing the ace. The source seating is restored: West has five spades and South three. Its duplicated heart six is corrected with the missing heart four: West KQ743, North A652. This does not make the finesse mandatory regardless of information from the auction.'],
 'Q8-4': ['La coppia trova il fit a picche e si ferma a 3♠, non a quadri o cuori. Ovest invita con 3♣ chiedendo aiuto nel colore; Est mostra valori a cuori con 3♥, ma Ovest riporta a 3♠ e si passa. I valori a cuori non offrono uno scarto utile. A quadri, con cartine di fronte ad AJ9, la piccola verso il 9 cerca di far scendere un onore mantenendo AJ per catturare l’altro, quando la posizione degli onori lo consente.', 'The partnership finds a spade fit and stops in 3♠, not diamonds or hearts. West invites with 3♣ asking for help; East shows heart values with 3♥, but West returns to 3♠ and the auction ends. The heart values provide no useful discard. In diamonds, small cards opposite AJ9 suggest leading low toward the nine to force an honor while retaining AJ to capture the other, when the honor position permits.'],
};
Object.assign(commentary,extraComments,revisedComments);
const dds=new Dds(await loadDds());const changes=[];
for(const id of ids){
 const before=live.smazzate.find(s=>s.id===id), after=structuredClone(before),src=source.find(s=>s.id===id);
 let reason='Trascrizione della sequenza originale e ripristino della posizione didattica FIGB; non ottimizzazione del contratto per farlo mantenere.';
 if(src){
  after.contract=src.proposed.contract;after.declarer=src.proposed.declarer;after.bidding=structuredClone(src.proposed.bidding);
  if(!src.handValid&& !['CG4-5','CG6-8'].includes(id))throw Error(`Invalid source hand ${id}`);
  if(id!=='CG4-5')after.hands=structuredClone(src.proposed.hands);
  if(id==='Q12-1'){after.bidding=structuredClone(before.bidding);reason+=' La fonte presenta due esiti alternativi; si conserva il ramo 5♠ di Nord, già presente nell’asta, e l’attacco K♦.';}
  if(id==='CG5-8'){after.contract='4H';reason+=' Errata fonte: riquadro 3♥, ma asta 4♥ e obiettivo dieci prese.';}
  if(id==='CG2-4'){after.contract='4S';after.declarer='north';reason+=' Contratto con simbolo Unicode nel PDF, verificato nel riquadro e nel commento.';}
  if(id==='CG3-5'){after.contract='4H';reason+=' Errata fonte: riquadro 3SA incompatibile con asta 4♥ e taglio difensivo descritto.';}
  if(['CG3-4','CG5-6','CG9-1'].includes(id)){
   after.bidding.bids=after.bidding.bids.slice(0,-1);
   reason+=' Eliminato quarto passo finale superfluo nella dispensa.';
  }
  if(id==='CG6-8'){
   after.bidding.bids=after.bidding.bids.slice(0,-1);
   after.hands.west=after.hands.west.map(c=>c.suit==='heart'&&c.rank==='6'?{...c,rank:'4'}:c);
   reason+=' Errata fonte: quarto passo finale superfluo; 6♥ duplicato e 4♥ mancante, ripristinato in Ovest.';
  }
  if(id==='CG4-5')reason+=' Errata fonte: 5♣ duplicato, conservate ♣43 in Ovest e le 52 carte univoche già nel DB.';
 }else{
  if(!['2-1','2-3','2-5','2-7','4-7','8-3'].includes(id))throw Error(`Missing source ${id}`);
  after.contract=id==='2-5'?'6NT':'3NT';
  reason='Contratto confermato dal commento e dalle smazzate FIGB Fiori: una buona difesa può batterlo. L’asta già presente è coerente col contratto originale.';
 }
 if(id==='Q3-5')after.opening_lead={suit:'spade',rank:'10'};
 if(id==='CG9-6')after.opening_lead={suit:'club',rank:'6'};
 if(leads[id])after.opening_lead={suit:leads[id][0],rank:leads[id][1]};
 if(commentary[id])[after.commentary,after.commentary_en]=commentary[id];
 const cards=Object.values(after.hands).flat();
 if(cards.length!==52||new Set(cards.map(c=>c.suit+c.rank)).size!==52||Object.values(after.hands).some(h=>h.length!==13))throw Error(`Invalid cards ${id}`);
 const issue=auctionProblem(after);if(issue)throw Error(`${id}: ${issue}`);
 const leader=seats[(seats.indexOf(after.declarer)+1)%4];
 if(!after.hands[leader].some(c=>c.suit===after.opening_lead.suit&&c.rank===after.opening_lead.rank))throw Error(`Invalid lead ${id}`);
 const contract=after.contract.replace(/[♠♥♦♣]/g,s=>({'♠':'S','♥':'H','♦':'D','♣':'C'}[s])).replace('SA','NT');
 const strain=['S','H','D','C','NT'].indexOf(contract.slice(1));
 const pbn='N:'+seats.map(p=>suits.map(s=>ranks.filter(r=>after.hands[p].some(c=>c.suit===s&&c.rank===r)).map(r=>r==='10'?'T':r).join('')).join('.')).join(' ');
 const f=dds.SolveBoardPBN({trump:strain,first:seats.indexOf(leader),currentTrickSuit:[],currentTrickRank:[],remainCards:pbn},-1,3,1);
 const rank=14-ranks.indexOf(after.opening_lead.rank),suit=suits.indexOf(after.opening_lead.suit);
 let tricks=null;for(let i=0;i<f.cards;i++)if(f.suit[i]===suit&&(f.rank[i]===rank||(f.equals[i]&(1<<rank))))tricks=13-f.score[i];
 if(tricks===null)throw Error(`DDS missing lead ${id}`);after.dd_tricks=tricks;
 changes.push({id,source:src?{file:src.source,page:src.page}:{file:`FIGB_CORSO FIORI/LEZIONE ${before.lesson_id}/Smazzate ${before.lesson_id}.pdf`,page:null},reason,before,after});
}
const q=s=>"'"+s.replaceAll("'","''")+"'";
const fields=['contract','declarer','hands','bidding','opening_lead','dd_tricks','commentary','commentary_en'];
const val=v=>v===null?'NULL':typeof v==='object'?q(JSON.stringify(v))+'::jsonb':typeof v==='number'?String(v):q(v);
let sql="BEGIN;\nSET LOCAL lock_timeout='3s';\nSET LOCAL statement_timeout='20s';\n";
for(const c of changes){const eq=o=>fields.map(f=>`${f} IS NOT DISTINCT FROM ${val(o[f])}`).join(' AND ');sql+=`DO $patch$ BEGIN\nUPDATE public.smazzate SET ${fields.map(f=>`${f}=${val(c.after[f])}`).join(',')} WHERE id=${q(c.id)} AND ${eq(c.before)};\nIF NOT FOUND AND NOT EXISTS (SELECT FROM public.smazzate WHERE id=${q(c.id)} AND ${eq(c.after)}) THEN RAISE EXCEPTION 'Position changed: ${c.id}'; END IF;\nEND $patch$;\n`;}
sql+='COMMIT;\n';
writeFileSync(base+'smazzate-prima-dopo.json',JSON.stringify(changes,null,2)+'\n');
writeFileSync(base+'smazzate-correzioni.sql',sql);
console.log(JSON.stringify({positions:changes.length,legalityAndCardsPassed:changes.length,ddsComputed:changes.length,sourceErrata:['Q12-1','CG4-5','CG5-8','CG6-8'],remoteWrites:0}));
