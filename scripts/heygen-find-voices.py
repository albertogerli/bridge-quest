#!/usr/bin/env python3
"""
BridgeQuest - HeyGen Voice & Avatar Finder
Lists all Italian voices and stock avatars from HeyGen API.
Suggests pairings for the 4 BridgeQuest profiles:
  - Junior (8-17): custom avatar + custom voice (already set)
  - Giovane (18-35): Female avatar + Female Italian voice
  - Adulto (36-55): Male or Female avatar + matching Italian voice
  - Senior (55+): Male avatar + Male Italian voice
"""

import json
import os
import ssl
import sys
import urllib.request

# ===== CONFIG =====
API_KEY = os.environ.get("HEYGEN_API_KEY", "")
if not API_KEY:
    print("ERROR: Set HEYGEN_API_KEY environment variable")
    print("  export HEYGEN_API_KEY='your-api-key-here'")
    sys.exit(1)

# SSL workaround for macOS
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

CUSTOM_AVATAR_ID = "8734f8e7c55647498a62a88d6810f2ea"
CUSTOM_VOICE_ID = "915ddcfeebea4e86a94d48a6e142fb8a"


def api_get(url):
    """Make a GET request to the HeyGen API."""
    req = urllib.request.Request(url, method="GET")
    req.add_header("X-Api-Key", API_KEY)
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP Error {e.code}: {e.reason}")
        print(f"Response: {body[:500]}")
        return None
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None


def fetch_all_voices():
    """Fetch all voices from HeyGen API."""
    print("=" * 70)
    print("  FETCHING VOICES FROM HEYGEN API")
    print("=" * 70)

    url = "https://api.heygen.com/v2/voices"
    data = api_get(url)
    if not data:
        print("Failed to fetch voices.")
        return []

    voices = data.get("data", {}).get("voices", [])
    print(f"Total voices found: {len(voices)}")
    return voices


def fetch_all_avatars():
    """Fetch all avatars from HeyGen API."""
    print()
    print("=" * 70)
    print("  FETCHING AVATARS FROM HEYGEN API")
    print("=" * 70)

    url = "https://api.heygen.com/v2/avatars"
    data = api_get(url)
    if not data:
        print("Failed to fetch avatars.")
        return []

    avatars = data.get("data", {}).get("avatars", [])
    print(f"Total avatars found: {len(avatars)}")
    return avatars


def filter_italian_voices(voices):
    """Filter voices to only Italian language."""
    italian_voices = []
    for v in voices:
        lang = v.get("language", "").lower()
        # Check for Italian language codes/names
        if "italian" in lang or "italiano" in lang or lang.startswith("it"):
            italian_voices.append(v)
    return italian_voices


def classify_avatar_age(avatar):
    """Try to classify avatar age group from name/metadata."""
    name = (avatar.get("avatar_name", "") or avatar.get("name", "")).lower()
    # Keywords that might hint at age
    young_keywords = ["young", "junior", "teen", "student", "casual"]
    senior_keywords = ["senior", "elder", "mature", "old", "professor", "doctor"]
    # Default to adult
    if any(k in name for k in young_keywords):
        return "giovane"
    elif any(k in name for k in senior_keywords):
        return "senior"
    return "adulto"


def filter_european_avatars(avatars):
    """
    Try to filter avatars that could look European/Italian.
    Since API metadata is limited, we return all talking-photo and
    non-Asian-named avatars as candidates.
    """
    candidates = []
    # Names that typically indicate non-European ethnicity
    non_european_hints = [
        "wei", "ming", "chen", "zhang", "wang", "liu", "yang",
        "huang", "zhao", "yuki", "hana", "sakura", "kenji",
        "hiroshi", "akira", "sato", "tanaka", "kim", "park",
        "lee_korean", "ji", "hyun", "priya", "raj", "amit",
        "sunita", "deepak", "aisha", "fatima", "omar", "abdul",
    ]
    for a in avatars:
        name = (a.get("avatar_name", "") or a.get("name", "") or "").lower()
        avatar_id = a.get("avatar_id", "")

        # Skip if clearly non-European by name
        skip = False
        for hint in non_european_hints:
            if hint in name.replace(" ", "_"):
                skip = True
                break
        if skip:
            continue

        candidates.append(a)
    return candidates


