import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { splitPdf, getPdfPageCount } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { open } from '@tauri-apps/plugin-dialog';
import { initStore } from '../lib/store';

type SplitMode = 'every_n' | 'ranges';

export function SplitPage() {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customPrefix, setCustomPrefix] = useState('');
  const [askEveryTime, setAskEveryTime] = useState(false);
  
  const [mode, setMode] = useState<SplitMode>('every_n');
  const [value, setValue] = useState('1');

  const { execute: fetchPageCount, result: totalPages, reset: resetPageCount } = useTauriCommand(getPdfPageCount);
  const { execute, result, error, loading, reset } = useTauriCommand(splitPdf);

  useEffect(() => {
    async function loadAsk() {
      const s = await initStore();
      const ask = await s.get('askEveryTime');
      if (ask) setAskEveryTime(true);
    }
    loadAsk();
  }, []);

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

  const handleSplit = async () => {
    if (!filePath) return;

    let absoluteDir = undefined;
    if (askEveryTime) {
      // Split generates multiple files, so ask for directory instead of file
      const selectedDir = await open({
        directory: true,
        multiple: false,
      });
      if (!selectedDir || Array.isArray(selectedDir)) return;
      absoluteDir = selectedDir;
    }

    execute(filePath, mode, value, customPrefix, absoluteDir);
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
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('split.title')}</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('common.step1')}</h3>
          {filePath ? (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center transition-all duration-300">
              <div className="flex flex-col truncate mr-4">
                <span className="font-medium truncate">{fileName}</span>
                {totalPages && <span className="text-xs text-gray-500">{totalPages} pages</span>}
              </div>
              <button onClick={handleStartOver} className="text-sm text-gray-500 hover:text-red-500 flex-shrink-0 transition-colors">
                {t('common.change')}
              </button>
            </div>
          ) : (
            <DropZone onFileSelect={handleFileSelect} />
          )}
        </div>

        <div className={filePath ? "animate-in fade-in slide-in-from-top-2 duration-300" : ""}>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('split.step2')}</h3>
          <div className="space-y-3 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="split_mode" value="every_n" checked={mode === 'every_n'} onChange={() => {setMode('every_n'); setValue('1');}} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t('split.mode.single')}</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="split_mode" value="ranges" checked={mode === 'ranges'} onChange={() => {setMode('ranges'); setValue('');}} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t('split.mode.ranges')}</span>
            </label>
          </div>

          <div className="mt-4 animate-in fade-in zoom-in-95 duration-300">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                mode === 'every_n' ? "e.g., 1 (split into single pages), 2 (split every 2 pages)" :
                "e.g., 1-5, 8-10"
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 transition-colors"
            />
          </div>
        </div>

        {filePath && !askEveryTime && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('split.step3')}</h3>
            <input
              type="text"
              value={customPrefix}
              onChange={(e) => setCustomPrefix(e.target.value)}
              placeholder={`${defaultPrefix}_part1.pdf`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Files will be generated as [prefix]_part1.pdf, [prefix]_part2.pdf, etc.</p>
          </div>
        )}

        {!result ? (
          <div>
            <button
              onClick={handleSplit}
              disabled={!filePath || !value.trim() || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                !filePath || !value.trim() || loading
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {loading ? t('split.buttonLoading') : t('split.button')}
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <button
              onClick={handleStartOver}
              className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 active:scale-[0.98]"
            >
              {t('split.buttonAnother')}
            </button>
          </div>
        )}

        {error && <ResultBanner type="error" message={t('split.failed')} details={error} />}
        {result && (
          <ResultBanner
            type="success"
            message={t('split.success')}
            details={`Generated ${result.total_files} files.`}
          />
        )}
      </div>
    </div>
  );
}