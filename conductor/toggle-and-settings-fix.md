# Visual Fixes: Toggle Alignment and Settings Cleanup

This plan addresses visual bugs in the `Toggle` component and the `SettingsPage` as reported by the user.

## Problems
1.  **Toggle Misalignment:** The knob in the `Toggle` component is incorrectly positioned, especially in the enabled state, sticking out of the track.
2.  **Redundant Theme Selector:** The `SettingsPage` still displays a "Match System Preferences" toggle below the theme cards, which is redundant and uses untranslated keys.
3.  **Bulky Theme Section:** The theme section in `SettingsPage` has excess vertical space.

## Proposed Changes

### 1. Fix `Toggle` Component (`src/components/Toggle.tsx`)
- Add `flex-shrink-0` to the button to prevent compression in flex layouts.
- Add `left-0.5` to the knob `span` for a consistent starting position.
- Change translation logic to `enabled ? 'translate-x-5' : 'translate-x-0'`.
  - Track: `w-11` (44px)
  - Knob: `w-5` (20px)
  - Left Offset: `0.5` (2px)
  - Right Offset: `0.5` (2px)
  - Shift needed: `44 - 20 - 2 (left) - 2 (right) = 20px` (which is `translate-x-5`).

### 2. Clean up `SettingsPage` (`src/pages/SettingsPage.tsx`)
- **Remove Redundant Logic:** Delete `handleSystemPreferenceToggle`.
- **Remove Redundant UI:** Delete the entire `div` block containing `settings.matchSystem`.
- **Compact Layout:**
  - Reduce section spacing if necessary.
  - Ensure the theme section only contains the title, description, and the three theme cards.
- **Fix Toggle Callbacks:** Ensure `Toggle` usage in `SettingsPage` handles the boolean correctly.
  - Currently, `Toggle` calls `onClick(!enabled)`.
  - In `SettingsPage`, `handleAskEveryTimeChange` should be passed directly or used as `(val) => handleAskEveryTimeChange(val)`.

## Verification Steps
1. Open Settings.
2. Verify only 3 theme cards exist.
3. Verify Toggles (Ask every time) align perfectly when toggled on and off.
4. Run `npm run build` to ensure no regressions.
