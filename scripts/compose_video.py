"""
Video Composer for BridgeQuest lessons — multi-profile version.
Takes slide images + avatar video (any background) + captions → final 1080x1920 video.

Works with:
- Green screen HeyGen videos (junior)
- Light-colored background HeyGen videos (giovane/adulto/senior)

Usage:
  python3 compose_video.py --avatar VIDEO --slides DIR --captions ASS --output MP4
  Or: imported as module for batch processing.
"""
import os
import sys
import argparse
import subprocess
import numpy as np
from PIL import Image

try:
    from moviepy import VideoFileClip, VideoClip, CompositeVideoClip, TextClip
except ImportError:
    print("ERROR: moviepy not installed. Run: pip3 install moviepy")
    sys.exit(1)


def load_slides(slides_dir, target_w=1080, target_h=1920):
    """Load all slides from a directory, sorted by filename, resized to target."""
    slides = []
    if not os.path.isdir(slides_dir):
        return slides
    for f in sorted(os.listdir(slides_dir)):
        if f.endswith('.png') or f.endswith('.jpg'):
            path = os.path.join(slides_dir, f)
            img = Image.open(path).convert("RGB")
            iw, ih = img.size
            scale = max(target_w / iw, target_h / ih)
            new_w = int(iw * scale)
            new_h = int(ih * scale)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            left = (new_w - target_w) // 2
            top = (new_h - target_h) // 2
            img = img.crop((left, top, left + target_w, top + target_h))
            slides.append({"name": f, "frame": np.array(img)})
    return slides


def parse_ass(filepath):
    """Parse .ass subtitle file into list of {start, end, text}."""
    subs = []
    if not filepath or not os.path.exists(filepath):
        return subs
    with open(filepath) as f:
        for line in f:
            if line.startswith("Dialogue:"):
                parts = line.split(",", 9)
                if len(parts) < 10:
                    continue
                start = parts[1].strip()
                end = parts[2].strip()
                text = parts[9].strip().replace("\\n", " ").replace("\\N", " ")
                def to_sec(t):
                    h, m, s = t.split(":")
                    return int(h)*3600 + int(m)*60 + float(s)
                subs.append({"start": to_sec(start), "end": to_sec(end), "text": text})
    return subs


