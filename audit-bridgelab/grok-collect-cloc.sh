#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="$ROOT/audit-bridgelab/grok-raw"
mkdir -p "$OUT"

CLOC=(npx --yes cloc --quiet --json --hide-rate)

# Application: src minus tests minus didactic seed data
"${CLOC[@]}" src \
  --fullpath \
  --not-match-d='src/data' \
  --not-match-f='(\.test\.ts$|\.spec\.ts$)' \
  > "$OUT/cloc-application.json"

# Tests: unit + e2e tracked-style
"${CLOC[@]}" src e2e scripts \
  --fullpath \
  --match-f='(\.test\.ts$|\.spec\.ts$|test-rls\.mjs$|test-realtime\.mjs$)' \
  > "$OUT/cloc-tests.json"

# Content: seed/catalog definitions in src/data
"${CLOC[@]}" src/data > "$OUT/cloc-content.json"

# Subtitles
"${CLOC[@]}" public/captions --force-lang="Text,ass" > "$OUT/cloc-subtitles.json" || true

# Config at repo root + config-like files
"${CLOC[@]}" \
  next.config.ts eslint.config.mjs tsconfig.json vercel.json \
  capacitor.config.ts vitest.config.ts playwright.config.ts \
  postcss.config.mjs components.json \
  > "$OUT/cloc-config.json"

# Tooling scripts excluding tests
"${CLOC[@]}" scripts \
  --fullpath \
  --not-match-f='(test-rls\.mjs$|test-realtime\.mjs$)' \
  --not-match-d='scripts/legacy' \
  > "$OUT/cloc-scripts.json"

# SQL schema scripts
"${CLOC[@]}" scripts/sql > "$OUT/cloc-sql.json"

# Working tree src (all, for comparison)
"${CLOC[@]}" src > "$OUT/cloc-src-all.json"

# Tracked-only application snapshot via git ls-files
TMP=$(mktemp -d)
git ls-files src | grep -v '/data/' | grep -v '\.test\.ts$' | grep -v '\.spec\.ts$' | while read -r f; do
  mkdir -p "$TMP/$(dirname "$f")"
  cp "$f" "$TMP/$f"
done
"${CLOC[@]}" "$TMP/src" --fullpath --not-match-d='src/data' --not-match-f='(\.test\.ts$|\.spec\.ts$)' \
  > "$OUT/cloc-application-tracked.json"
rm -rf "$TMP"

# Exclusions inventory
{
  echo "node_modules excluded by not scanning it"
  echo "package-lock.json excluded (lockfile, not passed to cloc)"
  echo ".next / dist not present or not scanned"
  echo "public binary assets (png/jpg/mp4/pdf) not passed to application cloc"
  echo "android/ ios/ www/ untracked wrappers not scanned as application"
} > "$OUT/cloc-exclusions.txt"

echo "cloc done"
