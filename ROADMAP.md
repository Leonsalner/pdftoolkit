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

## High Priority (V2.1 - Next Steps)
- **Advanced Batch Processing** (Diff: 5/10)
  - Process multiple files for Watermarking and Security.
- **Image Stamping** (Diff: 4/10)
  - Allow using images for Watermarks.
- **Improved AI Parsing** (Diff: 7/10)
  - Improve the prompt context loading strategy for massive PDFs to bypass token limits.

## Theoretically Possible (Long-term)
- **PDF to DOCX Reconstruction** (Diff: 9/10)
- **True Redaction Tool** (Diff: 10/10)
- **Form Data Extraction** (Diff: 7/10)
