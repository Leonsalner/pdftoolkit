import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { RangeInput } from '../components/RangeInput';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { extractPages, getPdfPageCount } from '../lib/invoke';

export function ExtractPage() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [rangeInput, setRangeInput] = useState('');

  const { execute: fetchPageCount, result: totalPages, error: pageCountError, reset: resetPageCount } = useTauriCommand(getPdfPageCount);
  const { execute: performExtract, result, error: extractError, loading, reset: resetExtract } = useTauriCommand(extractPages);

  useEffect(() => {
    if (filePath) {
      fetchPageCount(filePath);
    }
  }, [filePath, fetchPageCount]);

  const handleFileSelect = (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    setFilePath(p);
    setFileName(n);
    setRangeInput('');
    setCustomFileName('');
    resetPageCount();
    resetExtract();
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setRangeInput('');
    setCustomFileName('');
    resetPageCount();
    resetExtract();
  };

  const handleExtract = () => {
    if (filePath && rangeInput) {
      performExtract(filePath, rangeInput, customFileName);
    }
  };

  const sanitizedRanges = rangeInput ? rangeInput.replace(/,/g, '_').replace(/ /g, '') : 'extracted';
  const defaultOutputName = fileName ? fileName.replace(/\.pdf$/i, `_${sanitizedRanges}`) : '';

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Extract Pages</h2>

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
          {pageCountError && <p className="mt-2 text-sm text-red-500">{pageCountError}</p>}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">2. Specify Ranges</h3>
          <RangeInput value={rangeInput} onChange={(val) => { setRangeInput(val); resetExtract(); }} totalPages={totalPages || null} />
        </div>

        {filePath && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">3. File Renaming (Optional)</h3>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder={`${defaultOutputName}.pdf`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        )}

        {!result ? (
          <div>
            <button
              onClick={handleExtract}
              disabled={!filePath || !rangeInput || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                !filePath || !rangeInput || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Extracting...' : 'Extract Pages'}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleStartOver}
              className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Extract Another PDF
            </button>
          </div>
        )}

        {extractError && <ResultBanner type="error" message="Extraction failed" details={extractError} />}
        {result && (
          <ResultBanner
            type="success"
            message="Extraction successful!"
            details={`Saved to: ${result.output_path} | Extracted ${result.pages_extracted} pages`}
          />
        )}
      </div>
    </div>
  );
}