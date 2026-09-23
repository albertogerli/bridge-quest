/** Prepare only; run the resulting migration separately after local validation. */
import {readFileSync,writeFileSync} from 'node:fs';
const baseline=readFileSync('scripts/sql/000-schema-baseline.sql','utf8');
const start=baseline.indexOf('CREATE OR REPLACE FUNCTION public.dump_schema()');
const end=baseline.indexOf('\n$function$\n;',start)+'\n$function$\n;'.length;
let fn=baseline.slice(start,end);
if(start<0||!fn.includes('-- PERMESSI ESATTI'))throw Error('Exact-ACL exporter required first');
const seqWhere="WHERE n.nspname = 'public' AND c.relkind = 'S';";
if(!fn.includes(seqWhere))throw Error('Unexpected sequence section');
fn=fn.replace(seqWhere,`WHERE n.nspname = 'public' AND c.relkind = 'S'
    AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.objid=c.oid
      AND d.classid='pg_class'::regclass AND d.refclassid='pg_class'::regclass
      AND d.deptype='i' AND d.refobjsubid>0);`);
// Fail closed for schema features the custom exporter does not yet support.
fn=fn.replace("BEGIN\n  -- Ordine",`BEGIN
  IF EXISTS (SELECT FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND a.attgenerated<>'') THEN
    RAISE EXCEPTION 'Generated columns require pg_dump; refusing an incomplete schema backup';
  END IF;
  -- Ordine`);
const marker="  out := out || E'\\n\\n-- VINCOLI\\n';";
if(!fn.includes(marker))throw Error('Missing constraints section');
fn=fn.replace(marker,String.raw`
  -- Identity sequences are created by ADD IDENTITY, not standalone CREATE SEQUENCE.
  out := out || E'\n\n-- COLONNE IDENTITY\n';
  SELECT out || coalesce(string_agg(format(
    'ALTER TABLE public.%I ALTER COLUMN %I ADD GENERATED %s AS IDENTITY (SEQUENCE NAME public.%I START WITH %s INCREMENT BY %s MINVALUE %s MAXVALUE %s CACHE %s %s);',
    c.relname,a.attname,CASE a.attidentity WHEN 'a' THEN 'ALWAYS' ELSE 'BY DEFAULT' END,
    s.relname,q.seqstart,q.seqincrement,q.seqmin,q.seqmax,q.seqcache,
    CASE WHEN q.seqcycle THEN 'CYCLE' ELSE 'NO CYCLE' END),E'\n' ORDER BY c.relname,a.attnum),'') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_attribute a ON a.attrelid=c.oid AND a.attidentity<>'' AND NOT a.attisdropped
  JOIN pg_depend d ON d.refobjid=c.oid AND d.refobjsubid=a.attnum AND d.deptype='i'
    AND d.classid='pg_class'::regclass AND d.refclassid='pg_class'::regclass
  JOIN pg_class s ON s.oid=d.objid AND s.relkind='S' JOIN pg_sequence q ON q.seqrelid=s.oid
  WHERE n.nspname='public' AND c.relkind='r';

`+marker);
const triggerMarker="  out := out || E'\\n\\n-- TRIGGER\\n';";
fn=fn.replace(triggerMarker,String.raw`
  out := out || E'\n\n-- REPLICA IDENTITY\n';
  SELECT out || coalesce(string_agg(format('ALTER TABLE public.%I REPLICA IDENTITY %s;',c.relname,
    CASE c.relreplident WHEN 'f' THEN 'FULL' WHEN 'n' THEN 'NOTHING'
      WHEN 'i' THEN 'USING INDEX '||quote_ident(idx.relname) ELSE 'DEFAULT' END),E'\n' ORDER BY c.relname),'') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  LEFT JOIN pg_index i ON i.indrelid=c.oid AND i.indisreplident LEFT JOIN pg_class idx ON idx.oid=i.indexrelid
  WHERE n.nspname='public' AND c.relkind='r' AND c.relreplident<>'d';

`+triggerMarker);
const policyMarker="  out := out || E'\\n\\n-- POLICY\\n';";
fn=fn.replace(policyMarker,String.raw`
  SELECT out || E'\n' || coalesce(string_agg(format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;',c.relname),E'\n' ORDER BY c.relname),'') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relforcerowsecurity;

`+policyMarker);
writeFileSync('scripts/sql/schema-reconstruction-identity-2026-09.sql',`-- Exporter only: preserve identity columns and Realtime replica identity. No application ACL changes.\nBEGIN;\n${fn}\nREVOKE ALL ON FUNCTION public.dump_schema() FROM PUBLIC, anon, authenticated;\nGRANT EXECUTE ON FUNCTION public.dump_schema() TO service_role;\nCOMMIT;\n`);
console.log('Prepared identity/realtime schema export repair; no remote writes.');
