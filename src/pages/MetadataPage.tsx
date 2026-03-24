import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { getPdfMetadata, setPdfMetadata } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface MetadataPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function MetadataPage({ notify, isActive }: MetadataPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
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

    if (res && !isActive) {
      notify(t('metadata.success'), 'metadata');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('metadata.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('metadata.desc')}</p>
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
            {metadataError && <p className="mt-2 text-sm text-[var(--error)]">{metadataError}</p>}
          </div>
        </div>

        {/* Right Column: Metadata form */}
        <div className={`space-y-8 transition-opacity duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6 min-h-[300px] flex flex-col justify-center">
            {metadataLoading ? (
              <div className="text-center text-[var(--text-secondary)] animate-pulse">
                {t('metadata.loading')}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('metadata.titleField')}</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); resetSave(); }}
                      className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('metadata.author')}</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => { setAuthor(e.target.value); resetSave(); }}
                      className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('metadata.subject')}</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => { setSubject(e.target.value); resetSave(); }}
                      className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAsNew}
                      onChange={(e) => { setSaveAsNew(e.target.checked); resetSave(); }}
                      className="rounded border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] h-4 w-4 cursor-pointer bg-[var(--bg-surface)]"
                    />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{t('metadata.saveAsNew')}</span>
                  </label>
                </div>

                {saveAsNew && (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('metadata.outputLabel')}</label>
                    <input
                      type="text"
                      value={outputName}
                      onChange={(e) => { setOutputName(e.target.value); resetSave(); }}
                      placeholder={fileName ? fileName.replace(/\.pdf$/i, '_metadata') : ''}
                      className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {!saveResult ? (
            <button
              onClick={handleSave}
              disabled={saveLoading || metadataLoading}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
                saveLoading || metadataLoading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
              }`}
            >
              {saveLoading ? t('metadata.buttonLoading') : t('metadata.button')}
            </button>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <button
                onClick={handleStartOver}
                className="w-full py-3.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-elevated)] transition-all duration-300 active:scale-[0.99] shadow-sm"
              >
                {t('extract.buttonAnother')}
              </button>
            </div>
          )}
          
          {saveError && <ResultBanner type="error" message={t('metadata.failed')} details={saveError} />}
          {saveResult && (
            <ResultBanner
              type="success"
              message={t('metadata.success')}
              details={saveResult.overwritten ? t('metadata.successOverwrite') : `${t('common.savedTo')} ${saveResult.output_path}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}