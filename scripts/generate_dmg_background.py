#!/usr/bin/env python3
"""
Generates a DMG background image for PDF Toolkit.
Run: python3 scripts/generate_dmg_background.py
Output: src-tauri/icons/dmg-background.png

Layout:
  - Title above the icons
  - macOS places icons at y=155
  - Compact instructions below icons
  - Everything fits within 660x400
"""

from PIL import Image, ImageDraw, ImageFont
import os

# --- Dimensions (macOS default DMG size) ---
SCALE = 3
LW, LH = 660, 400
W, H = LW * SCALE, LH * SCALE  # 1980 x 1200

# Icon centers (match tauri.conf.json x SCALE)
APP_CX  = 190 * SCALE
APPS_CX = 470 * SCALE
ICON_CY = 155 * SCALE

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "src-tauri", "icons", "dmg-background.png")

# --- Colors ---
BG         = (246, 247, 249)
TEXT_DARK  = (40,  42,  48)
TEXT_MED   = (90,  95,  108)
TEXT_LIGHT = (150, 155, 165)
ARROW_COL  = (180, 185, 195)


def load_font(size, bold=False):
    size = int(size * SCALE)
    paths_bold = [
        "/System/Library/Fonts/SFProText-Semibold.otf",
        "/System/Library/Fonts/SFProDisplay-Semibold.otf",
        "/Library/Fonts/Inter-SemiBold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    paths_regular = [
        "/System/Library/Fonts/SFProText-Regular.otf",
        "/System/Library/Fonts/SFProDisplay-Regular.otf",
        "/Library/Fonts/Inter-Regular.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in (paths_bold if bold else paths_regular):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


# --- Canvas ---
img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# --- Arrow between icon positions ---
arrow_y = ICON_CY
x1 = APP_CX + 60 * SCALE
x2 = APPS_CX - 60 * SCALE
draw.line([(x1, arrow_y), (x2 - 8 * SCALE, arrow_y)],
          fill=ARROW_COL, width=2 * SCALE)
chev = 7 * SCALE
draw.polygon([
    (x2, arrow_y),
    (x2 - chev, arrow_y - chev // 2),
    (x2 - chev, arrow_y + chev // 2),
], fill=ARROW_COL)

# --- Fonts ---
f_head = load_font(13, bold=True)
f_body = load_font(10.5)
f_dim  = load_font(9.5)

cx = W // 2

# --- Title ABOVE the icons ---
# macOS icons sit at y~155, icon artwork starts at ~y=110
# Icon labels ("PDF Toolkit", "Applications") are at ~y=210
# Title goes at y=55, safely above the icon artwork
draw.text((cx, int(55 * SCALE)),
          "Drag PDF Toolkit into Applications to install.",
          font=f_head, fill=TEXT_DARK, anchor="mt")

# --- Instructions BELOW the icons ---
# Icon labels end at roughly y=225, start text at y=245
line_h = int(16 * SCALE)
y = int(248 * SCALE)

draw.text((cx, y), "If macOS blocks the app on first launch:",
          font=f_body, fill=TEXT_MED, anchor="mt")
y += line_h
draw.text((cx, y), "Right-click the app -> Open -> Open",
          font=f_body, fill=TEXT_MED, anchor="mt")
y += line_h
draw.text((cx, y), "or  System Settings -> Privacy & Security -> scroll down -> Open Anyway",
          font=f_body, fill=TEXT_MED, anchor="mt")

# --- Bottom tagline ---
draw.text((cx, H - int(12 * SCALE)),
          "Standalone - no additional software required",
          font=f_dim, fill=TEXT_LIGHT, anchor="mb")

# --- Save ---
os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, "PNG", dpi=(216, 216))

print(f"Saved: {OUT}")
print(f"  Pixels: {W}x{H}  DPI: 216  Logical: {LW}x{LH}")
