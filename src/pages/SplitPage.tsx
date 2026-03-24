import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { ThumbnailPickerModal, rangesToString } from '../components/ThumbnailPickerModal';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { splitPdf, getPdfPageCount } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { open } from '@tauri-apps/plugin-dialog';
import { initStore } from '../lib/store';
import { Page } from '../components/Sidebar';

type SplitMode = 'every_n' | 'ranges';

interface SplitPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function SplitPage({ notify, isActive }: SplitPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customPrefix, setCustomPrefix] = useState('');
  const [askEveryTime, setAskEveryTime] = useState(false);
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);
  
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
      const selectedDir = await open({
        directory: true,
        multiple: false,
      });
      if (!selectedDir || Array.isArray(selectedDir)) return;
      absoluteDir = selectedDir;
    }

    const res = await execute(filePath, mode, value, customPrefix, absoluteDir);
    if (res && !isActive) {
      notify(t('split.success'), 'split');
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
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('split.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('split.desc')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('common.step1')}</h3>
            {filePath ? (
              <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] flex justify-between items-center transition-all duration-300 shadow-sm">
                <div className="flex flex-col truncate mr-4">
                  <span className="font-medium text-[var(--text-primary)] truncate">{fileName}</span>
                  {totalPages && <span className="text-xs text-[var(--text-secondary)] mt-0.5">{totalPages} {t('extract.pagesLower')}</span>}
                </div>
                <button onClick={handleStartOver} className="text-sm text-[var(--text-secondary)] hover:text-[var(--error)] flex-shrink-0 transition-colors">
                  {t('common.change')}
                </button>
              </div>
            ) : (
              <DropZone onFileSelect={handleFileSelect} />
            )}
          </div>
        </div>

        {/* Right Column: Options */}
        <div className={`space-y-8 transition-opacity duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('split.step2')}</h3>
              <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-1 mb-4">
                <button 
                  onClick={() => {setMode('every_n'); setValue('1');}} 
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${mode === 'every_n' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {t('split.mode.single')}
                </button>
                <button 
                  onClick={() => {setMode('ranges'); setValue('');}} 
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${mode === 'ranges' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {t('split.mode.ranges')}
                </button>
              </div>

              <div className="animate-in fade-in zoom-in-95 duration-300">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={
                    mode === 'every_n' ? "e.g., 1 (split into single pages), 2 (split every 2 pages)" :
                    "e.g., 1-5, 8-10"
                  }
                  className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                />
                {mode === 'ranges' && filePath && totalPages && (
                  <button
                    onClick={() => setShowThumbnailPicker(true)}
                    className="mt-3 w-full py-2 px-4 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors text-sm font-medium shadow-sm"
                  >
                    {t('thumbnail.title')}
                  </button>
                )}
              </div>
            </div>

            {!askEveryTime && (
              <div className="pt-2">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('split.step3')}</h3>
                <input
                  type="text"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  placeholder={`${defaultPrefix}_part1.pdf`}
                  className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                />
                <p className="text-xs text-[var(--text-disabled)] mt-2">Outputs: [prefix]_part1.pdf, [prefix]_part2.pdf, etc.</p>
              </div>
            )}
          </div>

          {!result ? (
            <button
              onClick={handleSplit}
              disabled={!filePath || !value.trim() || loading}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
                !filePath || !value.trim() || loading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
              }`}
            >
              {loading ? t('split.buttonLoading') : t('split.button')}
            </button>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <button
                onClick={handleStartOver}
                className="w-full py-3.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-elevated)] transition-all duration-300 active:scale-[0.99] shadow-sm"
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
              details={`${t('split.generated')} ${result.total_files} ${t('split.files')}.`}
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
            setValue(rangesToString(pages));
            setShowThumbnailPicker(false);
          }}
          onClose={() => setShowThumbnailPicker(false)}
        />
      )}
    </div>
  );
}