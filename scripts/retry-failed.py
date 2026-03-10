#!/usr/bin/env python3 -u
"""
Retry failed HeyGen videos one at a time with green screen background.
Submits one video, waits for completion, downloads, then moves to next.

Usage:
  python3 retry-failed.py                    # Retry all failed
  python3 retry-failed.py --profile giovane  # Only giovane
  python3 retry-failed.py --dry-run          # Just show what would be retried
  python3 retry-failed.py --limit 5          # Only first 5
"""
import os, sys, json, re, ssl, time, argparse, urllib.request

sys.stdout.reconfigure(line_buffering=True)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(SCRIPT_DIR, "video-scripts")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "public", "videos")
STATE_FILE = os.path.join(SCRIPT_DIR, "video-jobs.json")

# Load API key from .env.local
env_file = os.path.join(SCRIPT_DIR, "..", ".env.local")
API_KEY = ""
if os.path.exists(env_file):
    with open(env_file) as f:
        for line in f:
            if line.startswith("HEYGEN_API_KEY="):
                API_KEY = line.split("=", 1)[1].strip().strip('"')
if not API_KEY:
    API_KEY = os.environ.get("HEYGEN_API_KEY", "")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

PROFILES = {
    "junior": {
        "avatar_id": "8734f8e7c55647498a62a88d6810f2ea",
        "voice_id": "915ddcfeebea4e86a94d48a6e142fb8a",
    },
    "giovane": {
        "avatar_id": "Georgia_expressive_2024112701",
        "voice_id": "fb6ff83d7319492394ab3af233cca8e3",
    },
    "adulto": {
        "avatar_id": "Judith_expressive_2024120201",
        "voice_id": "750533f27c5649979110086898518280",
    },
    "senior": {
        "avatar_id": "Marcus_expressive_2024120201",
        "voice_id": "93129ad473ea49dd8dd69da0f4fa8fd6",
    },
}

PROFILE_HEADERS = {
    "junior": "## JUNIOR", "giovane": "## GIOVANE",
    "adulto": "## ADULTO", "senior": "## SENIOR",
}

COURSES = {
    "fiori": {"dir": "fiori", "files": {f"{i:02d}": f"lezione-{i:02d}.md" for i in range(0, 13)}},
    "quadri": {"dir": "quadri", "files": {f"{i:02d}": f"lezione-{i:02d}.md" for i in range(1, 13)}},
    "cuori-gioco": {"dir": "cuori-gioco", "files": {str(i): f"lezione-{i}.md" for i in range(100, 110)}},
    "cuori-licita": {"dir": "cuori-licita", "files": {str(i): f"lezione-{i}.md" for i in range(200, 214)}},
}

MAX_CHARS = 4500


def parse_profile_text(filepath, profile):
    with open(filepath, "r") as f:
        content = f.read()
    header = PROFILE_HEADERS[profile]
    pattern = re.compile(r"^" + re.escape(header) + r"\b.*$", re.MULTILINE | re.IGNORECASE)
    match = pattern.search(content)
    if not match:
        return None
    start = match.start()
    # Find next profile header
    next_headers = [re.compile(r"^" + re.escape(h) + r"\b", re.MULTILINE | re.IGNORECASE)
                    for k, h in PROFILE_HEADERS.items() if k != profile]
    end = len(content)
    for nh in next_headers:
        m = nh.search(content, start + 1)
        if m and m.start() < end and m.start() > start:
            end = m.start()
    section = content[start:end]
    parts = []
    part_pat = re.compile(r"^### Parte \d+\s*$", re.MULTILINE)
    part_matches = list(part_pat.finditer(section))
    if part_matches:
        for j, pm in enumerate(part_matches):
            ps = pm.end()
            pe = part_matches[j+1].start() if j+1 < len(part_matches) else len(section)
            t = section[ps:pe].strip()
            if t:
                parts.append(t)
    else:
        lines = section.split("\n", 1)
        if len(lines) > 1 and lines[1].strip():
            parts.append(lines[1].strip())
    return "\n\n".join(parts) if parts else None


