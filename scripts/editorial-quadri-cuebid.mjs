/** Source: FIGB Corso Quadri, lesson 10, printed pp. 33–36. Prepare only. */
import {readFileSync,writeFileSync} from 'node:fs';
const folder='docs/attuazione-qualita-2026-09-23/';
const source=JSON.parse(readFileSync(folder+'contenuti-dopo/contenuti.json'));
const before=source.lesson_modules.find(x=>x.module_id==='Q10-1');
const after=structuredClone(before);
after.title_en='Doubles and Cue Bids: The Basics';
after.content[0].content='Nel sistema del corso Quadri, il contro può servire a cercare un fit. La surlicita è la dichiarazione del colore mostrato da un avversario: non è il surcontro. Il significato dipende dalla sequenza e dagli accordi della coppia.';
after.content_en[0].content='In the Quadri course system, a double can help find a fit. A cue bid is a bid of a suit shown by an opponent; it is not a redouble. Its meaning depends on the auction and partnership agreements.';
after.content[1].content='Negli accordi qui studiati, quando contro e surlicita sono entrambi disponibili, il contro cerca fit e la surlicita lo promette. Quando il contro non è legalmente disponibile, la surlicita può includere mani forti con o senza fit. Il contro non esclude però sempre un appoggio: si può cercare un fit nobile migliore pur avendo già fit in un minore. Se disponibile, si preferisce una dichiarazione naturale forzante con la lunghezza richiesta.';
after.content_en[1].content='Under the agreements studied here, when both double and cue bid are available, the double seeks a fit and the cue bid promises one. When double is not legally available, the cue bid can include strong hands with or without a fit. A double does not always deny support: a player may seek a better major-suit fit despite already holding a minor-suit fit. Prefer a natural forcing bid when available with the required length.';
after.content[2].content='Due aste distinte, con Sud apertore e Ovest intervenuto. Dopo 1♦–1♠–?, Nord con ♠54 ♥AJ54 ♦Q75 ♣K753 dichiara CONTRO per cercare un altro fit. Dopo 1♥–1♠–?, Nord con ♠J5 ♥AQ753 ♦KJ64 ♣A9 dichiara 2♠, SURLICITA: conferma fit a cuori e almeno forza di manche. Nella seconda asta il compagno ha aperto 1♥, non 1♦.';
after.content_en[2].content='Two separate auctions, with South opening and West overcalling. After 1♦–1♠–?, North holds ♠54 ♥AJ54 ♦Q75 ♣K753 and DOUBLES to seek another fit. After 1♥–1♠–?, North holds ♠J5 ♥AQ753 ♦KJ64 ♣A9 and bids 2♠, a CUE BID confirming heart support and at least game-going strength. In the second auction partner opened 1♥, not 1♦.';
after.content[3].content='Nel sistema Quadri, dopo 1♥ del compagno e 1♠ dell’avversario, la tua surlicita di 2♠ promette...';
after.content_en[3].content='In the Quadri system, after partner opens 1♥ and the opponent overcalls 1♠, your 2♠ cue bid promises...';
after.content[3].explanation='In questa sequenza sono disponibili sia contro sia surlicita: 2♠ mostra fit a cuori e almeno forza di manche. Non estendere la regola a tutte le surlicite: dopo un contro informativo del compagno, per esempio, si può surlicitare anche senza fit già individuato.';
after.content_en[3].explanation='Both double and cue bid are available in this auction: 2♠ shows heart support and at least game-going strength. Do not extend this rule to every cue bid; after partner’s takeout double, for example, a cue bid need not show an already established fit.';
const changes=[{table:'lesson_modules',key:{lesson_id:60,module_id:'Q10-1'},before,after,fields:['title_en','content','content_en']}];
for(const row of source.smazzate.filter(x=>/^Q10-[1-8]$/.test(x.id))) changes.push({table:'smazzate',key:{id:row.id},before:row,after:{...row,title_en:'Double and Cue Bid'},fields:['title_en']});
const q=x=>"'"+x.replaceAll("'","''")+"'";
const val=x=>typeof x==='object'?q(JSON.stringify(x))+'::jsonb':typeof x==='number'?String(x):q(x);
let sql="BEGIN;\nSET LOCAL lock_timeout='3s';\n";
for(const c of changes){
 const key=Object.entries(c.key).map(([k,v])=>`${k}=${val(v)}`).join(' AND ');
 const match=o=>c.fields.map(f=>`${f} IS NOT DISTINCT FROM ${val(o[f])}`).join(' AND ');
 sql+=`DO $patch$ BEGIN UPDATE public.${c.table} SET ${c.fields.map(f=>`${f}=${val(c.after[f])}`).join(',')} WHERE ${key} AND ${match(c.before)}; IF NOT FOUND AND NOT EXISTS(SELECT FROM public.${c.table} WHERE ${key} AND ${match(c.after)}) THEN RAISE EXCEPTION 'Concurrent editorial change'; END IF; END $patch$;\n`;
}
sql+='COMMIT;\n';
writeFileSync(folder+'quadri-surlicita-prima-dopo.json',JSON.stringify(changes,null,2)+'\n');
writeFileSync(folder+'quadri-surlicita.sql',sql);
console.log(JSON.stringify({modules:1,positionTitles:changes.length-1,remoteWrites:0}));
