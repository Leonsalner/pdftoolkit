import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { splitPdf, getPdfPageCount } from '../lib/invoke';

type SplitMode = 'single' | 'every_n' | 'after_page' | 'ranges';

export function SplitPage() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customPrefix, setCustomPrefix] = useState('');
  
  const [mode, setMode] = useState<SplitMode>('single');
  const [value, setValue] = useState('');

  const { execute: fetchPageCount, result: totalPages, reset: resetPageCount } = useTauriCommand(getPdfPageCount);
  const { execute, result, error, loading, reset } = useTauriCommand(splitPdf);

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
    setCustomPrefix('');
    resetPageCount();
    reset();
  };

  const handleSplit = () => {
    if (filePath) {
      execute(filePath, mode, value, customPrefix);
    }
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setCustomPrefix('');
    setValue('');
    resetPageCount();
    reset();
  };

  const defaultPrefix = fileName ? fileName.replace(/\.pdf$/i, '') : '';

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Split PDF</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">1. Select File</h3>
          {filePath ? (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <div className="flex flex-col truncate mr-4">
                <span className="font-medium truncate">{fileName}</span>
                {totalPages && <span className="text-xs text-gray-500">{totalPages} pages</span>}
              </div>
              <button onClick={handleStartOver} className="text-sm text-gray-500 hover:text-red-500 flex-shrink-0">
                Change
              </button>
            </div>
          ) : (
            <DropZone onFileSelect={handleFileSelect} />
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">2. Split Mode</h3>
          <div className="space-y-3 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="split_mode" value="single" checked={mode === 'single'} onChange={() => setMode('single')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Split into single pages</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="split_mode" value="every_n" checked={mode === 'every_n'} onChange={() => setMode('every_n')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Split every N pages</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="split_mode" value="after_page" checked={mode === 'after_page'} onChange={() => setMode('after_page')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Split after specific page</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="split_mode" value="ranges" checked={mode === 'ranges'} onChange={() => setMode('ranges')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Split into specific ranges</span>
            </label>
          </div>

          {mode !== 'single' && (
            <div className="mt-4">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  mode === 'every_n' ? "e.g., 2 (split every 2 pages)" :
                  mode === 'after_page' ? "e.g., 5 (creates 1-5 and 6-end)" :
                  "e.g., 1-5, 8-10"
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400"
              />
            </div>
          )}
        </div>

        {filePath && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">3. Output Prefix (Optional)</h3>
            <input
              type="text"
              value={customPrefix}
              onChange={(e) => setCustomPrefix(e.target.value)}
              placeholder={`${defaultPrefix}_part1.pdf`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Files will be generated as [prefix]_part1.pdf, [prefix]_part2.pdf, etc.</p>
          </div>
        )}

        {!result ? (
          <div>
            <button
              onClick={handleSplit}
              disabled={!filePath || (mode !== 'single' && !value.trim()) || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                !filePath || (mode !== 'single' && !value.trim()) || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Splitting...' : 'Split PDF'}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleStartOver}
              className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Split Another PDF
            </button>
          </div>
        )}

        {error && <ResultBanner type="error" message="Split failed" details={error} />}
        {result && (
          <ResultBanner
            type="success"
            message="Split successful!"
            details={`Generated ${result.total_files} files in your Downloads folder.`}
          />
        )}
      </div>
    </div>
  );
}