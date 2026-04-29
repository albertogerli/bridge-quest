#!/usr/bin/env python3
"""
Merge the FIGB 2026 ASD roster (tmp/asd-update/figb-2026.tsv) into
src/data/asd-clubs.ts.

Conservative semantics:
- Match existing entries by F-code (normalizing "F202" -> "F0202").
- Update name (canonical FIGB denomination), city, province, hasSchool;
  add new fields region, type.
- Preserve address, cap, lat, lng from the existing entry — they aren't in
  the new dataset and we don't want to lose geocoded data.
- Mark existing-only entries (in current asd-clubs.ts but not in new roster)
  as active=false but keep them, so any user/profile referencing them by
  name still resolves. Their region defaults to empty.
- New entries (in new roster but not in current asd-clubs.ts) get added
  with empty address/cap and lat=0/lng=0 (geocoding TBD).
- Output is sorted by name (case-insensitive) for diffability.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TSV = ROOT / "tmp/asd-update/figb-2026.tsv"
TS = ROOT / "src/data/asd-clubs.ts"

# 1) Parse the new roster
new_by_code: dict[str, dict] = {}
with TSV.open(encoding="utf-8") as f:
    for raw in f:
        if not raw.strip():
            continue
        parts = raw.rstrip("\n").split("\t")
        # 6 or 7 columns: code, type, name, region, city, prov [, school]
        while len(parts) < 7:
            parts.append("")
        code, kind, name, region, city, prov, school = parts[:7]
        # Normalize code: ensure F + 4 digits
        m = re.match(r"^F(\d+)$", code.strip())
        if not m:
            raise ValueError(f"Bad code: {code!r}")
        code = "F" + m.group(1).zfill(4)
        new_by_code[code] = {
            "code": code,
            "name": name.strip(),
            "kind": kind.strip(),  # ASD, A.S.D., S.Br., A.D., G.S.D., GSAD, C.B.D., or ""
            "region": region.strip(),
            "city": city.strip(),
            "province": prov.strip(),
            "hasSchool": school.strip().rstrip(",").upper() == "X",
        }

# 2) Load existing ASD_CLUBS (extract the JSON array literal)
src = TS.read_text(encoding="utf-8")
m = re.search(r"export const ASD_CLUBS:\s*AsdClub\[\]\s*=\s*(\[.*\]);", src, re.DOTALL)
if not m:
    raise SystemExit("Could not locate ASD_CLUBS array in asd-clubs.ts")
existing = json.loads(m.group(1))
existing_by_code = {c["code"]: c for c in existing}

# 3) Merge
merged: dict[str, dict] = {}

for code, ne in new_by_code.items():
    base = existing_by_code.get(code, {})
    merged[code] = {
        "code": code,
        "name": ne["name"],
        "kind": ne["kind"],
        "active": True,
        "hasSchool": ne["hasSchool"],
        "region": ne["region"],
        "address": base.get("address", ""),
        "city": ne["city"],
        "province": ne["province"],
        "cap": base.get("cap", ""),
        "lat": base.get("lat", 0),
        "lng": base.get("lng", 0),
    }

# Carry over entries that exist today but aren't in the new roster.
# Mark active=false. Region defaults to empty. Preserve other fields.
for code, ec in existing_by_code.items():
    if code in merged:
        continue
    merged[code] = {
        "code": code,
        "name": ec.get("name", ""),
        "kind": ec.get("kind", ""),
        "active": False,
        "hasSchool": bool(ec.get("hasSchool", False)),
        "region": ec.get("region", ""),
        "address": ec.get("address", ""),
        "city": ec.get("city", ""),
        "province": ec.get("province", ""),
        "cap": ec.get("cap", ""),
        "lat": ec.get("lat", 0),
        "lng": ec.get("lng", 0),
    }

# 4) Sort by name (case-insensitive), then code
out = sorted(merged.values(), key=lambda c: (c["name"].upper(), c["code"]))

# 5) Render new asd-clubs.ts
def fmt_obj(c: dict) -> str:
    return (
        "{"
        f'"code": {json.dumps(c["code"], ensure_ascii=False)}, '
        f'"name": {json.dumps(c["name"], ensure_ascii=False)}, '
        f'"kind": {json.dumps(c["kind"], ensure_ascii=False)}, '
        f'"active": {"true" if c["active"] else "false"}, '
        f'"hasSchool": {"true" if c["hasSchool"] else "false"}, '
        f'"region": {json.dumps(c["region"], ensure_ascii=False)}, '
        f'"address": {json.dumps(c["address"], ensure_ascii=False)}, '
        f'"city": {json.dumps(c["city"], ensure_ascii=False)}, '
        f'"province": {json.dumps(c["province"], ensure_ascii=False)}, '
        f'"cap": {json.dumps(c["cap"], ensure_ascii=False)}, '
        f'"lat": {c["lat"]}, '
        f'"lng": {c["lng"]}'
        "}"
    )

header = """\
/** ASD clubs reference — FIGB roster 2026 (merged with prior geocoded data) */
export interface AsdClub {
  /** FIGB code, e.g. "F0024" */
  code: string;
  /** Official denomination */
  name: string;
  /** Legal/type prefix from the FIGB list: ASD, A.S.D., S.Br., A.D., G.S.D., GSAD, C.B.D., or "" */
  kind: string;
  /** True if present in the latest FIGB roster */
  active: boolean;
  /** True if listed as "scuola attiva" in the FIGB roster */
  hasSchool: boolean;
  /** FIGB 2-letter region code (e.g. "LM" Lombardia, "PM" Piemonte, "TS" Toscana). Empty if unknown. */
  region: string;
  /** Free-form address (carried over from prior geocoded data; may be empty for new entries) */
  address: string;
  city: string;
  /** 2-letter province code, e.g. "MI" */
  province: string;
  /** Postal code; may be empty for new entries */
  cap: string;
  /** Latitude (0 if not yet geocoded) */
  lat: number;
  /** Longitude (0 if not yet geocoded) */
  lng: number;
}

export const ASD_CLUBS: AsdClub[] = [
"""

body = ",\n".join("  " + fmt_obj(c) for c in out)
ts_text = header + body + ",\n];\n"

TS.write_text(ts_text, encoding="utf-8")

# 6) Stats
print(f"Roster (new):     {len(new_by_code)} entries")
print(f"Existing in TS:   {len(existing_by_code)} entries")
print(f"Merged total:     {len(out)} entries")
print(f"  active=true:    {sum(1 for c in out if c['active'])}")
print(f"  active=false:   {sum(1 for c in out if not c['active'])}")
print(f"  hasSchool=true: {sum(1 for c in out if c['hasSchool'])}")
new_codes = set(new_by_code) - set(existing_by_code)
print(f"  new this run:   {len(new_codes)}")
if new_codes:
    print("    " + ", ".join(sorted(new_codes)))
