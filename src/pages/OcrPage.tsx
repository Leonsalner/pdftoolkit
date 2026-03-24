import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { invoke } from '@tauri-apps/api/core';

export interface OcrResult {
  output_path: string;
}

const extractTextOcr = (inputPath: string, outputName?: string) =>
  invoke<OcrResult>('extract_text_ocr', { inputPath, outputName });

export function OcrPage() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState('');

  const { execute, result, error, loading, reset } = useTauriCommand(extractTextOcr);

  const handleFileSelect = (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    setFilePath(p);
    setFileName(n);
    setCustomFileName('');
    reset();
  };

  const handleExtract = () => {
    if (filePath) {
      execute(filePath, customFileName);
    }
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setCustomFileName('');
    reset();
  };

  const defaultOutputName = fileName ? fileName.replace(/\.pdf$/i, '_ocr') : '';

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Local OCR Text Extraction</h2>

      <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-800 dark:text-indigo-200">
        <p className="text-sm">
          <strong>100% Offline:</strong> This process converts the PDF to images and uses the bundled Tesseract OCR engine to read text without internet access. This may take several minutes for larger documents.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">1. Select File</h3>
          {filePath ? (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <span className="font-medium truncate">{fileName}</span>
              <button
                onClick={handleStartOver}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                Change
              </button>
            </div>
          ) : (
            <DropZone onFileSelect={handleFileSelect} />
          )}
        </div>

        {filePath && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">2. Output Renaming (Optional)</h3>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder={`${defaultOutputName}.txt`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        )}

        {!result ? (
          <div>
            <button
              onClick={handleExtract}
              disabled={!filePath || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                !filePath || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Processing... (This may take a while)' : 'Extract Text'}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleStartOver}
              className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Process Another PDF
            </button>
          </div>
        )}

        {error && <ResultBanner type="error" message="OCR Extraction failed" details={error} />}
        {result && (
          <ResultBanner
            type="success"
            message="OCR Extraction successful!"
            details={`Text saved to: ${result.output_path}`}
          />
        )}
      </div>
    </div>
  );
}