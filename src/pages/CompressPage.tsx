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
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('compress.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('compress.desc')}</p>
      </div>

      {!gsAvailable && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200">
          <p className="font-semibold">{t('compress.gsRequired')}</p>
          <p className="text-sm mt-1">{t('compress.gsInstall')}</p>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {files.length === 0 ? t('common.step1') : t('common.step1.add')}
          </h3>
          <DropZone onFileSelect={handleFileSelect} multiple />
        </div>

        {files.length > 0 && (
          <BatchFileList
            files={files}
            onRemove={handleRemove}
            t={t}
          />
        )}

        {files.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={handleClearAll}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              {t('batch.clearAll')}
            </button>
          </div>
        )}

        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('common.step2.preset')}
            </h3>
            <PresetSelector
              value={preset}
              onChange={(p) => setPreset(p)}
              fileSize={null}
            />
          </div>
        )}

        {files.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={handleProcessAll}
              disabled={pendingCount === 0 || !gsAvailable || isProcessing}
              className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                pendingCount === 0 || !gsAvailable || isProcessing
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? t('batch.processing') : t('batch.processAll')}
            </button>
          </div>
        )}

        {files.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {`${files.length} files | ${doneCount} done | ${errorCount} errors`}
          </div>
        )}

        {files.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t('batch.maxFiles')}
          </div>
        )}

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
  );
}
