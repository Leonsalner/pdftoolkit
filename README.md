# PDF Toolkit

A fast, fully local macOS desktop PDF utility application built with Tauri 2.x, React, TypeScript, Rust, and Tailwind CSS v4.

## Features

- **PDF Compression**: Reduce PDF file sizes using Ghostscript with selectable quality presets (Low, Medium, High).
- **Page Extraction**: Extract specific pages or page ranges from large PDF documents effortlessly using `lopdf`.
- **Merge PDFs**: Combine multiple PDF files into a single document with drag-and-drop reordering.
- **Split PDF**: Break a single PDF down into specific chunks of N pages or by custom ranges.
- **Format Conversion**: Convert PDF pages to high-res PNG or JPEG images and export them as a subfolder or ZIP archive.
- **Metadata Editor**: Read and edit Title, Author, and Subject fields of documents, saving as new or overwriting.
- **Text Recognition (OCR)**: Extract text from scanned PDFs completely offline using the bundled Tesseract OCR engine (supports English, Slovak, and Czech).
- **Searchable PDF Generator**: Overlay OCR text onto scanned PDFs to make them selectable and searchable.
- **Page Organizer**: Visually rearrange, rotate, or delete individual pages in a grid view.
- **Watermarking**: Batch apply text stamps to specific pages with customizable font size, rotation, opacity, and color.
- **Security Suite**: Apply robust AES-256 encryption, passwords, and permission management (allow printing, copying, etc.) via bundled `qpdf`. Decrypt files effortlessly.
- **Digital Signatures**: Sign documents locally using PKCS#12 certificates or hardware smart cards (eID).
- **Local AI Assistant**: Chat with your documents securely using a 100% offline, privacy-first Local AI model (`Qwen 2.5`), powered by an optimized Metal-accelerated `llama.cpp` sidecar.
- **Settings**: Fully customizable output directory, dynamic Light/Dark/System theme switching, and full UI translation (English/Slovak/Czech).
- **Local & Private**: All processing happens entirely offline on your machine. No documents are uploaded to any server.

## Prerequisites

Before building or running the application, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [Rust](https://www.rust-lang.org/tools/install) (`rustup`, `cargo`, `rustc`)

**Note:** Ghostscript, Tesseract OCR, qpdf, and llama.cpp are bundled locally as Tauri sidecars for a standalone experience!

## Getting Started

1. **Local Setup:**
   Run the autoinstall script to automatically fetch and bundle the required Ghostscript and Tesseract binaries (and language packs) for your machine architecture:
   ```bash
   ./setup_env.sh
   ```

2. **Install Dependencies:**
   Install the frontend Node dependencies:
   ```bash
   npm install
   ```

3. **Development Mode:**
   Run the application in development mode with Hot Module Replacement (HMR). This will automatically compile the Rust backend and open the application window:
   ```bash
   npm run tauri dev
   ```

4. **Building for Production:**
   To build a standalone release artifact (e.g., `.app` / `.dmg` on macOS):
   ```bash
   npm run tauri build
   ```
   The compiled binaries will be available in `src-tauri/target/release/bundle/`.

## Project Structure

- `src/`: Frontend React application.
  - `components/`: Reusable React components (`DropZone`, `PresetSelector`, `ResultBanner`, etc.).
  - `pages/`: Main application workflows (`CompressPage`, `ExtractPage`, `MergePage`, `SplitPage`, `OcrPage`, `SettingsPage`).
  - `hooks/`: Custom React hooks (`useTauriCommand`, `useFileDialog`).
  - `lib/`: `invoke.ts` (typed wrappers for Tauri commands) and `i18n.tsx` (localization engine).
  - `styles/theme.css`: Tailwind CSS configuration and design system tokens.
- `src-tauri/src/`: Rust backend.
  - `commands/`: Tauri commands for compression, extraction, merging, splitting, and OCR.
  - `utils/paths.rs`: Helpers for file system resolution and fetching settings.
- `src-tauri/bin/`: Bundled external binaries (Ghostscript, Tesseract).
- `src-tauri/tessdata/`: Bundled language data packs for Tesseract.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned future features, including visual thumbnail picking, form extraction, and digital signatures.