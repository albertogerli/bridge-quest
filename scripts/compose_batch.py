#!/usr/bin/env python3 -u
"""
Batch video composition for ALL courses and profiles.
Takes HeyGen avatar videos + slide images → final 1080x1920 lesson videos.

Usage:
  python3 compose_batch.py                                    # All available
  python3 compose_batch.py --profile giovane                  # Only giovane
  python3 compose_batch.py --profile giovane --course fiori   # Only giovane fiori
  python3 compose_batch.py --lesson 0                         # Only lesson 0
"""
import os
import sys
import json
import glob
import argparse

sys.stdout.reconfigure(line_buffering=True)
sys.path.insert(0, os.path.dirname(__file__))
from compose_video import compose_video, generate_ass_from_script

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
VIDEOS_DIR = os.path.join(BASE_DIR, "public/videos")
INFOGRAFICHE_DIR = os.path.join(BASE_DIR, "public/infografiche")
CAPTIONS_DIR = os.path.join(BASE_DIR, "public/captions")
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts/video-scripts")

COURSES = {
    "fiori": {"lessons": list(range(0, 13)), "lesson_fmt": "{:02d}"},
    "quadri": {"lessons": list(range(1, 13)), "lesson_fmt": "{:02d}"},
    "cuori-gioco": {"lessons": list(range(100, 110)), "lesson_fmt": "{}"},
    "cuori-licita": {"lessons": list(range(200, 214)), "lesson_fmt": "{}"},
}

PROFILES = ["junior", "giovane", "adulto", "senior"]


def find_avatar(course, lesson_id, profile):
    """Find raw HeyGen avatar video."""
    lesson_fmt = COURSES[course]["lesson_fmt"].format(lesson_id)
    name = f"maestro-{course}-lezione{lesson_fmt}-{profile}.mp4"
    path = os.path.join(VIDEOS_DIR, name)
    if os.path.exists(path):
        return path
    # Try old naming (junior without profile suffix)
    if profile == "junior":
        old_name = f"maestro-{course}-lezione{lesson_id}.mp4"
        old_path = os.path.join(VIDEOS_DIR, old_name)
        if os.path.exists(old_path):
            return old_path
        # Try with greenscreen suffix
        gs_name = f"maestro-{course}-lezione{lesson_id}-junior-greenscreen.mp4"
        gs_path = os.path.join(VIDEOS_DIR, gs_name)
        if os.path.exists(gs_path):
            return gs_path
    return None


def find_slides(course, lesson_id):
    """Find slide images directory for a lesson."""
    lesson_fmt = COURSES[course]["lesson_fmt"].format(lesson_id)
    slides_dir = os.path.join(INFOGRAFICHE_DIR, course, f"lezione-{lesson_fmt}-slides")
    if os.path.isdir(slides_dir):
        return slides_dir
    return None


def find_captions(course, lesson_id, profile):
    """Find .ass caption file — try existing, then generate from script."""
    lesson_fmt = COURSES[course]["lesson_fmt"].format(lesson_id)

    # 1. Look for existing .ass file
    ass_path = os.path.join(CAPTIONS_DIR, course, f"lezione-{lesson_fmt}-{profile}.ass")
    if os.path.exists(ass_path):
        return ass_path

    # 2. Try junior captions as fallback (same content, different tone)
    junior_ass = os.path.join(CAPTIONS_DIR, course, f"lezione-{lesson_fmt}-junior.ass")
    if os.path.exists(junior_ass):
        return junior_ass

    return None


def find_script(course, lesson_id):
    """Find the markdown script file for a lesson."""
    lesson_fmt = COURSES[course]["lesson_fmt"].format(lesson_id)
    script_path = os.path.join(SCRIPTS_DIR, course, f"lezione-{lesson_fmt}.md")
    if os.path.exists(script_path):
        return script_path
    return None


def output_path(course, lesson_id, profile):
    """Generate output path for final video."""
    lesson_fmt = COURSES[course]["lesson_fmt"].format(lesson_id)
    out_dir = os.path.join(VIDEOS_DIR, f"{course}-final")
    os.makedirs(out_dir, exist_ok=True)
    return os.path.join(out_dir, f"{course}-lezione-{lesson_fmt}-{profile}.mp4")


def main():
    parser = argparse.ArgumentParser(description="Batch compose BridgeQuest videos")
    parser.add_argument("--profile", choices=PROFILES, help="Only this profile")
    parser.add_argument("--course", choices=list(COURSES.keys()), help="Only this course")
    parser.add_argument("--lesson", type=int, help="Only this lesson ID")
    parser.add_argument("--fps", type=int, default=25)
    parser.add_argument("--force", action="store_true", help="Re-compose even if output exists")
    args = parser.parse_args()

    profiles = [args.profile] if args.profile else PROFILES
    courses = [args.course] if args.course else list(COURSES.keys())

    # Discover what we can compose
    tasks = []
    for course in courses:
        lessons = COURSES[course]["lessons"]
        if args.lesson is not None:
            if args.lesson in lessons:
                lessons = [args.lesson]
            else:
                continue
        for lesson_id in lessons:
            slides = find_slides(course, lesson_id)
            if not slides:
                continue  # No slides = can't compose

            for profile in profiles:
                avatar = find_avatar(course, lesson_id, profile)
                if not avatar:
                    continue  # No raw video = skip

                out = output_path(course, lesson_id, profile)
                if os.path.exists(out) and not args.force:
                    continue  # Already composed

                captions = find_captions(course, lesson_id, profile)
                script = find_script(course, lesson_id)

                tasks.append({
                    "course": course,
                    "lesson_id": lesson_id,
                    "profile": profile,
                    "avatar": avatar,
                    "slides": slides,
                    "captions": captions,
                    "script": script,
                    "output": out,
                })

    if not tasks:
        print("No videos to compose. Check that:")
        print("  - Raw HeyGen videos exist in public/videos/")
        print("  - Slide directories exist in public/infografiche/*/lezione-*-slides/")
        print("  - Use --force to re-compose existing outputs")
        return

    # Summary
    by_course = {}
    by_profile = {}
    for t in tasks:
        by_course[t["course"]] = by_course.get(t["course"], 0) + 1
        by_profile[t["profile"]] = by_profile.get(t["profile"], 0) + 1

    print("=" * 60)
    print("  BridgeQuest Video Composer")
    print(f"  {len(tasks)} videos to compose")
    print("=" * 60)
    print(f"\n  By course: {by_course}")
    print(f"  By profile: {by_profile}\n")

    done = 0
    failed = 0
    for i, t in enumerate(tasks):
        print(f"\n[{i+1}/{len(tasks)}] {t['course']} L{t['lesson_id']} ({t['profile']})")

        # Generate captions from script if no .ass file
        caption_path = t["captions"]
        if not caption_path and t["script"]:
            from moviepy import VideoFileClip
            tmp_av = VideoFileClip(t["avatar"])
            dur = tmp_av.duration
            tmp_av.close()

            gen_ass = t["output"].replace(".mp4", ".ass")
            caption_path = generate_ass_from_script(
                t["script"], t["profile"], dur, gen_ass
            )
            if caption_path:
                print(f"  Generated captions from script ({os.path.basename(caption_path)})")

        try:
            compose_video(
                avatar_path=t["avatar"],
                slides_dir=t["slides"],
                caption_path=caption_path,
                output_path=t["output"],
                fps=args.fps,
            )
            done += 1
        except Exception as e:
            print(f"  FAILED: {e}")
            failed += 1

    print(f"\n{'=' * 60}")
    print(f"  Composed: {done} | Failed: {failed} | Skipped: {len(tasks) - done - failed}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
