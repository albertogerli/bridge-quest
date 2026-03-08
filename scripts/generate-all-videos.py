#!/usr/bin/env python3
"""
BridgeQuest - HeyGen Multi-Profile Video Generator (Python)
Generates lesson videos for all 4 courses x 4 profiles from markdown scripts.
Two-pass: submit all, then download all.

Usage:
  python generate-all-videos.py                          # Generate all
  python generate-all-videos.py --profile junior         # Only junior profile
  python generate-all-videos.py --course fiori           # Only fiori course
  python generate-all-videos.py --course quadri --profile senior
  python generate-all-videos.py --dry-run                # List only, no API calls
  python generate-all-videos.py --no-skip-existing       # Re-generate even if file exists
"""

import argparse
import json
import os
import re
import ssl
import sys
import time
import urllib.request

# ===== CONFIGURATION =====

API_KEY = os.environ.get("HEYGEN_API_KEY", "")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(SCRIPT_DIR, "video-scripts")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "public", "videos")
STATE_FILE = os.path.join(SCRIPT_DIR, "video-jobs.json")

# SSL context for macOS compatibility
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Pause marker inserted between concatenated parts
PART_PAUSE = "\n\n"

# ===== PROFILES =====

PROFILES = {
    "junior": {
        "avatar_id": "8734f8e7c55647498a62a88d6810f2ea",   # Alberto custom
        "voice_id": "915ddcfeebea4e86a94d48a6e142fb8a",     # Alberto voice clone
    },
    "giovane": {
        "avatar_id": "Georgia_expressive_2024112701",
        "voice_id": "fb6ff83d7319492394ab3af233cca8e3",     # Elsa - Cheerful (Italian)
    },
    "adulto": {
        "avatar_id": "Judith_expressive_2024120201",
        "voice_id": "750533f27c5649979110086898518280",     # Gabriella - Natural (Italian)
    },
    "senior": {
        "avatar_id": "Marcus_expressive_2024120201",
        "voice_id": "93129ad473ea49dd8dd69da0f4fa8fd6",     # Benigno - Natural (Italian)
    },
}

# Profile header patterns in markdown files
PROFILE_HEADERS = {
    "junior": "## JUNIOR",
    "giovane": "## GIOVANE",
    "adulto": "## ADULTO",
    "senior": "## SENIOR",
}

# ===== COURSES =====

COURSES = {
    "fiori": {
        "dir": "fiori",
        "files": [f"lezione-{i:02d}.md" for i in range(0, 13)],
    },
    "quadri": {
        "dir": "quadri",
        "files": [f"lezione-{i:02d}.md" for i in range(1, 13)],
    },
    "cuori-gioco": {
        "dir": "cuori-gioco",
        "files": [f"lezione-{i}.md" for i in range(100, 110)],
    },
    "cuori-licita": {
        "dir": "cuori-licita",
        "files": [f"lezione-{i}.md" for i in range(200, 214)],
    },
}


# ===== MARKDOWN PARSER =====

def parse_markdown_profiles(filepath):
    """
    Parse a markdown lesson file and extract scripts per profile.

    Returns a dict: { "junior": "full text...", "giovane": "full text...", ... }
    Each profile's text is the concatenation of all its parts (Parte 1 + Parte 2 + Parte 3).
    """
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    profiles = {}

    # Find all profile sections using ## PROFILE_NAME headers
    profile_keys = list(PROFILE_HEADERS.keys())
    profile_positions = []

    for key in profile_keys:
        header = PROFILE_HEADERS[key]
        # Match the header line (case-insensitive, e.g. "## JUNIOR (8-17 anni)")
        pattern = re.compile(r"^" + re.escape(header) + r"\b.*$", re.MULTILINE | re.IGNORECASE)
        match = pattern.search(content)
        if match:
            profile_positions.append((match.start(), key))

    # Sort by position in file
    profile_positions.sort(key=lambda x: x[0])

    # Extract each profile section
    for i, (start_pos, key) in enumerate(profile_positions):
        # Section ends at the next profile header or end of file
        if i + 1 < len(profile_positions):
            end_pos = profile_positions[i + 1][0]
        else:
            end_pos = len(content)

        section = content[start_pos:end_pos]

        # Extract parts (### Parte 1, ### Parte 2, ### Parte 3)
        parts = []
        part_pattern = re.compile(r"^### Parte \d+\s*$", re.MULTILINE)
        part_matches = list(part_pattern.finditer(section))

        if part_matches:
            for j, pm in enumerate(part_matches):
                part_start = pm.end()
                if j + 1 < len(part_matches):
                    part_end = part_matches[j + 1].start()
                else:
                    part_end = len(section)
                part_text = section[part_start:part_end].strip()
                if part_text:
                    parts.append(part_text)
        else:
            # No parts found - use the whole section after the header line
            lines = section.split("\n", 1)
            if len(lines) > 1:
                text = lines[1].strip()
                if text:
                    parts.append(text)

        if parts:
            profiles[key] = PART_PAUSE.join(parts)

    return profiles


