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

export interface ThumbnailData {
  page_number: number;
  data: string;
}

export interface OrganizeResult {
  output_path: string;
  pages_written: number;
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

export const generatePageThumbnails = (inputPath: string, pageNumbers: number[], maxWidth: number) =>
  invoke<ThumbnailData[]>('generate_page_thumbnails', { inputPath, pageNumbers, maxWidth });

export const saveOrganizedPdf = (
  inputPath: string,
  pageOrder: number[],
  rotations: Record<string, number>,
  outputName?: string,
  absoluteOutputPath?: string
) =>
  invoke<OrganizeResult>('save_organized_pdf', { inputPath, pageOrder, rotations, outputName, absoluteOutputPath });

export interface ConvertResult {
  output_path: string;
  pages_converted: number;
  output_mode: string;
}

export interface PdfMetadata {
  title: string | null;
  author: string | null;
  subject: string | null;
}

export interface MetadataResult {
  output_path: string;
  overwritten: boolean;
}

export interface SearchableResult {
  output_path: string;
  pages_processed: number;
}

export interface WatermarkResult {
  output_path: string;
  pages_watermarked: number;
}

export interface SecurityResult {
  output_path: string;
}

export interface SmartCardInfo {
  name: string;
  present: boolean;
}

export interface SignResult {
  output_path: string;
}

export interface SystemSpecs {
  ram_gb: number;
  recommended_model: string;
  model_url: string;
}

export const getAiSpecs = () => invoke<SystemSpecs>('get_ai_specs');
export const checkModelExists = (modelName: string) => invoke<boolean>('check_model_exists', { modelName });
export const checkAiToolsExists = () => invoke<boolean>('check_ai_tools_exists');
export const downloadModel = (url: string, modelName: string) => invoke<string>('download_model', { url, modelName });
export const downloadAiTools = () => invoke<string>('download_ai_tools');
export const startAiServer = (modelName: string) => invoke<void>('start_ai_server', { modelName });
export const stopAiServer = () => invoke<void>('stop_ai_server');

export const convertPdfToImages = (
  inputPath: string, format: string, ranges: string | undefined,
  outputMode: string, outputName?: string
) => invoke<ConvertResult>('convert_pdf_to_images', { inputPath, format, ranges, outputMode, outputName });

export const detectSmartCards = () =>
  invoke<SmartCardInfo[]>('detect_smart_cards');

export const signPdfFileBased = (
  inputPath: string,
  certPath: string,
  certPassword: string,
  outputName?: string
) => invoke<SignResult>('sign_pdf_file_based', { inputPath, certPath, certPassword, outputName });

export const addPdfSecurity = (
  inputPath: string,
  userPassword?: string,
  ownerPassword?: string,
  allowPrint: boolean = true,
  allowCopy: boolean = true,
  allowModify: boolean = true,
  outputName?: string
) => invoke<SecurityResult>('add_pdf_security', { 
  inputPath, userPassword, ownerPassword, allowPrint, allowCopy, allowModify, outputName 
});

export const decryptPdf = (inputPath: string, password: string, outputName?: string) =>
  invoke<SecurityResult>('decrypt_pdf', { inputPath, password, outputName });

export const checkPdfEncrypted = (inputPath: string) =>
  invoke<boolean>('check_pdf_encrypted', { inputPath });

export const addTextWatermark = (
  inputPath: string,
  text: string,
  pages: string | undefined,
  fontSize: number,
  opacity: number,
  rotation: number,
  color: [number, number, number],
  outputName?: string
) => invoke<WatermarkResult>('add_text_watermark', { 
  inputPath, text, pages, fontSize, opacity, rotation, color, outputName 
});

export const addImageWatermark = (
  inputPath: string,
  imagePath: string,
  pages: string | undefined,
  scale: number,
  opacity: number,
  rotation: number,
  outputName?: string
) => invoke<WatermarkResult>('add_image_watermark', { 
  inputPath, imagePath, pages, scale, opacity, rotation, outputName 
});

export interface CleanResult {
  output_path: string;
  original_pages: number;
  pages_removed: number;
}

export interface FlattenResult {
  output_path: string;
}

export const removeBlankPages = (inputPath: string, outputName?: string) =>
  invoke<CleanResult>('remove_blank_pages', { inputPath, outputName });

export const flattenPdf = (inputPath: string, outputName?: string) =>
  invoke<FlattenResult>('flatten_pdf', { inputPath, outputName });

export interface RepairResult {
  output_path: string;
  method_used: string;
}

export const repairPdf = (inputPath: string, outputName?: string) =>
  invoke<RepairResult>('repair_pdf', { inputPath, outputName });

export interface FormDataResult {
  output_path: string;
  field_count: number;
}

export interface ExtractImagesResult {
  output_dir: string;
  images_extracted: number;
}

export const extractFormData = (inputPath: string, outputName?: string) =>
  invoke<FormDataResult>('extract_form_data', { inputPath, outputName });

export const extractPdfImages = (inputPath: string, outputFolderName?: string) =>
  invoke<ExtractImagesResult>('extract_pdf_images', { inputPath, outputFolderName });

export const getPdfMetadata = (inputPath: string) =>
  invoke<PdfMetadata>('get_pdf_metadata', { inputPath });

export const setPdfMetadata = (
  inputPath: string, title: string, author: string, subject: string,
  saveAsNew: boolean, outputName?: string
) => invoke<MetadataResult>('set_pdf_metadata', { inputPath, title, author, subject, saveAsNew, outputName });

export const makeSearchablePdf = (
  inputPath: string, lang: string, outputName?: string, absoluteOutputPath?: string
) => invoke<SearchableResult>('make_searchable_pdf', { inputPath, lang, outputName, absoluteOutputPath });