import { useState, useEffect } from 'react';
import { Loader2, FileImage, Image as ImageIcon, FolderTree, Archive, Plus } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { RangeInput } from '../components/RangeInput';
import { ResultBanner } from '../components/ResultBanner';
import { ThumbnailPickerModal, rangesToString } from '../components/ThumbnailPickerModal';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { convertPdfToImages, getPdfPageCount } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface ConvertPageProps {
  gsAvailable: boolean;
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function ConvertPage({ gsAvailable, notify, isActive }: ConvertPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [outputMode, setOutputMode] = useState<'subfolder' | 'zip'>('subfolder');
  const [rangeInput, setRangeInput] = useState('');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);
  const { recentFiles, addRecentFile } = useRecentFiles('convert');

  const { execute: fetchPageCount, result: totalPages, error: pageCountError, reset: resetPageCount } = useTauriCommand(getPdfPageCount);
  const { execute: performConvert, result, error: convertError, loading, reset: resetConvert } = useTauriCommand(convertPdfToImages);

  useEffect(() => {
    if (filePath) {
      fetchPageCount(filePath);
    }
  }, [filePath, fetchPageCount]);

  const handleFileSelect = (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    setFilePath(p);
    setFileName(n);
    setRangeInput('');
    setCustomFileName('');
    resetPageCount();
    resetConvert();
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setRangeInput('');
    setCustomFileName('');
    resetPageCount();
    resetConvert();
  };

  const defaultOutputName = fileName ? fileName.replace(/\.pdf$/i, '') : 'converted';

  const handleConvert = async () => {
    if (!filePath) return;

    const res = await performConvert(
      filePath,
      format,
      rangeInput || undefined,
      outputMode,
      customFileName || undefined
    );

    if (res) {
      if (!isActive) {
        notify(t('convert.success'), 'convert');
      }
      if (fileName) {
        await addRecentFile(filePath, fileName);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="convert" title={t('convert.title')} description={t('convert.desc')} />

      {!gsAvailable && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200">
          <p className="font-semibold text-sm">{t('compress.gsRequired')}</p>
          <p className="text-xs mt-1 opacity-90">{t('compress.gsInstall')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8 xl:gap-10">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('common.step1')}</h3>
            {filePath ? (
              <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] flex justify-between items-center transition-all duration-300 shadow-sm">
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="font-medium text-[var(--text-primary)] truncate">{fileName}</span>
                  {totalPages && <span className="text-xs text-[var(--text-secondary)] mt-0.5">{totalPages} {t('extract.pagesLower')}</span>}
                </div>
                <button
                  onClick={handleStartOver}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors flex-shrink-0"
                >
                  {t('common.change')}
                </button>
              </div>
            ) : (
              <>
                <DropZone onFileSelect={handleFileSelect} />
                <RecentFiles
                  files={recentFiles}
                  onSelect={(path, name) => {
                    handleFileSelect(path, name);
                    void addRecentFile(path, name);
                  }}
                />
              </>
            )}
            {pageCountError && <p className="mt-2 text-sm text-[var(--error)]">{pageCountError}</p>}
          </div>
        </div>

        {/* Right Column: Options & Action */}
        <div className={`space-y-5 transition-all duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-3">
                  {t('convert.format')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setFormat('png'); resetConvert(); }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      format === 'png'
                        ? 'border-[var(--cat-content)] bg-[var(--cat-content-bg)] text-[var(--cat-content)] shadow-sm'
                        : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <ImageIcon size={18} className={format === 'png' ? 'text-[var(--cat-content)]' : 'text-[var(--text-disabled)]'} />
                    <span className={`text-sm font-semibold ${format === 'png' ? 'text-[var(--cat-content)]' : 'text-[var(--text-primary)]'}`}>
                      {t('convert.formatPng')}
                    </span>
                  </button>
                  <button
                    onClick={() => { setFormat('jpeg'); resetConvert(); }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      format === 'jpeg'
                        ? 'border-[var(--cat-content)] bg-[var(--cat-content-bg)] text-[var(--cat-content)] shadow-sm'
                        : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <FileImage size={18} className={format === 'jpeg' ? 'text-[var(--cat-content)]' : 'text-[var(--text-disabled)]'} />
                    <span className={`text-sm font-semibold ${format === 'jpeg' ? 'text-[var(--cat-content)]' : 'text-[var(--text-primary)]'}`}>
                      {t('convert.formatJpeg')}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-3">
                  {t('convert.outputMode')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setOutputMode('subfolder'); resetConvert(); }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      outputMode === 'subfolder'
                        ? 'border-[var(--cat-content)] bg-[var(--cat-content-bg)] text-[var(--cat-content)] shadow-sm'
                        : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <FolderTree size={18} className={outputMode === 'subfolder' ? 'text-[var(--cat-content)]' : 'text-[var(--text-disabled)]'} />
                    <span className={`text-sm font-semibold ${outputMode === 'subfolder' ? 'text-[var(--cat-content)]' : 'text-[var(--text-primary)]'}`}>
                      {t('convert.outputModeFolder')}
                    </span>
                  </button>
                  <button
                    onClick={() => { setOutputMode('zip'); resetConvert(); }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      outputMode === 'zip'
                        ? 'border-[var(--cat-content)] bg-[var(--cat-content-bg)] text-[var(--cat-content)] shadow-sm'
                        : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <Archive size={18} className={outputMode === 'zip' ? 'text-[var(--cat-content)]' : 'text-[var(--text-disabled)]'} />
                    <span className={`text-sm font-semibold ${outputMode === 'zip' ? 'text-[var(--cat-content)]' : 'text-[var(--text-primary)]'}`}>
                      {t('convert.outputModeZip')}
                    </span>
                  </button>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                  {t('convert.step4')}
                </p>
                <div className="flex gap-2">
                  <RangeInput value={rangeInput} onChange={(val) => { setRangeInput(val); resetConvert(); }} totalPages={totalPages || null} />
                  {totalPages && (
                    <button
                      onClick={() => setShowThumbnailPicker(true)}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-hover)] active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus size={14} /> {t('thumbnail.title')}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                  {t('convert.step5')}
                </p>
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder={defaultOutputName}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {!result ? (
            <button
              onClick={handleConvert}
              disabled={loading}
              className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
                loading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> {t('convert.buttonLoading')}
                </span>
              ) : t('convert.button')}
            </button>
          ) : (
            <button
              onClick={handleStartOver}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
            >
              {t('extract.buttonAnother')}
            </button>
          )}
          
          {convertError && <div className="animate-in fade-in zoom-in-95 duration-300"><ResultBanner type="error" message={t('convert.failed')} details={convertError} /></div>}
          {result && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message={t('convert.success')}
                details={`${t('common.savedTo')} ${result.output_path} | ${result.pages_converted} ${t('convert.pagesConverted')}`}
              />
            </div>
          )}
        </div>

        {filePath && totalPages && (
          <ThumbnailPickerModal
            isOpen={showThumbnailPicker}
            inputPath={filePath}
            totalPages={totalPages}
            onConfirm={(pages) => {
              setRangeInput(rangesToString(pages));
              setShowThumbnailPicker(false);
              resetConvert();
            }}
            onClose={() => setShowThumbnailPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
