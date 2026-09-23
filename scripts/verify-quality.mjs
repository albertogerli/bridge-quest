/** Local gates with exact command and raw output. Does not write production data. */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = 'docs/attuazione-qualita-2026-09-23/verifiche';
mkdirSync(out, { recursive: true });
const commands = {
 test: ['npm', ['test','--','--maxWorkers=4']],
 lint: ['npx', ['eslint','src','--max-warnings','0']],
 tipi: ['npx', ['tsc','--noEmit','--incremental','false']],
 traduzioni: ['node', ['scripts/stringhe-da-tradurre.mjs','--controlla']],
 terminologia: ['node', ['scripts/verifica-terminologia.mjs']],
 dipendenze: ['npm', ['audit','--json']],
 schema: ['npm', ['run','schema:check']],
 sw: ['node', ['scripts/verifica-sw.mjs']],
 build: ['npm', ['run','build'], { NEXT_DIST_DIR: '.next.nosync' }],
};
for (const name of process.argv.slice(2)) {
 if (!commands[name]) throw Error(`Unknown gate: ${name}`);
 const [cmd,args,extra={}] = commands[name];
 const start = Date.now();
 const result = await new Promise(resolve => {
  let stdout='',stderr='';
  const child=spawn(cmd,args,{env:{...process.env,...extra},stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',d=>stdout+=d); child.stderr.on('data',d=>stderr+=d);
  const timer=setTimeout(()=>child.kill('SIGTERM'),300000);
  child.on('error',e=>{clearTimeout(timer);resolve({code:null,error:e.message});});
  child.on('exit',(code,signal)=>{clearTimeout(timer);resolve({code,signal,stdout,stderr});});
 });
 const entry={command:[...Object.entries(extra).map(([k,v])=>`${k}=${v}`),cmd,...args].join(' '),at:new Date().toISOString(),ms:Date.now()-start,...result};
 writeFileSync(`${out}/${name}.json`,JSON.stringify(entry,null,2)+'\n');
 console.log(JSON.stringify({gate:name,code:result.code,ms:entry.ms,output:`${out}/${name}.json`}));
 if(result.code!==0) process.exitCode=1;
}
