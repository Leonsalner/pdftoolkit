import { useState } from 'react';
import { Loader2, Type, Image as ImageIcon, FileText, Layout } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { BatchFileList, type BatchFile } from '../components/BatchFileList';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { addTextWatermark, addImageWatermark } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';
import { open } from '@tauri-apps/plugin-dialog';

interface WatermarkPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function WatermarkPage({ notify, isActive }: WatermarkPageProps) {
  const { t } = useI18n();
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { recentFiles, addRecentFile } = useRecentFiles('watermark');
  
  const [mode, setMode] = useState<'text' | 'image'>('text');

  // Text options
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState('#666666'); 

  // Image options
  const [imagePath, setImagePath] = useState('');
  const [scale, setScale] = useState(1.0);

  // Common options
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(45);
  const [pages, setPages] = useState('all');

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

  const handleBrowseImage = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
    });
    if (selected && !Array.isArray(selected)) {
      setImagePath(selected);
    }
  };

  const handleProcessAll = async () => {
    if (mode === 'image' && !imagePath) return;

    setIsProcessing(true);
    let success = 0;

    // Convert hex color to RGB for text mode
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const rgb: [number, number, number] = [r, g, b];

    const pagesParam = pages === 'all' || !pages.trim() ? undefined : pages;

    for (const file of files.filter((f) => f.status === 'pending')) {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' as const } : f))
      );

      try {
        let result;
        if (mode === 'text') {
          result = await addTextWatermark(
            file.path,
            text,
            pagesParam,
            fontSize,
            opacity,
            rotation,
            rgb
          );
        } else {
          result = await addImageWatermark(
            file.path,
            imagePath,
            pagesParam,
            scale,
            opacity,
            rotation
          );
        }
        
        await addRecentFile(file.path, file.name);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'done' as const, result }
              : f
          )
        );
        success++;
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

    if (success > 0 && !isActive) {
      notify(t('watermark.success'), 'watermark');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="watermark" title={t('watermark.title')} description={t('watermark.desc')} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8 xl:gap-10">
        {/* Left Column: Input */}
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

        {/* Right Column: Options & Action */}
        <div className={`space-y-5 transition-all duration-300 ${files.length > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-3">
                Watermark Mode
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('text')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    mode === 'text'
                      ? 'border-[var(--cat-content)] bg-[var(--cat-content-bg)] text-[var(--cat-content)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <Type size={18} className={mode === 'text' ? 'text-[var(--cat-content)]' : 'text-[var(--text-disabled)]'} />
                  <span className={`text-sm font-semibold ${mode === 'text' ? 'text-[var(--cat-content)]' : 'text-[var(--text-primary)]'}`}>
                    Text
                  </span>
                </button>
                <button
                  onClick={() => setMode('image')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    mode === 'image'
                      ? 'border-[var(--cat-content)] bg-[var(--cat-content-bg)] text-[var(--cat-content)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <ImageIcon size={18} className={mode === 'image' ? 'text-[var(--cat-content)]' : 'text-[var(--text-disabled)]'} />
                  <span className={`text-sm font-semibold ${mode === 'image' ? 'text-[var(--cat-content)]' : 'text-[var(--text-primary)]'}`}>
                    Image
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-5 animate-in fade-in duration-300">
              {mode === 'text' ? (
                <>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                      {t('watermark.text')}
                    </p>
                    <div className="relative group">
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                      />
                      <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] group-focus-within:text-[var(--text-secondary)] transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                        {t('watermark.fontSize')}
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range" min="10" max="200"
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value))}
                          className="flex-1 accent-[var(--text-primary)]"
                        />
                        <span className="text-[10px] font-bold tabular-nums text-[var(--text-primary)] w-8 text-right bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                          {fontSize}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                        {t('watermark.color')}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="relative h-6 w-full rounded border border-[var(--border)] overflow-hidden">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="absolute -inset-1 h-[200%] w-[200%] cursor-pointer"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                          {color}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                      Image File
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <input
                          type="text"
                          readOnly
                          value={imagePath}
                          placeholder="Select a PNG or JPEG..."
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors"
                        />
                        <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                      </div>
                      <button
                        onClick={handleBrowseImage}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
                      >
                        {t('settings.browse')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                      Image Scale
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="0.1" max="5.0" step="0.1"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="flex-1 accent-[var(--text-primary)]"
                      />
                      <span className="text-[10px] font-bold tabular-nums text-[var(--text-primary)] w-8 text-right bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                        {scale.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                    {t('watermark.rotation')}
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="-180" max="180"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className="flex-1 accent-[var(--text-primary)]"
                    />
                    <span className="text-[10px] font-bold tabular-nums text-[var(--text-primary)] w-8 text-right bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                      {rotation}°
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                    {t('watermark.opacity')}
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="0.1" max="1" step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="flex-1 accent-[var(--text-primary)]"
                    />
                    <span className="text-[10px] font-bold tabular-nums text-[var(--text-primary)] w-8 text-right bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                      {Math.round(opacity * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                  {t('watermark.pages')}
                </p>
                <div className="relative group">
                  <input
                    type="text"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    placeholder="all or 1,2,5"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                  />
                  <Layout size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] group-focus-within:text-[var(--text-secondary)] transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleProcessAll}
            disabled={pendingCount === 0 || isProcessing || (mode === 'image' && !imagePath)}
            className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
              pendingCount === 0 || isProcessing || (mode === 'image' && !imagePath)
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

          {doneCount > 0 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message={t('watermark.success')}
                details={`${doneCount} files processed.`}
              />
            </div>
          )}

          {errorCount > 0 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="error"
                message={t('watermark.failed')}
                details={`${errorCount} files failed.`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