def split_scenes(text):
    if len(text) <= MAX_CHARS:
        return [text]
    parts = [p.strip() for p in text.split("\n\n") if p.strip()]
    scenes, cur = [], ""
    for p in parts:
        if cur and len(cur) + len(p) + 2 > MAX_CHARS:
            scenes.append(cur)
            cur = p
        else:
            cur = (cur + "\n\n" + p).strip() if cur else p
    if cur:
        scenes.append(cur)
    final = []
    for s in scenes:
        if len(s) <= MAX_CHARS:
            final.append(s)
        else:
            words = s.split(". ")
            chunk = ""
            for w in words:
                test = (chunk + ". " + w) if chunk else w
                if len(test) > MAX_CHARS and chunk:
                    final.append(chunk + ".")
                    chunk = w
                else:
                    chunk = test
            if chunk:
                final.append(chunk)
    return final


def api_request(url, data=None):
    headers = {"X-Api-Key": API_KEY}
    if data:
        headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method="POST")
    else:
        req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
        return json.loads(resp.read().decode())


def submit_one(script_text, avatar_id, voice_id):
    scenes = split_scenes(script_text)
    video_inputs = []
    for st in scenes:
        video_inputs.append({
            "character": {"type": "avatar", "avatar_id": avatar_id, "avatar_style": "normal"},
            "voice": {"type": "text", "input_text": st, "voice_id": voice_id, "speed": 1.0},
            "background": {"type": "color", "value": "#00FF00"},  # GREEN SCREEN
        })
    payload = {"video_inputs": video_inputs, "dimension": {"width": 1280, "height": 720}}
    result = api_request("https://api.heygen.com/v2/video/generate", payload)
    return result.get("data", {}).get("video_id")


def wait_and_download(video_id, filepath, max_wait=1200):
    """Poll until done, then download. Max 20 min wait."""
    start = time.time()
    while time.time() - start < max_wait:
        try:
            result = api_request(f"https://api.heygen.com/v1/video_status.get?video_id={video_id}")
            data = result.get("data", {})
            status = data.get("status", "unknown")
            if status == "completed" and data.get("video_url"):
                # Download
                req = urllib.request.Request(data["video_url"])
                with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
                    content = resp.read()
                    with open(filepath, "wb") as f:
                        f.write(content)
                return "done", len(content)
            elif status == "failed":
                err = data.get("error", {})
                err_code = err.get("code", "unknown") if isinstance(err, dict) else str(err)
                err_msg = err.get("message", "") if isinstance(err, dict) else ""
                print(f"    HEYGEN ERROR: {err_code} — {err_msg}", flush=True)
                return f"failed ({err_code})", 0
            else:
                elapsed = int(time.time() - start)
                print(f"    status={status}, {elapsed}s elapsed...", flush=True)
        except Exception as e:
            print(f"    poll error: {e}")
        time.sleep(30)
    return "timeout", 0


def get_script_for_video(filename):
    """Get the script text for a video filename like maestro-fiori-lezione01-giovane.mp4"""
    m = re.match(r"maestro-(.+)-lezione(\d+)-(\w+)\.mp4", filename)
    if not m:
        return None, None, None
    course, lesson_num, profile = m.group(1), m.group(2), m.group(3)
    if course not in COURSES or profile not in PROFILES:
        return None, None, None
    md_file = COURSES[course]["files"].get(lesson_num)
    if not md_file:
        return None, None, None
    filepath = os.path.join(SCRIPTS_DIR, COURSES[course]["dir"], md_file)
    if not os.path.exists(filepath):
        return None, None, None
    text = parse_profile_text(filepath, profile)
    return text, PROFILES[profile]["avatar_id"], PROFILES[profile]["voice_id"]


