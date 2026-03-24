# Tauri PDF Toolkit — Roadmap

## V2 High Priority Goals
The following items are prioritized for the next major release, providing a comprehensive set of features for local PDF management.

1. **Settings & Path Config**
   - Allow users to choose an output directory other than `~/Downloads`.
   - Dedicated settings page to consolidate app preferences.
   - Ghostscript path override (if not found in standard `$PATH`).
   - Theme toggle (Light/Dark mode force).

2. **Visual Thumbnail Picker**
   - Provide visual thumbnails of PDF pages for the "Extract" workflow.
   - Allow users to click thumbnails to select pages instead of manually typing page ranges.

3. **Merge & Split Capabilities**
   - **Merge:** Combine multiple PDF files into a single document, with drag-and-drop reordering.
   - **Split:** Break a single PDF into multiple documents by a set interval (e.g., every 5 pages) or individual pages.

4. **Format Conversion**
   - Convert PDF pages into images (PNG, JPEG) with DPI options.
   - Extract text and formatting to generate editable DOCX files.

5. **Local OCR Support**
   - Integrate local Optical Character Recognition (OCR) to extract text from scanned PDFs.
   - Leverage `tesseract` (installed locally) or similar Rust wrappers to ensure all text extraction remains completely offline and private.

## Theoretically Possible (Future Exploration)
Ambitious, yet feasible features that could turn this toolkit into a pro-grade application:

- **PDF Watermarking & Stamping:** Apply customizable text or image watermarks across selected pages, or batch apply them to multiple PDFs.
- **Password Protection & Encryption:** Add/remove passwords and configure PDF permission settings (e.g., restrict printing, copying, or modifications).
- **Metadata Editor:** Direct editing of document metadata (Title, Author, Subject, Keywords, Creator).
- **Advanced Compression Tuning:** A pro-level UI for Ghostscript flags, allowing users to manually tweak color downsampling, DPI, and image compression algorithms.
- **Redaction Tool:** Visually select and permanently strip sensitive text or images from the underlying document structure (not just drawing black boxes over them).
- **Digital Signatures:** Cryptographically sign PDFs using local certificates to guarantee document authenticity.
- **Form Filling & Extraction:** Detect PDF form fields and allow filling them out or extracting data in batch (e.g., to CSV).