#!/usr/bin/env python3 -u
"""
YouTube upload + site update pipeline for BridgeQuest.

Uploads composed final videos to BridgeLab YouTube channel,
then updates maestro-video.ts with the YouTube video IDs.

Usage:
  python3 youtube_upload.py                              # Upload all pending
  python3 youtube_upload.py --profile giovane             # Only giovane
  python3 youtube_upload.py --course fiori --lesson 0     # Specific lesson
  python3 youtube_upload.py --dry-run                     # Show what would be uploaded
  python3 youtube_upload.py --update-site-only            # Just update maestro-video.ts from state

First run will open browser for Google OAuth. Token saved to scripts/youtube_token.json.
"""
import os
import sys
import json
import re
import argparse
import time

sys.stdout.reconfigure(line_buffering=True)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
VIDEOS_DIR = os.path.join(BASE_DIR, "public/videos")
MAESTRO_TS = os.path.join(BASE_DIR, "src/components/maestro-video.ts")
TOKEN_FILE = os.path.join(BASE_DIR, "scripts/youtube_token.json")
STATE_FILE = os.path.join(BASE_DIR, "scripts/youtube_state.json")
CLIENT_SECRET = os.path.expanduser(
    "~/Downloads/client_secret_71202493383-mm47jfd23op9qp1et08q52odsa3dm4p7.apps.googleusercontent.com.json"
)

SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"]

COURSES = {
    "fiori": {"name": "Corso Fiori ♣", "lessons": list(range(0, 13)), "fmt": "{:02d}"},
    "quadri": {"name": "Corso Quadri ♦", "lessons": list(range(1, 13)), "fmt": "{:02d}"},
    "cuori-gioco": {"name": "Corso Cuori Gioco ♥", "lessons": list(range(100, 110)), "fmt": "{}"},
    "cuori-licita": {"name": "Corso Cuori Licita ♥", "lessons": list(range(200, 214)), "fmt": "{}"},
}

PROFILES = {
    "junior": {"label": "8-17 anni", "maestro": "Maestro Franci"},
    "giovane": {"label": "18-35 anni", "maestro": "Maestra Georgia"},
    "adulto": {"label": "36-55 anni", "maestro": "Maestra Giulia"},
    "senior": {"label": "55+ anni", "maestro": "Maestro Marco"},
}

# Lesson titles (extracted from courses.ts)
LESSON_TITLES = {
    0: "Il Bridge - Un Gioco di Prese", 1: "Le Carte Vincenti", 2: "L'Attacco e la Difesa",
    3: "Sviluppo del Gioco", 4: "Il Piano di Gioco", 5: "La Dichiarazione - Le Basi",
    6: "Risposte all'Apertura", 7: "Il Rientro del Dichiarante", 8: "La Seconda Dichiarazione",
    9: "Intervento e Competizione", 10: "Il Gioco in Difesa", 11: "Slam e Convenzioni",
    12: "Strategia Avanzata",
    100: "Introduzione al Gioco della Carta", 101: "Il Piano di Gioco a SA",
    102: "Sviluppo delle Vincenti", 103: "L'Impasse", 104: "Il Gioco in Atout",
    105: "Eliminazione e Messa in Mano", 106: "Il Conteggio", 107: "Le Comunicazioni",
    108: "Il Gioco in Difesa", 109: "Tecniche Avanzate",
    200: "Aperture e Risposte", 201: "Le Aperture Forti", 202: "Le Risposte con Fit",
    203: "Senza Fit - La Ricerca", 204: "L'Intervento", 205: "La Riapertura",
    206: "Le Convenzioni", 207: "Il Contro Informativo", 208: "Competizione e Sacrificio",
    209: "Lo Slam", 210: "La Licita Difensiva", 211: "Situazioni Speciali",
    212: "Licita Avanzata I", 213: "Licita Avanzata II",
}


def get_youtube_service():
    """Authenticate and return YouTube API service."""
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            from google.auth.transport.requests import Request
            creds.refresh(Request())
        else:
            if not os.path.exists(CLIENT_SECRET):
                print(f"ERROR: Client secret not found: {CLIENT_SECRET}")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
            creds = flow.run_local_server(port=8090)

        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
        print(f"Token saved to {TOKEN_FILE}")

    return build("youtube", "v3", credentials=creds)