def extract_lesson_number(filename):
    """
    Extract the lesson number string from a filename.
    lezione-01.md -> 01
    lezione-100.md -> 100
    """
    match = re.search(r"lezione-(\d+)\.md$", filename)
    if match:
        return match.group(1)
    return None


def build_output_filename(course, lesson_num, profile):
    """
    Build output filename: maestro-{course}-lezione{N}-{profile}.mp4
    """
    return f"maestro-{course}-lezione{lesson_num}-{profile}.mp4"


# ===== VIDEO DISCOVERY =====

def discover_videos(course_filter=None, profile_filter=None):
    """
    Discover all videos to generate by reading markdown script files.

    Returns a list of dicts:
    [
        {
            "filename": "maestro-fiori-lezione01-junior.mp4",
            "course": "fiori",
            "lesson_num": "01",
            "profile": "junior",
            "script_text": "...",
            "avatar_id": "...",
            "voice_id": "...",
            "source_file": "scripts/video-scripts/fiori/lezione-01.md",
        },
        ...
    ]
    """
    videos = []
    courses_to_process = COURSES.keys() if course_filter is None else [course_filter]

    for course in courses_to_process:
        if course not in COURSES:
            print(f"  WARNING: Unknown course '{course}', skipping.")
            continue

        course_cfg = COURSES[course]
        course_dir = os.path.join(SCRIPTS_DIR, course_cfg["dir"])

        if not os.path.isdir(course_dir):
            print(f"  WARNING: Scripts directory not found: {course_dir}")
            continue

        for md_file in sorted(course_cfg["files"]):
            filepath = os.path.join(course_dir, md_file)
            if not os.path.isfile(filepath):
                print(f"  WARNING: Script file not found: {filepath}")
                continue

            lesson_num = extract_lesson_number(md_file)
            if lesson_num is None:
                print(f"  WARNING: Cannot parse lesson number from: {md_file}")
                continue

            # Parse all profiles from this file
            try:
                file_profiles = parse_markdown_profiles(filepath)
            except Exception as e:
                print(f"  ERROR parsing {filepath}: {e}")
                continue

            profiles_to_process = PROFILES.keys() if profile_filter is None else [profile_filter]

            for profile in profiles_to_process:
                if profile not in PROFILES:
                    print(f"  WARNING: Unknown profile '{profile}', skipping.")
                    continue

                if profile not in file_profiles:
                    print(f"  WARNING: Profile '{profile}' not found in {md_file}")
                    continue

                script_text = file_profiles[profile]
                if not script_text.strip():
                    print(f"  WARNING: Empty script for {profile} in {md_file}")
                    continue

                prof_cfg = PROFILES[profile]
                output_name = build_output_filename(course, lesson_num, profile)

                videos.append({
                    "filename": output_name,
                    "course": course,
                    "lesson_num": lesson_num,
                    "profile": profile,
                    "script_text": script_text,
                    "avatar_id": prof_cfg["avatar_id"],
                    "voice_id": prof_cfg["voice_id"],
                    "source_file": filepath,
                })

    return videos


# ===== API FUNCTIONS =====

def api_request(url, data=None):
    """Make an API request to HeyGen."""
    headers = {"X-Api-Key": API_KEY}
    if data:
        headers["Content-Type"] = "application/json"
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode(),
            headers=headers,
            method="POST",
        )
    else:
        req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
        return json.loads(resp.read().decode())


MAX_CHARS_PER_SCENE = 4500  # HeyGen limit per input_text


