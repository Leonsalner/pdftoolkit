import { useState, useEffect } from 'react';
import { Loader2, Tag, User, Book } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { getPdfMetadata, setPdfMetadata } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';
import { Toggle } from '../components/Toggle';

interface MetadataPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function MetadataPage({ notify, isActive }: MetadataPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { recentFiles, addRecentFile } = useRecentFiles('metadata');
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [outputName, setOutputName] = useState('');

  const { execute: fetchMetadata, result: metadataResult, error: metadataError, loading: metadataLoading, reset: resetMetadata } = useTauriCommand(getPdfMetadata);
  const { execute: saveMetadata, result: saveResult, error: saveError, loading: saveLoading, reset: resetSave } = useTauriCommand(setPdfMetadata);

  useEffect(() => {
    if (filePath) {
      fetchMetadata(filePath);
    }
  }, [filePath, fetchMetadata]);

  useEffect(() => {
    if (metadataResult) {
      setTitle(metadataResult.title || '');
      setAuthor(metadataResult.author || '');
      setSubject(metadataResult.subject || '');
    }
  }, [metadataResult]);

  const handleFileSelect = (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    setFilePath(p);
    setFileName(n);
    setTitle('');
    setAuthor('');
    setSubject('');
    setSaveAsNew(false);
    setOutputName('');
    resetMetadata();
    resetSave();
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setTitle('');
    setAuthor('');
    setSubject('');
    setSaveAsNew(false);
    setOutputName('');
    resetMetadata();
    resetSave();
  };

  const handleSave = async () => {
    if (!filePath) return;

    const res = await saveMetadata(
      filePath,
      title,
      author,
      subject,
      saveAsNew,
      outputName || undefined
    );

    if (res) {
      if (!isActive) {
        notify(t('metadata.success'), 'metadata');
      }
      if (fileName) {
        await addRecentFile(filePath, fileName);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="metadata" title={t('metadata.title')} description={t('metadata.desc')} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8 xl:gap-10">
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
            {metadataError && <p className="mt-2 text-sm text-[var(--error)]">{metadataError}</p>}
          </div>
        </div>

        {/* Right Column: Options & Action */}
        <div className={`space-y-5 transition-all duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
            {metadataLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 size={24} className="animate-spin text-[var(--text-disabled)]" />
                <p className="text-sm text-[var(--text-secondary)] animate-pulse">{t('metadata.loading')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
                    Document Metadata
                  </p>
                  
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                      {t('metadata.titleField')}
                    </p>
                    <div className="relative group">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); resetSave(); }}
                        placeholder="Document Title"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                      />
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] group-focus-within:text-[var(--text-secondary)] transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                        {t('metadata.author')}
                      </p>
                      <div className="relative group">
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => { setAuthor(e.target.value); resetSave(); }}
                          placeholder="Author Name"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                        />
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] group-focus-within:text-[var(--text-secondary)] transition-colors" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                        {t('metadata.subject')}
                      </p>
                      <div className="relative group">
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => { setSubject(e.target.value); resetSave(); }}
                          placeholder="Subject"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                        />
                        <Book size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] group-focus-within:text-[var(--text-secondary)] transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-5 mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-3">
                    Save Options
                  </p>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-base)]">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{t('metadata.saveAsNew')}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">Create a copy instead of overwriting</p>
                    </div>
                    <Toggle enabled={saveAsNew} onClick={(val) => { setSaveAsNew(val); resetSave(); }} />
                  </div>

                  {saveAsNew && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">
                        {t('metadata.outputLabel')}
                      </p>
                      <input
                        type="text"
                        value={outputName}
                        onChange={(e) => { setOutputName(e.target.value); resetSave(); }}
                        placeholder={fileName ? fileName.replace(/\.pdf$/i, '_metadata') : ''}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {!saveResult ? (
            <div className="flex gap-3">
              <button
                onClick={handleStartOver}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading || metadataLoading}
                className={`flex-[2] rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
                  saveLoading || metadataLoading
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                    : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                {saveLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={15} className="animate-spin" /> {t('metadata.buttonLoading')}
                  </span>
                ) : t('metadata.button')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartOver}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
            >
              {t('extract.buttonAnother')}
            </button>
          )}
          
          {saveError && <div className="animate-in fade-in zoom-in-95 duration-300"><ResultBanner type="error" message={t('metadata.failed')} details={saveError} /></div>}
          {saveResult && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message={t('metadata.success')}
                details={saveResult.overwritten ? t('metadata.successOverwrite') : `${t('common.savedTo')} ${saveResult.output_path}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
