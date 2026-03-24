import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { invoke } from '@tauri-apps/api/core';
import { useI18n } from '../lib/i18n';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { Page } from '../components/Sidebar';

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
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [ocrLang, setOcrLang] = useState('eng');

  const { execute, result, error, loading, reset } = useTauriCommand(extractTextOcr);

  const handleFileSelect = (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    setFilePath(p);
    setFileName(n);
    reset();
  };

  const handleExtract = async () => {
    if (filePath) {
      const res = await execute(filePath, ocrLang);
      if (res && !isActive) {
        notify(t('ocr.success'), 'ocr');
      }
    }
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    reset();
  };

  const handleSaveText = async () => {
    if (!result || !result.text) return;
    
    try {
      const defaultName = fileName ? fileName.replace(/\.pdf$/i, '_ocr.txt') : 'extracted_ocr.txt';
      const savePath = await save({
        defaultPath: defaultName,
        filters: [{ name: 'Text', extensions: ['txt'] }]
      });

      if (savePath) {
        await writeTextFile(savePath, result.text);
      }
    } catch (err) {
      console.error('Failed to save file', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('ocr.title')}</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('common.step1')}</h3>
          {filePath ? (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center transition-all duration-300">
              <span className="font-medium truncate">{fileName}</span>
              <button
                onClick={handleStartOver}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                {t('common.change')}
              </button>
            </div>
          ) : (
            <DropZone onFileSelect={handleFileSelect} />
          )}
        </div>

        {filePath && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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

        {!result ? (
          <div>
            <button
              onClick={handleExtract}
              disabled={!filePath || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                !filePath || loading
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {loading ? t('ocr.buttonLoading') : t('ocr.button')}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <ResultBanner
              type="success"
              message={t('ocr.success')}
            />
            
            <details className="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              <summary className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer font-medium text-gray-700 dark:text-gray-200 select-none flex justify-between items-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50">
                {t('ocr.textPreview')}
                <span className="transform group-open:rotate-180 transition-transform duration-300">▼</span>
              </summary>
              <div className="p-4 bg-white dark:bg-[#0f1117] max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                  {result.text}
                </pre>
              </div>
            </details>

            <div className="flex gap-4">
              <button
                onClick={handleSaveText}
                className="flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-sm"
              >
                {t('ocr.saveText')}
              </button>
              <button
                onClick={handleStartOver}
                className="flex-1 py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 active:scale-[0.98]"
              >
                {t('ocr.buttonAnother')}
              </button>
            </div>
          </div>
        )}

        {error && <ResultBanner type="error" message={t('ocr.failed')} details={error} />}
      </div>
    </div>
  );
}