def split_into_scenes(script_text):
    """Split script text into chunks that fit HeyGen's character limit."""
    if len(script_text) <= MAX_CHARS_PER_SCENE:
        return [script_text]

    # Split on double newlines (part boundaries from concatenation)
    parts = [p.strip() for p in script_text.split("\n\n") if p.strip()]

    # Re-merge parts that are small enough together
    scenes = []
    current = ""
    for part in parts:
        if current and len(current) + len(part) + 2 > MAX_CHARS_PER_SCENE:
            scenes.append(current)
            current = part
        else:
            current = (current + "\n\n" + part).strip() if current else part

    if current:
        scenes.append(current)

    # Final safety: split any scene still too long at sentence boundaries
    final = []
    for scene in scenes:
        if len(scene) <= MAX_CHARS_PER_SCENE:
            final.append(scene)
        else:
            # Split at sentence boundaries (period + space)
            words = scene.split(". ")
            chunk = ""
            for w in words:
                test = (chunk + ". " + w) if chunk else w
                if len(test) > MAX_CHARS_PER_SCENE and chunk:
                    final.append(chunk + ".")
                    chunk = w
                else:
                    chunk = test
            if chunk:
                final.append(chunk)

    return final


def submit_video(script_text, avatar_id, voice_id):
    """Submit a video generation request to HeyGen.
    Splits long scripts into multiple scenes (video_inputs)."""
    scenes = split_into_scenes(script_text)

    video_inputs = []
    for scene_text in scenes:
        video_inputs.append({
            "character": {
                "type": "avatar",
                "avatar_id": avatar_id,
                "avatar_style": "normal",
            },
            "voice": {
                "type": "text",
                "input_text": scene_text,
                "voice_id": voice_id,
                "speed": 1.0,
            },
            "background": {"type": "color", "value": "#f0fdf4"},
        })

    payload = {
        "video_inputs": video_inputs,
        "dimension": {"width": 1280, "height": 720},
    }
    result = api_request("https://api.heygen.com/v2/video/generate", payload)
    return result.get("data", {}).get("video_id")


def check_status(video_id):
    """Check the status of a video generation job."""
    result = api_request(
        f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"
    )
    data = result.get("data", {})
    return data.get("status", "unknown"), data.get("video_url")


def download(url, filepath):
    """Download a video file from a URL."""
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
        data = resp.read()
        with open(filepath, "wb") as f:
            f.write(data)
        return len(data)


# ===== STATE MANAGEMENT =====

