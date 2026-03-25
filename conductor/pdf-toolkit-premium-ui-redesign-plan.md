# PDF Toolkit — Premium Interior Redesign Plan

Redesign the interior UI of all remaining feature pages to match the premium visual style
already established in `ExtractPage`, `OrganizePage`, and `SettingsPage`.
Do **not** change functionality, routing, Tauri commands, or the two-column layout structure.

---

## Already Done (reference only — do not touch)

- `src/pages/ExtractPage.tsx` — breadcrumb via `PageIntro`, 35/65 grid, `RecentFiles`
- `src/pages/OrganizePage.tsx` — bulk toolbar, zoom slider, lightbox
- `src/pages/SettingsPage.tsx` — `ThemePreviewCard`, `Toggle`, section cards with `rounded-2xl`

---

## Visual System

### Color Palette (CSS custom properties in `src/styles/theme.css`)

| Token | Light | Dark |
|---|---|---|
| `--bg-base` | `#f5f5f7` | `#1c1c1e` |
| `--bg-surface` | `#ffffff` | `#2c2c2e` |
| `--bg-elevated` | `#ffffff` | `#3a3a3c` |
| `--border` | subtle grey | muted dark |
| `--border-hover` | slightly darker | slightly lighter |
| `--text-primary` | near-black | near-white |
| `--text-secondary` | muted grey | muted grey |
| `--text-disabled` | faint grey | faint grey |

**Category accent colors — use for icons and selected/active states only:**
- Documents: `--cat-documents` (blue), `--cat-documents-bg`
- Content: `--cat-content` (green), `--cat-content-bg`
- Security: `--cat-security` (amber), `--cat-security-bg`
- Intelligence: `--cat-intelligence` (purple), `--cat-intelligence-bg`

**State colors:** `--error` / `--error-bg`, `--success` / `--success-bg`

### Typography

| Role | Class |
|---|---|
| Section label | `text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]` |
| Field label | `text-sm font-medium text-[var(--text-primary)] mb-1.5` |
| Body / helper text | `text-xs text-[var(--text-secondary)] leading-5` |
| Breadcrumb | handled by `<PageIntro>` component |

### Shape & Spacing

- Large containers / section wrappers: `rounded-2xl`
- Cards / panels: `rounded-xl`
- Inputs / small buttons: `rounded-lg`
- Card padding: `p-5` or `p-6`
- Space between option groups inside a panel: `space-y-5`
- Thin separator between sections: `border-t border-[var(--border)] pt-5 mt-5`

---

## Component Patterns

### Option Panel Card (outer wrapper for all controls)

```tsx
<div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
  {/* section label */}
  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
    Extraction Mode
  </p>
  {/* controls here */}
</div>
```

### Option Selector Cards (e.g. "Select Range" vs "Extract All")

Stacked vertically inside the panel. Each card is clickable:

```tsx
<button
  onClick={() => setMode('range')}
  className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
    mode === 'range'
      ? 'border-[var(--cat-documents)] bg-[var(--cat-documents-bg)]'
      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
  }`}
>
  <Icon size={18} className={mode === 'range' ? 'text-[var(--cat-documents)]' : 'text-[var(--text-disabled)]'} />
  <div>
    <p className={`text-sm font-semibold ${mode === 'range' ? 'text-[var(--cat-documents)]' : 'text-[var(--text-primary)]'}`}>
      Select Range
    </p>
    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Pull specific pages by number or range</p>
  </div>
</button>
```

Use the relevant **category color** variables for the selected state.

### Text Input

```tsx
<div>
  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
    Page Range
  </p>
  <input
    type="text"
    placeholder="e.g. 1-5, 8, 11-14"
    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2
               text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]
               outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20
               transition-colors"
  />
</div>
```

### Inline Preset/Tag Pill

```tsx
<span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]
                 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-disabled)]">
  Preset
</span>
```

### Toggle Switch (use existing `Toggle` component from `SettingsPage.tsx`)

Import the same inline `Toggle` component (copy into the page or extract to `src/components/Toggle.tsx`).

### Primary Action Button

```tsx
<button
  disabled={!ready || loading}
  className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
    !ready || loading
      ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
      : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
  }`}
>
  {loading ? (
    <span className="flex items-center justify-center gap-2">
      <Loader2 size={15} className="animate-spin" /> Processing…
    </span>
  ) : 'Start Operation'}
</button>
```

### Secondary / Outline Button

```tsx
<button className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-2
                   text-sm font-medium text-[var(--text-primary)]
                   hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm
                   active:scale-[0.98] transition-all duration-200">
  Browse
</button>
```

### Select / Dropdown

Same border/bg as text input; use native `<select>` with custom styling:

```tsx
<select className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2
                   text-sm text-[var(--text-primary)] outline-none
                   focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20
                   transition-colors appearance-none cursor-pointer">
```

### Range Slider (quality, opacity, etc.)

```tsx
<div className="flex items-center gap-3">
  <input
    type="range" min={0} max={100}
    className="flex-1 accent-[var(--text-primary)]"
  />
  <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)] w-8 text-right">
    {value}%
  </span>
</div>
```

### Right Column Structure

```
<div className="space-y-5">

  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
    {/* SECTION LABEL */}
    {/* option cards / inputs */}
    {/* optional thin border-t separator + more options */}
  </div>

  {/* PRIMARY BUTTON */}

  {/* RESULT BANNER (animate-in on appear) */}

</div>
```

---

## Components Available (read before using)

