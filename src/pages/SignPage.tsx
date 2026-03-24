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
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('sign.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('sign.desc')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{t('common.step1')}</h3>
            {filePath ? (
              <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] flex justify-between items-center transition-all duration-300 shadow-sm">
                <span className="font-medium text-[var(--text-primary)] truncate pr-4">{fileName}</span>
                <button onClick={handleStartOver} className="text-sm text-[var(--text-secondary)] hover:text-[var(--error)] flex-shrink-0 transition-colors">
                  {t('common.change')}
                </button>
              </div>
            ) : (
              <DropZone onFileSelect={handleFileSelect} />
            )}
          </div>
        </div>

        {/* Right Column: Sign Config */}
        <div className={`space-y-8 transition-opacity duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-1">
              <button
                onClick={() => setSignMode('file')}
                className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                  signMode === 'file' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t('sign.modeFile')}
              </button>
              <button
                onClick={() => setSignMode('eid')}
                className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                  signMode === 'eid' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t('sign.modeEid')}
              </button>
            </div>

            {signMode === 'file' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('sign.certFile')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={certPath}
                      placeholder="/path/to/certificate.p12"
                      className="flex-1 rounded-md border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm sm:text-sm px-3 py-2 border outline-none text-[var(--text-primary)] transition-colors"
                    />
                    <button
                      onClick={handleBrowseCert}
                      className="px-4 py-2 bg-[var(--bg-elevated)] text-sm font-medium rounded-md hover:bg-[var(--bg-surface)] transition-colors border border-[var(--border)] shadow-sm text-[var(--text-primary)]"
                    >
                      {t('settings.browse')}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('sign.certPassword')}</label>
                  <input
                    type="password"
                    value={certPassword}
                    onChange={(e) => setCertPassword(e.target.value)}
                    className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm px-3 py-2 outline-none transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[var(--cat-security-bg)] border border-[var(--cat-security)]/30 rounded-lg">
                  <p className="text-xs text-[var(--cat-security)] leading-relaxed">{t('sign.eidRndDesc')}</p>
                </div>
                
                <button
                  onClick={handleScanEid}
                  disabled={isScanning}
                  className="w-full py-2.5 px-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--bg-elevated)] transition-all flex items-center justify-center gap-2 shadow-sm text-[var(--text-primary)]"
                >
                  {isScanning ? <div className="w-4 h-4 border-2 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin" /> : null}
                  {t('sign.detectEid')}
                </button>

                {readers.length > 0 ? (
                  <div className="space-y-2">
                    {readers.map((r, i) => (
                      <div key={i} className="p-3 border rounded-lg flex items-center justify-between bg-[var(--bg-elevated)] border-[var(--border)]">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{t('sign.readerFound')} {r.name}</p>
                          <p className={`text-xs ${r.present ? 'text-[var(--success)]' : 'text-[var(--text-disabled)]'}`}>
                            {r.present ? t('sign.cardPresent') : t('sign.cardMissing')}
                          </p>
                        </div>
                        {r.present && <div className="w-2 h-2 rounded-full bg-[var(--success)]" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  !isScanning && <p className="text-center text-sm text-[var(--text-secondary)]">{t('sign.noReaders')}</p>
                )}
              </div>
            )}
          </div>

          {!signResult ? (
            <button
              onClick={handleSign}
              disabled={signLoading || (signMode === 'file' && (!certPath || !certPassword))}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
                signLoading || (signMode === 'file' && (!certPath || !certPassword)) ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed' : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
              }`}
            >
              {signLoading ? t('common.buttonLoading') : t('sign.button')}
            </button>
          ) : (
            <button
              onClick={handleStartOver}
              className="w-full py-3.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-elevated)] transition-all duration-300 active:scale-[0.99] shadow-sm"
            >
              {t('extract.buttonAnother')}
            </button>
          )}
          {signResult && <ResultBanner type="success" message={t('sign.success')} details={`${t('common.savedTo')} ${signResult.output_path}`} />}
          {signError && <ResultBanner type="error" message={t('sign.failed')} details={signError} />}
        </div>
      </div>
    </div>
  );
}