def print_voices(voices, title="ITALIAN VOICES"):
    """Print voice details in formatted output."""
    print()
    print("=" * 70)
    print(f"  {title} ({len(voices)} found)")
    print("=" * 70)

    males = [v for v in voices if (v.get("gender", "") or "").lower() == "male"]
    females = [v for v in voices if (v.get("gender", "") or "").lower() == "female"]
    others = [v for v in voices if v not in males and v not in females]

    for group_name, group in [("MALE", males), ("FEMALE", females), ("OTHER", others)]:
        if not group:
            continue
        print(f"\n  --- {group_name} ({len(group)}) ---")
        for i, v in enumerate(group, 1):
            voice_id = v.get("voice_id", "N/A")
            name = v.get("name", v.get("display_name", "Unknown"))
            gender = v.get("gender", "N/A")
            language = v.get("language", "N/A")
            preview = v.get("preview_audio", v.get("sample", "N/A"))
            is_custom = voice_id == CUSTOM_VOICE_ID

            marker = " *** CUSTOM (Junior) ***" if is_custom else ""
            print(f"\n  [{i}]{marker}")
            print(f"      Name:      {name}")
            print(f"      Voice ID:  {voice_id}")
            print(f"      Gender:    {gender}")
            print(f"      Language:  {language}")
            if preview and preview != "N/A":
                print(f"      Preview:   {preview}")


def print_avatars(avatars, title="EUROPEAN/ITALIAN AVATAR CANDIDATES"):
    """Print avatar details in formatted output."""
    print()
    print("=" * 70)
    print(f"  {title} ({len(avatars)} found)")
    print("=" * 70)

    males = [a for a in avatars if (a.get("gender", "") or "").lower() == "male"]
    females = [a for a in avatars if (a.get("gender", "") or "").lower() == "female"]
    others = [a for a in avatars if a not in males and a not in females]

    for group_name, group in [("MALE", males), ("FEMALE", females), ("OTHER/UNSPECIFIED", others)]:
        if not group:
            continue
        print(f"\n  --- {group_name} ({len(group)}) ---")
        for i, a in enumerate(group, 1):
            avatar_id = a.get("avatar_id", "N/A")
            name = a.get("avatar_name", a.get("name", "Unknown"))
            gender = a.get("gender", "N/A")
            preview = a.get("preview_image_url", a.get("preview", a.get("thumbnail", "N/A")))
            is_custom = avatar_id == CUSTOM_AVATAR_ID

            marker = " *** CUSTOM (Junior) ***" if is_custom else ""
            print(f"\n  [{i}]{marker}")
            print(f"      Name:      {name}")
            print(f"      Avatar ID: {avatar_id}")
            print(f"      Gender:    {gender}")
            if preview and preview != "N/A":
                print(f"      Preview:   {preview}")


