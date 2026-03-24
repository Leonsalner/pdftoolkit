import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { RangeInput } from '../components/RangeInput';
import { ResultBanner } from '../components/ResultBanner';
import { ThumbnailPickerModal, rangesToString } from '../components/ThumbnailPickerModal';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { extractPages, getPdfPageCount } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { save } from '@tauri-apps/plugin-dialog';
import { initStore } from '../lib/store';
import { Page } from '../components/Sidebar';

interface ExtractPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function ExtractPage({ notify, isActive }: ExtractPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [rangeInput, setRangeInput] = useState('');
  const [askEveryTime, setAskEveryTime] = useState(false);
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);

  const { execute: fetchPageCount, result: totalPages, error: pageCountError, reset: resetPageCount } = useTauriCommand(getPdfPageCount);
  const { execute: performExtract, result, error: extractError, loading, reset: resetExtract } = useTauriCommand(extractPages);

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

  const sanitizedRanges = rangeInput ? rangeInput.replace(/,/g, '_').replace(/ /g, '') : 'extracted';
  const defaultOutputName = fileName ? fileName.replace(/\.pdf$/i, `_${sanitizedRanges}`) : 'extracted';

  const handleExtract = async () => {
    if (!filePath || !rangeInput) return;

    let absolutePath = undefined;
    if (askEveryTime) {
      const selectedPath = await save({
        defaultPath: `${defaultOutputName}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if (!selectedPath) return;
      absolutePath = selectedPath;
    }

    const res = await performExtract(filePath, rangeInput, customFileName, absolutePath);
    if (res && !isActive) {
      notify(t('extract.success'), 'extract');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('extract.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('extract.desc')}</p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('common.step1')}</h3>
          {filePath ? (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center transition-all duration-300">
              <span className="font-medium truncate">{fileName}</span>
              <button
                onClick={handleStartOver}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                {t('common.change')}
              </button>
            </div>
          ) : (
            <DropZone onFileSelect={handleFileSelect} />
          )}
          {pageCountError && <p className="mt-2 text-sm text-red-500">{pageCountError}</p>}
        </div>

        <div className={filePath ? "animate-in fade-in slide-in-from-top-2 duration-300" : ""}>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('extract.step2')}</h3>
          <RangeInput value={rangeInput} onChange={(val) => { setRangeInput(val); resetExtract(); }} totalPages={totalPages || null} />
          {filePath && totalPages && (
            <button
              onClick={() => setShowThumbnailPicker(true)}
              className="mt-3 w-full py-2 px-4 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium transition-colors text-sm"
            >
              {t('thumbnail.title')}
            </button>
          )}
        </div>

        {filePath && !askEveryTime && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('extract.step3')}</h3>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder={`${defaultOutputName}.pdf`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            />
          </div>
        )}

        {!result ? (
          <div>
            <button
              onClick={handleExtract}
              disabled={!filePath || !rangeInput || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                !filePath || !rangeInput || loading
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {loading ? t('extract.buttonLoading') : t('extract.button')}
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <button
              onClick={handleStartOver}
              className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 active:scale-[0.98]"
            >
              {t('extract.buttonAnother')}
            </button>
          </div>
        )}

        {extractError && <ResultBanner type="error" message={t('extract.failed')} details={extractError} />}
        {result && (
          <ResultBanner
            type="success"
            message={t('extract.success')}
            details={`${t('common.savedTo')} ${result.output_path} | ${t('extract.extracted')} ${result.pages_extracted} ${t('extract.pagesLower')}`}
          />
        )}

        {filePath && totalPages && (
          <ThumbnailPickerModal
            isOpen={showThumbnailPicker}
            inputPath={filePath}
            totalPages={totalPages}
            onConfirm={(pages) => {
              setRangeInput(rangesToString(pages));
              setShowThumbnailPicker(false);
              resetExtract();
            }}
            onClose={() => setShowThumbnailPicker(false)}
          />
        )}
      </div>
    </div>
  );
}