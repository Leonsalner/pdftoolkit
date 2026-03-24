import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { BatchFileList, type BatchFile } from '../components/BatchFileList';
import { invoke } from '@tauri-apps/api/core';
import { useI18n } from '../lib/i18n';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { Page } from '../components/Sidebar';
import { makeSearchablePdf } from '../lib/invoke';

export interface OcrResult {
  text: string;
}

const extractTextOcr = (inputPath: string, lang: string) =>
  invoke<OcrResult>('extract_text_ocr', { inputPath, lang });

interface OcrPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function OcrPage({ notify, isActive }: OcrPageProps) {
  const { t } = useI18n();
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [ocrLang, setOcrLang] = useState('eng');
  const [ocrMode, setOcrMode] = useState<'extract' | 'searchable'>('extract');
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
        if (ocrMode === 'searchable') {
          const result = await makeSearchablePdf(file.path, ocrLang);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: 'done' as const, result: { path: result.output_path } }
                : f
            )
          );
        } else {
          const result = await extractTextOcr(file.path, ocrLang);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: 'done' as const, result }
                : f
            )
          );
        }
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
      notify(ocrMode === 'searchable' ? t('ocr.searchableSuccess') : t('ocr.success'), 'ocr');
    }
  };

  const handleSaveText = async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file || !file.result || typeof file.result !== 'object' || !('text' in file.result)) return;

    const result = file.result as OcrResult;
    const defaultName = file.name.replace(/\.pdf$/i, '_ocr.txt');
    const savePath = await save({
      defaultPath: defaultName,
      filters: [{ name: 'Text', extensions: ['txt'] }],
    });

    if (savePath) {
      await writeTextFile(savePath, result.text);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('ocr.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('ocr.desc')}</p>
      </div>

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
              <BatchFileList
                files={files}
                onRemove={handleRemove}
                onSaveText={ocrMode === 'extract' ? handleSaveText : undefined}
                t={t}
              />
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
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('ocr.modeTitle')}</h3>
              <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-1">
                <button
                  onClick={() => setOcrMode('extract')}
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                    ocrMode === 'extract'
                      ? 'bg-[var(--cat-intelligence-bg)] text-[var(--cat-intelligence)] shadow-sm border border-[var(--cat-intelligence)]/30'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t('ocr.modeExtract')}
                </button>
                <button
                  onClick={() => setOcrMode('searchable')}
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                    ocrMode === 'searchable'
                      ? 'bg-[var(--cat-intelligence-bg)] text-[var(--cat-intelligence)] shadow-sm border border-[var(--cat-intelligence)]/30'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t('ocr.modeSearchable')}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('ocr.language')}</h3>
              <select
                value={ocrLang}
                onChange={(e) => setOcrLang(e.target.value)}
                className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm text-[var(--text-primary)] px-3 py-2 border outline-none transition-colors"
              >
                <option value="eng">English</option>
                <option value="slk">Slovak</option>
                <option value="ces">Czech</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleProcessAll}
            disabled={pendingCount === 0 || isProcessing}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
              pendingCount === 0 || isProcessing
                ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
            }`}
          >
            {isProcessing ? t('batch.processing') : t('batch.processAll')}
          </button>

          {files.length > 0 && doneCount > 0 && (
            <ResultBanner
              type="success"
              message={ocrMode === 'searchable' ? t('ocr.searchableSuccess') : t('ocr.success')}
            />
          )}

          {files.length > 0 && errorCount > 0 && (
            <ResultBanner
              type="error"
              message={ocrMode === 'searchable' ? t('ocr.searchableFailed') : t('ocr.failed')}
            />
          )}
        </div>
      </div>
    </div>
  );
}