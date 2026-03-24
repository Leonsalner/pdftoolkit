# Project Context: PDF Toolkit

## Overview
PDF Toolkit is a local macOS desktop application for manipulating PDF files. 
It uses **Tauri 2.x**, **React 19**, **TypeScript**, **Tailwind CSS v4** (via Vite plugin), and **Rust**.

## Architecture & Tech Stack
- **Frontend:** React (Vite template).
- **Styling:** Tailwind CSS v4 using `@import "tailwindcss"` and custom variants in `src/styles/theme.css`. We use CSS custom properties for dark/light themes (`data-theme="dark"`).
- **Localization:** Custom lightweight i18n context provider (`src/lib/i18n.tsx`) supporting English and Slovak.
- **Backend:** Rust (`src-tauri`).
  - PDF Extraction, Merging, & Splitting: Handled natively via the `lopdf` crate.
  - PDF Compression & OCR Image Extraction: Handled by shelling out to a bundled Ghostscript (`gs`) binary.
  - Text Recognition (OCR): Handled by shelling out to a bundled Tesseract (`tesseract`) binary.
- **Inter-process Communication (IPC):** Tauri Commands. The frontend interacts via typed wrappers in `src/lib/invoke.ts`.
- **File System & Storage:** Files are read/written using `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs`. Preferences are persisted globally via `@tauri-apps/plugin-store`.
- **Sidecars:** External binaries (`gs`, `tesseract`) and language data (`tessdata`) are fetched via `setup_env.sh` and physically bundled into the app via Tauri's `externalBin` and `resources` arrays, executed securely using `@tauri-apps/plugin-shell`.

## Build & Development Commands
- Fetch dependencies & bundle sidecars: `./setup_env.sh`
- Install JS dependencies: `npm install`
- Start development server & Tauri app: `npm run tauri dev`
- Build production bundle: `npm run tauri build`
- Typecheck frontend: `npm run build` (runs `tsc && vite build`)
- Format Rust: `cd src-tauri && cargo fmt`

## Coding Conventions
1. **React Components:** Use functional components and hooks. Prefer explicit prop typing with TypeScript interfaces.
2. **Tailwind:** Keep inline classes clean. For complex states, string interpolation with template literals is acceptable (e.g., ``className={`base-class ${isActive ? 'active' : ''}`}``).
3. **Rust Commands:** All Tauri commands should return `Result<T, String>` to allow structured error handling on the frontend. Do not use `.unwrap()` in command handlers unless absolutely safe; instead, use `.map_err()` to bubble up descriptive error strings.
4. **Error Handling:** Frontend wraps Tauri commands with the custom `useTauriCommand` hook to manage loading states and error parsing seamlessly. Render errors visually using the `<ResultBanner />` component.

## Known Constraints & Gotchas
- **Sidecar Execution:** Because Ghostscript and Tesseract run as isolated Tauri sidecars, you must always use `app.shell().sidecar("gs")` rather than `std::process::Command::new("gs")`. This ensures they work flawlessly on the user's machine regardless of their $PATH.
- **Synchronous vs Asynchronous:** While Tauri commands are async on the JS side, Heavy PDF operations (like OCR processing) block the Rust thread. For V1 sizes, this is acceptable, but be aware of main thread blocking on massive files. OCR is currently the longest-running task and displays a warning to the user.