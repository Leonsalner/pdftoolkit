import { useState } from 'react';
import { Loader2, FileText, Search, Globe, Cpu } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { BatchFileList, type BatchFile } from '../components/BatchFileList';
import { invoke } from '@tauri-apps/api/core';
import { useRecentFiles } from '../hooks/useRecentFiles';
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
  const { recentFiles, addRecentFile } = useRecentFiles('ocr');

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
        if (ocrMode === 'searchable') {
          const result = await makeSearchablePdf(file.path, ocrLang);
          await addRecentFile(file.path, file.name);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: 'done' as const, result: { path: result.output_path } }
                : f
            )
          );
        } else {
          const result = await extractTextOcr(file.path, ocrLang);
          await addRecentFile(file.path, file.name);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: 'done' as const, result }
                : f
            )
          );
        }
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
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="ocr" title={t('ocr.title')} description={t('ocr.desc')} />

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
              <BatchFileList
                files={files}
                onRemove={handleRemove}
                onSaveText={ocrMode === 'extract' ? handleSaveText : undefined}
                t={t}
              />
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
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-3">
                Recognition Mode
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setOcrMode('extract')}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left group ${
                    ocrMode === 'extract'
                      ? 'border-[var(--cat-intelligence)] bg-[var(--cat-intelligence-bg)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)] hover:-translate-y-[1px]'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-colors ${ocrMode === 'extract' ? 'bg-[var(--cat-intelligence)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] group-hover:text-[var(--text-secondary)]'}`}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${ocrMode === 'extract' ? 'text-[var(--cat-intelligence)]' : 'text-[var(--text-primary)]'}`}>
                      {t('ocr.modeExtract')}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Extract plain text to a separate file</p>
                  </div>
                </button>

                <button
                  onClick={() => setOcrMode('searchable')}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left group ${
                    ocrMode === 'searchable'
                      ? 'border-[var(--cat-intelligence)] bg-[var(--cat-intelligence-bg)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)] hover:-translate-y-[1px]'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-colors ${ocrMode === 'searchable' ? 'bg-[var(--cat-intelligence)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] group-hover:text-[var(--text-secondary)]'}`}>
                    <Search size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${ocrMode === 'searchable' ? 'text-[var(--cat-intelligence)]' : 'text-[var(--text-primary)]'}`}>
                      {t('ocr.modeSearchable')}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Create a searchable PDF layer under the image</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">{t('ocr.language')}</p>
              <div className="relative group">
                <select
                  value={ocrLang}
                  onChange={(e) => setOcrLang(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                >
                  <option value="eng">English</option>
                  <option value="slk">Slovak</option>
                  <option value="ces">Czech</option>
                </select>
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <Cpu size={14} className="text-[var(--text-disabled)] mt-0.5" />
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed italic">
                OCR is a CPU-intensive task. Processing large documents may take several minutes and will utilize all available system cores.
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
            ) : t('batch.processAll')}
          </button>

          {files.length > 0 && doneCount > 0 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message={ocrMode === 'searchable' ? t('ocr.searchableSuccess') : t('ocr.success')}
              />
            </div>
          )}

          {files.length > 0 && errorCount > 0 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="error"
                message={ocrMode === 'searchable' ? t('ocr.searchableFailed') : t('ocr.failed')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