- `src/components/PageIntro.tsx` — renders breadcrumb + title + description + optional right-aligned `actions` slot. **Use on every page.**
- `src/components/DropZone.tsx` — do not modify
- `src/components/BatchFileList.tsx` — do not modify
- `src/components/ResultBanner.tsx` — do not modify
- `src/components/RecentFiles.tsx` — show below DropZone when no file selected
- `src/hooks/useRecentFiles.ts` — hook to persist last 5 files per tool
- Lucide icons: `size={16}` inline, `size={18}` option card icons, `size={15}` inside buttons

---

## Pages to Redesign (by category)

Work **one page at a time**. Read each file fully before editing.
Run `npm run build` (from `/Users/leon/conductor/workspaces/pdftoolkit/bandung`) after every 3–4 pages.

---

### Phase 1 — Documents (blue: `--cat-documents` / `--cat-documents-bg`)

#### `CompressPage.tsx`
- Wrap quality/preset controls in one option panel card
- `PresetSelector.tsx`: redesign preset options as option-selector cards (low/medium/high/custom) with blue selected state
- Quality slider: use range slider pattern above
- Batch file list stays as-is; just ensure consistent button styling

#### `MergePage.tsx`
- File list items: add subtle hover state (`hover:bg-[var(--bg-elevated)]`), clean filename truncation
- "Add more files" action: secondary outline button style
- Merge button: primary action button pattern

#### `SplitPage.tsx`
- Split mode picker: use option-selector cards ("By Range", "Every N Pages", "Into Equal Parts" etc.)
- Range / number inputs: use text input pattern with uppercase section labels above
- Primary button at bottom

#### `CleanPage.tsx`
- Read file first to understand available options; wrap them in option panel card
- Cleaning options (if toggles): use Toggle component

#### `RepairPage.tsx`
- Likely simple — ensure panel card wrapper, consistent primary button

---

### Phase 2 — Content (green: `--cat-content` / `--cat-content-bg`)

#### `ConvertPage.tsx`
- Output format selector: option-selector cards or a grid of format pills
- Selected format: green border + green-tinted bg
- Quality options (if any): text input or range slider

#### `ExtractImagesPage.tsx`
- Format selector (PNG/JPEG/WEBP): option-selector cards
- Quality slider if JPEG selected
- DPI input: text input pattern

#### `WatermarkPage.tsx`
- Mode selector: "Text Watermark" vs "Image Watermark" — option-selector cards
- Text controls: inputs for text, font size, opacity — use text input + slider patterns
- Position picker: if it's a 3×3 grid, style each cell as a small button with green selected state
- Opacity/rotation: range sliders

#### `MetadataPage.tsx`
- Each metadata field (Title, Author, Subject, etc.): text input with uppercase label above
- Group all fields inside one option panel card with section separators
- "Clear All" → secondary outline button; "Save" → primary button

#### `FormDataPage.tsx`
- Read file to understand the output; style any form field display with consistent typography

---

### Phase 3 — Security (amber: `--cat-security` / `--cat-security-bg`)

#### `SecurityPage.tsx`
- Group "Encrypt" vs "Decrypt" as option-selector cards with amber selected state
- Password fields: text input pattern with eye-toggle if present
- Permission checkboxes: replace with Toggle components
- Separate "permissions" into their own labeled section inside the panel

#### `SignPage.tsx`
- Signature options: option-selector cards if multiple modes exist
- Consistent inputs, primary button

#### `FlattenPage.tsx`
- Likely simple; ensure option panel wrapper and primary button styling

---

### Phase 4 — Intelligence (purple: `--cat-intelligence` / `--cat-intelligence-bg`)

#### `OcrPage.tsx`
- Language selector: styled `<select>` or option-selector cards for common languages
- Output format selector (searchable PDF, text file, etc.): option-selector cards with purple state
- Warn about processing time: style the warning as an amber info row inside the panel

#### `AiPage.tsx`
- Chat message styling: message bubbles with consistent border-radius and colors
- Input area: text input pattern for the prompt field
- Send button: primary button style (full-width or right-aligned)
- Loading/streaming state: `Loader2 animate-spin` inline

---

## Also Required: `PageIntro` Integration

Every page above must use `<PageIntro>` for the header. Replace any existing title/description `<div>` with:

```tsx
<PageIntro page="compress" title={t('compress.title')} description={t('compress.desc')} />
```

Read `src/components/PageIntro.tsx` first to understand its props.

---

## Also Required: `RecentFiles` Integration

Add to pages that don't have it yet (all pages above). Show below DropZone when no file selected:

```tsx
const { recentFiles, addRecentFile } = useRecentFiles('compress');
// ...
{!filePath && <RecentFiles files={recentFiles} onSelect={handleFileSelect} />}
// call addRecentFile(filePath, fileName) on successful operation
```

---

## Hard Rules

- **Do not** change `src-tauri/`, `src/lib/invoke.ts`, `src/App.tsx`, `src/components/Sidebar.tsx`, or `src/styles/theme.css`
- **Do not** rename or remove any existing translation keys in `src/lib/i18n.tsx`; adding new keys is fine — add to all 3 languages (en, sk, cs)
- **Do not** change the left column (DropZone + file display state machine)
- **Do not** change any prop interfaces, Tauri command calls, or state logic
- **Do not** add new dependencies
- All TypeScript must compile cleanly — run `npm run build` to verify

---

## Verification

After all phases are complete:
1. `npm run build` must pass with no errors
2. Visual consistency check: all pages should feel like they belong to the same design system
3. Both light and dark modes must look correct
4. Category colors must be applied correctly per section
