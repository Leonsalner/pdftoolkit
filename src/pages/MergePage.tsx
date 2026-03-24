import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { mergePdfs } from '../lib/invoke';

interface FileItem {
  id: string;
  path: string;
  name: string;
}

export function MergePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [customFileName, setCustomFileName] = useState('');

  const { execute, result, error, loading, reset } = useTauriCommand(mergePdfs);

  const handleFileSelect = (paths: any, names: any) => {
    const newFiles: FileItem[] = [];
    if (Array.isArray(paths)) {
      paths.forEach((p, i) => {
        newFiles.push({ id: Math.random().toString(36).substring(7), path: p, name: names[i] });
      });
    } else {
      newFiles.push({ id: Math.random().toString(36).substring(7), path: paths, name: names });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    reset();
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index - 1];
    newFiles[index - 1] = newFiles[index];
    newFiles[index] = temp;
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index + 1];
    newFiles[index + 1] = newFiles[index];
    newFiles[index] = temp;
    setFiles(newFiles);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleMerge = () => {
    if (files.length > 1) {
      execute(files.map(f => f.path), customFileName);
    }
  };

  const handleStartOver = () => {
    setFiles([]);
    setCustomFileName('');
    reset();
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Merge PDFs</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">1. Add Files</h3>
          <DropZone onFileSelect={handleFileSelect} multiple={true} />
          
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center flex-1 min-w-0 mr-4">
                    <span className="w-6 text-gray-400 text-sm">{index + 1}.</span>
                    <span className="font-medium truncate text-gray-900 dark:text-gray-200">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30">▲</button>
                    <button onClick={() => moveDown(index)} disabled={index === files.length - 1} className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30">▼</button>
                    <button onClick={() => removeFile(file.id)} className="p-1 ml-2 text-red-500 hover:text-red-700">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">2. Output Renaming (Optional)</h3>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="merged.pdf"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400"
            />
          </div>
        )}

        {!result ? (
          <div>
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                files.length < 2 || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Merging...' : 'Merge PDFs'}
            </button>
            {files.length === 1 && <p className="text-xs text-gray-500 mt-2 text-center">Add at least 2 files to merge.</p>}
          </div>
        ) : (
          <div>
            <button
              onClick={handleStartOver}
              className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Merge More PDFs
            </button>
          </div>
        )}

        {error && <ResultBanner type="error" message="Merge failed" details={error} />}
        {result && (
          <ResultBanner
            type="success"
            message="Merge successful!"
            details={`Saved to: ${result.output_path} | ${result.files_merged} files combined`}
          />
        )}
      </div>
    </div>
  );
}