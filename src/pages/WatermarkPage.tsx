import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { addTextWatermark } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface WatermarkPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function WatermarkPage({ notify, isActive }: WatermarkPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(60);
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState('#666666'); 
  const [pages, setPages] = useState('all');

  const { execute: performWatermark, result, error, loading, reset } = useTauriCommand(addTextWatermark);

  const handleFileSelect = (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    setFilePath(p);
    setFileName(n);
    reset();
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    reset();
  };

  const handleWatermark = async () => {
    if (!filePath) return;

    // Convert hex color to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const rgb: [number, number, number] = [r, g, b];

    const res = await performWatermark(
      filePath,
      text,
      pages === 'all' ? undefined : pages,
      fontSize,
      opacity,
      rotation,
      rgb
    );

    if (res && !isActive) {
      notify(t('watermark.success'), 'watermark');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('watermark.title')}</h2>

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
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('watermark.text')}</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => { setText(e.target.value); reset(); }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('watermark.fontSize')} ({fontSize})</label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={fontSize}
                  onChange={(e) => { setFontSize(parseInt(e.target.value)); reset(); }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('watermark.rotation')} ({rotation}°)</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => { setRotation(parseInt(e.target.value)); reset(); }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('watermark.opacity')} ({Math.round(opacity * 100)}%)</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => { setOpacity(parseFloat(e.target.value)); reset(); }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('watermark.color')}</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => { setColor(e.target.value); reset(); }}
                    className="h-9 w-12 rounded border-gray-300 dark:border-gray-700 bg-transparent p-0 cursor-pointer"
                  />
                  <span className="text-sm font-mono text-gray-500 dark:text-gray-400 uppercase">{color}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('watermark.pages')}</label>
                <input
                  type="text"
                  value={pages}
                  onChange={(e) => { setPages(e.target.value); reset(); }}
                  placeholder="all or 1,2,5"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border"
                />
              </div>
            </div>

            {!result ? (
              <button
                onClick={handleWatermark}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                }`}
              >
                {loading ? t('watermark.buttonLoading') : t('watermark.button')}
              </button>
            ) : (
              <button
                onClick={handleStartOver}
                className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
              >
                {t('extract.buttonAnother')}
              </button>
            )}

            {error && <ResultBanner type="error" message={t('watermark.failed')} details={error} />}
            {result && (
              <ResultBanner
                type="success"
                message={t('watermark.success')}
                details={`${t('common.savedTo')} ${result.output_path}`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
