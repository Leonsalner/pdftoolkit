# Final DMG Background Plan

## Objective
Fix the icon misalignment in the DMG background by using precise top-left coordinates and generate a refined, premium "Orbital Mesh Gradient" image.

## Analysis of Misalignment
The `appPosition` and `applicationFolderPosition` coordinates in `tauri.conf.json` (`x: 190, y: 155` and `x: 470, y: 155`) define the **top-left corner** of the icon placement, not the center. My previous prompts used center-based placement, causing the vertical misalignment.

## Corrected Layout (for a 660x400 window)
- **Retina Image Size**: 1320x800
- **App Icon (top-left)**: `x=380`, `y=310`
- **Applications Folder (top-left)**: `x=940`, `y=310`

## Refined Prompt
"Create a premium, elegant macOS DMG installer background image, resolution **1320x800 pixels**.
**Style**: Soft, organic mesh gradient of light sky blue and soft lavender in the corners, fading to a pure white center.
**Text (Crisp black typography)**:
  - Top center: 'Drag PDF Toolkit into Applications to install.'
  - Bottom center (smaller): 'If macOS blocks the app on first launch:
Right-click the app -> Open -> Open
or System Settings -> Privacy & Security -> scroll down -> Open Anyway'
**Layout**:
- A subtle, sleek light grey arrow pointing from left to right, visually connecting the icon areas.
- **Crucially, leave the following areas completely blank for icons**:
    1. A 256x256 area with its **top-left corner at exactly x=380, y=310**.
    2. A 256x256 area with its **top-left corner at exactly x=940, y=310**.
**Floating Icons**: In the background, subtly place small, colorful, minimalist icons (like `FileText`, `Shield`, `Sparkles`) that appear to orbit the blank icon areas. They should be semi-transparent and feel like they are behind the main content layer."

## Implementation
1.  **Generate Image**: Run the refined prompt with Nano Banana Pro.
2.  **Fix DPI**: Set the generated image to 144 DPI using `sips`.
3.  **Local Build**: Replace the background and run `npm run tauri build`.
4.  **Verification**: Await user confirmation before committing.
