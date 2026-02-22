#!/usr/bin/env python3
"""
Generate PWA icons for BridgeQuest.
Creates high-quality PNG icons with proper safe zones for maskable icons.

Design: Emerald green rounded rectangle with "BQ" text and four filled suit symbols.
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'icons')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Brand colors
EMERALD = (5, 150, 105)       # #059669
EMERALD_DARK = (4, 120, 87)   # Slightly darker for depth
WHITE = (255, 255, 255)
WHITE_SEMI = (255, 255, 255, 220)  # Semi-transparent white


def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    # Main rectangle body
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    # Four corners
    draw.pieslice([x0, y0, x0 + 2*radius, y0 + 2*radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2*radius, y0, x1, y0 + 2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2*radius, x0 + 2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2*radius, y1 - 2*radius, x1, y1], 0, 90, fill=fill)


def draw_spade(draw, cx, cy, size, fill):
    """Draw a filled spade symbol using polygons."""
    s = size
    # Top part: two circles + triangle pointing up
    # Spade body
    points_top = [
        (cx, cy - s * 0.5),           # top point
        (cx - s * 0.45, cy + s * 0.05),  # left
        (cx - s * 0.3, cy + s * 0.3),
        (cx, cy + s * 0.15),
        (cx + s * 0.3, cy + s * 0.3),
        (cx + s * 0.45, cy + s * 0.05),  # right
    ]
    draw.polygon(points_top, fill=fill)
    # Left bulge
    r = s * 0.25
    draw.ellipse([cx - s * 0.48, cy - s * 0.12, cx - s * 0.02, cy + s * 0.35], fill=fill)
    # Right bulge
    draw.ellipse([cx + s * 0.02, cy - s * 0.12, cx + s * 0.48, cy + s * 0.35], fill=fill)
    # Stem
    stem_w = s * 0.08
    draw.rectangle([cx - stem_w, cy + s * 0.1, cx + stem_w, cy + s * 0.5], fill=fill)


def draw_heart(draw, cx, cy, size, fill):
    """Draw a filled heart symbol."""
    s = size
    # Two circles for the top bumps
    r = s * 0.25
    draw.ellipse([cx - s * 0.47, cy - s * 0.35, cx - 0, cy + s * 0.12], fill=fill)
    draw.ellipse([cx + 0, cy - s * 0.35, cx + s * 0.47, cy + s * 0.12], fill=fill)
    # Triangle for bottom
    points = [
        (cx - s * 0.47, cy - s * 0.05),
        (cx + s * 0.47, cy - s * 0.05),
        (cx, cy + s * 0.5),
    ]
    draw.polygon(points, fill=fill)


def draw_diamond(draw, cx, cy, size, fill):
    """Draw a filled diamond symbol."""
    s = size
    points = [
        (cx, cy - s * 0.5),   # top
        (cx + s * 0.35, cy),   # right
        (cx, cy + s * 0.5),   # bottom
        (cx - s * 0.35, cy),   # left
    ]
    draw.polygon(points, fill=fill)


def draw_club(draw, cx, cy, size, fill):
    """Draw a filled club symbol."""
    s = size
    r = s * 0.22
    # Three circles in trefoil pattern
    # Top circle
    draw.ellipse([cx - r, cy - s * 0.42, cx + r, cy - s * 0.42 + 2 * r], fill=fill)
    # Bottom-left circle
    draw.ellipse([cx - s * 0.35, cy - s * 0.1, cx - s * 0.35 + 2 * r, cy - s * 0.1 + 2 * r], fill=fill)
    # Bottom-right circle
    draw.ellipse([cx + s * 0.35 - 2 * r, cy - s * 0.1, cx + s * 0.35, cy - s * 0.1 + 2 * r], fill=fill)
    # Center fill
    draw.ellipse([cx - r * 0.6, cy - r * 0.8, cx + r * 0.6, cy + r * 0.3], fill=fill)
    # Stem
    stem_w = s * 0.08
    draw.rectangle([cx - stem_w, cy + s * 0.05, cx + stem_w, cy + s * 0.5], fill=fill)


def get_font(size, bold=True):
    """Try to load the best available font."""
    font_paths = [
        '/System/Library/Fonts/SFCompactRounded.ttf',
        '/System/Library/Fonts/SFNS.ttf',
        '/System/Library/Fonts/HelveticaNeue.ttc',
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/Avenir Next.ttc',
    ]
    for fp in font_paths:
        try:
            font = ImageFont.truetype(fp, size)
            return font
        except Exception:
            continue
    return ImageFont.load_default()


def create_icon(size, maskable=False):
    """Create a single icon at the given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Maskable icons: fill entire canvas, content in safe zone (inner 80%)
        # Background fills entire canvas
        draw.rectangle([0, 0, size, size], fill=EMERALD)

        # Content area: inner 80% (10% padding on each side)
        safe_margin = int(size * 0.10)
        content_x0 = safe_margin
        content_y0 = safe_margin
        content_w = size - 2 * safe_margin
        content_h = size - 2 * safe_margin
    else:
        # Regular icon: rounded rectangle with padding
        padding = int(size * 0.02)
        corner_radius = int(size * 0.18)
        draw_rounded_rect(draw, [padding, padding, size - padding, size - padding],
                          corner_radius, EMERALD)

        content_x0 = padding
        content_y0 = padding
        content_w = size - 2 * padding
        content_h = size - 2 * padding

    cx = size // 2  # Center X

    # -- Draw "BQ" text --
    bq_font_size = int(content_h * 0.32)
    font = get_font(bq_font_size, bold=True)

    text = "BQ"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    text_x = cx - tw // 2
    text_y = content_y0 + int(content_h * 0.12)

    # Subtle shadow for depth
    shadow_off = max(1, size // 200)
    draw.text((text_x + shadow_off, text_y + shadow_off), text,
              fill=(0, 0, 0, 40), font=font)
    draw.text((text_x, text_y), text, fill=WHITE, font=font)

    # -- Draw four suit symbols --
    suit_y = content_y0 + int(content_h * 0.62)
    suit_size = int(content_h * 0.18)
    spacing = int(content_w * 0.19)
    start_x = cx - int(spacing * 1.5)

    suits = [draw_spade, draw_heart, draw_diamond, draw_club]
    for i, draw_suit in enumerate(suits):
        sx = start_x + i * spacing
        draw_suit(draw, sx, suit_y, suit_size, WHITE_SEMI)

    return img


def create_favicon(size=32):
    """Create a tiny favicon - simplified design."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rect background
    radius = int(size * 0.18)
    draw_rounded_rect(draw, [0, 0, size, size], radius, EMERALD)

    # Just draw a spade symbol in the center for small sizes
    draw_spade(draw, size // 2, int(size * 0.45), int(size * 0.38), WHITE)

    return img


# === Generate all icon variants ===
icons_to_generate = [
    ('icon-192x192.png', 192, False),
    ('icon-512x512.png', 512, False),
    ('icon-maskable-192x192.png', 192, True),
    ('icon-maskable-512x512.png', 512, True),
    ('apple-touch-icon.png', 180, False),
    ('favicon-32x32.png', 32, False),
    ('favicon-16x16.png', 16, False),
]

for filename, size, maskable in icons_to_generate:
    if size <= 32:
        icon = create_favicon(size)
    else:
        icon = create_icon(size, maskable=maskable)

    filepath = os.path.join(OUTPUT_DIR, filename)
    icon.save(filepath, 'PNG', optimize=True)
    print(f'  Generated {filename} ({size}x{size}{"  maskable" if maskable else ""})')

# Also generate a favicon.ico at the root public directory
favicon = create_favicon(32)
favicon_path = os.path.join(OUTPUT_DIR, '..', 'favicon.ico')
# ICO format with multiple sizes
favicon_16 = create_favicon(16)
favicon.save(favicon_path, format='ICO', sizes=[(16, 16), (32, 32)],
             append_images=[favicon_16])
print(f'  Generated favicon.ico (16x16 + 32x32)')

print(f'\nAll icons saved to: {os.path.abspath(OUTPUT_DIR)}')
