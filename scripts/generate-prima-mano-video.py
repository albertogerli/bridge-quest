#!/usr/bin/env python3
"""
Generate the dedicated onboarding video for "Prima Mano" via HeyGen.
Outputs: public/videos/prima-mano-intro.mp4
"""

import json
import os
import ssl
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(__file__))
SCRIPT_PATH = os.path.join(ROOT, "scripts", "video-scripts", "fiori", "prima-mano.md")
OUTPUT_PATH = os.path.join(ROOT, "public", "videos", "prima-mano-intro.mp4")

API_KEY = os.environ.get("HEYGEN_API_KEY", "")
AVATAR_ID = os.environ.get("HEYGEN_AVATAR_ID", "")
VOICE_ID = os.environ.get("HEYGEN_VOICE_ID", "")

if not API_KEY:
    raise SystemExit("Set HEYGEN_API_KEY before running this script.")
if not AVATAR_ID:
    raise SystemExit("Set HEYGEN_AVATAR_ID before running this script.")
if not VOICE_ID:
    raise SystemExit("Set HEYGEN_VOICE_ID before running this script.")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def api_request(url, payload=None):
    headers = {"X-Api-Key": API_KEY}
    if payload is not None:
        headers["Content-Type"] = "application/json"
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers=headers,
            method="POST",
        )
    else:
        request = urllib.request.Request(url, headers=headers)

    with urllib.request.urlopen(request, timeout=45, context=ctx) as response:
        return json.loads(response.read().decode())


def load_script():
    with open(SCRIPT_PATH, "r", encoding="utf-8") as handle:
        lines = [line.strip() for line in handle.readlines() if line.strip() and not line.startswith("#")]
    return " ".join(lines)


def submit_video(script_text):
    payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": AVATAR_ID,
                    "avatar_style": "normal",
                },
                "voice": {
                    "type": "text",
                    "input_text": script_text,
                    "voice_id": VOICE_ID,
                    "speed": 1.0,
                },
                "background": {
                    "type": "color",
                    "value": "#f7f1e5",
                },
            }
        ],
        "dimension": {
            "width": 1280,
            "height": 720,
        },
    }
    result = api_request("https://api.heygen.com/v2/video/generate", payload)
    video_id = result.get("data", {}).get("video_id")
    if not video_id:
        raise RuntimeError(f"HeyGen response missing video_id: {result}")
    return video_id


def get_status(video_id):
    result = api_request(f"https://api.heygen.com/v1/video_status.get?video_id={video_id}")
    data = result.get("data", {})
    return data.get("status"), data.get("video_url")


def download(url):
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    request = urllib.request.Request(url)
    with urllib.request.urlopen(request, timeout=120, context=ctx) as response:
        with open(OUTPUT_PATH, "wb") as handle:
            handle.write(response.read())


def main():
    script_text = load_script()
    print("Submitting Prima Mano video to HeyGen...")
    video_id = submit_video(script_text)
    print(f"Video job created: {video_id}")

    for attempt in range(60):
        status, url = get_status(video_id)
        print(f"[{attempt + 1}/60] status={status}")

        if status == "completed" and url:
            download(url)
            print(f"Saved video to {OUTPUT_PATH}")
            return
        if status == "failed":
            raise SystemExit("HeyGen reported a failed job.")

        time.sleep(10)

    raise SystemExit("Timed out waiting for HeyGen video generation.")


if __name__ == "__main__":
    main()
