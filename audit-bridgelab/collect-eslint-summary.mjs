import { spawnSync } from "node:child_process";
import path from "node:path";

const run = spawnSync("npx", ["eslint", "src", "--format", "json"], {
  encoding: "utf8",
  maxBuffer: 100 * 1024 * 1024,
});
if (!run.stdout) {
  console.error(run.stderr || `eslint exited ${run.status}`);
  process.exit(1);
}

const rows = JSON.parse(run.stdout);
const relevant = rows.map((row) => ({
  file: path.relative(process.cwd(), row.filePath),
  errors: row.errorCount,
  warnings: row.warningCount,
}));
const totals = relevant.reduce(
  (acc, row) => ({ errors: acc.errors + row.errors, warnings: acc.warnings + row.warnings }),
  { errors: 0, warnings: 0 },
);

console.log(JSON.stringify({
  eslint_exit_code: run.status,
  files_checked: relevant.length,
  files_with_issues: relevant.filter((row) => row.errors || row.warnings).length,
  ...totals,
  top_files_by_errors_then_warnings: relevant
    .filter((row) => row.errors || row.warnings)
    .sort((a, b) => b.errors - a.errors || b.warnings - a.warnings || a.file.localeCompare(b.file))
    .slice(0, 20),
}, null, 2));
