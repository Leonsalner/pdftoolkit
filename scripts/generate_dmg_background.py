#!/usr/bin/env python3
"""
Generates a premium DMG background image for PDF Toolkit.
Run: python3 scripts/generate_dmg_background.py
Output: src-tauri/icons/dmg-background.png
"""

from PIL import Image, ImageDraw, ImageFont
import os, sys

# --- Layout constants ---
W, H = 660, 400
APP_X, APP_Y = 160, 155      # center of app icon drop zone
APPS_X, APPS_Y = 500, 155    # center of Applications alias drop zone
ARROW_Y = 155
OUT = os.path.join(os.path.dirname(__file__), "../src-tauri/icons/dmg-background.png")

# --- Colors ---
BG          = (15,  17,  23)   # #0f1117 — matches app dark base
SURFACE     = (26,  29,  39)   # #1a1d27
BORDER      = (45,  49,  66)   # subtle border
TEXT_PRI    = (243, 244, 246)  # #f3f4f6
TEXT_SEC    = (156, 163, 175)  # #9ca3af
TEXT_MUTED  = (107, 114, 128)  # #6b7280
ACCENT      = (129, 140, 248)  # #818cf8 — indigo
ARROW_COL   = (99,  102, 241)  # #6366f1

def load_font(size, bold=False):
    """Try Inter, then system fonts, then PIL default."""
    candidates = []
    if bold:
        candidates += [
            "/Library/Fonts/Inter-Bold.ttf",
            "/Library/Fonts/Inter/Inter-Bold.ttf",
            "/System/Library/Fonts/SFProDisplay-Bold.otf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
    else:
        candidates += [
            "/Library/Fonts/Inter-Regular.ttf",
            "/Library/Fonts/Inter/Inter-Regular.ttf",
            "/System/Library/Fonts/SFProDisplay-Regular.otf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)

def draw_arrow(draw, x1, y1, x2, y2, color, thickness=2):
    """Draw a horizontal arrow with a clean arrowhead."""
    # shaft
    draw.line([(x1, y1), (x2 - 12, y2)], fill=color, width=thickness)
    # arrowhead
    draw.polygon([
        (x2, y2),
        (x2 - 14, y2 - 7),
        (x2 - 14, y2 + 7),
    ], fill=color)

img = Image.new("RGBA", (W, H), BG)
draw = ImageDraw.Draw(img)

# --- Subtle background grid pattern ---
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill=(255, 255, 255, 6), width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill=(255, 255, 255, 6), width=1)

# --- Title bar area ---
draw_rounded_rect(draw, (30, 18, W - 30, 60), radius=8,
                  fill=SURFACE, outline=BORDER, width=1)
title_font = load_font(15, bold=True)
draw.text((W // 2, 39), "PDF Toolkit", font=title_font, fill=TEXT_PRI, anchor="mm")

# --- Icon drop zones (circles with dashed-style outline) ---
zone_r = 52
for cx, cy, label in [(APP_X, APP_Y, "PDF Toolkit"), (APPS_X, APPS_Y, "Applications")]:
    # glow
    for r in range(zone_r + 18, zone_r - 1, -3):
        alpha = max(0, int(20 - (r - zone_r) * 1.2))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                     outline=(*ACCENT, alpha), width=1)
    # dashed circle ring
    draw_rounded_rect(draw, [cx - zone_r, cy - zone_r, cx + zone_r, cy + zone_r],
                      radius=zone_r, outline=BORDER, width=1)
    # label below zone
    lbl_font = load_font(11)
    draw.text((cx, cy + zone_r + 14), label, font=lbl_font, fill=TEXT_MUTED, anchor="mm")

# --- Arrow between zones ---
arrow_x1 = APP_X + zone_r + 12
arrow_x2 = APPS_X - zone_r - 12
draw_arrow(draw, arrow_x1, ARROW_Y, arrow_x2, ARROW_Y, ARROW_COL, thickness=2)

# --- Divider ---
div_y = 240
draw.line([(40, div_y), (W - 40, div_y)], fill=BORDER, width=1)

# --- Instructions ---
head_font   = load_font(11, bold=True)
body_font   = load_font(10)
muted_font  = load_font(9)

# English
en_lines = [
    ("Drag PDF Toolkit into the Applications folder to install.", head_font, TEXT_PRI),
    ("First launch — if macOS blocks the app:", body_font, TEXT_SEC),
    ("  1. Right-click the app icon → Open", body_font, TEXT_SEC),
    ("  2. Or: System Settings → Privacy & Security → scroll down → Open Anyway", body_font, TEXT_SEC),
]

# Slovak
sk_lines = [
    ("Nainštalujte presunutím ikony PDF Toolkit do priečinka Applications.", head_font, TEXT_PRI),
    ("Prvé spustenie — ak macOS zablokuje aplikáciu:", body_font, TEXT_SEC),
    ("  1. Kliknite pravým tlačidlom → Otvoriť", body_font, TEXT_SEC),
    ("  2. Alebo: Nastavenia systému → Súkromie → posúňte nadol → Otvoriť tak či onak", body_font, TEXT_SEC),
]

# Two columns
col1_x = 50
col2_x = W // 2 + 10
y_start = div_y + 16
line_gap = 14

for col_x, lines in [(col1_x, en_lines), (col2_x, sk_lines)]:
    y = y_start
    for text, font, color in lines:
        draw.text((col_x, y), text, font=font, fill=color)
        y += line_gap

# Column labels
lang_font = load_font(9, bold=True)
draw.text((col1_x, div_y + 4), "EN", font=lang_font, fill=ACCENT)
draw.text((col2_x, div_y + 4), "SK", font=lang_font, fill=ACCENT)

# --- Bottom version note ---
ver_font = load_font(9)
draw.text((W // 2, H - 14), "PDF Toolkit v2.0 — standalone, no additional setup required",
          font=ver_font, fill=TEXT_MUTED, anchor="mm")

# --- Save ---
os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.convert("RGB").save(OUT, "PNG", dpi=(144, 144))
print(f"✓ Saved: {OUT}  ({W}x{H}px)")
