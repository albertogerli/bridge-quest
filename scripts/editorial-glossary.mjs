// Bilingual glossary quiz revision. Exact original-quiz guards, no remote writes by this script.
import { readFileSync, writeFileSync } from 'node:fs';
const source = JSON.parse(readFileSync('docs/audit-qualita-2026-09-23/contenuti.json','utf8'));
const english = JSON.parse(readFileSync('scripts/editorial-glossary-en.json','utf8'));
const corrections = {
 apertura: { explanation: 'Una normale apertura a livello uno richiede generalmente circa 12–13 punti onori. Barrage e mani distribuzionali richiedono valutazioni specifiche: non basta una soglia unica.' },
 bilanciata: { explanation: '6-3-2-2 ha un seme sesto e due doppietti. Le bilanciate del corso sono 4333, 4432 e 5332: un solo doppietto non rende automaticamente sbilanciata una mano.' },
 contro: { options: ['Il contratto viene annullato','I punti delle prese di contratto raddoppiano; premi e penalità seguono la scala del contro','Si ridistribuiscono le carte','L’avversario deve cambiare seme'], explanation: 'Il contro raddoppia i punti delle prese di contratto, non ogni voce del punteggio. Se il contratto riesce si applicano premi specifici; se cade, le penalità seguono la scala dei contratti contrati.' },
 cue_bid: { question: 'Con fit concordato, a cosa serve una dichiarazione di controllo nella ricerca dello slam?', explanation: 'Mostra un controllo di primo o secondo giro, secondo gli accordi, per esplorare lo slam. La dichiarazione del colore avversario può avere altri significati in sequenze diverse.' },
 dichiarante: { options: ['Chi fa l’ultima dichiarazione','Chi ha più punti nella coppia','Chi nella linea vincente ha nominato per primo il seme o i SA del contratto finale','Chi siede a Nord'] },
 licita: { options: ['Si gioca senza atout','La mano termina senza contratto: tutti passano','Il mazziere sceglie il contratto','Si gioca a 1♣'], explanation: 'Quattro passi iniziali chiudono la mano senza contratto. Nel bridge duplicato si registra zero: non si ridistribuiscono le carte del board per gli altri tavoli (Leggi WBF 22 e 77).' },
 manche: { question: 'Quale di questi contratti NON contrati non raggiunge la manche?' },
 parziale: { question: 'Quale di questi contratti NON contrati è un parziale?' },
 onori: { explanation: 'Gli onori sono A, K, Q, J e 10. Nel conteggio Milton Work valgono punti onori soltanto A=4, K=3, Q=2, J=1. Il 10 vale zero punti onori.' },
 presa_sicura: { question: 'A Senza Atout, cosa rende una carta una presa sicura?', explanation: 'La carta più alta rimasta in un seme vince quando quel seme viene giocato a Senza Atout, purché si possa raggiungere la mano che la possiede per incassarla.' },
 punti_distribuzione: { question: 'Nello schema di punti di corta qui illustrato, quanto vale un singolo?', explanation: 'In questo schema, da usare per rivalutare una mano con fit: vuoto=3, singolo=2, doppietto=1. Non sono punti onori.' },
 regola_venti: { explanation: 'Punti onori più carte nei due semi più lunghi: se la somma raggiunge 20 si può valutare l’apertura anche sotto 12 punti. È una guida, non un obbligo.' },
 ruff: { question: 'Perché può essere vantaggioso tagliare al morto quando ha meno atout del dichiarante?' },
 segnale: { question: 'Con l’accordo alto=incoraggiante, cosa suggerisce una carta alta in un segnale di gradimento?', explanation: 'In questo accordo di gradimento, alto incoraggia e basso scoraggia. I segnali di conto, preferenza e altri accordi hanno significati diversi.' },
 sottomano: { explanation: 'Secondo basso è una guida per conservare gli onori, non una regola assoluta: alcune posizioni richiedono di giocare alto.' },
 terza_alta: { options: ['In terza posizione, gioca la carta più bassa','In terza posizione gioca alto per vincere o forzare un onore avversario','Gioca il terzo atout che hai','Fai sempre tre prese di fila'], explanation: 'In terza posizione si gioca generalmente alto per vincere o forzare un onore. Fra carte equivalenti si usa la più bassa; la posizione può richiedere eccezioni.' },
 transfer: { explanation: '2♦ chiede all’apertore di 1SA di dire 2♥. Se si giocherà a cuori, l’apertore sarà il dichiarante; il rispondente che ha effettuato il transfer sarà il morto.' },
 vulnerabile: { options: ['Non può fare contratti di slam','Aumentano i premi di manche e slam e le penalità per caduta','Deve sempre aprire la licita','Non può contrare'], explanation: 'La vulnerabilità aumenta i premi di manche e slam e le penalità per caduta; non modifica ogni voce del punteggio.' },
};
const quote=x=>"'"+JSON.stringify(x).replaceAll("'","''")+"'::jsonb";
const changes=source.glossary.map(row=>{
 const e=english[row.id];
 if(!e||e[1].length!==row.quiz.options.length) throw Error(`Missing/invalid English quiz: ${row.id}`);
 return {id:row.id,before:row.quiz,after:{...row.quiz,...corrections[row.id]},english:{question:e[0],options:e[1],explanation:e[2],correctAnswer:row.quiz.correctAnswer}};
});
if(changes.length!==Object.keys(english).length) throw Error('Unexpected translation inventory');
let sql='BEGIN;\nALTER TABLE public.glossary ADD COLUMN IF NOT EXISTS quiz_en jsonb;\n';
for(const c of changes) sql+=`DO $patch$ BEGIN\nUPDATE public.glossary SET quiz=${quote(c.after)},quiz_en=${quote(c.english)} WHERE id='${c.id}' AND quiz=${quote(c.before)} AND (quiz_en IS NULL OR quiz_en=${quote(c.english)});\nIF NOT FOUND AND NOT EXISTS(SELECT FROM public.glossary WHERE id='${c.id}' AND quiz=${quote(c.after)} AND quiz_en=${quote(c.english)}) THEN RAISE EXCEPTION 'Glossary changed: ${c.id}'; END IF;\nEND $patch$;\n`;
sql+='COMMIT;\n';
writeFileSync('scripts/sql/glossary-quiz-en-2026-09.sql',sql);
writeFileSync('docs/attuazione-qualita-2026-09-23/glossario-prima-dopo.json',JSON.stringify(changes,null,2)+'\n');
console.log(JSON.stringify({quizzes:changes.length,italianRevisions:Object.keys(corrections).length,remoteWrites:0}));
