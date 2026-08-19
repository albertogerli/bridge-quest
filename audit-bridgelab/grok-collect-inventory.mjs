import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") return [];
    return entry.isDirectory() ? walk(full) : [full];
  });
};
const rel = (p) => path.relative(root, p);
const read = (p) => fs.readFileSync(p, "utf8");

const pageFiles = walk(path.join(root, "src/app")).filter((f) => f.endsWith("/page.tsx"));
const componentFiles = walk(path.join(root, "src/components")).filter((f) => f.endsWith(".tsx"));
const routeFiles = walk(path.join(root, "src/app")).filter((f) => f.endsWith("/route.ts"));
const apiRouteFiles = walk(path.join(root, "src/app/api")).filter((f) => f.endsWith("/route.ts"));
const handlerPattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b|export\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
const handlers = [];
for (const file of routeFiles) {
  const text = read(file);
  for (const m of text.matchAll(handlerPattern)) {
    handlers.push({ file: rel(file), method: m[1] || m[2] });
  }
}

const sqlFiles = walk(path.join(root, "scripts/sql")).filter((f) => f.endsWith(".sql"));
const sqlText = sqlFiles.map((f) => ({ file: rel(f), text: read(f) }));
const countMatches = (re) => sqlText.reduce((n, x) => n + [...x.text.matchAll(re)].length, 0);
const uniqueSqlTables = new Set();
for (const { text } of sqlText) {
  for (const m of text.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z0-9_]+)/gi)) uniqueSqlTables.add(m[1]);
  for (const m of text.matchAll(/CREATE TABLE public\.([a-z0-9_]+)/gi)) uniqueSqlTables.add(m[1]);
}
const uniquePolicies = [];
for (const { file, text } of sqlText) {
  for (const m of text.matchAll(/CREATE POLICY\s+"([^"]+)"/g)) uniquePolicies.push({ file, name: m[1] });
}
const uniqueIndexes = [];
for (const { file, text } of sqlText) {
  for (const m of text.matchAll(/CREATE (?:UNIQUE )?INDEX(?: IF NOT EXISTS)?\s+([a-z0-9_]+)/gi)) {
    uniqueIndexes.push({ file, name: m[1] });
  }
}
const securityDefinerFns = [];
for (const { file, text } of sqlText) {
  const fnNames = [...text.matchAll(/CREATE OR REPLACE FUNCTION public\.([a-z0-9_]+)/gi)].map((m) => m[1]);
  const hasDefiner = /SECURITY DEFINER/i.test(text);
  if (hasDefiner) {
    for (const name of fnNames) securityDefinerFns.push({ file, name });
  }
}

const unitTests = walk(path.join(root, "src")).filter((f) => f.endsWith(".test.ts"));
const e2eTests = walk(path.join(root, "e2e")).filter((f) => f.endsWith(".spec.ts"));
const workflows = walk(path.join(root, ".github/workflows")).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

const typesPath = path.join(root, "src/lib/supabase/types.ts");
const typesText = read(typesPath);
const typedTables = [...typesText.matchAll(/^\s{6}([a-z0-9_]+): \{\n\s+Row:/gm)].map((m) => m[1]);

const routeFromPage = (file) => {
  const r = path.relative(path.join(root, "src/app"), file).replace(/\/page\.tsx$/, "");
  return r === "" || r === "page.tsx" ? "/" : `/${r}`;
};

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const trackedSrc = git("ls-files", "src").split("\n").filter(Boolean);
const untracked = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);

const output = {
  working_tree: {
    component_tsx_files_under_src_components: componentFiles.length,
    routable_page_files: pageFiles.length,
    routes: pageFiles.map(routeFromPage).sort(),
    api_and_auth_route_files: routeFiles.map(rel).sort(),
    api_route_files: apiRouteFiles.length,
    exported_http_handlers: handlers.length,
    handlers,
    sql_scripts: sqlFiles.length,
    sql_script_files: sqlFiles.map(rel).sort(),
    create_table_statements_in_sql: countMatches(/CREATE TABLE/gi),
    unique_tables_named_in_create_table: [...uniqueSqlTables].sort(),
    create_policy_statements_in_sql: uniquePolicies.length,
    policy_names_in_sql: uniquePolicies,
    create_index_statements_in_sql: uniqueIndexes.length,
    index_names_in_sql: uniqueIndexes,
    security_definer_mentions_in_sql: countMatches(/SECURITY DEFINER/gi),
    functions_in_files_containing_security_definer: securityDefinerFns,
    enable_rls_statements_in_sql: countMatches(/ENABLE ROW LEVEL SECURITY/gi),
    typed_tables_in_supabase_types: typedTables,
    unit_test_files: unitTests.map(rel).sort(),
    unit_test_file_count: unitTests.length,
    e2e_spec_files: e2eTests.map(rel).sort(),
    e2e_spec_file_count: e2eTests.length,
    ci_workflows: workflows.map(rel),
    tracked_src_files: trackedSrc.length,
    untracked_file_count: untracked.length,
    nota: "Conteggi sulla working tree corrente. Le tabelle/policy/indici SQL sono dichiarazioni nel repository, non lo schema live. Lo schema live è nella raccolta database.",
  },
};

fs.writeFileSync("audit-bridgelab/grok-raw/inventory.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
