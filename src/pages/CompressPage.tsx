import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { PresetSelector } from '../components/PresetSelector';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { compressPdf, getFileSize, Preset } from '../lib/invoke';

interface CompressPageProps {
  gsAvailable: boolean;
}

export function CompressPage({ gsAvailable }: CompressPageProps) {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [preset, setPreset] = useState<Preset>('ebook');

  const { execute: fetchSize, result: fileSize, reset: resetSize } = useTauriCommand(getFileSize);
  const { execute, result, error, loading, reset } = useTauriCommand(compressPdf);

  useEffect(() => {
    if (filePath) {
      fetchSize(filePath);
    }
  }, [filePath, fetchSize]);

  const handleFileSelect = (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    setFilePath(p);
    setFileName(n);
    setCustomFileName('');
    resetSize();
    reset();
  };

  const handleCompress = () => {
    if (filePath) {
      execute(filePath, preset, customFileName);
    }
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setCustomFileName('');
    resetSize();
    reset();
  };

  const defaultOutputName = fileName ? fileName.replace(/\.pdf$/i, '_compressed') : '';

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Compress PDF</h2>

      {!gsAvailable && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200">
          <p className="font-semibold">Ghostscript is required for compression.</p>
          <p className="text-sm mt-1">Please install it by running <code>brew install ghostscript</code> in your terminal.</p>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">1. Select File</h3>
          {filePath ? (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <div className="flex flex-col truncate mr-4">
                <span className="font-medium truncate">{fileName}</span>
                {fileSize && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Original Size: {(fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
              <button
                onClick={handleStartOver}
                className="text-sm text-gray-500 hover:text-red-500 flex-shrink-0"
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
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">2. File Renaming (Optional)</h3>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder={`${defaultOutputName}.pdf`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {filePath ? '3. Choose Preset' : '2. Choose Preset'}
          </h3>
          <PresetSelector value={preset} onChange={(p) => { setPreset(p); reset(); }} fileSize={fileSize} />
        </div>

        {!result ? (
          <div>
            <button
              onClick={handleCompress}
              disabled={!filePath || !gsAvailable || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                !filePath || !gsAvailable || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Compressing...' : 'Compress PDF'}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleStartOver}
              className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Compress Another PDF
            </button>
          </div>
        )}

        {error && <ResultBanner type="error" message="Compression failed" details={error} />}
        {result && (
          <ResultBanner
            type="success"
            message="Compression successful!"
            details={`Saved to: ${result.output_path} | Reduced to ${(result.compressed_size / 1024 / 1024).toFixed(2)} MB`}
          />
        )}
      </div>
    </div>
  );
}