# Project Context: PDF Toolkit

## Overview
PDF Toolkit is a local macOS desktop application for manipulating PDF files. 
It uses **Tauri 2.x**, **React 19**, **TypeScript**, **Tailwind CSS v4** (via Vite plugin), and **Rust**.

## Architecture & Tech Stack
- **Frontend:** React (Vite template).
- **Styling:** Tailwind CSS v4 using `@import "tailwindcss"` in `src/styles/theme.css`. We use CSS custom properties for dark/light themes.
- **Backend:** Rust (`src-tauri`).
  - PDF Extraction: Handled natively via the `lopdf` crate.
  - PDF Compression: Handled by shelling out to Ghostscript (`gs` command) via `std::process::Command`.
- **Inter-process Communication (IPC):** Tauri Commands. The frontend interacts via typed wrappers in `src/lib/invoke.ts`.
- **File System:** Files are read from absolute paths using `@tauri-apps/plugin-dialog`. Generated outputs are automatically saved to the user's `~/Downloads` folder.

## Build & Development Commands
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
- **Ghostscript Dependency:** The compression workflow strictly requires Ghostscript to be installed on the host system (`brew install ghostscript`). The app queries `gs --version` on mount to warn users if it is missing.
- **Drag and Drop:** The current UI relies strictly on the native file picker dialog (`@tauri-apps/plugin-dialog`) via a "Click to browse" mechanism. Native Tauri drag-and-drop parsing is not implemented for file picking yet.
- **Synchronous vs Asynchronous:** While Tauri commands are async on the JS side, Heavy PDF operations block the Rust thread. For V1 sizes, this is acceptable, but be aware of main thread blocking on massive files.