import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { RangeInput } from '../components/RangeInput';
import { ResultBanner } from '../components/ResultBanner';
import { ThumbnailPickerModal, rangesToString } from '../components/ThumbnailPickerModal';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { useRecentFiles } from '../hooks/useRecentFiles';
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
  const { recentFiles, addRecentFile } = useRecentFiles('extract');

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
    if (res && fileName) {
      await addRecentFile(filePath, fileName);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="extract" title={t('extract.title')} description={t('extract.desc')} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8 xl:gap-10">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('common.step1')}</h3>
            {filePath ? (
              <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] flex justify-between items-center transition-all duration-300 shadow-sm">
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="font-medium text-[var(--text-primary)] truncate">{fileName}</span>
                  {totalPages && <span className="text-xs text-[var(--text-secondary)] mt-0.5">{totalPages} pages</span>}
                </div>
                <button
                  onClick={handleStartOver}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors flex-shrink-0"
                >
                  {t('common.change')}
                </button>
              </div>
            ) : (
              <>
                <DropZone onFileSelect={handleFileSelect} />
                <RecentFiles
                  files={recentFiles}
                  onSelect={(path, name) => {
                    handleFileSelect(path, name);
                    void addRecentFile(path, name);
                  }}
                />
              </>
            )}
            {pageCountError && <p className="mt-2 text-sm text-[var(--error)]">{pageCountError}</p>}
          </div>
        </div>

        {/* Right Column: Options & Action */}
        <div className={`space-y-8 transition-opacity duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('extract.step2')}</h3>
              <RangeInput value={rangeInput} onChange={(val) => { setRangeInput(val); resetExtract(); }} totalPages={totalPages || null} />
              {filePath && totalPages && (
                <button
                  onClick={() => setShowThumbnailPicker(true)}
                  className="mt-3 w-full py-2 px-4 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors text-sm font-medium shadow-sm"
                >
                  {t('thumbnail.title')}
                </button>
              )}
            </div>

            {!askEveryTime && (
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('extract.step3')}</h3>
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder={`${defaultOutputName}.pdf`}
                  className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                />
              </div>
            )}
          </div>

          {!result ? (
            <button
              onClick={handleExtract}
              disabled={!filePath || !rangeInput || loading}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
                !filePath || !rangeInput || loading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
              }`}
            >
              {loading ? t('extract.buttonLoading') : t('extract.button')}
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

          {extractError && <ResultBanner type="error" message={t('extract.failed')} details={extractError} />}
          {result && (
            <ResultBanner
              type="success"
              message={t('extract.success')}
              details={`${t('common.savedTo')} ${result.output_path} | ${t('extract.extracted')} ${result.pages_extracted} ${t('extract.pagesLower')}`}
            />
          )}
        </div>
      </div>

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
  );
}