def generate_ass_from_script(script_path, profile, duration, output_ass):
    """Generate .ass captions from video script markdown when no HeyGen .ass available."""
    with open(script_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract text for this profile
    profile_map = {"junior": "JUNIOR", "giovane": "GIOVANE", "adulto": "ADULTO", "senior": "SENIOR"}
    profile_header = profile_map.get(profile, "GIOVANE")

    # Find section for this profile
    import re
    pattern = rf"## {profile_header}.*?\n(.*?)(?=\n## [A-Z]|\Z)"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return None

    text = match.group(1)
    # Clean: remove ### headers, blank lines
    lines = [l.strip() for l in text.split("\n") if l.strip() and not l.strip().startswith("###")]
    full_text = " ".join(lines)

    # Split into ~5 second chunks based on word count
    words = full_text.split()
    words_per_sec = len(words) / duration  # speaking rate
    chunk_secs = 4.0  # each subtitle ~4 seconds
    words_per_chunk = max(5, int(words_per_sec * chunk_secs))

    subs = []
    i = 0
    t = 0.5  # start 0.5s in
    while i < len(words):
        chunk_words = words[i:i + words_per_chunk]
        text_chunk = " ".join(chunk_words)
        chunk_dur = len(chunk_words) / words_per_sec if words_per_sec > 0 else chunk_secs
        subs.append({"start": t, "end": min(t + chunk_dur, duration - 0.1), "text": text_chunk})
        t += chunk_dur
        i += words_per_chunk

    # Write .ass file
    with open(output_ass, "w", encoding="utf-8") as f:
        f.write("[Script Info]\nTitle: BridgeQuest Captions\nScriptType: v4.00+\n")
        f.write(f"PlayResX: 1080\nPlayResY: 1920\n\n")
        f.write("[V4+ Styles]\n")
        f.write("Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,"
                "Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,"
                "Alignment,MarginL,MarginR,MarginV,Encoding\n")
        f.write("Style: Default,Impact,50,&H0000D4FF,&H000000FF,&H00000000,&H80000000,"
                "-1,0,0,0,100,100,0,0,1,4,0,2,40,40,80,1\n\n")
        f.write("[Events]\n")
        f.write("Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n")
        for sub in subs:
            def fmt(s):
                h = int(s // 3600)
                m = int((s % 3600) // 60)
                sec = s % 60
                return f"{h}:{m:02d}:{sec:05.2f}"
            f.write(f"Dialogue: 0,{fmt(sub['start'])},{fmt(sub['end'])},Default,,0,0,0,,{sub['text']}\n")

    return output_ass


def auto_timeline(slides, duration):
    """Create timeline distributing slides across the video."""
    n_slides = len(slides)
    if n_slides == 0:
        return [((0, duration, "avatar_full", "blue"))]

    intro_end = duration * 0.18
    closing_start = duration * 0.85
    slide_duration = (closing_start - intro_end) / n_slides
    crossfade_start = intro_end - 1.5

    timeline = []
    timeline.append((0, crossfade_start, "avatar_full", "blue"))
    timeline.append((crossfade_start, intro_end, "crossfade", 0))

    for i in range(n_slides):
        t_start = intro_end + i * slide_duration
        t_end = intro_end + (i + 1) * slide_duration
        if i == n_slides - 1:
            t_end = closing_start
        side = "right" if i % 2 == 0 else "left"
        if i == 0 or i == n_slides - 1:
            side = "none"
        timeline.append((t_start, t_end, "slide", i, side))

    timeline.append((closing_start, duration, "avatar_full", "purple"))
    return timeline


def chroma_key_alpha(frame):
    """Compute alpha mask for background removal.
    Works with both green screen and light-colored HeyGen backgrounds."""
    r = frame[:, :, 0].astype(float)
    g = frame[:, :, 1].astype(float)
    b = frame[:, :, 2].astype(float)

    # Standard green screen detection
    greenness = np.clip((g - np.maximum(r, b) * 1.1) / 80, 0, 1)
    green_mask = (g > 80) & (g > r * 1.2) & (g > b * 1.2)

    # Light background detection (for HeyGen's mint/white backgrounds)
    brightness = (r + g + b) / 3
    light_mask = (brightness > 200) & (g > r * 0.95) & (g > b * 0.95)
    light_bg = np.where(light_mask, np.clip((brightness - 200) / 40, 0, 1), 0)

    # Combine both approaches
    alpha = 1.0 - np.maximum(greenness, light_bg)
    alpha = np.where(green_mask & (greenness > 0.3), np.minimum(alpha, 0.3), alpha)
    alpha = np.where(light_mask & (light_bg > 0.5), np.minimum(alpha, 0.2), alpha)

    return np.clip(alpha, 0, 1)


def overlay_avatar(bg, av_frame, x, y, size_w, opacity, W, H):
    """Overlay chroma-keyed avatar onto background."""
    if opacity <= 0.01:
        return bg
    result = bg.copy()
    av_pil = Image.fromarray(av_frame).resize(
        (size_w, int(av_frame.shape[0] * size_w / av_frame.shape[1])), Image.LANCZOS)
    av_arr = np.array(av_pil)
    av_h, av_w = av_arr.shape[:2]
    alpha = chroma_key_alpha(av_arr) * opacity

    ix, iy = int(x), int(y)
    x1_bg, y1_bg = max(0, ix), max(0, iy)
    x2_bg, y2_bg = min(W, ix + av_w), min(H, iy + av_h)
    x1_av, y1_av = x1_bg - ix, y1_bg - iy
    x2_av, y2_av = x2_bg - ix, y2_bg - iy

    rw, rh = x2_bg - x1_bg, y2_bg - y1_bg
    if rw <= 0 or rh <= 0:
        return bg

    for c in range(3):
        reg = result[y1_bg:y2_bg, x1_bg:x2_bg, c].astype(float)
        av_c = av_arr[y1_av:y2_av, x1_av:x2_av, c].astype(float)
        a = alpha[y1_av:y2_av, x1_av:x2_av]
        result[y1_bg:y2_bg, x1_bg:x2_bg, c] = (a * av_c + (1 - a) * reg).astype(np.uint8)
    return result


def ease(t):
    return t * t * (3 - 2 * t)


def lerp_frames(f1, f2, t):
    t = np.clip(t, 0, 1)
    return (f1.astype(float) * (1 - t) + f2.astype(float) * t).astype(np.uint8)


def add_bottom_gradient(bg, H, intensity=0.4):
    result = bg.copy().astype(float)
    grad_h = int(H * 0.22)
    for i in range(grad_h):
        y = H - grad_h + i
        factor = 1.0 - intensity * (i / grad_h)
        result[y, :, :] *= factor
    return result.astype(np.uint8)


def compose_video(avatar_path, slides_dir, caption_path, output_path, fps=25):
    """Main composition function."""
    W, H = 1080, 1920

    print(f"  Loading avatar: {os.path.basename(avatar_path)}")
    avatar = VideoFileClip(avatar_path)
    duration = avatar.duration
    print(f"  Duration: {duration:.1f}s, Size: {avatar.w}x{avatar.h}")

    print(f"  Loading slides from: {slides_dir}")
    slides = load_slides(slides_dir, W, H)
    print(f"  {len(slides)} slides loaded")

    timeline = auto_timeline(slides, duration)
    print(f"  Timeline: {len(timeline)} segments")

    blue_bg = np.full((H, W, 3), [0, 61, 165], dtype=np.uint8)
    purple_bg = np.full((H, W, 3), [45, 27, 105], dtype=np.uint8)
    PIP_W = int(W * 0.38)

    def get_entry(t):
        for entry in timeline:
            if entry[0] <= t < entry[1]:
                return entry
        return timeline[-1]

    def make_frame(t):
        entry = get_entry(t)
        start, end = entry[0], entry[1]
        mode = entry[2]
        progress = (t - start) / max(0.01, end - start)
        av_frame = avatar.get_frame(t)

        if mode == "avatar_full":
            color = entry[3]
            bg_color = blue_bg if color == "blue" else purple_bg

            if color == "purple" and progress < 0.2 and slides:
                fade = ease(progress / 0.2)
                last_slide = slides[-1]["frame"]
                avatar_on_bg = overlay_avatar(bg_color.copy(), av_frame,
                    (W - avatar.w) // 2, (H - avatar.h) // 2, avatar.w, 1.0, W, H)
                bg = lerp_frames(last_slide, avatar_on_bg, fade)
            else:
                bg = overlay_avatar(bg_color.copy(), av_frame,
                    (W - avatar.w) // 2, (H - avatar.h) // 2, avatar.w, 1.0, W, H)

        elif mode == "crossfade":
            slide_idx = entry[3]
            fade = ease(progress)
            avatar_on_blue = overlay_avatar(blue_bg.copy(), av_frame,
                (W - avatar.w) // 2, (H - avatar.h) // 2, avatar.w, 1.0, W, H)
            slide_frame = slides[slide_idx]["frame"]
            bg = lerp_frames(avatar_on_blue, slide_frame, fade)

        elif mode == "slide":
            slide_idx = entry[3]
            side = entry[4]
            bg = slides[slide_idx]["frame"].copy()

            if progress < 0.08 and slide_idx > 0:
                prev_frame = slides[slide_idx - 1]["frame"]
                fade = ease(progress / 0.08)
                bg = lerp_frames(prev_frame, bg, fade)

            # Ken Burns
            kb = 1.0 + 0.03 * ease(progress)
            if kb > 1.005:
                crop_w, crop_h = int(W / kb), int(H / kb)
                x1, y1 = (W - crop_w) // 2, (H - crop_h) // 2
                region = Image.fromarray(bg).crop((x1, y1, x1 + crop_w, y1 + crop_h))
                bg = np.array(region.resize((W, H), Image.LANCZOS))

            # Avatar PiP
            if side != "none":
                if progress < 0.10:
                    pip_opacity, pip_slide_val = 0, 0
                elif progress < 0.22:
                    t_in = (progress - 0.10) / 0.12
                    pip_slide_val = ease(t_in)
                    pip_opacity = pip_slide_val
                elif progress < 0.80:
                    pip_slide_val, pip_opacity = 1.0, 1.0
                elif progress < 0.92:
                    t_out = (progress - 0.80) / 0.12
                    pip_slide_val = 1.0 - ease(t_out)
                    pip_opacity = pip_slide_val
                else:
                    pip_opacity, pip_slide_val = 0, 0

                if pip_opacity > 0.01:
                    pip_h_ratio = avatar.h / avatar.w
                    pip_y = H - int(PIP_W * pip_h_ratio) - 380
                    if side == "right":
                        target_x, off_x = W - PIP_W - 15, W + 50
                    else:
                        target_x, off_x = 15, -PIP_W - 50
                    pip_x = off_x + (target_x - off_x) * pip_slide_val
                    bg = overlay_avatar(bg, av_frame, pip_x, pip_y, PIP_W, pip_opacity, W, H)
        else:
            bg = blue_bg.copy()

        bg = add_bottom_gradient(bg, H, 0.35)
        return bg

    print("  Building composite...")
    composite = VideoClip(make_frame, duration=duration).with_fps(fps)
    composite = composite.with_audio(avatar.audio)

    # Add captions
    if caption_path and os.path.exists(caption_path):
        print("  Adding captions...")
        subs = parse_ass(caption_path)
        FONT = "/System/Library/Fonts/Supplemental/Impact.ttf"
        if not os.path.exists(FONT):
            FONT = "/System/Library/Fonts/Helvetica.ttc"
        colors = ["#FFD700", "#FF4500", "#00E5FF", "#FF1493"]

        all_clips = [composite]
        for i, sub in enumerate(subs):
            text = sub["text"].upper().strip()
            if not text or text == ".":
                continue
            try:
                txt = TextClip(
                    text=text, font_size=50, color=colors[i % len(colors)],
                    font=FONT, stroke_color="black", stroke_width=4,
                    text_align="center", size=(W - 80, None), method="caption"
                )
                txt = txt.with_start(sub["start"]).with_end(sub["end"])
                txt = txt.with_position(("center", H - 350))
                all_clips.append(txt)
            except Exception:
                pass

        print(f"  Rendering {len(all_clips)} layers...")
        final = CompositeVideoClip(all_clips, size=(W, H))
    else:
        print("  No captions, rendering video only...")
        final = composite

    final.write_videofile(output_path, codec="libx264", audio_codec="aac",
                         fps=fps, preset="fast", threads=4,
                         logger=None)

    avatar.close()
    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"  Done! {os.path.basename(output_path)} ({size_mb:.1f} MB)")
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compose BridgeQuest lesson video")
    parser.add_argument("--avatar", required=True, help="Path to avatar video")
    parser.add_argument("--slides", required=True, help="Path to slides directory")
    parser.add_argument("--captions", default=None, help="Path to .ass caption file")
    parser.add_argument("--output", required=True, help="Output video path")
    parser.add_argument("--fps", type=int, default=25)
    args = parser.parse_args()

    compose_video(args.avatar, args.slides, args.captions, args.output, args.fps)
