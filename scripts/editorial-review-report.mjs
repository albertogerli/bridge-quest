/** Review pack from a fresh editorial snapshot. Never reads the obsolete TS seed. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const folder = process.argv[2] || 'tmp/editorial-audit';
const raw = readFileSync(`${folder}/contenuti.json`, 'utf8');
const data = JSON.parse(raw), audit = JSON.parse(readFileSync(`${folder}/risultati.json`, 'utf8'));
const out = `${folder}/review`; mkdirSync(out,{recursive:true});
const hash = createHash('sha256').update(raw).digest('hex');
const register = [];
const section=(kind,id,title,payload)=>{
 const file=`${kind}-${String(id).replace(/[^\w-]/g,'_')}.md`;
 register.push({kind,id,title,snapshotSha256:hash,status:'da_revisionare',decision:null,reason:null,file});
 writeFileSync(`${out}/${file}`,`# ${title}\n\nFonte: ${kind}/${id}. Snapshot SHA-256: ${hash}.\n\nStato: da revisionare. Non è un’approvazione automatica.\n\nVerificare: sistema e fonte; carte/HCP; soluzione e alternative; testo italiano/inglese; asset effettivo; prova in interfaccia.\n\n\`\`\`json\n${JSON.stringify(payload,null,2)}\n\`\`\`\n`);
};
for(const r of data.lesson_modules) section('modulo',r.module_id,r.title,{it:r.content,en:r.content_en});
for(const r of data.smazzate) section('smazzata',r.id,r.title,r);
for(const r of data.guided_hands) section('guidata',r.id,r.name,r);
for(const r of data.glossary) section('glossario',r.id,r.term,r);
for(const r of data.trova_errore_scenarios) section('trova-errore',r.id,r.situation,r);
const auctionIds=[...new Set(audit.issues.filter(i=>i.kind.startsWith('auction-')).map(i=>i.where.split('/')[1]))];
writeFileSync(`${out}/registro.json`,JSON.stringify(register,null,2)+'\n');
writeFileSync(`${out}/ASTE_DA_REVISIONARE.md`,'# Aste da revisionare\n\nNon ricostruire un’asta soltanto per farla coincidere col contratto. Carte, attacco, commento e DDS devono riferirsi alla stessa scelta didattica. Nessuna riscrittura retroattiva di risultati o tornei.\n\n'+auctionIds.map(id=>`- [${id}](smazzata-${id}.md): ${audit.issues.filter(i=>i.where===`smazzate/${id}`&&i.kind.startsWith('auction-')).map(i=>i.kind).join(', ')}`).join('\n')+'\n');
writeFileSync(`${out}/README.md`,`# Registro editoriale\n\n${register.length} schede canoniche; ${auctionIds.length} aste con rilievi. Tutte partono da “da revisionare”: le correzioni già applicate sono nel registro separato di attuazione, non equivalgono ad approvare tutto il materiale.\n\nI vecchi eserciziario_exercises sono conservati come archivio, esclusi dalla fonte canonica. Immagini, PDF e video richiedono inoltre verifica visiva/ascolto: questi dossier non la sostituiscono. Non pubblicare questi allegati sul sito: includono soluzioni.\n`);
console.log(JSON.stringify({schede:register.length,aste:auctionIds.length,output:out,snapshotSha256:hash}));
