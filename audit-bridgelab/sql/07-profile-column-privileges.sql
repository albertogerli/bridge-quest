-- Read-only aggregate of column grants; returns schema metadata only.
SELECT grantee, privilege_type,
       count(*) AS granted_columns,
       string_agg(column_name, ', ' ORDER BY column_name) AS columns
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee, privilege_type
ORDER BY grantee, privilege_type;
