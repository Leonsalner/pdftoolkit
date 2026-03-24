import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { signPdfFileBased, detectSmartCards, type SmartCardInfo } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { open } from '@tauri-apps/plugin-dialog';
import { Page } from '../components/Sidebar';

interface SignPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function SignPage({ notify, isActive }: SignPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [signMode, setSignMode] = useState<'file' | 'eid'>('file');

  // File-based settings
  const [certPath, setCertPath] = useState('');
  const [certPassword, setCertPassword] = useState('');

  // eID settings
  const [readers, setReaders] = useState<SmartCardInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const { execute: performSign, result: signResult, error: signError, loading: signLoading, reset: resetSign } = useTauriCommand(signPdfFileBased);

  const handleFileSelect = (path: any, name: any) => {
    setFilePath(Array.isArray(path) ? path[0] : path);
    setFileName(Array.isArray(name) ? name[0] : name);
    resetSign();
  };

  const handleBrowseCert = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Certificate', extensions: ['p12', 'pfx'] }]
    });
    if (selected) setCertPath(selected as string);
  };

  const handleScanEid = async () => {
    setIsScanning(true);
    try {
      const detected = await detectSmartCards();
      setReaders(detected);
    } catch (e) {
      console.error(e);
    }
    setIsScanning(false);
  };

  const handleSign = async () => {
    if (!filePath) return;
    if (signMode === 'file' && (!certPath || !certPassword)) return;
    
    // In V2.0 prototype, we use the file-based command even for the eID flow structure
    // as full eID logic is a massive R&D task.
    const res = await performSign(filePath, certPath, certPassword);
    if (res && !isActive) notify(t('sign.success'), 'sign');
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setCertPath('');
    setCertPassword('');
    setReaders([]);
    resetSign();
  };

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('sign.title')}</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('common.step1')}</h3>
          {filePath ? (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center transition-all duration-300">
              <span className="font-medium truncate">{fileName}</span>
              <button onClick={handleStartOver} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
                {t('common.change')}
              </button>
            </div>
          ) : (
            <DropZone onFileSelect={handleFileSelect} />
          )}
        </div>

        {filePath && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
            <div className="flex gap-4">
              <button
                onClick={() => setSignMode('file')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                  signMode === 'file' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20' : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                {t('sign.modeFile')}
              </button>
              <button
                onClick={() => setSignMode('eid')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                  signMode === 'eid' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20' : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                {t('sign.modeEid')}
              </button>
            </div>

            {signMode === 'file' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sign.certFile')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={certPath}
                      placeholder="/path/to/certificate.p12"
                      className="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border"
                    />
                    <button
                      onClick={handleBrowseCert}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
                    >
                      {t('settings.browse')}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sign.certPassword')}</label>
                  <input
                    type="password"
                    value={certPassword}
                    onChange={(e) => setCertPassword(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{t('sign.eidRndDesc')}</p>
                </div>
                
                <button
                  onClick={handleScanEid}
                  disabled={isScanning}
                  className="w-full py-2 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  {isScanning ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : null}
                  {t('sign.detectEid')}
                </button>

                {readers.length > 0 ? (
                  <div className="space-y-2">
                    {readers.map((r, i) => (
                      <div key={i} className="p-3 border rounded-lg flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium dark:text-gray-200">{t('sign.readerFound')} {r.name}</p>
                          <p className={`text-xs ${r.present ? 'text-green-600' : 'text-gray-500'}`}>
                            {r.present ? t('sign.cardPresent') : t('sign.cardMissing')}
                          </p>
                        </div>
                        {r.present && <div className="w-2 h-2 rounded-full bg-green-500" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  !isScanning && <p className="text-center text-sm text-gray-500">{t('sign.noReaders')}</p>
                )}
              </div>
            )}

            {!signResult ? (
              <button
                onClick={handleSign}
                disabled={signLoading || (signMode === 'file' && (!certPath || !certPassword))}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                  signLoading || (signMode === 'file' && (!certPath || !certPassword)) ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {signLoading ? t('common.buttonLoading') : t('sign.button')}
              </button>
            ) : (
              <ResultBanner type="success" message={t('sign.success')} details={`${t('common.savedTo')} ${signResult.output_path}`} />
            )}
            {signError && <ResultBanner type="error" message={t('sign.failed')} details={signError} />}
          </div>
        )}
      </div>
    </div>
  );
}
