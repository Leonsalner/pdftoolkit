import { useState } from 'react';
import { Loader2, FileSignature, Contact, HardDrive, Key, Cpu, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { useTauriCommand } from '../hooks/useTauriCommand';
import { useRecentFiles } from '../hooks/useRecentFiles';
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
  const { recentFiles, addRecentFile } = useRecentFiles('sign');
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
    
    const res = await performSign(filePath, certPath, certPassword);
    if (res) {
      await addRecentFile(filePath, fileName || 'signed.pdf');
      if (!isActive) notify(t('sign.success'), 'sign');
    }
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
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="sign" title={t('sign.title')} description={t('sign.desc')} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8 xl:gap-10">
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
          </div>
        </div>

        {/* Right Column: Sign Config */}
        <div className={`space-y-5 transition-all duration-300 ${filePath ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-3">
                Signature Method
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSignMode('file')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    signMode === 'file'
                      ? 'border-[var(--cat-security)] bg-[var(--cat-security-bg)] text-[var(--cat-security)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <FileSignature size={18} className={signMode === 'file' ? 'text-[var(--cat-security)]' : 'text-[var(--text-disabled)]'} />
                  <span className={`text-sm font-semibold ${signMode === 'file' ? 'text-[var(--cat-security)]' : 'text-[var(--text-primary)]'}`}>
                    {t('sign.modeFile')}
                  </span>
                </button>
                <button
                  onClick={() => setSignMode('eid')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    signMode === 'eid'
                      ? 'border-[var(--cat-security)] bg-[var(--cat-security-bg)] text-[var(--cat-security)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <Contact size={18} className={signMode === 'eid' ? 'text-[var(--cat-security)]' : 'text-[var(--text-disabled)]'} />
                  <span className={`text-sm font-semibold ${signMode === 'eid' ? 'text-[var(--cat-security)]' : 'text-[var(--text-primary)]'}`}>
                    {t('sign.modeEid')}
                  </span>
                </button>
              </div>
            </div>

            {signMode === 'file' ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">{t('sign.certFile')}</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <input
                        type="text"
                        readOnly
                        value={certPath}
                        placeholder="PKCS#12 Certificate (.p12, .pfx)"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors"
                      />
                      <HardDrive size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                    </div>
                    <button
                      onClick={handleBrowseCert}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
                    >
                      {t('settings.browse')}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">{t('sign.certPassword')}</p>
                  <div className="relative group">
                    <input
                      type="password"
                      value={certPassword}
                      onChange={(e) => setCertPassword(e.target.value)}
                      placeholder="Certificate Password"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                    />
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--cat-security)] bg-[var(--cat-security-bg)]">
                  <div className="p-2 rounded-lg bg-[var(--cat-security)] text-white shrink-0">
                    <Cpu size={18} />
                  </div>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {t('sign.eidRndDesc')}
                  </p>
                </div>
                
                <button
                  onClick={handleScanEid}
                  disabled={isScanning}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] text-sm font-semibold hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[var(--text-primary)]"
                >
                  {isScanning ? <Loader2 size={16} className="animate-spin text-[var(--text-disabled)]" /> : <Search size={16} className="text-[var(--text-disabled)]" />}
                  {t('sign.detectEid')}
                </button>

                {readers.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">Detected Readers</p>
                    {readers.map((r, i) => (
                      <div key={i} className="p-3 border rounded-xl flex items-center justify-between bg-[var(--bg-base)] border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${r.present ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--bg-elevated)] text-[var(--text-disabled)]'}`}>
                            <HardDrive size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{r.name}</p>
                            <p className={`text-[10px] font-medium uppercase tracking-wider ${r.present ? 'text-[var(--success)]' : 'text-[var(--text-disabled)]'}`}>
                              {r.present ? t('sign.cardPresent') : t('sign.cardMissing')}
                            </p>
                          </div>
                        </div>
                        {r.present ? <CheckCircle2 size={16} className="text-[var(--success)]" /> : <AlertCircle size={16} className="text-[var(--text-disabled)]" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  !isScanning && <p className="text-center py-4 text-xs font-medium text-[var(--text-disabled)] italic">{t('sign.noReaders')}</p>
                )}
              </div>
            )}
          </div>

          {!signResult ? (
            <button
              onClick={handleSign}
              disabled={signLoading || (signMode === 'file' && (!certPath || !certPassword))}
              className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
                signLoading || (signMode === 'file' && (!certPath || !certPassword)) ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed' : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {signLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> {t('common.buttonLoading')}
                </span>
              ) : t('sign.button')}
            </button>
          ) : (
            <button
              onClick={handleStartOver}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all duration-200"
            >
              {t('extract.buttonAnother')}
            </button>
          )}

          {signResult && <div className="animate-in fade-in zoom-in-95 duration-300"><ResultBanner type="success" message={t('sign.success')} details={`${t('common.savedTo')} ${signResult.output_path}`} /></div>}
          {signError && <div className="animate-in fade-in zoom-in-95 duration-300"><ResultBanner type="error" message={t('sign.failed')} details={signError} /></div>}
        </div>
      </div>
    </div>
  );
}
