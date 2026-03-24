# PDF Toolkit

A fast, fully local macOS desktop PDF utility application built with Tauri 2.x, React, TypeScript, Rust, and Tailwind CSS v4.

## Features

- **PDF Compression**: Reduce PDF file sizes using Ghostscript with selectable quality presets (Screen, Ebook, Printer, Prepress).
- **Page Extraction**: Extract specific pages or page ranges from large PDF documents effortlessly using `lopdf`.
- **Local & Private**: All processing happens entirely offline on your machine. No documents are uploaded to any server.

## Prerequisites

Before building or running the application, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [Rust](https://www.rust-lang.org/tools/install) (`rustup`, `cargo`, `rustc`)
- [Ghostscript](https://ghostscript.com/): Required for the PDF compression feature.
  - On macOS, install via Homebrew: `brew install ghostscript`

## Getting Started

1. **Install Dependencies:**
   Install the frontend Node dependencies:
   ```bash
   npm install
   ```

2. **Development Mode:**
   Run the application in development mode with Hot Module Replacement (HMR). This will automatically compile the Rust backend and open the application window:
   ```bash
   npm run tauri dev
   ```

3. **Building for Production:**
   To build a standalone release artifact (e.g., `.app` / `.dmg` on macOS):
   ```bash
   npm run tauri build
   ```
   The compiled binaries will be available in `src-tauri/target/release/bundle/`.

## Project Structure

- `src/`: Frontend React application.
  - `components/`: Reusable React components (`DropZone`, `PresetSelector`, `ResultBanner`, etc.).
  - `pages/`: Main application workflows (`CompressPage`, `ExtractPage`).
  - `hooks/`: Custom React hooks (`useTauriCommand`, `useFileDialog`).
  - `styles/theme.css`: Tailwind CSS configuration and design system tokens.
- `src-tauri/src/`: Rust backend.
  - `commands/`: Tauri commands for compression (`compress.rs`) and extraction (`extract.rs`).
  - `utils/paths.rs`: Helpers for file system resolution (e.g., routing outputs to `~/Downloads`).

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned future features, including visual thumbnail picking, file merging/splitting, and local OCR support.
