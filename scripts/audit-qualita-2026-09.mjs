/** Audit diagnostico: sole SELECT su contenuti editoriali, nessuna scrittura remota.
 * node scripts/audit-qualita-2026-09.mjs
 * node scripts/audit-qualita-2026-09.mjs --offline --dds
 * I risultati sono candidati da revisionare, non correzioni automatiche.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { leggiEnv } from './leggi-env.mjs';

const out = new URL('../docs/audit-qualita-2026-09-23/', import.meta.url);
mkdirSync(out, { recursive: true });
const save = (name, value) => writeFileSync(new URL(name, out), JSON.stringify(value, null, 2) + '\n');
const columns = {
  courses: 'id,name,name_en',
  course_worlds: 'id,course_id,name,name_en',
  lessons: 'id,world_id,title,title_en',
  lesson_modules: 'lesson_id,module_id,title,title_en,module_type,content,content_en',
  eserciziario_exercises: 'id,lesson_id,title,title_en,content,content_en',
  smazzate: 'id,lesson_id,board,title,title_en,contract,declarer,vulnerability,opening_lead,hands,bidding,commentary,commentary_en,dd_tricks',
  glossary: 'id,term,definition,example,cards,quiz,term_en,definition_en',
  guided_hands: 'id,name,description,hands,contract,declarer,opening_lead,hints,tricks_needed',
  trova_errore_scenarios: 'id,category,situation,cards,sequence,error_description,options,correct_answer,explanation',
};
let data;
if (process.argv.includes('--offline')) data = JSON.parse(readFileSync(new URL('contenuti.json', out), 'utf8'));
else {
  const env = leggiEnv(['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']);
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  data = {};
  for (const [table, select] of Object.entries(columns)) {
    const rows = [];
    for (let from = 0; ; from += 500) {
      const order = table === 'lesson_modules' ? 'module_id' : 'id';
      const { data: page, error } = await db.from(table).select(select).order(order).range(from, from + 499).abortSignal(AbortSignal.timeout(20000));
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...page);
      if (page.length < 500) break;
    }
    data[table] = rows;
    console.log(`${table}: ${rows.length}`);
  }
  save('contenuti.json', data);
}
const summary = { at: new Date().toISOString(), sha256: createHash('sha256').update(JSON.stringify(data)).digest('hex'), counts: Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length])), blockTypes: {}, checks: {}, translation: {}, issues: [] };
const issue = (kind, where, detail) => summary.issues.push({kind,where,detail});
const seats=['north','east','south','west'], suits=['spade','heart','diamond','club'], ranks=['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
const hcp={A:4,K:3,Q:2,J:1};
const key=c=>`${c.suit}:${c.rank}`;
const symbol={ '♠':'S','♥':'H','♦':'D','♣':'C' };
const norm = b => String(b).toUpperCase().replace(/SA/g,'NT').replace(/[♠♥♦♣]/g,s=>symbol[s]).replace(/\s/g,'').replace(/^(\d)N(?=X|$)/,'$1NT');
const bidValue=b=>{const m=norm(b).match(/^([1-7])(C|D|H|S|NT)$/);return m ? (Number(m[1])-1)*5+['C','D','H','S','NT'].indexOf(m[2]) : -1;};
const lessonIds=new Set(data.lessons.map(l=>l.id));
let parsedHands=0, blocks=0;
function inspectTextHand(text, where) {
  // Non assorbire la Q di «Quale» o la T di «The» dopo l'ultima carta.
  const re=/♠\s*([AKQJT2-9xX10 \t,—–-]*)♥\s*([AKQJT2-9xX10 \t,—–-]*)♦\s*([AKQJT2-9xX10 \t,—–-]*)♣[ \t]*([AKQJT2-9xX10]+(?:[ \t]+[AKQJT2-9xX10]+)*(?![A-Za-z0-9])|[—–-])/g;
  const found=[];
  for(const match of text.matchAll(re)) {
    const parts=match.slice(1).map(s=>s.replace(/10/g,'T').replace(/[\s,—–-]/g,''));
    if(parts.some(s=>/[xX]/.test(s))) continue;
    parsedHands++;
    const n=parts.join('').length, p=[...parts.join('')].reduce((a,r)=>a+(hcp[r]||0),0);
    const hand={parts,cards:n,hcp:p};found.push(hand);
    if(n!==13) issue(n<10?'partial-hand-review':'text-hand-size',where,{...hand,text:match[0].trim()});
    parts.forEach((s,i)=>{if(new Set(s).size!==s.length)issue('text-duplicate-card',where,{suit:i,cards:s});});
  }
  return found;
}
function inspectBlocks(rows, table) {
  for(const row of rows) {
    if(!lessonIds.has(row.lesson_id))issue('missing-lesson',`${table}/${row.module_id??row.id}`,row.lesson_id);
    const inlineByBlock={};
    for(const lang of ['content','content_en']) {
      const contents=row[lang];
      if(!Array.isArray(contents)) {if(lang==='content')issue('invalid-content',`${table}/${row.module_id??row.id}`,typeof contents);continue;}
      if(lang==='content_en' && contents.length!==row.content.length) issue('translation-block-count',`${table}/${row.module_id??row.id}`,{it:row.content.length,en:contents.length});
      for(const [i,b] of contents.entries()) {
        const where=`${table}/${row.module_id??row.id}/${lang}/${i}`;
        blocks++;
        summary.blockTypes[`${lang}/${b.type}`]=(summary.blockTypes[`${lang}/${b.type}`]||0)+1;
        if(['quiz','bid-select'].includes(b.type) && (!Array.isArray(b.options)||!Number.isInteger(b.correctAnswer)||b.correctAnswer<0||b.correctAnswer>=b.options.length)) issue('answer-index',where,b);
        if(b.type==='true-false'&&![0,1].includes(b.correctAnswer))issue('answer-index',where,b);
        const hands=inspectTextHand(b.cards||'',where);
        const inline=[];
        for(const field of ['content','explanation'])if(/[♠].*[♥].*[♦].*[♣]/s.test(b[field]||''))inline.push(...inspectTextHand(b[field],`${where}/${field}`));
        const signatures=inline.map(h=>h.parts.join('.'));
        if(lang==='content')inlineByBlock[i]=signatures;
        else if(JSON.stringify(signatures)!==JSON.stringify(inlineByBlock[i]))issue('translation-inline-hands-review',where,{it:inlineByBlock[i],en:signatures});
        if(b.type==='hand-eval'&&hands.length===1&&hands[0].cards===13&&b.correctValue!==hands[0].hcp)issue('hand-eval-hcp',where,{actual:hands[0].hcp,expected:b.correctValue,content:b.content});
        if(lang==='content_en') {
          const it=row.content[i];
          for(const field of ['type','cards','correctAnswer','correctCard','correctValue','correctOrder']) if(JSON.stringify(b[field])!==JSON.stringify(it?.[field]))issue('translation-structural-drift',where,{field,it:it?.[field],en:b[field]});
          if(b.options?.length!==it?.options?.length)issue('translation-options-length',where,{it:it?.options?.length,en:b.options?.length});
        }
        const primary=hands.length===1?hands[0]:inline.length===1?inline[0]:null;
        if(primary?.cards===13 && lang==='content') {
          for(const m of `${b.content||''} ${b.explanation||''}`.matchAll(/\b(\d{1,2})\s*(?:HCP|PO|punti(?: onori)?)\b/gi)) {
            if(Number(m[1])!==primary.hcp) issue('hcp-claim-review',where,{actual:primary.hcp,claim:m[0],text:`${b.content} ${b.explanation}`});
          }
        }
      }
    }
    summary.translation[table] ??= {total:rows.length,missing:0};
    if(!row.content_en?.length)summary.translation[table].missing++;
  }
}
inspectBlocks(data.lesson_modules,'lesson_modules');
inspectBlocks(data.eserciziario_exercises,'eserciziario_exercises');
for(const g of data.glossary) {
  if(!g.quiz?.options?.length||!Number.isInteger(g.quiz.correctAnswer)||g.quiz.correctAnswer<0||g.quiz.correctAnswer>=g.quiz.options.length)issue('glossary-answer',`glossary/${g.id}`,g.quiz);
}
for(const s of data.trova_errore_scenarios??[]) {
  inspectTextHand(s.cards||'',`trova_errore_scenarios/${s.id}`);
  if(!s.options?.length||!Number.isInteger(s.correct_answer)||s.correct_answer<0||s.correct_answer>=s.options.length)issue('scenario-answer',`trova_errore_scenarios/${s.id}`,s);
}
const structurallyValid=[];
for(const d of [...data.smazzate.map(x=>({...x,table:'smazzate'})),...(data.guided_hands??[]).map(x=>({...x,table:'guided_hands'}))]) {
  const before=summary.issues.length, where=`${d.table}/${d.id}`;
  const all=seats.flatMap(p=>d.hands?.[p]||[]);
  for(const p of seats) if(d.hands?.[p]?.length!==13)issue('deal-hand-size',where,{seat:p,count:d.hands?.[p]?.length});
  if(all.length!==52||new Set(all.map(key)).size!==52)issue('deal-card-integrity',where,{total:all.length,unique:new Set(all.map(key)).size});
  for(const c of all)if(!suits.includes(c.suit)||!ranks.includes(c.rank))issue('invalid-card',where,c);
  if(!seats.includes(d.declarer))issue('invalid-declarer',where,d.declarer);
  const leader=seats[(seats.indexOf(d.declarer)+1)%4];
  if(!d.hands?.[leader]?.some(c=>key(c)===key(d.opening_lead)))issue('invalid-lead',where,{leader,card:d.opening_lead});
  if(d.table==='smazzate'&&!lessonIds.has(d.lesson_id))issue('missing-lesson',where,d.lesson_id);
  if(summary.issues.length===before)structurallyValid.push(d);
  const bids=d.bidding?.bids?.map(norm);
  if(bids?.length) {
    let value=-1,last=-1,lastBid,passes=0,closed=false,doubling=0;
    const dealer=seats.indexOf(d.bidding.dealer);
    for(const [i,b]of bids.entries()) {
      if(closed){issue('auction-after-close',where,{index:i,bids});break;}
      if(b==='P'){passes++;if(passes===(last<0?4:3))closed=true;continue;}
      passes=0;
      if(b==='X'||b==='XX') {const allowed=last>=0 && (b==='X'?doubling===0&&(i-last)%2!==0:doubling===1&&(i-last)%2===0);if(!allowed)issue('auction-illegal-double',where,{index:i,bids});doubling=b==='X'?1:2;continue;}
      const v=bidValue(b);
      if(v<=value)issue('auction-not-ascending',where,{index:i,bids});
      value=v;last=i;lastBid=b;doubling=0;
    }
    if(last>=0) {
      const contract=lastBid+['','X','XX'][doubling];
      if(contract!==norm(d.contract))issue('auction-contract-mismatch',where,{declared:d.contract,auction:contract,bids});
      const denom=lastBid.slice(1), first=bids.findIndex((b,i)=>i%2===last%2&&b.slice(1)===denom&&bidValue(b)>=0);
      const declarer=seats[(dealer+first)%4];
      if(declarer!==d.declarer)issue('auction-declarer-mismatch',where,{declared:d.declarer,auction:declarer,bids});
    }
    if(!closed)issue('auction-incomplete-review',where,bids);
  }
}
summary.checks={blocks,parsedTextHands:parsedHands,structurallyValidDeals:structurallyValid.length};
if(process.argv.includes('--dds')) {
  const { Dds, loadDds }=await import('./dds.mjs');
  const dds=new Dds(await loadDds());
  const results=[];
  for(const d of structurallyValid) {
    const m=norm(d.contract).match(/^([1-7])(C|D|H|S|NT)(X|XX)?$/);
    if(!m){issue('invalid-contract',`${d.table}/${d.id}`,d.contract);continue;}
    const pbn='N:'+seats.map(p=>suits.map(s=>ranks.filter(r=>d.hands[p].some(c=>c.suit===s&&c.rank===r)).map(r=>r==='10'?'T':r).join('')).join('.')).join(' ');
    const trump=['S','H','D','C','NT'].indexOf(m[2]),declarer=seats.indexOf(d.declarer);
    const fut=dds.SolveBoardPBN({trump,first:(declarer+1)%4,currentTrickSuit:[],currentTrickRank:[],remainCards:pbn},-1,3,1);
    const suit=suits.indexOf(d.opening_lead.suit),rank=14-ranks.indexOf(d.opening_lead.rank);
    let tricks=null;
    for(let i=0;i<fut.cards;i++)if(fut.suit[i]===suit&&(fut.rank[i]===rank||(fut.equals[i]&(1<<rank))))tricks=13-fut.score[i];
    const result={id:d.id,table:d.table,contract:d.contract,declarer:d.declarer,required:Number(m[1])+6,tricks,stored:d.dd_tricks};
    results.push(result);
    if(d.table==='smazzate'&&tricks!==null&&tricks!==d.dd_tricks)issue('dd-stored-mismatch',`${d.table}/${d.id}`,result);
    if(['north','south'].includes(d.declarer)&&tricks!==null&&tricks<result.required)issue('unmakeable-declarer-review',`${d.table}/${d.id}`,result);
    if(results.length%25===0)console.log(`DDS offline: ${results.length}/${structurallyValid.length}`);
  }
  save('dds.json',results);
  summary.checks.dds=results.length;
}
summary.byKind=Object.fromEntries([...new Set(summary.issues.map(i=>i.kind))].map(k=>[k,summary.issues.filter(i=>i.kind===k).length]));
save(process.argv.includes('--dds')?'risultati-dds.json':'risultati.json',summary);
console.log(JSON.stringify({...summary,issues:undefined},null,2));