def suggest_pairings(italian_voices, european_avatars):
    """Suggest avatar+voice pairings for each profile."""
    print()
    print("=" * 70)
    print("  SUGGESTED PAIRINGS FOR BRIDGEQUEST PROFILES")
    print("=" * 70)

    # Separate by gender
    male_voices = [v for v in italian_voices if (v.get("gender", "") or "").lower() == "male"]
    female_voices = [v for v in italian_voices if (v.get("gender", "") or "").lower() == "female"]
    male_avatars = [a for a in european_avatars if (a.get("gender", "") or "").lower() == "male"]
    female_avatars = [a for a in european_avatars if (a.get("gender", "") or "").lower() == "female"]

    # ----- Junior (already configured) -----
    print(f"""
  -------------------------------------------------------
  JUNIOR (8-17) - Already configured
  -------------------------------------------------------
    Avatar:  {CUSTOM_AVATAR_ID} (Alberto Gerli custom)
    Voice:   {CUSTOM_VOICE_ID} (user voice clone)
    Tone:    "Ciao!", simple, friendly
  -------------------------------------------------------""")

    # ----- Giovane (18-35): Female avatar + Female Italian voice -----
    print(f"""
  -------------------------------------------------------
  GIOVANE (18-35) - Female avatar + Female Italian voice
  -------------------------------------------------------""")
    if female_avatars and female_voices:
        # Pick up to 3 suggestions
        for i in range(min(3, max(len(female_avatars), len(female_voices)))):
            av = female_avatars[i % len(female_avatars)]
            vo = female_voices[i % len(female_voices)]
            av_name = av.get("avatar_name", av.get("name", "Unknown"))
            vo_name = vo.get("name", vo.get("display_name", "Unknown"))
            print(f"    Option {i+1}:")
            print(f"      Avatar:  {av_name} ({av.get('avatar_id', 'N/A')})")
            print(f"      Voice:   {vo_name} ({vo.get('voice_id', 'N/A')})")
            av_preview = av.get("preview_image_url", av.get("preview", ""))
            if av_preview:
                print(f"      Preview: {av_preview}")
            print()
    else:
        print("    No female avatars or Italian female voices found.")
        print("    Check the full lists above and pick manually.")
    print("  -------------------------------------------------------")

    # ----- Adulto (36-55): Male or Female avatar + matching voice -----
    print(f"""
  -------------------------------------------------------
  ADULTO (36-55) - Male or Female + matching Italian voice
  -------------------------------------------------------""")
    suggestions_adulto = []
    # Add male options
    for i in range(min(2, len(male_avatars))):
        if i < len(male_voices):
            suggestions_adulto.append((male_avatars[i], male_voices[i]))
    # Add female option
    if female_avatars and female_voices:
        suggestions_adulto.append((female_avatars[0], female_voices[0]))

    if suggestions_adulto:
        for i, (av, vo) in enumerate(suggestions_adulto):
            av_name = av.get("avatar_name", av.get("name", "Unknown"))
            vo_name = vo.get("name", vo.get("display_name", "Unknown"))
            print(f"    Option {i+1}:")
            print(f"      Avatar:  {av_name} ({av.get('avatar_id', 'N/A')}) [{av.get('gender', '?')}]")
            print(f"      Voice:   {vo_name} ({vo.get('voice_id', 'N/A')}) [{vo.get('gender', '?')}]")
            av_preview = av.get("preview_image_url", av.get("preview", ""))
            if av_preview:
                print(f"      Preview: {av_preview}")
            print()
    else:
        print("    No suitable avatars or Italian voices found.")
        print("    Check the full lists above and pick manually.")
    print("  -------------------------------------------------------")

    # ----- Senior (55+): Male avatar + Male Italian voice -----
    print(f"""
  -------------------------------------------------------
  SENIOR (55+) - Male avatar + Male Italian voice
  -------------------------------------------------------""")
    if male_avatars and male_voices:
        for i in range(min(3, max(len(male_avatars), len(male_voices)))):
            av = male_avatars[i % len(male_avatars)]
            vo = male_voices[i % len(male_voices)]
            av_name = av.get("avatar_name", av.get("name", "Unknown"))
            vo_name = vo.get("name", vo.get("display_name", "Unknown"))
            print(f"    Option {i+1}:")
            print(f"      Avatar:  {av_name} ({av.get('avatar_id', 'N/A')})")
            print(f"      Voice:   {vo_name} ({vo.get('voice_id', 'N/A')})")
            av_preview = av.get("preview_image_url", av.get("preview", ""))
            if av_preview:
                print(f"      Preview: {av_preview}")
            print()
    else:
        print("    No male avatars or Italian male voices found.")
        print("    Check the full lists above and pick manually.")
    print("  -------------------------------------------------------")


def main():
    print()
    print("*" * 70)
    print("*  BridgeQuest - HeyGen Voice & Avatar Finder                      *")
    print("*  Finding Italian voices and European avatars for 4 profiles       *")
    print("*" * 70)
    print()

    # 1. Fetch voices
    all_voices = fetch_all_voices()
    if not all_voices:
        print("\nNo voices returned. Check your API key and try again.")
        sys.exit(1)

    # 2. Filter Italian voices
    italian_voices = filter_italian_voices(all_voices)
    print(f"\nItalian voices found: {italian_voices and len(italian_voices) or 0}")

    # 3. Fetch avatars
    all_avatars = fetch_all_avatars()
    if not all_avatars:
        print("\nNo avatars returned. Check your API key and try again.")
        sys.exit(1)

    # 4. Filter European-looking avatars
    european_avatars = filter_european_avatars(all_avatars)
    print(f"\nEuropean/Italian avatar candidates: {len(european_avatars)}")

    # 5. Print detailed lists
    print_voices(italian_voices)
    print_avatars(european_avatars)

    # 6. Suggest pairings
    suggest_pairings(italian_voices, european_avatars)

    # 7. Summary stats
    print()
    print("=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    print(f"  Total voices in HeyGen:          {len(all_voices)}")
    print(f"  Italian voices:                   {len(italian_voices)}")
    male_it = len([v for v in italian_voices if (v.get("gender", "") or "").lower() == "male"])
    female_it = len([v for v in italian_voices if (v.get("gender", "") or "").lower() == "female"])
    print(f"    - Male:                         {male_it}")
    print(f"    - Female:                       {female_it}")
    print(f"  Total avatars in HeyGen:          {len(all_avatars)}")
    print(f"  European/Italian candidates:      {len(european_avatars)}")
    male_av = len([a for a in european_avatars if (a.get("gender", "") or "").lower() == "male"])
    female_av = len([a for a in european_avatars if (a.get("gender", "") or "").lower() == "female"])
    print(f"    - Male:                         {male_av}")
    print(f"    - Female:                       {female_av}")
    print()
    print("  TIP: Preview avatar images in browser to verify appearance.")
    print("  TIP: Preview audio URLs in browser to hear voice samples.")
    print("=" * 70)
    print()


if __name__ == "__main__":
    main()
