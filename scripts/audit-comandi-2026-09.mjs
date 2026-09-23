// Esegue solo controlli diagnostici locali e salva stdout/stderr senza variabili d'ambiente.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const out=new URL('../docs/audit-qualita-2026-09-23/',import.meta.url);
mkdirSync(out,{recursive:true});
const commands={
  test:['npm',['test','--','--maxWorkers=4']],
  lint:['npx',['eslint','src','--max-warnings','0']],
  traduzioni:['node',['scripts/stringhe-da-tradurre.mjs','--controlla']],
  terminologia:['node',['scripts/verifica-terminologia.mjs']],
  dipendenze:['npm',['audit','--omit=dev','--json']],
  schema:['node',['scripts/verifica-schema.mjs']],
  tipiSorgenti:['npx',['tsc','--project','docs/audit-qualita-2026-09-23/tsconfig-source.json','--noEmit']],
};
for(const name of process.argv.slice(2)) {
  if(!commands[name])throw Error('Controllo non riconosciuto');
  const [exe,args]=commands[name];const start=Date.now();
  const result=await new Promise(resolve=>{
    let stdout='',stderr='';const child=spawn(exe,args,{cwd:new URL('..',import.meta.url),stdio:['ignore','pipe','pipe']});
    child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
    const timer=setTimeout(()=>child.kill('SIGTERM'),120000);
    child.on('exit',(code,signal)=>{clearTimeout(timer);resolve({command:[exe,...args].join(' '),at:new Date().toISOString(),code,signal,ms:Date.now()-start,stdout,stderr});});
  });
  writeFileSync(new URL(name+'.json',out),JSON.stringify(result,null,2)+'\n');
  if(name==='dipendenze'&&result.stdout.startsWith('{')) {
    const r=JSON.parse(result.stdout);
    console.log(name,r.metadata?.vulnerabilities,Object.values(r.vulnerabilities??{}).filter(x=>x.isDirect).map(x=>({name:x.name,severity:x.severity,via:x.via,fix:x.fixAvailable})));
  } else console.log(name,JSON.stringify(result));
}
