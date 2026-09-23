/** Disposable local verification stack. Credentials stay in child-process memory. */
import {execFileSync,spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {leggiEnv} from './leggi-env.mjs';
const cli=process.env.BRIDGELAB_SUPABASE_CLI||'supabase';
const command=process.argv[2];
const local=JSON.parse(execFileSync(cli,['status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const url=local.API_URL, dburl=local.DB_URL;
if(new URL(url).hostname!=='127.0.0.1'||new URL(url).port!=='56321'||new URL(dburl).hostname!=='127.0.0.1'||new URL(dburl).port!=='56322')throw Error('Unexpected local test target');
const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_ANON_KEY:local.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:local.SERVICE_ROLE_KEY,BRIDGELAB_TEST_SUPABASE_URL:url,NEXT_PUBLIC_SENTRY_DSN:'',SENTRY_DSN:'',SENTRY_AUTH_TOKEN:'',BEN_API_URL:'http://127.0.0.1:55999',BEN_API_KEY:'local-only',OPENAI_API_KEY:'',NEXT_DIST_DIR:'.next.quality',PORTA_E2E:'3137',BRIDGELAB_E2E_PREBUILT:'1'};
function sql(text){return execFileSync('psql',[dburl,'-X','-q','-v','ON_ERROR_STOP=1','-At'],{input:text,encoding:'utf8',maxBuffer:10*1024*1024,stdio:['pipe','pipe','pipe']});}
if(command==='seed'){
 const tables=['courses','course_worlds','lessons','lesson_modules','smazzate','glossary','guided_hands','trova_errore_scenarios','collectible_cards'];
 const file=existsSync('e2e/fixtures/editorial.json')?'e2e/fixtures/editorial.json':'tmp/quality-local-editorial.json';mkdirSync('tmp',{recursive:true});
 let content;
 if(existsSync(file))content=JSON.parse(readFileSync(file));
 else {
  const remote=leggiEnv(['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']);
  const db=createClient(remote.NEXT_PUBLIC_SUPABASE_URL,remote.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  content={};
  for(const table of tables){
   const {data,error}=await db.from(table).select('*').limit(1000).abortSignal(AbortSignal.timeout(20000));
   if(error)throw Error(`${table}: ${error.code}`);if(data.length===1000)throw Error('Fixture would be truncated');
   content[table]=data;console.log(`Editorial fixture: ${table} ${data.length}`);
  }
  writeFileSync(file,JSON.stringify(content),{mode:0o600});
 }
 if(sql("select to_regclass('public.profiles') is null;").trim()==='t'){
  sql('BEGIN;\n'+readFileSync('scripts/sql/000-schema-baseline.sql','utf8')+'\nCOMMIT;');
  console.log('Production public schema restored locally; no production data.');
 }
 sql("DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_trigger WHERE tgname='on_auth_user_created' AND tgrelid='auth.users'::regclass) THEN CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); END IF; END $$;");
 const q=x=>"'"+JSON.stringify(x).replaceAll("'","''")+"'::jsonb";
 for(const table of tables){
  sql(`INSERT INTO public.${table} SELECT * FROM jsonb_populate_recordset(NULL::public.${table},${q(content[table])}) ON CONFLICT DO NOTHING;`);
 }
 const {tournamentTestFixture}=await import('./tournament-test-fixture.mjs');
 const tournamentHands=await tournamentTestFixture(content);
 for(const hand of tournamentHands){
  sql(`INSERT INTO public.mani_generate (id,hands,dealer,vulnerability,dd_table,par_contracts,par_score,valore_atteso,distribuzioni)
   SELECT id,hands,dealer,vulnerability,dd_table,par_contracts,par_score,valore_atteso,distribuzioni
   FROM jsonb_populate_record(NULL::public.mani_generate,${q(hand)}) ON CONFLICT DO NOTHING;`);
 }
 // Repair only empty fixture tournaments left by an earlier run without a
 // reserve. Already assigned hands/results are never replaced.
 sql(`DO $$ DECLARE t record; BEGIN FOR t IN SELECT id,tipo FROM public.tornei WHERE NOT EXISTS
  (SELECT FROM public.torneo_mani WHERE torneo_id=tornei.id) LOOP
   INSERT INTO public.torneo_mani(torneo_id,numero,mano_id)
   SELECT t.id,row_number() OVER (),id FROM (SELECT id FROM public.mani_generate m
    WHERE NOT EXISTS(SELECT FROM public.torneo_mani tm WHERE tm.mano_id=m.id)
    ORDER BY id LIMIT CASE WHEN t.tipo='giornaliero' THEN 8 ELSE 24 END) chosen;
  END LOOP; END $$;`);
 console.log(`Local tournament reserve: ${tournamentHands.length} editorial hands, calculated DDS, no simulated EV.`);
 // Publication is outside the public-schema snapshot; no emails, jobs, or remote endpoints copied.
 sql("DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_publication WHERE pubname='supabase_realtime') THEN CREATE PUBLICATION supabase_realtime; END IF; END $$;");
 sql("DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['challenges','class_messages','coda_sfide_coppie','friendships','live_tables','sfide_coppie'] LOOP IF NOT EXISTS(SELECT FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',t); END IF; END LOOP; END $$;");
 sql("NOTIFY pgrst,'reload schema';");
 console.log('Local editorial fixture ready; zero real users copied.');
}else if(command==='permissions'){
 const dump=readFileSync('scripts/sql/000-schema-baseline.sql','utf8');
 const start=dump.indexOf('\n\n-- PERMESSI ESATTI: TABELLE');
 const end=dump.indexOf('\n\n-- TRIGGER APPLICATIVI SU AUTH',start);
 if(start<0||end<start)throw Error('Baseline must include exact permissions');
 sql('BEGIN;'+dump.slice(start,end)+"\nNOTIFY pgrst,'reload schema';COMMIT;");
 console.log('Production ACL snapshot replayed ONLY on guarded localhost.');
}else{
 const commands={rls:['node',['scripts/test-rls.mjs']],realtime:['node',['scripts/test-realtime.mjs']],e2e:['node',['node_modules/@playwright/test/cli.js','test',...process.argv.slice(3)]],dev:['node',['node_modules/next/dist/bin/next','dev','--webpack','--disable-source-maps','--port','3137']],sql:['psql',[dburl,'-X','-v','ON_ERROR_STOP=1','-f',process.argv[3]]],build:['npm',['run','build']]};
 if(!commands[command])throw Error('Use seed, rls, realtime, e2e, dev, sql, or build');
 const [cmd,args]=commands[command];
 const started=Date.now();let stdout='',stderr='';
 const child=spawn(cmd,args,{env,stdio:['inherit','pipe','pipe']});
 child.stdout.on('data',d=>{stdout+=d;process.stdout.write(d);});
 child.stderr.on('data',d=>{stderr+=d;process.stderr.write(d);});
 child.on('exit',(code,signal)=>{
  process.exitCode=code??1;
  if(command!=='dev'){
   const folder='docs/attuazione-qualita-2026-09-23/verifiche';mkdirSync(folder,{recursive:true});
   writeFileSync(`${folder}/locale-${command}-${started}.json`,JSON.stringify({
    command:['node','scripts/quality-local.mjs',...process.argv.slice(2)].join(' '),
    target:'Supabase locale 127.0.0.1:56321, soli dati sintetici/editoriali',at:new Date(started).toISOString(),ms:Date.now()-started,code,signal,stdout,stderr,
   },null,2)+'\n');
  }
 });
}
