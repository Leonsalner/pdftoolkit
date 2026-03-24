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
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('security.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('security.desc')}</p>
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

        {/* Right Column: Encrypt / Decrypt Form */}
        <div className={`space-y-8 transition-opacity duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {filePath && !isEncrypted && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('security.userPassword')}</label>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => { setUserPassword(e.target.value); resetSecure(); }}
                      className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('security.ownerPassword')}</label>
                    <input
                      type="password"
                      value={ownerPassword}
                      onChange={(e) => { setOwnerPassword(e.target.value); resetSecure(); }}
                      className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 mt-4">{t('security.permissions')}</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" checked={allowPrint} onChange={(e) => { setAllowPrint(e.target.checked); resetSecure(); }} className="rounded border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] h-4 w-4 bg-[var(--bg-surface)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">{t('security.allowPrint')}</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" checked={allowCopy} onChange={(e) => { setAllowCopy(e.target.checked); resetSecure(); }} className="rounded border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] h-4 w-4 bg-[var(--bg-surface)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">{t('security.allowCopy')}</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" checked={allowModify} onChange={(e) => { setAllowModify(e.target.checked); resetSecure(); }} className="rounded border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] h-4 w-4 bg-[var(--bg-surface)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">{t('security.allowModify')}</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('metadata.outputLabel')}</label>
                  <input
                    type="text"
                    value={outputName}
                    onChange={(e) => { setOutputName(e.target.value); resetSecure(); }}
                    placeholder={fileName ? fileName.replace(/\.pdf$/i, '_secured') : ''}
                    className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                  />
                </div>
              </div>

              {!secureResult ? (
                <button
                  onClick={handleSecure}
                  disabled={secureLoading}
                  className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
                    secureLoading ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed' : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
                  }`}
                >
                  {secureLoading ? t('common.buttonLoading') : t('security.button')}
                </button>
              ) : (
                <button
                  onClick={handleStartOver}
                  className="w-full py-3.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-elevated)] transition-all duration-300 active:scale-[0.99] shadow-sm"
                >
                  {t('extract.buttonAnother')}
                </button>
              )}
              {secureResult && <ResultBanner type="success" message={t('security.success')} details={`${t('common.savedTo')} ${secureResult.output_path}`} />}
              {secureError && <ResultBanner type="error" message={t('security.failed')} details={secureError} />}
            </div>
          )}


          {filePath && isEncrypted && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
                <div className="p-4 bg-[var(--cat-security-bg)] border border-[var(--cat-security)]/30 rounded-lg">
                  <p className="text-sm text-[var(--cat-security)] font-medium">{t('security.decryptTitle')}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('security.password')}</label>
                  <input
                    type="password"
                    value={decryptPassword}
                    onChange={(e) => setDecryptPassword(e.target.value)}
                    className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                  />
                </div>
              </div>

              {!decryptResult ? (
                <button
                  onClick={handleDecrypt}
                  disabled={decryptLoading || !decryptPassword}
                  className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
                    decryptLoading || !decryptPassword ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed' : 'bg-[var(--success)] text-white hover:opacity-90 active:scale-[0.99]'
                  }`}
                >
                  {decryptLoading ? t('common.buttonLoading') : t('security.decryptButton')}
                </button>
              ) : (
                <button
                  onClick={handleStartOver}
                  className="w-full py-3.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-elevated)] transition-all duration-300 active:scale-[0.99] shadow-sm"
                >
                  {t('extract.buttonAnother')}
                </button>
              )}
              {decryptResult && <ResultBanner type="success" message={t('security.decryptSuccess')} details={`${t('common.savedTo')} ${decryptResult.output_path}`} />}
              {decryptError && <ResultBanner type="error" message={t('security.failed')} details={decryptError} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}