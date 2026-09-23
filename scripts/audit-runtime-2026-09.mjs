/** Riproduzioni locali: nessuna rete, dipendenze DB/auth simulate. */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from 'esbuild';
import { Dds, loadDds } from './dds.mjs';
const root=new URL('..',import.meta.url).pathname;
const out=new URL('../docs/audit-qualita-2026-09-23/',import.meta.url);
const require=createRequire(import.meta.url);
const data=JSON.parse(readFileSync(new URL('contenuti.json',out),'utf8'));
const result={at:new Date().toISOString()};
function literal(file,name) {
  const raw=readFileSync(root+file,'utf8'),source=ts.createSourceFile(file,raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let found;
  function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(source)===name)found=n.initializer.getText(source);ts.forEachChild(n,visit);}visit(source);
  return runInNewContext(`(${found})`);
}
async function load(file,mocks={}) {
  const b=await build({entryPoints:[root+file],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',logLevel:'silent',plugins:[{name:'offline-mocks',setup(api){api.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'mock'}:null);api.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
  const exports={},module={exports};
  runInNewContext(b.outputFiles[0].text,{module,exports,require,console,localStorage:storage,setTimeout,clearTimeout,URLSearchParams,Date,process});
  return module.exports;
}
const memory=new Map();const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const catalog=await load('src/lib/catalog.ts',{'@/lib/supabase/client':'export function createClient(){throw Error("Network forbidden by audit")};'});
const raw=data.smazzate.map(d=>({...d,lesson:d.lesson_id,openingLead:d.opening_lead,ddTricks:d.dd_tricks}));
const fixed=catalog.validateSmazzate(raw), changed=fixed.filter(d=>d.declarer!==raw.find(x=>x.id===d.id).declarer);
const seats=['north','east','south','west'],suits=['spade','heart','diamond','club'],ranks=['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
const dds=new Dds(await loadDds());
result.runtimeHandChanges=[];
for(const d of changed) {
  const old=raw.find(x=>x.id===d.id),m=d.contract.replace(/SA/g,'NT').replace(/[♠♥♦♣]/g,s=>({'♠':'S','♥':'H','♦':'D','♣':'C'}[s])).match(/^([1-7])(NT|S|H|D|C)/);
  const pbn='N:'+seats.map(p=>suits.map(s=>ranks.filter(r=>d.hands[p].some(c=>c.suit===s&&c.rank===r)).map(r=>r==='10'?'T':r).join('')).join('.')).join(' ');
  const fut=dds.SolveBoardPBN({trump:['S','H','D','C','NT'].indexOf(m[2]),first:(seats.indexOf(d.declarer)+1)%4,currentTrickSuit:[],currentTrickRank:[],remainCards:pbn},-1,3,1);
  let tricks;
  const rank=14-ranks.indexOf(d.openingLead.rank);
  for(let i=0;i<fut.cards;i++)if(fut.suit[i]===suits.indexOf(d.openingLead.suit)&&(fut.rank[i]===rank||(fut.equals[i]&(1<<rank))))tricks=13-fut.score[i];
  result.runtimeHandChanges.push({id:d.id,oldDeclarer:old.declarer,newDeclarer:d.declarer,oldLead:old.openingLead,newLead:d.openingLead,storedTricks:d.ddTricks,actualTricks:tricks,playable:catalog.isPlausibleSmazzata(d),required:Number(m[1])+6});
}
result.runtimeHandSummary={changed:changed.length,ddStale:result.runtimeHandChanges.filter(x=>x.storedTricks!==x.actualTricks).length,ddStalePlayable:result.runtimeHandChanges.filter(x=>x.playable&&x.storedTricks!==x.actualTricks).length,playable:fixed.filter(catalog.isPlausibleSmazzata).length};
const reactMock='export const useEffect=()=>{}; export const useCallback=f=>f; export const useState=x=>[x,()=>{}];';
const store=await load('src/store/use-smazzate-store.ts',{'react':reactMock,'@/lib/catalog':'let calls=0;export async function getAllSmazzate(){if(++calls===1)throw Error("Simulated network failure");return []};export const validateSmazzate=x=>x;export const isPlausibleSmazzata=()=>true;'});
await store.useSmazzateStore.getState().fetchSmazzate();
const state=store.useSmazzateStore.getState();
await state.fetchSmazzate();
result.retry={afterFailure:{isLoaded:state.isLoaded,error:state.error},afterRetry:{isLoaded:store.useSmazzateStore.getState().isLoaded,error:store.useSmazzateStore.getState().error}};
const badges=literal('src/components/achievement-popup.tsx','allBadges');
result.badges=badges.filter(b=>['prima_mano','guided_master'].includes(b.id)).map(b=>({id:b.id,description:b.desc,unlockedWithoutTutorial:b.check({xp:50,streak:0,modulesCompleted:0,handsPlayed:3,worldsCompleted:0})}));
function handInfo(s){const parts=s.split(/[♠♥♦♣]/).slice(1).map(p=>p.replace(/10/g,'T').replace(/\s/g,''));return {cards:parts.join('').length,hcp:[...parts.join('')].reduce((n,r)=>n+({A:4,K:3,Q:2,J:1}[r]||0),0),shape:parts.map(p=>p.length).join('-')};}
result.dichiara=literal('src/app/gioca/dichiara/page.tsx','scenarios').map((s,i)=>({index:i,hand:s.hand,stated:s.hcp,actual:handInfo(s.hand),answer:s.correctBid,explanation:s.explanation}));
result.biddingPractice=literal('src/data/bidding-practice-data.ts','biddingScenarios').map(s=>({id:s.id,hand:s.handDisplay,actual:handInfo(s.handDisplay),answer:s.correctBid,explanation:s.explanation}));
const lessonModule=await load('src/lib/lesson-module.ts');
result.unanswerableBlocks=[];
for(const row of data.lesson_modules)for(const lang of ['content','content_en'])for(const [i,b] of (row[lang]??[]).entries()) {
  if(b.type==='hand-eval'&&(b.correctValue<5||b.correctValue>19))result.unanswerableBlocks.push({module:row.module_id,lang,index:i,value:b.correctValue,content:b.content,reason:'UI only offers integer values 5..19'});
  if(b.type==='card-select'&&lessonModule.correctAnswerFor(b)<0)result.unanswerableBlocks.push({module:row.module_id,lang,index:i,value:b.correctCard,content:b.content,reason:'correctCard absent from rendered choices'});
}
// Render iniziale di Dispense: esegue la funzione originale con hook simulati.
const rawPage=readFileSync(root+'src/app/dispense/page.tsx','utf8'),ast=ts.createSourceFile('page.tsx',rawPage,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='Dispense');
const js=ts.transpileModule(fn.getText(ast),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
try { runInNewContext(js+'; Dispense();',{exports:{},require,useT:()=>s=>s,useSearchParams:()=>new URLSearchParams(),useState:x=>[x,()=>{}],useGameStore:()=>({}),useCatalog:()=>({courses:[],isLoaded:false})});result.dispense='no error'; }catch(e){result.dispense={name:e.name,message:e.message};}
// Due salvataggi concorrenti: il primo successo scarica una coda che contiene già il secondo.
// Voce virtuale per condividere lo stato del mock fra hook e diagnostica.
const entry=`import {useGameResults} from './src/hooks/use-game-results.ts';import{pending,rows}from '@/lib/supabase/client';export {pending,rows};export const save=useGameResults().saveGameResult;`;
const dbmock='export const pending=[];export const rows=[];export function createClient(){return {from:()=>({insert:r=>{rows.push(r);return new Promise(resolve=>pending.push(resolve));}})}};';
const b=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',plugins:[{name:'m',setup(api){const mocks={'react':reactMock,'@/contexts/auth-provider':'export const useSharedAuth=()=>({user:{id:"synthetic-offline-audit"}});','@/lib/native-bridge':'export const getPlatform=()=>"web";','@/lib/supabase/client':dbmock};api.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'mock'}:null);api.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
const exp={},mod={exports:exp};runInNewContext(b.outputFiles[0].text,{module:mod,exports:exp,require,console,localStorage:storage,Date});
const q=mod.exports;q.save({gameType:'dichiara',score:1});q.save({gameType:'dichiara',score:2});
q.pending[0]({error:null});await new Promise(r=>setTimeout(r,0));
q.pending[2]({error:null});await new Promise(r=>setTimeout(r,0));
q.pending[1]({error:null});await new Promise(r=>setTimeout(r,0));
result.concurrentResults={submitted:[1,2],insertedScores:q.rows.flat().map(x=>x.score),remainingQueue:storage.getItem('bq_game_results_queue')};
const syncRaw=readFileSync(root+'src/hooks/use-supabase-sync.ts','utf8'),syncAst=ts.createSourceFile('sync.ts',syncRaw,ts.ScriptTarget.Latest,true);
const snapshotFn=syncAst.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='getLocalSnapshot');
const snapshotJS=ts.transpileModule(snapshotFn.getText(syncAst),{}).outputText;
const context={localStorage:storage,useGameStore:{getState:()=>({xp:0,streak:0,handsPlayed:0,completedModules:{}})},LS_KEYS:{badges:'bq_badges',profile:'bq_profile',memoryBest:'bq_memory_best',textSize:'bq_text_size',animSpeed:'bq_anim_speed',sound:'bq_sound',reviewItems:'bq_review_items',totalMinutes:'bq_total_minutes'}};
const snapshot=()=>runInNewContext(snapshotJS+';getLocalSnapshot()',context);
const before=snapshot();storage.setItem('bq_review_items',JSON.stringify([{lessonId:1,moduleId:'1-1',box:2}]));
result.reviewOnlyChange={snapshotUnchanged:before===snapshot()};
let pushNode;function findPush(n){if(ts.isVariableDeclaration(n)&&n.name.getText(syncAst)==='pushToSupabase')pushNode=n.initializer;ts.forEachChild(n,findPush);}findPush(syncAst);
const pushJS=ts.transpileModule('const pushToSupabase='+pushNode.getText(syncAst),{}).outputText;
const dbCalls=[],logs=[];
const failure={error:{message:'Synthetic denied write'}};
function query(table){const chain={then:(resolve,reject)=>Promise.resolve(failure).then(resolve,reject)};for(const op of ['update','upsert','delete','insert','eq'])chain[op]=(...args)=>{dbCalls.push({table,op});return chain};return chain;}
const syncContext={...context,Date,useCallback:f=>f,supabase:{from:query},logError:(...a)=>logs.push(a),console:{error:(...a)=>logs.push(a)}};
const runPush=runInNewContext('let lastSyncedSnapshot="";'+snapshotJS+pushJS+';pushToSupabase',syncContext);
await runPush('synthetic-offline-audit');const firstCalls=dbCalls.length;
await runPush('synthetic-offline-audit');
result.syncDeniedWrites={firstQueryOperations:firstCalls,secondAdditionalOperations:dbCalls.length-firstCalls,reportedErrors:logs.length,note:'All mocked writes return {error}; no network requests'};
writeFileSync(new URL('runtime.json',out),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,runtimeHandChanges:undefined,dichiara:undefined,biddingPractice:undefined},null,2));
