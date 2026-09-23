/** Generate a versioned, editorial-only fixture. No credentials or user tables. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const source=JSON.parse(readFileSync('tmp/quality-local-editorial.json'));
const canonical=JSON.parse(readFileSync('docs/attuazione-qualita-2026-09-23/contenuti-finali/contenuti.json'));
const tables=['courses','course_worlds','lessons','lesson_modules','smazzate','glossary','guided_hands','trova_errore_scenarios','collectible_cards'];
const result={};
for(const table of tables){
 result[table]=source[table].map(row=>{
  if(Object.keys(row).some(k=>/email|user_id|created_by|updated_by|token|password/i.test(k)))throw Error('Non-editorial field in fixture');
  const current=canonical[table]?.find(x=>table==='lesson_modules'?x.module_id===row.module_id&&x.lesson_id===row.lesson_id:x.id===row.id);
  return {...row,...current};
 });
}
mkdirSync('e2e/fixtures',{recursive:true});
writeFileSync('e2e/fixtures/editorial.json',JSON.stringify(result)+'\n');
console.log(JSON.stringify({tables:Object.fromEntries(tables.map(t=>[t,result[t].length])),remoteReads:0,personalDataTables:0}));
