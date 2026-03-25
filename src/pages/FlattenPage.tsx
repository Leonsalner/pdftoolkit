import { useState } from 'react';
import { Loader2, Layers, FileStack } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { flattenPdf } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface FlattenPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function FlattenPage({ notify, isActive }: FlattenPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>('');
  const { recentFiles, addRecentFile } = useRecentFiles('flatten');

  const { execute: performFlatten, result, error, loading, reset } = useTauriCommand(flattenPdf);

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

  const handleFlatten = async () => {
    if (!filePath) return;

    const res = await performFlatten(filePath, outputName || undefined);
    if (res) {
      if (!isActive) {
        notify(t('flatten.success'), 'flatten');
      }
      if (fileName) {
        await addRecentFile(filePath, fileName);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="flatten" title={t('flatten.title')} description={t('flatten.desc')} />

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
              Flatten Options
            </p>
            
            <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--cat-security)] bg-[var(--cat-security-bg)]">
              <div className="p-2 rounded-lg bg-[var(--cat-security)] text-white shrink-0">
                <Layers size={18} />
              </div>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                This tool merges all interactive elements (form fields, annotations, comments) into the static content of the PDF. This makes the document non-editable and ensures it looks the same on all devices.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                Output Filename (Optional)
              </p>
              <div className="relative group">
                <input
                  type="text"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  placeholder={fileName ? fileName.replace(/\.pdf$/i, '_flattened.pdf') : ''}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                />
                <FileStack size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] group-focus-within:text-[var(--text-secondary)] transition-colors" />
              </div>
            </div>
          </div>

          {!result ? (
            <button
              onClick={handleFlatten}
              disabled={!filePath || loading}
              className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
                !filePath || loading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> {t('common.buttonLoading')}
                </span>
              ) : t('flatten.button')}
            </button>
          ) : (
            <button
              onClick={handleStartOver}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
            >
              {t('extract.buttonAnother')}
            </button>
          )}

          {error && <div className="animate-in fade-in zoom-in-95 duration-300"><ResultBanner type="error" message="Failed to flatten document" details={error} /></div>}
          {result && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message="Document Flattened Successfully"
                details={`${t('common.savedTo')} ${result.output_path}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
