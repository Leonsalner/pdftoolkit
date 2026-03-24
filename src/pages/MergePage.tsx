import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { mergePdfs } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { save } from '@tauri-apps/plugin-dialog';
import { initStore } from './SettingsPage';

interface FileItem {
  id: string;
  path: string;
  name: string;
}

export function MergePage() {
  const { t } = useI18n();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [customFileName, setCustomFileName] = useState('');
  const [askEveryTime, setAskEveryTime] = useState(false);

  const { execute, result, error, loading, reset } = useTauriCommand(mergePdfs);

  useEffect(() => {
    async function loadAsk() {
      const s = await initStore();
      const ask = await s.get('askEveryTime');
      if (ask) setAskEveryTime(true);
    }
    loadAsk();
  }, []);

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

  const handleMerge = async () => {
    if (files.length < 2) return;
    
    let absolutePath = undefined;
    if (askEveryTime) {
      const selectedPath = await save({
        defaultPath: 'merged.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if (!selectedPath) return;
      absolutePath = selectedPath;
    }

    execute(files.map(f => f.path), customFileName, absolutePath);
  };

  const handleStartOver = () => {
    setFiles([]);
    setCustomFileName('');
    reset();
  };

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('merge.title')}</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('common.step1.add')}</h3>
          <DropZone onFileSelect={handleFileSelect} multiple={true} />
          
          {files.length > 0 && (
            <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {files.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 transition-all duration-200">
                  <div className="flex items-center flex-1 min-w-0 mr-4">
                    <span className="w-6 text-gray-400 text-sm">{index + 1}.</span>
                    <span className="font-medium truncate text-gray-900 dark:text-gray-200">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30 transition-colors">▲</button>
                    <button onClick={() => moveDown(index)} disabled={index === files.length - 1} className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30 transition-colors">▼</button>
                    <button onClick={() => removeFile(file.id)} className="p-1 ml-2 text-red-500 hover:text-red-700 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {files.length > 0 && !askEveryTime && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('merge.step2')}</h3>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="merged.pdf"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 transition-colors"
            />
          </div>
        )}

        {!result ? (
          <div>
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                files.length < 2 || loading
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {loading ? t('merge.buttonLoading') : t('merge.button')}
            </button>
            {files.length === 1 && <p className="text-xs text-gray-500 mt-2 text-center">{t('merge.minFiles')}</p>}
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <button
              onClick={handleStartOver}
              className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 active:scale-[0.98]"
            >
              {t('merge.buttonAnother')}
            </button>
          </div>
        )}

        {error && <ResultBanner type="error" message={t('merge.failed')} details={error} />}
        {result && (
          <ResultBanner
            type="success"
            message={t('merge.success')}
            details={`Saved to: ${result.output_path} | ${result.files_merged} files combined`}
          />
        )}
      </div>
    </div>
  );
}