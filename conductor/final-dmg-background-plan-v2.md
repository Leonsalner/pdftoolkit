# Final DMG Background Plan v2

## Objective
Fix icon misalignment by adjusting the DMG window size and icon coordinates in `tauri.conf.json`, then generate a perfectly aligned background image.

## Analysis
The core issue is that the current `appPosition` and `applicationFolderPosition` coordinates are too close together and too high up in the 660x400 window, causing the icons to feel cramped and misaligned with the background image's intended visual center.

## Corrected Layout
I will update `tauri.conf.json` to use a more standard and spacious layout:

- **Window Size**: `width: 800`, `height: 500`
- **App Icon Position**: `x: 200`, `y: 250` (centered vertically)
- **Applications Folder Position**: `x: 600`, `y: 250` (centered vertically)

This provides ample horizontal and vertical space, creating a more balanced and professional look.

## Refined Prompt for New Background
I will generate a new 1600x1000 Retina image with the same "Orbital Mesh Gradient" aesthetic, but with the layout adjusted for the new coordinates:

- **Prompt**: "Create a premium, elegant macOS DMG installer background image, resolution **1600x1000 pixels**.
Style: Soft, organic mesh gradient of light sky blue and soft lavender in the corners, fading to a pure white center.
Text (Crisp black typography):
  - Top center: 'Drag PDF Toolkit into Applications to install.'
  - Bottom center (smaller): 'If macOS blocks the app on first launch:
Right-click the app -> Open -> Open
or System Settings -> Privacy & Security -> scroll down -> Open Anyway'
Layout:
- A subtle, sleek light grey arrow pointing from left to right, visually connecting the icon areas.
- **Crucially, leave the following areas completely blank for icons**:
    1. A 256x256 area with its **top-left corner at exactly x=400, y=500**.
    2. A 256x256 area with its **top-left corner at exactly x=1200, y=500**.
Floating Icons: In the background, subtly place small, colorful, minimalist icons (like `FileText`, `Shield`, `Sparkles`) that appear to orbit the blank icon areas. They should be semi-transparent and feel like they are behind the main content layer."

## Implementation
1.  **Modify `tauri.conf.json`**: Apply the new `windowSize` and `appPosition`/`applicationFolderPosition` values.
2.  **Generate Image**: Run the refined prompt with Nano Banana Pro.
3.  **Fix DPI**: Set the generated image to 144 DPI using `sips`.
4.  **Local Build**: Replace the background and run `npm run tauri build`.
5.  **Verification**: Await user confirmation before committing.