def load_state():
    """Load the state file tracking submitted/completed jobs."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {}


def save_state(state):
    """Save the state file."""
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


# ===== MAIN =====

def main():
    parser = argparse.ArgumentParser(
        description="BridgeQuest - HeyGen Multi-Profile Video Generator"
    )
    parser.add_argument(
        "--profile",
        choices=list(PROFILES.keys()),
        default=None,
        help="Generate only for a specific profile (default: all)",
    )
    parser.add_argument(
        "--course",
        choices=list(COURSES.keys()),
        default=None,
        help="Generate only for a specific course (default: all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List what would be generated without calling the API",
    )
    parser.add_argument(
        "--no-skip-existing",
        action="store_true",
        help="Re-generate even if the output file already exists",
    )
    args = parser.parse_args()

    skip_existing = not args.no_skip_existing

    # Discover all videos to generate
    print(f"\nDiscovering video scripts...")
    videos = discover_videos(
        course_filter=args.course,
        profile_filter=args.profile,
    )

    if not videos:
        print("No videos found to generate. Check your --course and --profile filters.")
        sys.exit(1)

    # Group summary
    by_course = {}
    by_profile = {}
    for v in videos:
        by_course[v["course"]] = by_course.get(v["course"], 0) + 1
        by_profile[v["profile"]] = by_profile.get(v["profile"], 0) + 1

    print(f"\n{'='*60}")
    print(f"  BridgeQuest Multi-Profile Video Generator")
    print(f"  {len(videos)} videos to process")
    print(f"{'='*60}")
    print(f"\n  By course:")
    for c, n in sorted(by_course.items()):
        print(f"    {c}: {n} videos")
    print(f"\n  By profile:")
    for p, n in sorted(by_profile.items()):
        print(f"    {p}: {n} videos")
    print()

    # Dry run mode
    if args.dry_run:
        print("DRY RUN - Listing all videos that would be generated:\n")
        for i, v in enumerate(videos, 1):
            filepath = os.path.join(OUTPUT_DIR, v["filename"])
            exists = os.path.exists(filepath)
            status = "EXISTS" if exists else "NEW"
            skip = "(SKIP)" if exists and skip_existing else ""
            chars = len(v["script_text"])
            print(
                f"  {i:3d}. [{status}] {v['filename']} "
                f"({chars:,} chars, avatar={v['avatar_id'][:12]}...) {skip}"
            )
        print(f"\n  Total: {len(videos)} videos")
        would_generate = sum(
            1 for v in videos
            if not (skip_existing and os.path.exists(os.path.join(OUTPUT_DIR, v["filename"])))
        )
        print(f"  Would generate: {would_generate} videos")
        print(f"  Would skip: {len(videos) - would_generate} videos")
        return

    # Validate API key
    if not API_KEY:
        print("ERROR: Set HEYGEN_API_KEY environment variable")
        sys.exit(1)

    # Check for TODO placeholders in avatar/voice IDs
    todo_profiles = set()
    for v in videos:
        if "TODO" in v["avatar_id"] or "TODO" in v["voice_id"]:
            todo_profiles.add(v["profile"])
    if todo_profiles:
        print(f"WARNING: The following profiles have TODO avatar/voice IDs: {', '.join(sorted(todo_profiles))}")
        print("Videos for these profiles will fail. Update PROFILES config first.")
        resp = input("Continue anyway? (y/N): ").strip().lower()
        if resp != "y":
            print("Aborted.")
            sys.exit(0)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    state = load_state()

    # Phase 1: Submit all videos that haven't been submitted yet
    print("PHASE 1: Submitting videos...\n")
    submitted_count = 0
    skipped_count = 0

    for v in videos:
        filename = v["filename"]
        filepath = os.path.join(OUTPUT_DIR, filename)

        if skip_existing and os.path.exists(filepath):
            print(f"  SKIP {filename} (already downloaded)")
            skipped_count += 1
            continue

        if filename in state and state[filename].get("video_id"):
            print(f"  SKIP {filename} (already submitted: {state[filename]['video_id']})")
            skipped_count += 1
            continue

        try:
            video_id = submit_video(
                v["script_text"],
                v["avatar_id"],
                v["voice_id"],
            )
            state[filename] = {
                "video_id": video_id,
                "status": "submitted",
                "course": v["course"],
                "profile": v["profile"],
                "lesson": v["lesson_num"],
            }
            save_state(state)
            submitted_count += 1
            print(f"  OK   {filename} -> {video_id}")
            time.sleep(1)  # Rate limit
        except Exception as e:
            print(f"  FAIL {filename}: {e}")
            state[filename] = {
                "status": "submit_error",
                "error": str(e),
                "course": v["course"],
                "profile": v["profile"],
                "lesson": v["lesson_num"],
            }
            save_state(state)
            time.sleep(3)

    print(f"\n  Submitted: {submitted_count} | Skipped: {skipped_count}")

    # Phase 2: Poll and download
    print("\nPHASE 2: Downloading videos...\n")
    pending = {
        fn: s
        for fn, s in state.items()
        if s.get("video_id") and s.get("status") not in ("done", "failed", "submit_error")
    }

    if not pending:
        print("  No pending downloads.")
    else:
        max_rounds = 600  # ~5 hours max (30s per round)
        round_num = 0

        while pending and round_num < max_rounds:
            round_num += 1
            for filename in list(pending.keys()):
                filepath = os.path.join(OUTPUT_DIR, filename)
                if os.path.exists(filepath):
                    state[filename]["status"] = "done"
                    del pending[filename]
                    continue

                vid = state[filename]["video_id"]
                try:
                    status, url = check_status(vid)
                    if status == "completed" and url:
                        size = download(url, filepath)
                        state[filename]["status"] = "done"
                        save_state(state)
                        del pending[filename]
                        print(f"  DONE {filename} ({size // 1024}KB)")
                    elif status == "failed":
                        print(f"  FAILED {filename}")
                        state[filename]["status"] = "failed"
                        del pending[filename]
                    else:
                        state[filename]["status"] = status
                except Exception as e:
                    print(f"  ERR  {filename}: {e}")

            if pending:
                remaining = len(pending)
                print(
                    f"  ... {remaining} remaining, waiting 30s (round {round_num}/{max_rounds})..."
                )
                save_state(state)
                time.sleep(30)

    save_state(state)

    # Summary
    done = sum(1 for s in state.values() if s.get("status") == "done")
    failed = sum(1 for s in state.values() if s.get("status") == "failed")
    submit_errors = sum(1 for s in state.values() if s.get("status") == "submit_error")
    total_files = len(
        [f for f in os.listdir(OUTPUT_DIR) if f.startswith("maestro-") and f.endswith(".mp4")]
    ) if os.path.isdir(OUTPUT_DIR) else 0

    print(f"\n{'='*60}")
    print(f"  DONE: {done} | FAILED: {failed} | ERRORS: {submit_errors} | FILES: {total_files}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
