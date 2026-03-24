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

export interface MergeResult {
  output_path: string;
  files_merged: number;
}

export interface SplitResult {
  output_paths: string[];
  total_files: number;
}

export type Preset = 'screen' | 'ebook' | 'printer' | 'prepress';

export const compressPdf = (inputPath: string, preset: Preset, outputName?: string, absoluteOutputPath?: string) =>
  invoke<CompressResult>('compress_pdf', { inputPath, preset, outputName, absoluteOutputPath });

export const extractPages = (inputPath: string, ranges: string, outputName?: string, absoluteOutputPath?: string) =>
  invoke<ExtractResult>('extract_pages', { inputPath, ranges, outputName, absoluteOutputPath });

export const mergePdfs = (filePaths: string[], outputName?: string, absoluteOutputPath?: string) =>
  invoke<MergeResult>('merge_pdfs', { filePaths, outputName, absoluteOutputPath });

export const splitPdf = (inputPath: string, mode: string, value: string, outputPrefix?: string, absoluteOutputDir?: string) =>
  invoke<SplitResult>('split_pdf', { inputPath, mode, value, outputPrefix, absoluteOutputDir });

export const getPdfPageCount = (inputPath: string) =>
  invoke<number>('get_pdf_page_count', { inputPath });

export const checkGhostscript = () =>
  invoke<boolean>('check_ghostscript');

export const getFileSize = (inputPath: string) =>
  invoke<number>('get_file_size', { inputPath });