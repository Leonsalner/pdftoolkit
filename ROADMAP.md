# Tauri PDF Toolkit — Roadmap

## Current Progress (V2.0) - ✅ Completed
- **PDF Compression**: Low/Medium/High presets using bundled Ghostscript.
- **Merge & Split**: Full multi-file merge and intelligent splitting.
- **Text Recognition (OCR)**: 100% offline extraction for EN/SK/CS.
- **Settings**: Persistent output paths, i18n support, and system-aware dark mode.
- **Standalone Sidecars**: Self-contained binaries for zero-install portability.
- **Visual Thumbnail Picker**: Browse PDF pages visually to select ranges for extraction or splitting.
- **Page Organizer**: Rearrange, rotate, or delete individual pages in a grid view.
- **Batch Processor**: Process multiple files at once for compression and OCR.
- **Format Conversion**: Convert PDF pages to high-res PNG/JPEG images.
- **Metadata Editor**: Edit Title, Author, and Subject fields of documents.
- **"Searchable PDF" Generator**: Overlay OCR text onto scanned PDFs to make them selectable/searchable.
- **Security Suite**: Password protection, encryption, and permission management.
- **Watermarking**: Batch apply text or image stamps to pages.
- **Local AI Assistant**: Offline document summarization and Q&A using local models (llama.cpp).
- **Digital Signatures**: Sign documents locally using PKCS#12 certificates or eID.
- **Arc/Linear UI Overhaul**: Full premium UI with category-tinting, Lucide icons, and animations.

## Current Progress (V2.2) - 🚧 In Development
- **Image Stamping**: Allow using images for Watermarks.
- **Advanced Batch Processing**: Process multiple files for Watermarking and Security.
- **Remove Blank Pages**: Automatically detect and remove blank pages from a PDF.
- **PDF Flattening**: Flatten annotations, forms, and interactive elements into static content.

## High Priority (V2.3 - Next Steps)
- **Improved AI Parsing** (Diff: 7/10)
  - Improve the prompt context loading strategy for massive PDFs to bypass token limits.
- **Extract Images from PDF** (Diff: 5/10)
  - Extract embedded image assets (JPEGs, PNGs) from the document in their original resolution.
- **Form Data Extraction** (Diff: 6/10)
  - Read a PDF with fillable forms (AcroForms/XFA) and export data as CSV/JSON.

## Planned
- **Document Library / History**
  - Track processed files, operations, timestamps, and output paths.
  - Browse and reopen history per tool with search and date/tool/filename filtering.

## Theoretically Possible (Long-term)
- **PDF Repair / Recovery Tool** (Diff: 7/10)
  - Reconstruct corrupted, malformed, or truncated PDF files.
- **PDF to DOCX Reconstruction** (Diff: 9/10)
  - Convert PDF back into an editable Word document while preserving layout/styling.
- **True Redaction Tool** (Diff: 10/10)
  - Permanently remove underlying text/data streams beneath redaction boxes.
