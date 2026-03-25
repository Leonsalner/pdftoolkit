import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { removeBlankPages } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface CleanPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
  gsAvailable: boolean;
}

export function CleanPage({ notify, isActive, gsAvailable }: CleanPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>('');
  const { recentFiles, addRecentFile } = useRecentFiles('clean');

  const { execute: performClean, result, error, loading, reset } = useTauriCommand(removeBlankPages);

  const handleFileSelect = (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    setFilePath(p);
    setFileName(n);
    setOutputName('');
    reset();
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setOutputName('');
    reset();
  };

  const handleClean = async () => {
    if (!filePath) return;

    const res = await performClean(filePath, outputName || undefined);
    if (res) {
      if (!isActive) {
        notify(t('clean.success'), 'clean');
      }
      if (fileName) {
        await addRecentFile(filePath, fileName);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="clean" title={t('clean.title')} description={t('clean.desc')} />

      {!gsAvailable && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200">
          <p className="font-semibold text-sm">{t('compress.gsRequired')}</p>
          <p className="text-xs mt-1 opacity-90">{t('compress.gsInstall')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8 xl:gap-10">
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

        {/* Right Column: Options & Action */}
        <div className={`space-y-5 transition-all duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
              Cleaning Options
            </p>
            
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                Output Filename (Optional)
              </p>
              <input
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder={fileName ? fileName.replace(/\.pdf$/i, '_cleaned.pdf') : ''}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
              />
              <p className="text-[10px] text-[var(--text-secondary)] mt-2 leading-relaxed">
                The tool will analyze every page and remove those containing no visible content.
              </p>
            </div>
          </div>

          {!result ? (
            <button
              onClick={handleClean}
              disabled={!filePath || !gsAvailable || loading}
              className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
                !filePath || !gsAvailable || loading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> {t('common.buttonLoading')}
                </span>
              ) : t('clean.button')}
            </button>
          ) : (
            <button
              onClick={handleStartOver}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
            >
              {t('extract.buttonAnother')}
            </button>
          )}

          {error && <div className="animate-in fade-in zoom-in-95 duration-300"><ResultBanner type="error" message="Failed to process document" details={error} /></div>}
          {result && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message={t('clean.success')}
                details={`${result.pages_removed} blank pages removed from ${result.original_pages} total. Saved to ${result.output_path}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
