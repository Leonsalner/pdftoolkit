# App Rename and DMG Background Generation Plan

Rename the application and generate a premium installer background.

## Objective
1.  **Rename App**: Change `productName` from "PDF Toolkit v3.0" to "PDF Toolkit" in `tauri.conf.json`.
2.  **Generate Visuals**: Use Nano Banana to create a 1320x800 Retina-ready DMG background.
3.  **Deploy**: Save the image to `src-tauri/icons/dmg-background.png`.

## Proposed Design
- **Theme**: Premium, minimalist macOS aesthetic.
- **Colors**: Light-colored background (subtle grey/white gradient) to ensure black text is legible.
- **Content**:
    - **Header**: "Drag PDF Toolkit into Applications to install."
    - **Footer**: Detailed instructions for bypassing macOS gatekeeper (Right-click -> Open, etc.).
    - **Layout**: Space for App icon at ~x=190 and Applications folder at ~x=470 (scaled for 1320x800).
    - **Accents**: Elegant arrow indicating the drag path.

## Implementation Steps
1.  **Modify Configuration**: Update `src-tauri/tauri.conf.json`.
2.  **Generate Image**: Run the Nano Banana prompt.
3.  **Verification**: Confirm the image is saved and the config is correct.

## Prompt for Nano Banana
"Create a premium, elegant macOS DMG installer background image. 
Resolution: 1320x800 pixels. 
Style: Minimalist, light-colored aesthetic (sophisticated off-white with a very subtle, soft silk-like gradient). 
Text: Use clean, black typography.
- Top center: 'Drag PDF Toolkit into Applications to install.'
- Bottom center (smaller text): 'If macOS blocks the app on first launch:\nRight-click the app -> Open -> Open\nor System Settings -> Privacy & Security -> scroll down -> Open Anyway'
- Layout: Leave two clear, unobstructed areas for icons. One on the left center, one on the right center. Connect them with a very subtle, sleek, minimalist arrow pointing right.
High fidelity, professional software delivery feel, Apple design language."
