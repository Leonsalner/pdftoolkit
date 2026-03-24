import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { addPdfSecurity, decryptPdf, checkPdfEncrypted } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface SecurityPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function SecurityPage({ notify, isActive }: SecurityPageProps) {
  const { t } = useI18n();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isEncrypted, setIsEncrypted] = useState(false);

  // Security Settings
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [allowModify, setAllowModify] = useState(true);
  const [outputName, setOutputName] = useState('');

  // Decrypt Settings
  const [decryptPassword, setDecryptPassword] = useState('');

  const { execute: performSecure, result: secureResult, error: secureError, loading: secureLoading, reset: resetSecure } = useTauriCommand(addPdfSecurity);
  const { execute: performDecrypt, result: decryptResult, error: decryptError, loading: decryptLoading, reset: resetDecrypt } = useTauriCommand(decryptPdf);

  const handleFileSelect = async (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    setFilePath(p);
    setFileName(n);
    resetSecure();
    resetDecrypt();
    setDecryptPassword('');
    setUserPassword('');
    setOwnerPassword('');
    setOutputName('');
    
    try {
      const encrypted = await checkPdfEncrypted(p);
      setIsEncrypted(encrypted);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartOver = () => {
    setFilePath(null);
    setFileName(null);
    setIsEncrypted(false);
    resetSecure();
    resetDecrypt();
  };

  const handleSecure = async () => {
    if (!filePath) return;
    const res = await performSecure(
      filePath,
      userPassword || undefined,
      ownerPassword || undefined,
      allowPrint,
      allowCopy,
      allowModify,
      outputName || undefined
    );
    if (res && !isActive) notify(t('security.success'), 'security');
  };

  const handleDecrypt = async () => {
    if (!filePath || !decryptPassword) return;
    const res = await performDecrypt(filePath, decryptPassword);
    if (res && !isActive) notify(t('security.decryptSuccess'), 'security');
  };

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('security.title')}</h2>

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

        {filePath && !isEncrypted && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('security.userPassword')}</label>
                <input
                  type="password"
                  value={userPassword}
                  onChange={(e) => { setUserPassword(e.target.value); resetSecure(); }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('security.ownerPassword')}</label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => { setOwnerPassword(e.target.value); resetSecure(); }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('security.permissions')}</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={allowPrint} onChange={(e) => { setAllowPrint(e.target.checked); resetSecure(); }} className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm dark:text-gray-300">{t('security.allowPrint')}</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={allowCopy} onChange={(e) => { setAllowCopy(e.target.checked); resetSecure(); }} className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm dark:text-gray-300">{t('security.allowCopy')}</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={allowModify} onChange={(e) => { setAllowModify(e.target.checked); resetSecure(); }} className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm dark:text-gray-300">{t('security.allowModify')}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('metadata.outputLabel')}</label>
              <input
                type="text"
                value={outputName}
                onChange={(e) => { setOutputName(e.target.value); resetSecure(); }}
                placeholder={fileName ? fileName.replace(/\.pdf$/i, '_secured') : ''}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border transition-colors"
              />
            </div>

            {!secureResult ? (
              <button
                onClick={handleSecure}
                disabled={secureLoading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                  secureLoading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                }`}
              >
                {secureLoading ? t('common.buttonLoading') : t('security.button')}
              </button>
            ) : (
              <ResultBanner type="success" message={t('security.success')} details={`${t('common.savedTo')} ${secureResult.output_path}`} />
            )}
            {secureError && <ResultBanner type="error" message={t('security.failed')} details={secureError} />}
          </div>
        )}


        {filePath && isEncrypted && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">{t('security.decryptTitle')}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('security.password')}</label>
              <input
                type="password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 border"
              />
            </div>

            {!decryptResult ? (
              <button
                onClick={handleDecrypt}
                disabled={decryptLoading || !decryptPassword}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                  decryptLoading || !decryptPassword ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {decryptLoading ? t('common.buttonLoading') : t('security.decryptButton')}
              </button>
            ) : (
              <ResultBanner type="success" message={t('security.decryptSuccess')} details={`${t('common.savedTo')} ${decryptResult.output_path}`} />
            )}
            {decryptError && <ResultBanner type="error" message={t('security.failed')} details={decryptError} />}
          </div>
        )}
      </div>
    </div>
  );
}
