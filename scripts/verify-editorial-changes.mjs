/** Compare the fresh read-only snapshot with every guarded editorial change. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='docs/attuazione-qualita-2026-09-23';
const read=name=>JSON.parse(readFileSync(`${root}/${name}.json`));
const content=read('contenuti-finali/contenuti');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const checked=[];
const cueChanges=read('quadri-surlicita-prima-dopo');
function verify(kind,id,row,expected,fields=Object.keys(expected),basis){
 if(!row)throw Error(`Missing ${kind}/${id}`);
 for(const field of fields)if(hash(row[field])!==hash(expected[field]))throw Error(`Changed or unapplied ${kind}/${id}/${field}`);
 checked.push({kind,id,fields,basis,currentPayloadSha256:hash(row),status:'correzione_verificata_non_approvazione_integrale'});
}
for(const name of ['smazzate-prima-dopo','smazzate-errata-prima-dopo'])for(const row of read(name)){
 const expected={...row.after};
 for(const later of cueChanges.filter(x=>x.table==='smazzate'&&x.key.id===row.id))for(const field of later.fields)expected[field]=later.after[field];
 verify('smazzata',row.id,content.smazzate.find(x=>x.id===row.id),expected,undefined,{file:`${name}.json`,source:row.source,reason:row.reason,laterTitleCorrections:'quadri-surlicita-prima-dopo.json'});
}
for(const row of read('correzioni-editoriali')){
 verify('modulo',row.id,content.lesson_modules.find(x=>x.module_id===row.id),row.after,undefined,{file:'correzioni-editoriali.json'});
}
for(const row of cueChanges){
 const isModule=row.table==='lesson_modules';
 verify(isModule?'modulo':'smazzata',isModule?row.key.module_id:row.key.id,
   content[row.table].find(x=>isModule?x.module_id===row.key.module_id&&x.lesson_id===row.key.lesson_id:x.id===row.key.id),
   row.after,row.fields,{file:'quadri-surlicita-prima-dopo.json'});
}
for(const row of read('glossario-prima-dopo')){
 verify('glossario',row.id,content.glossary.find(x=>x.id===row.id),{quiz:row.after,quiz_en:row.english},undefined,{file:'glossario-prima-dopo.json'});
}
for(const row of read('glossario-definizioni-prima-dopo')){
 verify('glossario',row.id,content.glossary.find(x=>x.id===row.id),row.after,undefined,{file:'glossario-definizioni-prima-dopo.json'});
}
const issues=read('contenuti-finali/risultati').issues;
const decisions=issues.map(issue=>{
 const where=issue.where;
 let reason;
 if(where.startsWith('lesson_modules/107-1/'))reason='Due mani di un finale a sei carte, non mani iniziali incomplete. Il controllo richiede una lettura contestuale.';
 else if(where.startsWith('lesson_modules/109-2/'))reason='13 punti è una deduzione controfattuale sulla mano avversaria: due assi, re e dama; non il punteggio della mano mostrata.';
 else if(where.startsWith('lesson_modules/209-1/'))reason='8 punti indica i due assi, non il totale di 9 punti della mano; il fante vale il punto residuo.';
 else if(where.startsWith('lesson_modules/7-2/'))reason='La mano vale 10 punti; 12 è la soglia minima citata nella spiegazione, non il valore della mano.';
 else if(where.startsWith('lesson_modules/8-1/'))reason='Il blocco contiene due esempi distinti: 16 punti nel primo, 15 nel secondo. Il parser associa le cifre alla prima mano.';
 else if(where.startsWith('lesson_modules/8-4/'))reason='8 punti è la mano del rispondente, 29–31 la somma con i 21–23 dell’apertore.';
 else if(/\/(eserciziario-7-2|ex-7-2)\//.test(where))reason='15 è il valore della mano, 15–17 l’intervallo dell’apertura 1SA.';
 else if(/\/(eserciziario-9-1|ex-9-1)\//.test(where))reason='6 è il valore della mano, 6–9 l’intervallo dell’appoggio semplice.';
 else if(where.startsWith('eserciziario_exercises/ex-1-3/'))reason='Errore reale nelle 14 carte del solo archivio legacy non utilizzato dal caricatore. Il modulo canonico corretto è la fonte runtime; archivio conservato senza reseed.';
 else throw Error(`New semantic candidate requires review: ${where}`);
 return {kind:issue.kind,where,issueSha256:hash(issue),decision:where.startsWith('eserciziario_exercises/ex-1-3/')?'archivio_non_runtime':'falso_positivo_contestuale',reason};
});
const result={at:new Date().toISOString(),command:'node scripts/verify-editorial-changes.mjs',snapshotSha256:hash(content),
 scope:'Verifica delle sole correzioni elencate; nessuna approvazione integrale automatica di moduli, immagini, video o sistema FIGB.',
 checks:checked.length,correctedPositions:read('smazzate-prima-dopo').length+read('smazzate-errata-prima-dopo').length,
 uniquePositionRecords:new Set(checked.filter(x=>x.kind==='smazzata').map(x=>x.id)).size,
 uniqueModuleRecords:new Set(checked.filter(x=>x.kind==='modulo').map(x=>x.id)).size,
 checked,semanticDecisions:decisions};
writeFileSync(`${root}/verifica-editoriale-finale.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checks:result.checks,correctedPositions:result.correctedPositions,positionRecords:result.uniquePositionRecords,moduleRecords:result.uniqueModuleRecords,semanticCandidates:decisions.length,output:`${root}/verifica-editoriale-finale.json`}));
