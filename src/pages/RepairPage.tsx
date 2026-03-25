import { useState } from 'react';
import { Loader2, Wrench } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { BatchFileList, type BatchFile } from '../components/BatchFileList';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { repairPdf } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface RepairPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function RepairPage({ notify, isActive }: RepairPageProps) {
  const { t } = useI18n();
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { recentFiles, addRecentFile } = useRecentFiles('repair');

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  const handleAddFiles = (paths: string[], names: string[]) => {
    const remaining = 10 - files.length;
    const toAdd = paths.slice(0, remaining).map((p, i) => ({
      id: crypto.randomUUID(),
      path: p,
      name: names[i] || p.split('/').pop() || p,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...toAdd]);
  };

  const handleFileSelect = (path: any, name: any) => {
    if (Array.isArray(path)) {
      const n = Array.isArray(name) ? name : path.map((p: string) => p.split('/').pop() || p);
      handleAddFiles(path, n);
    } else {
      handleAddFiles([path], [name]);
    }
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const handleProcessAll = async () => {
    setIsProcessing(true);
    let successCount = 0;

    for (const file of files.filter((f) => f.status === 'pending')) {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' as const } : f))
      );

      try {
        const result = await repairPdf(file.path);
        await addRecentFile(file.path, file.name);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'done' as const, result }
              : f
          )
        );
        successCount++;
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'error' as const, error: String(err) }
              : f
          )
        );
      }
    }

    setIsProcessing(false);

    if (successCount > 0 && !isActive) {
      notify(t('repair.success'), 'repair');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="repair" title={t('repair.title')} description={t('repair.desc')} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8 xl:gap-10">
        {/* Left Column: File Selection */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                {files.length === 0 ? t('common.step1') : t('common.step1.add')}
              </h3>
              {files.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={isProcessing}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors"
                >
                  {t('batch.clearAll')}
                </button>
              )}
            </div>
            
            <DropZone onFileSelect={handleFileSelect} multiple />
            {files.length === 0 && (
              <RecentFiles
                files={recentFiles}
                onSelect={(path, name) => {
                  handleFileSelect(path, name);
                  void addRecentFile(path, name);
                }}
              />
            )}
          </div>
          
          {files.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <BatchFileList files={files} onRemove={handleRemove} t={t} />
              <div className="mt-4 px-4 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)]">
                <span>{files.length} Files</span>
                <span className="flex gap-3">
                  <span className="text-[var(--success)]">{doneCount} Done</span>
                  <span className="text-[var(--error)]">{errorCount} Errors</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Options & Processing */}
        <div className={`space-y-5 transition-all duration-300 ${files.length > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
              Repair Strategy
            </p>
            
            <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--cat-documents)] bg-[var(--cat-documents-bg)]">
              <div className="p-2 rounded-lg bg-[var(--cat-documents)] text-white shrink-0">
                <Wrench size={18} />
              </div>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                This tool automatically rewrites cross-reference tables and streams. It uses a multi-stage approach, starting with <strong>qpdf</strong> for structural integrity and falling back to <strong>Ghostscript</strong> for aggressive content recovery.
              </p>
            </div>
          </div>

          <button
            onClick={handleProcessAll}
            disabled={pendingCount === 0 || isProcessing}
            className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
              pendingCount === 0 || isProcessing
                ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={15} className="animate-spin" /> {t('batch.processing')}
              </span>
            ) : t('repair.button')}
          </button>

          {doneCount > 0 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message="Repair Complete"
                details={`${doneCount} files successfully reconstructed.`}
              />
            </div>
          )}

          {errorCount > 0 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="error"
                message="Repair Failed"
                details={`${errorCount} files were too corrupted to be recovered.`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
