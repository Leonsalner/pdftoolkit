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
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('ocr.title')}</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {files.length === 0 ? t('common.step1') : t('common.step1.add')}
          </h3>
          <DropZone onFileSelect={handleFileSelect} multiple />
        </div>

        {files.length > 0 && (
          <div className="flex gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => setOcrMode('extract')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                ocrMode === 'extract'
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-400'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
              }`}
            >
              {t('ocr.modeExtract')}
            </button>
            <button
              onClick={() => setOcrMode('searchable')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                ocrMode === 'searchable'
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-400'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
              }`}
            >
              {t('ocr.modeSearchable')}
            </button>
          </div>
        )}

        {files.length > 0 && (
          <BatchFileList
            files={files}
            onRemove={handleRemove}
            onSaveText={ocrMode === 'extract' ? handleSaveText : undefined}
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
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('ocr.language')}</h3>
            <select
              value={ocrLang}
              onChange={(e) => setOcrLang(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border"
            >
              <option value="eng">English</option>
              <option value="slk">Slovak</option>
              <option value="ces">Czech</option>
            </select>
          </div>
        )}

        {files.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={handleProcessAll}
              disabled={pendingCount === 0 || isProcessing}
              className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                pendingCount === 0 || isProcessing
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
  );
}
