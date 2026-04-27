#!/usr/bin/env python3
"""
Promuove le infografiche gpt-image-2 come versione finale junior.

Strategia per ogni lezione:
  1. Backup del .jpg originale (Gemini) in public/infografiche/_backup-gemini/
  2. Sceglie la versione piu recente disponibile: v4 > v3 > v2
  3. Converte PNG -> JPG (quality 92) sovrascrivendo lezione-{id}-junior.jpg

Uso:
  python3 scripts/promote-infografiche.py           # esegue
  python3 scripts/promote-infografiche.py --dry-run # mostra solo cosa farebbe
"""

import argparse
import shutil
import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).parent.parent
INFO_DIR = PROJECT_ROOT / "public" / "infografiche"
BACKUP_DIR = INFO_DIR / "_backup-gemini"

COURSES = ["fiori", "quadri", "cuori-licita", "cuori-gioco"]

# Preferenza versioni (prima trovata vince)
VERSION_PRIORITY = ["v4", "v3", "v2"]


def pick_source(lesson_dir: Path, lesson_id: str) -> Path | None:
    """Ritorna il PNG gpt-image-2 piu recente, o None se nessuno."""
    for v in VERSION_PRIORITY:
        candidate = lesson_dir / f"lezione-{lesson_id}-junior-{v}.png"
        if candidate.exists():
            return candidate
    return None


def list_lesson_ids(lesson_dir: Path) -> list[str]:
    """Elenca gli ID lezione guardando i PNG gpt-image-2 presenti."""
    ids = set()
    for p in lesson_dir.glob("lezione-*-junior-v*.png"):
        # lezione-{id}-junior-v{n}.png
        parts = p.stem.split("-")
        if len(parts) >= 4:
            ids.add(parts[1])
    return sorted(ids)


def convert_png_to_jpg(png_path: Path, jpg_path: Path, quality: int = 92) -> int:
    """Converte PNG -> JPG, ritorna la dimensione in KB."""
    with Image.open(png_path) as img:
        rgb = img.convert("RGB")
        rgb.save(jpg_path, "JPEG", quality=quality, optimize=True, progressive=True)
    return jpg_path.stat().st_size // 1024


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Non modifica file, mostra solo il piano")
    args = parser.parse_args()

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    total_promoted = 0
    total_skipped = 0
    total_backed_up = 0

    for course in COURSES:
        course_dir = INFO_DIR / course
        if not course_dir.is_dir():
            print(f"SKIP {course}: dir non trovata")
            continue

        print(f"\n== {course} ==")
        lesson_ids = list_lesson_ids(course_dir)

        for lid in lesson_ids:
            src = pick_source(course_dir, lid)
            if src is None:
                print(f"  lezione {lid}: nessuna versione gpt, SKIP")
                total_skipped += 1
                continue

            # L'app si aspetta ID a min 2 cifre (lezione-01, lezione-02, ...).
            # Per cuori-gioco (100+) e cuori-licita (200+) zfill(2) e' no-op.
            padded_id = lid.zfill(2)
            jpg_path = course_dir / f"lezione-{padded_id}-junior.jpg"
            version = src.stem.split("-")[-1]  # v2/v3/v4

            # Backup originale se non gia in backup
            if jpg_path.exists():
                backup_subdir = BACKUP_DIR / course
                backup_subdir.mkdir(parents=True, exist_ok=True)
                backup_target = backup_subdir / jpg_path.name
                if not backup_target.exists():
                    if args.dry_run:
                        print(f"  lezione {lid}: BACKUP {jpg_path.name} -> _backup-gemini/{course}/")
                    else:
                        shutil.copy2(jpg_path, backup_target)
                    total_backed_up += 1

            if args.dry_run:
                print(f"  lezione {lid}: {version} -> {jpg_path.name}")
            else:
                kb = convert_png_to_jpg(src, jpg_path)
                print(f"  lezione {lid}: {version} -> {jpg_path.name} ({kb} KB)")
            total_promoted += 1

    print()
    print("=" * 60)
    mode = "DRY-RUN" if args.dry_run else "DONE"
    print(f"{mode}: promosse={total_promoted} backup={total_backed_up} skip={total_skipped}")
    if args.dry_run:
        print("Per eseguire davvero: python3 scripts/promote-infografiche.py")


if __name__ == "__main__":
    main()
