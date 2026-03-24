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
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('metadata.title')}</h2>

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
          {metadataError && <p className="mt-2 text-sm text-red-500">{metadataError}</p>}
        </div>

        {filePath && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
            {metadataLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {t('metadata.loading')}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('metadata.titleField')}</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); resetSave(); }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('metadata.author')}</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => { setAuthor(e.target.value); resetSave(); }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('metadata.subject')}</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => { setSubject(e.target.value); resetSave(); }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAsNew}
                      onChange={(e) => { setSaveAsNew(e.target.checked); resetSave(); }}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('metadata.saveAsNew')}</span>
                  </label>
                </div>

                {saveAsNew && (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('metadata.outputLabel')}</label>
                    <input
                      type="text"
                      value={outputName}
                      onChange={(e) => { setOutputName(e.target.value); resetSave(); }}
                      placeholder={fileName ? fileName.replace(/\.pdf$/i, '_metadata') : ''}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    />
                  </div>
                )}

                {!saveResult ? (
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                      saveLoading
                        ? 'bg-gray-400 cursor-not-allowed opacity-70'
                        : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                    }`}
                  >
                    {saveLoading ? t('metadata.buttonLoading') : t('metadata.button')}
                  </button>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-500">
                    <button
                      onClick={handleStartOver}
                      className="w-full py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 active:scale-[0.98]"
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
