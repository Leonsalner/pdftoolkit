# DMG Background 1320x800 Plan

## Objective
The previous 660x400 image was rendering far too small on a Retina display, occupying only the top-left quadrant of the DMG window. We will generate a 1320x800 pixel image that covers the full DMG window, set its internal DPI to 144, and run a local build to ensure perfect scaling and visual fidelity.

## Changes
1. **Generate Image**: A 1320x800 image has been generated utilizing the "Aurora Flow" aesthetic. The colors are slightly less vibrant and the text formatting uses clear line breaks for legibility. The background aurora expands to cover the entire canvas diagonally.
2. **Apply Retina DPI**: Use the Python `PIL` library to change the image DPI from 72 to 144 so macOS `appdmg` packages it as a Retina (`@2x`) background.
3. **Local Build**: Execute `npm run tauri build` locally to generate the DMG file for the user to visually inspect.