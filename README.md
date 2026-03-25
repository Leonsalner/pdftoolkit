# PDF Toolkit v3.0

A fast, fully local macOS desktop PDF utility application. All processing happens 100% offline on your machine—no documents are ever uploaded to any server.

Built with Tauri 2.x, React 19, TypeScript, Rust, and Tailwind CSS v4.

## What's New in v3.0 (Premium Redesign)

The v3.0 release introduces a comprehensive **Premium Interior Redesign** of all feature pages, providing a more refined, professional, and consistent user experience across the entire toolkit.

### ✨ Highlights
- **Premium Visual Style**: A complete overhaul of all interior controls, inputs, and panels using a sophisticated macOS-native aesthetic.
- **Unified Navigation**: Every tool now features a consistent `PageIntro` header with breadcrumbs and clear descriptions.
- **Intelligent Category Styling**: Feature-specific color coding (Documents, Content, Security, Intelligence) is now deeply integrated into the UI for better visual context.
- **Optimized Workflows**:
  - **Organize**: New visual cards with dedicated drag handles and same-card delete/undo.
  - **Compress**: Improved size estimates for entire batches.
  - **Metadata**: Enhanced field grouping with Lucide icons.
  - **Security**: Simplified permission management using modern Toggles.
  - **AI Assistant**: Redesigned chat interface and onboarding experience.
- **Recent Files Integration**: Quick access to previously processed files across all tools.

## Features

- **PDF Compression** – Reduce file sizes with quality presets and batch estimates
- **Extract Pages** – Pull specific pages or ranges from documents
- **Merge & Split** – Combine multiple PDFs or break them into chunks with premium controls
- **Format Conversion** – Export PDF pages as PNG/JPEG with batch support
- **Metadata Editor** – Edit title, author, and subject fields with a refined UI
- **Text Recognition (OCR)** – Extract text from scanned PDFs (English, Slovak, Czech)
- **Searchable PDF** – Overlay OCR text to make PDFs selectable
- **Page Organizer** – Rearrange, rotate, or delete pages visually with dedicated drag handles
- **Watermarking** – Apply text stamps with customizable styling and batch processing
- **Security** – Encrypt with AES-256, set passwords and refined permissions
- **Digital Signatures** – Sign documents with certificates or smart cards
- **Local AI Assistant** – Chat with documents using an offline AI model (Llama-3)
- **Auto-Updater** – Seamless background updates and one-click installs
- **Multi-language UI** – English, Slovak, Czech with light/dark theme support

## Installation

1. Go to [Releases](https://github.com/Leonsalner/pdftoolkit/releases) and download the latest `.dmg` file
2. Open the `.dmg` and drag **PDF Toolkit** to the **Applications** folder
3. Done! The app will now automatically check for updates on launch.

## Development

To build from source:

```bash
./setup_env.sh        # Install & configure dependencies
npm install           # Install JS dependencies
npm run tauri dev     # Start dev mode with hot reload
npm run tauri build   # Build production DMG
```

## Project Structure

- `src/` – React frontend (React 19 + Tailwind v4)
- `src-tauri/` – Rust backend with Tauri commands
- `src-tauri/bin/` – Bundled external tools (Ghostscript, Tesseract, qpdf)
- `src-tauri/tessdata/` – OCR language data
- `llama-server` & Models – Downloaded dynamically to app data directory on-demand.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for upcoming features.
