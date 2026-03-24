import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { PresetSelector } from '../components/PresetSelector';
import { ResultBanner } from '../components/ResultBanner';
import { BatchFileList, type BatchFile } from '../components/BatchFileList';
import { compressPdf, Preset } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface CompressPageProps {
  gsAvailable: boolean;
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function CompressPage({ gsAvailable, notify, isActive }: CompressPageProps) {
  const { t } = useI18n();
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [preset, setPreset] = useState<Preset>('ebook');
  const [isProcessing, setIsProcessing] = useState(false);

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
    let doneCount = 0;

    for (const file of files.filter((f) => f.status === 'pending')) {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' as const } : f))
      );

      try {
        await compressPdf(file.path, preset);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'done' as const }
              : f
          )
        );
        doneCount++;
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

    if (doneCount > 0 && !isActive) {
      notify(t('compress.success'), 'compress');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('compress.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('compress.desc')}</p>
      </div>

      {!gsAvailable && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200">
          <p className="font-semibold">{t('compress.gsRequired')}</p>
          <p className="text-sm mt-1 opacity-90">{t('compress.gsInstall')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
        {/* Left Column: File Selection */}
        <div className="space-y-6">
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              {files.length === 0 ? t('common.step1') : t('common.step1.add')}
            </h3>
            {files.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isProcessing}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {t('batch.clearAll')}
              </button>
            )}
          </div>
          
          <DropZone onFileSelect={handleFileSelect} multiple />
          
          {files.length > 0 && (
            <div className="mt-6">
              <BatchFileList files={files} onRemove={handleRemove} t={t} />
            </div>
          )}

          {files.length > 0 && (
            <div className="text-sm text-[var(--text-disabled)] text-center pt-2">
              {`${files.length} files | ${doneCount} done | ${errorCount} errors`}
            </div>
          )}
        </div>

        {/* Right Column: Options & Processing */}
        <div className={`space-y-8 transition-opacity duration-300 ${files.length > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
              {t('common.step2.preset')}
            </h3>
            <PresetSelector
              value={preset}
              onChange={(p) => setPreset(p)}
              fileSize={null}
            />
          </div>

          <button
            onClick={handleProcessAll}
            disabled={pendingCount === 0 || !gsAvailable || isProcessing}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
              pendingCount === 0 || !gsAvailable || isProcessing
                ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
            }`}
          >
            {isProcessing ? t('batch.processing') : t('batch.processAll')}
          </button>

          {files.length > 0 && doneCount > 0 && (
            <ResultBanner
              type="success"
              message={t('compress.success')}
              details={`${doneCount} ${t('split.files')}`}
            />
          )}

          {files.length > 0 && errorCount > 0 && (
            <ResultBanner
              type="error"
              message={t('compress.failed')}
              details={`${errorCount} ${t('batch.status.error')}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}