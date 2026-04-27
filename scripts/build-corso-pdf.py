#!/usr/bin/env python3
"""
Genera un PDF per ogni corso con tutte le lezioni junior (A4 dispense).

Output:
  public/infografiche/fiori/corso-fiori-junior.pdf
  public/infografiche/quadri/corso-quadri-junior.pdf
  public/infografiche/cuori-licita/corso-cuori-licita-junior.pdf
  public/infografiche/cuori-gioco/corso-cuori-gioco-junior.pdf

Uso:
  python3 scripts/build-corso-pdf.py
"""

import re
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).parent.parent
INFO_DIR = PROJECT_ROOT / "public" / "infografiche"
OUTPUT_DIR = PROJECT_ROOT / "output" / "corsi-pdf-junior"

COURSES = ["fiori", "quadri", "cuori-licita", "cuori-gioco"]


def lesson_sort_key(path: Path):
    """Estrae l'ID numerico dal filename per ordinamento."""
    m = re.match(r"lezione-(\d+)-junior\.jpg$", path.name)
    return int(m.group(1)) if m else -1


def build_pdf(course: str) -> None:
    course_dir = INFO_DIR / course
    jpgs = sorted(
        [p for p in course_dir.glob("lezione-*-junior.jpg")],
        key=lesson_sort_key,
    )
    if not jpgs:
        print(f"SKIP {course}: nessun jpg trovato")
        return

    print(f"\n== {course} ({len(jpgs)} lezioni) ==")

    # 1) PDF singolo per ogni lezione (path canonico app)
    for jpg in jpgs:
        single_out = course_dir / f"{jpg.stem}.pdf"
        img = Image.open(jpg).convert("RGB")
        img.save(single_out, "PDF", resolution=150.0)
        print(f"  + {jpg.name} -> {single_out.name}")

    # 2) PDF corso intero (path canonico app + copia in OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    bundle_paths = [
        course_dir / f"corso-{course}-junior.pdf",
        OUTPUT_DIR / f"corso-{course}-junior.pdf",
    ]

    images = [Image.open(j).convert("RGB") for j in jpgs]
    first, rest = images[0], images[1:]
    for out in bundle_paths:
        first.save(out, "PDF", save_all=True, append_images=rest, resolution=150.0)

    size_kb = bundle_paths[0].stat().st_size // 1024
    print(
        f"  CORSO INTERO -> {bundle_paths[0].relative_to(PROJECT_ROOT)} "
        f"({size_kb} KB, {len(images)} pagine)"
    )


def main():
    for c in COURSES:
        build_pdf(c)
    print("\nDONE.")


if __name__ == "__main__":
    main()
