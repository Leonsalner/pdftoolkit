import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { RangeInput } from '../components/RangeInput';
import { ResultBanner } from '../components/ResultBanner';
import { ThumbnailPickerModal, rangesToString } from '../components/ThumbnailPickerModal';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { convertPdfToImages, getPdfPageCount } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface ConvertPageProps {
  gsAvailable: boolean;
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function ConvertPage({ gsAvailable, notify, isActive }: ConvertPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [outputMode, setOutputMode] = useState<'subfolder' | 'zip'>('subfolder');
  const [rangeInput, setRangeInput] = useState('');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);

  const { execute: fetchPageCount, result: totalPages, error: pageCountError, reset: resetPageCount } = useTauriCommand(getPdfPageCount);
  const { execute: performConvert, result, error: convertError, loading, reset: resetConvert } = useTauriCommand(convertPdfToImages);

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
    resetConvert();
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setRangeInput('');
    setCustomFileName('');
    resetPageCount();
    resetConvert();
  };

  const defaultOutputName = fileName ? fileName.replace(/\.pdf$/i, '') : 'converted';

  const handleConvert = async () => {
    if (!filePath) return;

    const res = await performConvert(
      filePath,
      format,
      rangeInput || undefined,
      outputMode,
      customFileName || undefined
    );

    if (res && !isActive) {
      notify(t('convert.success'), 'convert');
    }
  };

  if (!gsAvailable) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center mt-20">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('compress.gsRequired')}</h2>
        <p className="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg inline-block font-mono text-sm">
          {t('compress.gsInstall')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('convert.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('convert.desc')}</p>
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

        {filePath && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('convert.format')}</h3>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input type="radio" checked={format === 'png'} onChange={() => { setFormat('png'); resetConvert(); }} />
                  <span className="text-sm dark:text-gray-300">{t('convert.formatPng')}</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" checked={format === 'jpeg'} onChange={() => { setFormat('jpeg'); resetConvert(); }} />
                  <span className="text-sm dark:text-gray-300">{t('convert.formatJpeg')}</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('convert.outputMode')}</h3>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input type="radio" checked={outputMode === 'subfolder'} onChange={() => { setOutputMode('subfolder'); resetConvert(); }} />
                  <span className="text-sm dark:text-gray-300">{t('convert.outputModeFolder')}</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" checked={outputMode === 'zip'} onChange={() => { setOutputMode('zip'); resetConvert(); }} />
                  <span className="text-sm dark:text-gray-300">{t('convert.outputModeZip')}</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('convert.step4')}</h3>
              <RangeInput value={rangeInput} onChange={(val) => { setRangeInput(val); resetConvert(); }} totalPages={totalPages || null} />
              {totalPages && (
                <button
                  onClick={() => setShowThumbnailPicker(true)}
                  className="mt-3 w-full py-2 px-4 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium transition-colors text-sm"
                >
                  {t('thumbnail.title')}
                </button>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('convert.step5')}</h3>
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder={defaultOutputName}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              />
            </div>

            {!result ? (
              <button
                onClick={handleConvert}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                }`}
              >
                {loading ? t('convert.buttonLoading') : t('convert.button')}
              </button>
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
            
            {convertError && <ResultBanner type="error" message={t('convert.failed')} details={convertError} />}
            {result && (
              <ResultBanner
                type="success"
                message={t('convert.success')}
                details={`${t('common.savedTo')} ${result.output_path} | ${result.pages_converted} ${t('convert.pagesConverted')}`}
              />
            )}
          </div>
        )}

        {filePath && totalPages && (
          <ThumbnailPickerModal
            isOpen={showThumbnailPicker}
            inputPath={filePath}
            totalPages={totalPages}
            onConfirm={(pages) => {
              setRangeInput(rangesToString(pages));
              setShowThumbnailPicker(false);
              resetConvert();
            }}
            onClose={() => setShowThumbnailPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
