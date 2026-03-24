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
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('watermark.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('watermark.desc')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
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
              <DropZone onFileSelect={handleFileSelect} />
            )}
          </div>
        </div>

        {/* Right Column: Options & Action */}
        <div className={`space-y-8 transition-opacity duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('watermark.text')}</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => { setText(e.target.value); reset(); }}
                  className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('watermark.fontSize')} ({fontSize})</label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={fontSize}
                  onChange={(e) => { setFontSize(parseInt(e.target.value)); reset(); }}
                  className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('watermark.rotation')} ({rotation}°)</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => { setRotation(parseInt(e.target.value)); reset(); }}
                  className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('watermark.opacity')} ({Math.round(opacity * 100)}%)</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => { setOpacity(parseFloat(e.target.value)); reset(); }}
                  className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('watermark.color')}</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => { setColor(e.target.value); reset(); }}
                    className="h-9 w-12 rounded border-[var(--border)] bg-[var(--bg-elevated)] p-0 cursor-pointer outline-none"
                  />
                  <span className="text-sm font-mono text-[var(--text-secondary)] uppercase">{color}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('watermark.pages')}</label>
                <input
                  type="text"
                  value={pages}
                  onChange={(e) => { setPages(e.target.value); reset(); }}
                  placeholder="all or 1,2,5"
                  className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {!result ? (
            <button
              onClick={handleWatermark}
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
                loading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
              }`}
            >
              {loading ? t('watermark.buttonLoading') : t('watermark.button')}
            </button>
          ) : (
            <button
              onClick={handleStartOver}
              className="w-full py-3.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-elevated)] transition-all duration-300 active:scale-[0.99] shadow-sm"
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
      </div>
    </div>
  );
}