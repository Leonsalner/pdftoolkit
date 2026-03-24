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
      <div className="max-w-5xl mx-auto p-8 text-center mt-20">
        <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">{t('compress.gsRequired')}</h2>
        <p className="text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border)] p-4 rounded-xl inline-block font-mono text-sm">
          {t('compress.gsInstall')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('convert.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('convert.desc')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('common.step1')}</h3>
            {filePath ? (
              <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] flex justify-between items-center transition-all duration-300 shadow-sm">
                <span className="font-medium text-[var(--text-primary)] truncate pr-4">{fileName}</span>
                <button
                  onClick={handleStartOver}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors flex-shrink-0"
                >
                  {t('common.change')}
                </button>
              </div>
            ) : (
              <DropZone onFileSelect={handleFileSelect} />
            )}
            {pageCountError && <p className="mt-2 text-sm text-[var(--error)]">{pageCountError}</p>}
          </div>
        </div>

        {/* Right Column: Options & Action */}
        <div className={`space-y-8 transition-opacity duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('convert.format')}</h3>
              <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-1">
                <button 
                  onClick={() => { setFormat('png'); resetConvert(); }} 
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${format === 'png' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {t('convert.formatPng')}
                </button>
                <button 
                  onClick={() => { setFormat('jpeg'); resetConvert(); }} 
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${format === 'jpeg' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {t('convert.formatJpeg')}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('convert.outputMode')}</h3>
              <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-1">
                <button 
                  onClick={() => { setOutputMode('subfolder'); resetConvert(); }} 
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${outputMode === 'subfolder' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {t('convert.outputModeFolder')}
                </button>
                <button 
                  onClick={() => { setOutputMode('zip'); resetConvert(); }} 
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${outputMode === 'zip' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {t('convert.outputModeZip')}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('convert.step4')}</h3>
              <RangeInput value={rangeInput} onChange={(val) => { setRangeInput(val); resetConvert(); }} totalPages={totalPages || null} />
              {totalPages && (
                <button
                  onClick={() => setShowThumbnailPicker(true)}
                  className="mt-3 w-full py-2 px-4 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors text-sm font-medium shadow-sm"
                >
                  {t('thumbnail.title')}
                </button>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('convert.step5')}</h3>
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder={defaultOutputName}
                className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
              />
            </div>
          </div>

          {!result ? (
            <button
              onClick={handleConvert}
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
                loading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
              }`}
            >
              {loading ? t('convert.buttonLoading') : t('convert.button')}
            </button>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <button
                onClick={handleStartOver}
                className="w-full py-3.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-elevated)] transition-all duration-300 active:scale-[0.99] shadow-sm"
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