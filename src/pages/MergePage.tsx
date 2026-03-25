import { useState, useEffect } from 'react';
import { Loader2, ArrowUp, ArrowDown, X } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { mergePdfs } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { save } from '@tauri-apps/plugin-dialog';
import { initStore } from '../lib/store';
import { Page } from '../components/Sidebar';

interface FileItem {
  id: string;
  path: string;
  name: string;
}

interface MergePageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function MergePage({ notify, isActive }: MergePageProps) {
  const { t } = useI18n();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [customFileName, setCustomFileName] = useState('');
  const [askEveryTime, setAskEveryTime] = useState(false);
  const { recentFiles, addRecentFile } = useRecentFiles('merge');

  const { execute, result, error, loading, reset } = useTauriCommand(mergePdfs);

  useEffect(() => {
    async function loadAsk() {
      const s = await initStore();
      const ask = await s.get('askEveryTime');
      if (ask) setAskEveryTime(true);
    }
    loadAsk();
  }, []);

  const handleFileSelect = (paths: any, names: any) => {
    const newFiles: FileItem[] = [];
    if (Array.isArray(paths)) {
      paths.forEach((p, i) => {
        newFiles.push({ id: crypto.randomUUID(), path: p, name: names[i] || p.split('/').pop() || p });
      });
    } else {
      newFiles.push({ id: crypto.randomUUID(), path: paths, name: names || paths.split('/').pop() || paths });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    reset();
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index - 1];
    newFiles[index - 1] = newFiles[index];
    newFiles[index] = temp;
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index + 1];
    newFiles[index + 1] = newFiles[index];
    newFiles[index] = temp;
    setFiles(newFiles);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    
    let absolutePath = undefined;
    if (askEveryTime) {
      const selectedPath = await save({
        defaultPath: 'merged.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if (!selectedPath) return;
      absolutePath = selectedPath;
    }

    const res = await execute(files.map(f => f.path), customFileName, absolutePath);
    if (res) {
      for (const file of files) {
        await addRecentFile(file.path, file.name);
      }
      if (!isActive) {
        notify(t('merge.success'), 'merge');
      }
    }
  };

  const handleStartOver = () => {
    setFiles([]);
    setCustomFileName('');
    reset();
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="merge" title={t('merge.title')} description={t('merge.desc')} />

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
                  onClick={handleStartOver}
                  disabled={loading}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors"
                >
                  {t('batch.clearAll')}
                </button>
              )}
            </div>
            
            <DropZone onFileSelect={handleFileSelect} multiple={true} />
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
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {files.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)] transition-all duration-200 shadow-sm group">
                  <div className="flex items-center flex-1 min-w-0 mr-4">
                    <span className="w-8 text-[var(--text-disabled)] text-[10px] font-bold font-mono">{String(index + 1).padStart(2, '0')}</span>
                    <span className="font-medium truncate text-sm text-[var(--text-primary)]">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-md disabled:opacity-20 transition-colors">
                      <ArrowUp size={14} />
                    </button>
                    <button onClick={() => moveDown(index)} disabled={index === files.length - 1} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-md disabled:opacity-20 transition-colors">
                      <ArrowDown size={14} />
                    </button>
                    <div className="w-px h-3 bg-[var(--border)] mx-1" />
                    <button onClick={() => removeFile(file.id)} className="p-1.5 text-[var(--text-disabled)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-md transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 px-4 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)]">
                <span>{files.length} Files</span>
                <span className="text-[var(--cat-documents)]">Ordered Top to Bottom</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Options & Action */}
        <div className={`space-y-5 transition-all duration-300 ${files.length > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
              {t('merge.step2')}
            </p>
            
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                Output Filename
              </p>
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="merged.pdf"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
              />
              <p className="text-[10px] text-[var(--text-secondary)] mt-2 leading-relaxed">
                Tip: Use <kbd className="bg-[var(--bg-elevated)] px-1 rounded border border-[var(--border)] font-sans text-[9px]">Enter</kbd> to quickly start merging.
              </p>
            </div>
          </div>

          {files.length === 1 && (
            <div className="p-4 rounded-xl border border-amber-200/50 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs">
              {t('merge.minFiles')}
            </div>
          )}

          {!result ? (
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || loading}
              className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
                files.length < 2 || loading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> {t('merge.buttonLoading')}
                </span>
              ) : t('merge.button')}
            </button>
          ) : (
            <button
              onClick={handleStartOver}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
            >
              {t('merge.buttonAnother')}
            </button>
          )}

          {error && <div className="animate-in fade-in zoom-in-95 duration-300"><ResultBanner type="error" message={t('merge.failed')} details={error} /></div>}
          {result && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message={t('merge.success')}
                details={`${t('common.savedTo')} ${result.output_path} | ${result.files_merged} ${t('merge.filesCombined')}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
