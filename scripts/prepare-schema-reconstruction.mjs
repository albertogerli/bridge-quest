/** Prepare an idempotent update to the schema exporter; no database writes. */
import{readFileSync,writeFileSync}from'node:fs';
const baseline=readFileSync('scripts/sql/000-schema-baseline.sql','utf8');
const begin=baseline.indexOf('CREATE OR REPLACE FUNCTION public.dump_schema()');
const end=baseline.indexOf('\n$function$\n;',begin)+'\n$function$\n;'.length;
let fn=baseline.slice(begin,end);
const oldMarker=fn.indexOf("  out := out || E'\\n\\n-- PERMESSI SULLE TABELLE\\n';");
const a=oldMarker<0?fn.indexOf('  -- Clear platform default grants'):oldMarker;
const b=fn.indexOf("  out := out || E'\\n\\n-- PUBLICATION",a);
if(begin<0||a<0||b<0)throw Error('Unexpected baseline exporter');
const permissions=String.raw`
  -- Clear platform default grants before replaying the actual ACLs.
  out := out || E'\n\n-- PERMESSI ESATTI: TABELLE, COLONNE, SEQUENZE\n';
  SELECT out || coalesce(string_agg(format('REVOKE ALL ON %s public.%I FROM PUBLIC, anon, authenticated, service_role;',
    CASE c.relkind WHEN 'S' THEN 'SEQUENCE' ELSE 'TABLE' END,c.relname), E'\n' ORDER BY c.relname),'') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','S');
  SELECT out || E'\n' || coalesce(string_agg(format('GRANT %s ON %s public.%I TO %s%s;',
    x.privilege_type,CASE c.relkind WHEN 'S' THEN 'SEQUENCE' ELSE 'TABLE' END,c.relname,
    CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(x.grantee)) END,
    CASE WHEN x.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END),E'\n' ORDER BY c.relname,x.grantee,x.privilege_type),'') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault(CASE c.relkind WHEN 'S' THEN 's'::"char" ELSE 'r'::"char" END,c.relowner))) x
  WHERE n.nspname='public' AND c.relkind IN ('r','S') AND x.grantee<>c.relowner;
  SELECT out || E'\n' || coalesce(string_agg(format('GRANT %s (%I) ON TABLE public.%I TO %s%s;',
    x.privilege_type,a.attname,c.relname,
    CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(x.grantee)) END,
    CASE WHEN x.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END),E'\n' ORDER BY c.relname,a.attnum,x.grantee,x.privilege_type),'') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
  CROSS JOIN LATERAL aclexplode(a.attacl) x
  WHERE n.nspname='public' AND c.relkind='r' AND x.grantee<>c.relowner;
  out := out || E'\n\n-- PERMESSI ESATTI: FUNZIONI\n';
  SELECT out || coalesce(string_agg(format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated, service_role;',
    p.proname,pg_get_function_identity_arguments(p.oid)) || coalesce(E'\n'||a.acl,''),E'\n' ORDER BY p.proname,pg_get_function_identity_arguments(p.oid)),'') INTO out
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  LEFT JOIN LATERAL (
    SELECT string_agg(format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO %s%s;',p.proname,pg_get_function_identity_arguments(p.oid),
      CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(x.grantee)) END,
      CASE WHEN x.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END),E'\n' ORDER BY x.grantee) acl
    FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x WHERE x.grantee<>p.proowner
  ) a ON true WHERE n.nspname='public' AND p.prokind='f';
  -- Application triggers attached to auth.users are not in schema public.
  out := out || E'\n\n-- TRIGGER APPLICATIVI SU AUTH\n';
  SELECT out || coalesce(string_agg(pg_get_triggerdef(t.oid)||';',E'\n' ORDER BY t.tgname),'') INTO out
  FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_namespace pn ON pn.oid=p.pronamespace
  WHERE n.nspname='auth' AND c.relname='users' AND pn.nspname='public' AND NOT t.tgisinternal;

`;
fn=fn.slice(0,a)+permissions+fn.slice(b);
writeFileSync('scripts/sql/schema-reconstruction-2026-09.sql',`-- Fix schema backup fidelity. Only replaces the service-role exporter; does not change application privileges.\nBEGIN;\n${fn}\nREVOKE ALL ON FUNCTION public.dump_schema() FROM PUBLIC, anon, authenticated;\nGRANT EXECUTE ON FUNCTION public.dump_schema() TO service_role;\nCOMMIT;\n`);
console.log('Prepared schema exporter repair; no remote writes.');