def main():
    parser = argparse.ArgumentParser(description="Retry failed HeyGen videos one at a time")
    parser.add_argument("--profile", choices=list(PROFILES.keys()))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0, help="Max videos to retry")
    args = parser.parse_args()

    with open(STATE_FILE) as f:
        state = json.load(f)

    failed = [(k, v) for k, v in sorted(state.items()) if v.get("status") == "failed"]
    if args.profile:
        failed = [(k, v) for k, v in failed if args.profile in k]

    if not failed:
        print("No failed videos to retry!")
        return

    if args.limit > 0:
        failed = failed[:args.limit]

    print(f"{'='*60}")
    print(f"  Retry Failed Videos (Green Screen)")
    print(f"  {len(failed)} videos to retry")
    print(f"{'='*60}\n")

    if args.dry_run:
        for i, (fn, _) in enumerate(failed, 1):
            print(f"  {i}. {fn}")
        return

    if not API_KEY:
        print("ERROR: No HEYGEN_API_KEY found in .env.local or environment")
        sys.exit(1)

    # Check remaining credits before starting
    try:
        credit_info = api_request("https://api.heygen.com/v1/video/remaining_quota")
        remaining = credit_info.get("data", {}).get("remaining_quota", "?")
        print(f"  HeyGen credits remaining: {remaining}")
        if isinstance(remaining, (int, float)) and remaining < 5:
            print(f"\n  WARNING: Only {remaining} credits left!")
            print(f"  Need ~{len(failed) * 4} credits for {len(failed)} videos.")
            print(f"  Recharge credits at https://app.heygen.com/settings/billing")
            confirm = input("  Continue anyway? (y/N): ").strip().lower()
            if confirm != "y":
                print("  Aborted.")
                return
    except Exception as e:
        print(f"  Could not check credits: {e}")

    done_count = 0
    fail_count = 0

    for i, (filename, old_state) in enumerate(failed, 1):
        filepath = os.path.join(OUTPUT_DIR, filename)
        print(f"[{i}/{len(failed)}] {filename}")

        # Get script text
        text, avatar_id, voice_id = get_script_for_video(filename)
        if not text:
            print(f"  SKIP: cannot find script for {filename}")
            fail_count += 1
            continue

        chars = len(text)
        scenes = len(split_scenes(text))
        print(f"  {chars:,} chars, {scenes} scene(s), avatar={avatar_id[:15]}...")

        # Submit
        try:
            video_id = submit_one(text, avatar_id, voice_id)
            if not video_id:
                print(f"  ERROR: no video_id returned")
                fail_count += 1
                continue
            print(f"  Submitted: {video_id}")
            state[filename] = {
                "video_id": video_id,
                "status": "submitted",
                "course": old_state.get("course", ""),
                "profile": old_state.get("profile", ""),
                "lesson": old_state.get("lesson", ""),
                "retry": True,
                "background": "green_screen",
            }
            with open(STATE_FILE, "w") as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            print(f"  SUBMIT ERROR: {e}")
            fail_count += 1
            continue

        # Wait and download
        print(f"  Waiting for completion...")
        result, size = wait_and_download(video_id, filepath)
        if result == "done":
            print(f"  DONE! {size // 1024} KB")
            state[filename]["status"] = "done"
            state[filename]["downloaded"] = True
            done_count += 1
        else:
            print(f"  FAILED: {result}")
            state[filename]["status"] = "failed"
            fail_count += 1
            if "INSUFFICIENT_CREDIT" in result:
                print(f"\n  STOPPING: No credits left. Recharge at https://app.heygen.com/settings/billing")
                with open(STATE_FILE, "w") as f:
                    json.dump(state, f, indent=2)
                break

        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)

        # Small pause between videos
        if i < len(failed):
            time.sleep(2)

    print(f"\n{'='*60}")
    print(f"  Done: {done_count} | Failed: {fail_count}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
