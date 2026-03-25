import { useState, useEffect } from 'react';
import { Loader2, Layers, Scissors, Plus } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { ThumbnailPickerModal, rangesToString } from '../components/ThumbnailPickerModal';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { useRecentFiles } from '../hooks/useRecentFiles';
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
  const { recentFiles, addRecentFile } = useRecentFiles('split');
  
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
    if (res && fileName) {
      await addRecentFile(filePath, fileName);
    }
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setCustomPrefix('');
    setValue('1');
    setMode('every_n');
    resetPageCount();
    reset();
  };

  const defaultPrefix = fileName ? fileName.replace(/\.pdf$/i, '') : '';

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="split" title={t('split.title')} description={t('split.desc')} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8 xl:gap-10">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('common.step1')}</h3>
            {filePath ? (
              <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] flex justify-between items-center transition-all duration-300 shadow-sm">
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="font-medium text-[var(--text-primary)] truncate">{fileName}</span>
                  {totalPages && <span className="text-xs text-[var(--text-secondary)] mt-0.5">{totalPages} {t('extract.pagesLower')}</span>}
                </div>
                <button onClick={handleStartOver} className="text-sm text-[var(--text-secondary)] hover:text-[var(--error)] flex-shrink-0 transition-colors">
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
          </div>
        </div>

        {/* Right Column: Options */}
        <div className={`space-y-5 transition-all duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
              {t('split.step2')}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => { setMode('every_n'); setValue('1'); reset(); }}
                className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 group ${
                  mode === 'every_n'
                    ? 'border-[var(--cat-documents)] bg-[var(--cat-documents-bg)]'
                    : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)] hover:-translate-y-[1px]'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${mode === 'every_n' ? 'bg-[var(--cat-documents)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] group-hover:text-[var(--text-secondary)]'}`}>
                  <Layers size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${mode === 'every_n' ? 'text-[var(--cat-documents)]' : 'text-[var(--text-primary)]'}`}>
                    {t('split.mode.single')}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Split the document into multiple files every N pages</p>
                </div>
              </button>

              <button
                onClick={() => { setMode('ranges'); setValue(''); reset(); }}
                className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 group ${
                  mode === 'ranges'
                    ? 'border-[var(--cat-documents)] bg-[var(--cat-documents-bg)]'
                    : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)] hover:-translate-y-[1px]'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${mode === 'ranges' ? 'bg-[var(--cat-documents)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] group-hover:text-[var(--text-secondary)]'}`}>
                  <Scissors size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${mode === 'ranges' ? 'text-[var(--cat-documents)]' : 'text-[var(--text-primary)]'}`}>
                    {t('split.mode.ranges')}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Extract specific page sets into their own individual files</p>
                </div>
              </button>
            </div>

            <div className="border-t border-[var(--border)] pt-5 mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                  {mode === 'every_n' ? 'Pages Per File' : 'Custom Ranges'}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => { setValue(e.target.value); reset(); }}
                    placeholder={
                      mode === 'every_n' ? "e.g. 1" : "e.g. 1-5, 8-10"
                    }
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                  />
                  {mode === 'ranges' && filePath && totalPages && (
                    <button
                      onClick={() => setShowThumbnailPicker(true)}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-hover)] active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center gap-2"
                    >
                      <Plus size={14} /> {t('thumbnail.title')}
                    </button>
                  )}
                </div>
              </div>

              {!askEveryTime && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                    {t('split.step3')}
                  </p>
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    placeholder={`${defaultPrefix}_part1.pdf`}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] mt-2 leading-relaxed opacity-70">
                    Outputs will be named: <span className="font-mono">{customPrefix || defaultPrefix}_part1.pdf</span>, etc.
                  </p>
                </div>
              )}
            </div>
          </div>

          {!result ? (
            <button
              onClick={handleSplit}
              disabled={!filePath || !value.trim() || loading}
              className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
                !filePath || !value.trim() || loading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> {t('split.buttonLoading')}
                </span>
              ) : t('split.button')}
            </button>
          ) : (
            <button
              onClick={handleStartOver}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
            >
              {t('split.buttonAnother')}
            </button>
          )}

          {error && <div className="animate-in fade-in zoom-in-95 duration-300"><ResultBanner type="error" message={t('split.failed')} details={error} /></div>}
          {result && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message={t('split.success')}
                details={`${t('split.generated')} ${result.total_files} ${t('split.files')}.`}
              />
            </div>
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
            reset();
          }}
          onClose={() => setShowThumbnailPicker(false)}
        />
      )}
    </div>
  );
}
