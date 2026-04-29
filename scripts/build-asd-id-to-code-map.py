#!/usr/bin/env python3
"""
Build the ASD_LIST index (1-based) → F-code mapping needed to backfill
profiles.asd_code. Reads:
  - src/data/asd-list.ts  (the static ASD_LIST array, 1-based ids)
  - src/data/asd-clubs.ts (the new ASD_CLUBS reference with F-codes)

Emits a SQL `(asd_id, code)` VALUES list to stdout, plus diagnostics about
unmatched names (those need manual mapping or will be left as asd_code=NULL
on backfill).
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# 1) Parse ASD_LIST
list_src = (ROOT / "src/data/asd-list.ts").read_text(encoding="utf-8")
m = re.search(r"export const ASD_LIST\s*=\s*\[(.*?)\]\s*as const;", list_src, re.DOTALL)
assert m, "Could not parse ASD_LIST"
asd_list = re.findall(r'"([^"]*)"', m.group(1))

# 2) Parse ASD_CLUBS
clubs_src = (ROOT / "src/data/asd-clubs.ts").read_text(encoding="utf-8")
m = re.search(r"export const ASD_CLUBS:\s*AsdClub\[\]\s*=\s*(\[.*\]);", clubs_src, re.DOTALL)
assert m, "Could not parse ASD_CLUBS"
# Strip trailing comma before `]` (valid TS, invalid JSON)
clubs_json = re.sub(r",(\s*\])", r"\1", m.group(1))
clubs = json.loads(clubs_json)

# 3) Build name → code lookup (normalized)
def norm(s: str) -> str:
    # Strip whitespace, collapse internal whitespace, drop quote chars, uppercase
    s = re.sub(r"[\"'\u201C\u201D\u2018\u2019]", "", s)
    return re.sub(r"\s+", " ", s.strip()).upper()

by_norm_name: dict[str, list[str]] = {}
for c in clubs:
    by_norm_name.setdefault(norm(c["name"]), []).append(c["code"])

mapping: list[tuple[int, str]] = []
unmatched: list[tuple[int, str]] = []
ambiguous: list[tuple[int, str, list[str]]] = []

for i, name in enumerate(asd_list, start=1):
    candidates = by_norm_name.get(norm(name), [])
    if len(candidates) == 1:
        mapping.append((i, candidates[0]))
    elif len(candidates) == 0:
        unmatched.append((i, name))
    else:
        ambiguous.append((i, name, candidates))

print(f"-- Mapping: {len(mapping)}/{len(asd_list)} matched")
if unmatched:
    print(f"-- UNMATCHED ({len(unmatched)}):")
    for i, n in unmatched:
        print(f"--   id={i}: {n!r}")
if ambiguous:
    print(f"-- AMBIGUOUS ({len(ambiguous)}):")
    for i, n, cs in ambiguous:
        print(f"--   id={i}: {n!r} -> {cs}")

print()
print("-- Generated VALUES list (paste into UPDATE ... FROM (VALUES ...) m(asd_id, code))")
print("-- format: (id, 'F-code')")
for asd_id, code in mapping:
    print(f"  ({asd_id}, '{code}'),")