def load_state():
    """Load upload state (which videos have been uploaded with their YouTube IDs)."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {}


def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def get_or_create_playlist(youtube, title, description=""):
    """Find or create a YouTube playlist."""
    # Search existing playlists
    req = youtube.playlists().list(part="snippet", mine=True, maxResults=50)
    resp = req.execute()
    for item in resp.get("items", []):
        if item["snippet"]["title"] == title:
            return item["id"]

    # Create new
    body = {
        "snippet": {"title": title, "description": description},
        "status": {"privacyStatus": "public"},
    }
    resp = youtube.playlists().insert(part="snippet,status", body=body).execute()
    print(f"  Created playlist: {title} ({resp['id']})")
    return resp["id"]


def upload_video(youtube, filepath, title, description, tags, playlist_id=None):
    """Upload a single video to YouTube."""
    from googleapiclient.http import MediaFileUpload

    body = {
        "snippet": {
            "title": title[:100],  # YouTube max 100 chars
            "description": description,
            "tags": tags,
            "categoryId": "27",  # Education
            "defaultLanguage": "it",
        },
        "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(filepath, chunksize=10 * 1024 * 1024, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            print(f"\r    Upload: {pct}%", end="", flush=True)
    print(f"\r    Upload: 100%")

    video_id = response["id"]

    # Add to playlist
    if playlist_id:
        youtube.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": playlist_id,
                    "resourceId": {"kind": "youtube#video", "videoId": video_id},
                }
            },
        ).execute()

    return video_id


def discover_videos(profiles_filter=None, courses_filter=None, lesson_filter=None):
    """Find all composed final videos ready for upload."""
    videos = []
    for course, info in COURSES.items():
        if courses_filter and course not in courses_filter:
            continue
        final_dir = os.path.join(VIDEOS_DIR, f"{course}-final")
        if not os.path.isdir(final_dir):
            continue

        for f in sorted(os.listdir(final_dir)):
            if not f.endswith(".mp4"):
                continue
            # Parse: fiori-lezione-00-giovane.mp4
            m = re.match(r"(.+)-lezione-(\d+)-(\w+)\.mp4", f)
            if not m:
                continue
            c, lesson_str, profile = m.group(1), m.group(2), m.group(3)
            lesson_id = int(lesson_str)

            if profiles_filter and profile not in profiles_filter:
                continue
            if lesson_filter is not None and lesson_id != lesson_filter:
                continue
            if profile not in PROFILES:
                continue

            videos.append({
                "course": course,
                "lesson_id": lesson_id,
                "profile": profile,
                "filepath": os.path.join(final_dir, f),
                "filename": f,
            })
    return videos


def make_title(course, lesson_id, profile):
    course_name = COURSES[course]["name"]
    lesson_title = LESSON_TITLES.get(lesson_id, f"Lezione {lesson_id}")
    profile_label = PROFILES[profile]["label"]
    # e.g. "Corso Fiori ♣ - Lezione 0: Il Bridge (8-17 anni)"
    return f"{course_name} - Lezione {lesson_id}: {lesson_title} ({profile_label})"


def make_description(course, lesson_id, profile):
    maestro = PROFILES[profile]["maestro"]
    lesson_title = LESSON_TITLES.get(lesson_id, f"Lezione {lesson_id}")
    return (
        f"{lesson_title}\n\n"
        f"Con {maestro} - profilo {PROFILES[profile]['label']}\n\n"
        f"BridgeLab - La piattaforma gratuita per imparare il Bridge\n"
        f"Basata sulle dispense ufficiali della Federazione Italiana Gioco Bridge (FIGB)\n\n"
        f"Prova gratis: https://bridgelab.it\n\n"
        f"#Bridge #FIGB #BridgeLab #ImparaIlBridge"
    )


def update_maestro_video_ts(state):
    """Update maestro-video.ts with YouTube video IDs from upload state."""
    if not os.path.exists(MAESTRO_TS):
        print(f"ERROR: {MAESTRO_TS} not found")
        return

    with open(MAESTRO_TS, "r") as f:
        content = f.read()

    # Build per-profile maps from state
    updates = {}  # profile -> course -> lesson_id -> youtube_id
    for key, info in state.items():
        yt_id = info.get("youtube_id")
        if not yt_id:
            continue
        parts = key.split("/")
        if len(parts) != 3:
            continue
        course, lesson_str, profile = parts
        lesson_id = int(lesson_str)
        if profile not in updates:
            updates[profile] = {}
        if course not in updates[profile]:
            updates[profile][course] = {}
        updates[profile][course][lesson_id] = yt_id

    if not updates:
        print("No YouTube IDs to update")
        return

    # Write a JSON summary that can be imported
    summary_path = os.path.join(BASE_DIR, "scripts/youtube_ids.json")
    with open(summary_path, "w") as f:
        json.dump(updates, f, indent=2)
    print(f"YouTube IDs saved to {summary_path}")
    print(f"Update maestro-video.ts manually or run with --update-site-only")


def main():
    parser = argparse.ArgumentParser(description="Upload BridgeQuest videos to YouTube")
    parser.add_argument("--profile", choices=list(PROFILES.keys()), help="Only this profile")
    parser.add_argument("--course", choices=list(COURSES.keys()), help="Only this course")
    parser.add_argument("--lesson", type=int, help="Only this lesson ID")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be uploaded")
    parser.add_argument("--update-site-only", action="store_true", help="Just update maestro-video.ts")
    args = parser.parse_args()

    state = load_state()

    if args.update_site_only:
        update_maestro_video_ts(state)
        return

    profiles_filter = [args.profile] if args.profile else None
    courses_filter = [args.course] if args.course else None
    videos = discover_videos(profiles_filter, courses_filter, args.lesson)

    # Filter out already uploaded
    pending = []
    for v in videos:
        key = f"{v['course']}/{v['lesson_id']}/{v['profile']}"
        if key in state and state[key].get("youtube_id"):
            continue
        pending.append(v)

    if not pending:
        print("No new videos to upload.")
        if videos:
            print(f"({len(videos)} already uploaded)")
        update_maestro_video_ts(state)
        return

    print("=" * 60)
    print(f"  BridgeLab YouTube Uploader")
    print(f"  {len(pending)} videos to upload ({len(videos) - len(pending)} already done)")
    print("=" * 60)

    by_profile = {}
    for v in pending:
        by_profile[v["profile"]] = by_profile.get(v["profile"], 0) + 1
    print(f"  By profile: {by_profile}\n")

    if args.dry_run:
        for v in pending:
            title = make_title(v["course"], v["lesson_id"], v["profile"])
            size_mb = os.path.getsize(v["filepath"]) / 1024 / 1024
            print(f"  WOULD UPLOAD: {v['filename']} ({size_mb:.0f} MB)")
            print(f"    Title: {title}")
        return

    # Authenticate
    print("Authenticating with YouTube...")
    youtube = get_youtube_service()
    print("Authenticated!\n")

    # Create/find playlists
    playlists = {}
    for v in pending:
        pl_key = f"{v['course']}-{v['profile']}"
        if pl_key not in playlists:
            course_name = COURSES[v["course"]]["name"]
            profile_label = PROFILES[v["profile"]]["label"]
            pl_title = f"BridgeLab - {course_name} ({profile_label})"
            playlists[pl_key] = get_or_create_playlist(youtube, pl_title,
                f"Lezioni di Bridge - {course_name} per profilo {profile_label}")

    uploaded = 0
    failed = 0
    for i, v in enumerate(pending):
        title = make_title(v["course"], v["lesson_id"], v["profile"])
        desc = make_description(v["course"], v["lesson_id"], v["profile"])
        tags = ["bridge", "FIGB", "BridgeLab", "carte", "gioco",
                COURSES[v["course"]]["name"], PROFILES[v["profile"]]["label"]]
        pl_key = f"{v['course']}-{v['profile']}"
        playlist_id = playlists.get(pl_key)

        size_mb = os.path.getsize(v["filepath"]) / 1024 / 1024
        print(f"[{i+1}/{len(pending)}] {v['filename']} ({size_mb:.0f} MB)")
        print(f"  Title: {title}")

        try:
            yt_id = upload_video(youtube, v["filepath"], title, desc, tags, playlist_id)
            key = f"{v['course']}/{v['lesson_id']}/{v['profile']}"
            state[key] = {
                "youtube_id": yt_id,
                "filename": v["filename"],
                "title": title,
                "uploaded_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            }
            save_state(state)
            print(f"  OK: https://youtube.com/watch?v={yt_id}")
            uploaded += 1

            # Respect rate limits
            if i < len(pending) - 1:
                time.sleep(2)

        except Exception as e:
            print(f"  FAILED: {e}")
            failed += 1
            if "uploadLimitExceeded" in str(e):
                print(f"\n  DAILY LIMIT REACHED — {uploaded} uploaded today.")
                print(f"  Run again tomorrow to continue.")
                break

    print(f"\n{'=' * 60}")
    print(f"  Uploaded: {uploaded} | Failed: {failed}")
    print(f"{'=' * 60}")

    # Update site
    if uploaded > 0:
        update_maestro_video_ts(state)


if __name__ == "__main__":
    main()
