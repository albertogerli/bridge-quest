-- Exporter only: preserve identity columns and Realtime replica identity. No application ACL changes.
BEGIN;
CREATE OR REPLACE FUNCTION public.dump_schema()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  out text := '';
BEGIN
  IF EXISTS (SELECT FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND a.attgenerated<>'') THEN
    RAISE EXCEPTION 'Generated columns require pg_dump; refusing an incomplete schema backup';
  END IF;
  -- Ordine studiato su un database VUOTO, verificato eseguendolo davvero:
  --   sequenze -> tabelle (senza valori predefiniti) -> funzioni ->
  --   valori predefiniti -> vincoli -> indici -> trigger -> RLS -> policy.
  -- I due nodi: una tabella puo' avere un DEFAULT che chiama una funzione
  -- (classes.invite_code), e una funzione puo' RESTITUIRE il tipo di una
  -- tabella (SETOF profiles). Le due dipendenze vanno in direzioni opposte, e
  -- si sciolgono staccando i valori predefiniti dalla CREATE TABLE.
  out := out || E'SET check_function_bodies = false;\n\n';

  out := out || E'-- ESTENSIONI\n';
  SELECT out || coalesce(string_agg(
    'CREATE EXTENSION IF NOT EXISTS ' || quote_ident(extname) || ';', E'\n' ORDER BY extname), '')
    INTO out FROM pg_extension WHERE extname <> 'plpgsql';

  out := out || E'\n\n-- SEQUENZE\n';
  SELECT out || coalesce(string_agg(
    'CREATE SEQUENCE IF NOT EXISTS public.' || quote_ident(c.relname) || ';', E'\n' ORDER BY c.relname), '')
    INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'S'
    AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.objid=c.oid
      AND d.classid='pg_class'::regclass AND d.refclassid='pg_class'::regclass
      AND d.deptype='i' AND d.refobjsubid>0);

  out := out || E'\n\n-- TABELLE (senza valori predefiniti: vedi più avanti)\n';
  SELECT out || coalesce(string_agg(ddl, E'\n\n' ORDER BY tbl), '') INTO out FROM (
    SELECT c.relname AS tbl,
      'CREATE TABLE IF NOT EXISTS public.' || quote_ident(c.relname) || E' (\n' ||
      string_agg('  ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
        || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END, E',\n' ORDER BY a.attnum)
      || E'\n);' AS ddl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    GROUP BY c.relname) t;

  out := out || E'\n\n-- APPARTENENZA DELLE SEQUENZE\n';
  SELECT out || coalesce(string_agg(
    'ALTER SEQUENCE public.' || quote_ident(s.relname) || ' OWNED BY public.'
    || quote_ident(t.relname) || '.' || quote_ident(a.attname) || ';', E'\n' ORDER BY s.relname), '')
    INTO out
  FROM pg_class s
  JOIN pg_namespace n ON n.oid = s.relnamespace AND n.nspname = 'public' AND s.relkind = 'S'
  JOIN pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
  JOIN pg_class t ON t.oid = d.refobjid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid;

  out := out || E'\n\n-- FUNZIONI\n';
  SELECT out || coalesce(string_agg(pg_get_functiondef(p.oid) || ';', E'\n\n' ORDER BY p.proname), '') INTO out
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f';

  out := out || E'\n\n-- VALORI PREDEFINITI\n';
  SELECT out || coalesce(string_agg(
    'ALTER TABLE public.' || quote_ident(c.relname) || ' ALTER COLUMN '
    || quote_ident(a.attname) || ' SET DEFAULT ' || pg_get_expr(d.adbin, d.adrelid) || ';',
    E'\n' ORDER BY c.relname, a.attnum), '') INTO out
  FROM pg_attrdef d
  JOIN pg_class c ON c.oid = d.adrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
  WHERE n.nspname = 'public' AND c.relkind = 'r';


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

  out := out || E'\n\n-- VINCOLI\n';
  SELECT out || coalesce(string_agg(
    'ALTER TABLE public.' || quote_ident(c.relname) || ' ADD CONSTRAINT '
    || quote_ident(con.conname) || ' ' || pg_get_constraintdef(con.oid) || ';',
    E'\n' ORDER BY CASE con.contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'c' THEN 3 ELSE 4 END,
    c.relname, con.conname), '') INTO out
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public';

  out := out || E'\n\n-- INDICI\n';
  SELECT out || coalesce(string_agg(indexdef || ';', E'\n' ORDER BY indexname), '') INTO out
  FROM pg_indexes WHERE schemaname = 'public'
    AND indexname NOT IN (SELECT conname FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n2 ON n2.oid = c.relnamespace WHERE n2.nspname = 'public');


  out := out || E'\n\n-- REPLICA IDENTITY\n';
  SELECT out || coalesce(string_agg(format('ALTER TABLE public.%I REPLICA IDENTITY %s;',c.relname,
    CASE c.relreplident WHEN 'f' THEN 'FULL' WHEN 'n' THEN 'NOTHING'
      WHEN 'i' THEN 'USING INDEX '||quote_ident(idx.relname) ELSE 'DEFAULT' END),E'\n' ORDER BY c.relname),'') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  LEFT JOIN pg_index i ON i.indrelid=c.oid AND i.indisreplident LEFT JOIN pg_class idx ON idx.oid=i.indexrelid
  WHERE n.nspname='public' AND c.relkind='r' AND c.relreplident<>'d';

  out := out || E'\n\n-- TRIGGER\n';
  SELECT out || coalesce(string_agg(pg_get_triggerdef(t.oid) || ';', E'\n' ORDER BY t.tgname), '') INTO out
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal;

  out := out || E'\n\n-- ROW LEVEL SECURITY\n';
  SELECT out || coalesce(string_agg(
    'ALTER TABLE public.' || quote_ident(c.relname) || ' ENABLE ROW LEVEL SECURITY;',
    E'\n' ORDER BY c.relname), '') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity;


  SELECT out || E'\n' || coalesce(string_agg(format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;',c.relname),E'\n' ORDER BY c.relname),'') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relforcerowsecurity;

  out := out || E'\n\n-- POLICY\n';
  SELECT out || coalesce(string_agg(
    'CREATE POLICY ' || quote_ident(policyname) || ' ON public.' || quote_ident(tablename)
    || ' AS ' || permissive || ' FOR ' || cmd
    || ' TO ' || array_to_string(roles, ', ')
    || coalesce(' USING (' || qual || ')', '')
    || coalesce(' WITH CHECK (' || with_check || ')', '') || ';',
    E'\n' ORDER BY tablename, policyname), '') INTO out
  FROM pg_policies WHERE schemaname = 'public';


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

  out := out || E'\n\n-- PUBLICATION (Realtime)\n';
  SELECT out || coalesce(string_agg(
    'ALTER PUBLICATION ' || quote_ident(pubname) || ' ADD TABLE public.' || quote_ident(tablename) || ';',
    E'\n' ORDER BY pubname, tablename), '') INTO out
  FROM pg_publication_tables WHERE schemaname = 'public';

  RETURN out;
END;
$function$
;
REVOKE ALL ON FUNCTION public.dump_schema() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dump_schema() TO service_role;
COMMIT;
