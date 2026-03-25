# PDF Toolkit

A fast, fully local macOS desktop PDF utility application. All processing happens 100% offline on your machine—no documents are ever uploaded to any server.

Built with Tauri 2.x, React, TypeScript, Rust, and Tailwind CSS v4.

## Features

- **PDF Compression** – Reduce file sizes with quality presets
- **Extract Pages** – Pull specific pages or ranges from documents
- **Merge & Split** – Combine multiple PDFs or break them into chunks
- **Format Conversion** – Export PDF pages as PNG/JPEG
- **Metadata Editor** – Edit title, author, subject fields
- **Text Recognition (OCR)** – Extract text from scanned PDFs (English, Slovak, Czech)
- **Searchable PDF** – Overlay OCR text to make PDFs selectable
- **Page Organizer** – Rearrange, rotate, or delete pages visually
- **Watermarking** – Apply text stamps with customizable styling
- **Security** – Encrypt with AES-256, set passwords and permissions
- **Digital Signatures** – Sign documents with certificates or smart cards
- **Local AI Assistant** – Chat with documents using an offline AI model (downloaded on-demand)
- **Auto-Updater** – Seamless background updates and one-click installs
- **Multi-language UI** – English, Slovak, Czech with light/dark theme

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

- `src/` – React frontend
- `src-tauri/` – Rust backend with Tauri commands
- `src-tauri/bin/` – Bundled external tools (Ghostscript, Tesseract, qpdf)
- `src-tauri/tessdata/` – OCR language data
- `llama-server` & Models – Downloaded dynamically to app data directory on-demand.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for upcoming features.