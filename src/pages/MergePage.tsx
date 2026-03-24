import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { mergePdfs } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { save } from '@tauri-apps/plugin-dialog';
import { initStore } from '../lib/store';
import { Page } from '../components/Sidebar';
import { ArrowUp, ArrowDown, X } from 'lucide-react';

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
        newFiles.push({ id: Math.random().toString(36).substring(7), path: p, name: names[i] });
      });
    } else {
      newFiles.push({ id: Math.random().toString(36).substring(7), path: paths, name: names });
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
    if (res && !isActive) {
      notify(t('merge.success'), 'merge');
    }
  };

  const handleStartOver = () => {
    setFiles([]);
    setCustomFileName('');
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-8 border-b border-[var(--border)] pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('merge.title')}</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{t('merge.desc')}</p>
        </div>
        {!result && files.length >= 2 && (
          <button
            onClick={handleMerge}
            disabled={loading}
            className="py-2.5 px-6 rounded-lg font-semibold transition-all duration-300 shadow-sm bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99] text-sm"
          >
            {loading ? t('merge.buttonLoading') : t('merge.button')}
          </button>
        )}
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">{t('common.step1.add')}</h3>
            {files.length > 0 && (
              <span className="text-xs font-medium text-[var(--text-secondary)]">{files.length} files selected</span>
            )}
          </div>
          <DropZone onFileSelect={handleFileSelect} multiple={true} />
          
          {files.length > 0 && (
            <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {files.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] hover:border-[var(--border-hover)] transition-all duration-200 shadow-sm group">
                  <div className="flex items-center flex-1 min-w-0 mr-4">
                    <span className="w-8 text-[var(--text-disabled)] text-sm font-mono">{index + 1}.</span>
                    <span className="font-medium truncate text-[var(--text-primary)]">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-md disabled:opacity-30 transition-colors">
                      <ArrowUp size={16} />
                    </button>
                    <button onClick={() => moveDown(index)} disabled={index === files.length - 1} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-md disabled:opacity-30 transition-colors">
                      <ArrowDown size={16} />
                    </button>
                    <div className="w-px h-4 bg-[var(--border)] mx-1" />
                    <button onClick={() => removeFile(file.id)} className="p-1.5 text-[var(--text-disabled)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-md transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {files.length > 0 && !askEveryTime && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('merge.step2')}</h3>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="merged.pdf"
              className="block w-full max-w-md rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
            />
          </div>
        )}

        {files.length === 1 && <p className="text-sm text-[var(--text-secondary)] mt-2 italic">{t('merge.minFiles')}</p>}

        {result && (
          <div className="animate-in fade-in zoom-in-95 duration-500 max-w-md mx-auto mt-8">
            <button
              onClick={handleStartOver}
              className="w-full py-3.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-elevated)] transition-all duration-300 active:scale-[0.99] shadow-sm"
            >
              {t('merge.buttonAnother')}
            </button>
          </div>
        )}

        {error && <ResultBanner type="error" message={t('merge.failed')} details={error} />}
        {result && (
          <ResultBanner
            type="success"
            message={t('merge.success')}
            details={`${t('common.savedTo')} ${result.output_path} | ${result.files_merged} ${t('merge.filesCombined')}`}
          />
        )}
      </div>
    </div>
  );
}