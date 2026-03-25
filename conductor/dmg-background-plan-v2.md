# Updated DMG Background and Branding Plan

## Objective
1.  **Rename App**: Change `productName` to "PDF Toolkit" and clean up the sidebar.
2.  **Generate Visuals**: Use Nano Banana Pro to create a 1320x800 Retina background.
3.  **Fix DPI**: Use `sips` to set the image to 144 DPI so it fills the 660x400 window correctly.
4.  **Deploy**: Replace `src-tauri/icons/dmg-background.png`.

## Proposed Design (Option A: Frosted Glass)
- **Prompt**: "Create a premium, elegant macOS DMG installer background image. Resolution: 1320x800 pixels. Style: Minimalist, light-colored aesthetic (sophisticated off-white with a very subtle, soft silk-like gradient). In the background, several translucent, semi-transparent 'frosted glass' layers float elegantly with soft, multi-layered shadows. Text: Use clean, black typography. Top center: 'Drag PDF Toolkit into Applications to install.' Bottom center (smaller text): 'If macOS blocks the app on first launch:\nRight-click the app -> Open -> Open\nor System Settings -> Privacy & Security -> scroll down -> Open Anyway'. Layout: Two clear, unobstructed areas for icons connected by a very subtle, sleek, minimalist arrow pointing right. High fidelity, professional software delivery feel, Apple design language."

## Implementation Steps
1.  **Modify Configs**: Update `src-tauri/tauri.conf.json` and `src/components/Sidebar.tsx`.
2.  **Generate Image**: Run Nano Banana.
3.  **Correct Metadata**: Run `sips` command to set 144 DPI.
4.  **Verification**: Confirm file replacement and build checks.
