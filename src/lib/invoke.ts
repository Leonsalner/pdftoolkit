import { invoke } from '@tauri-apps/api/core';

export interface CompressResult {
  output_path: string;
  original_size: number;
  compressed_size: number;
}

export interface ExtractResult {
  output_path: string;
  pages_extracted: number;
}

export type Preset = 'screen' | 'ebook' | 'printer' | 'prepress';

export const compressPdf = (inputPath: string, preset: Preset) =>
  invoke<CompressResult>('compress_pdf', { inputPath, preset });

export const extractPages = (inputPath: string, ranges: string) =>
  invoke<ExtractResult>('extract_pages', { inputPath, ranges });

export const getPdfPageCount = (inputPath: string) =>
  invoke<number>('get_pdf_page_count', { inputPath });

export const checkGhostscript = () =>
  invoke<boolean>('check_ghostscript');