import { useState } from 'react';
import { Loader2, Lock, Unlock, Shield, Key, Printer, Copy, FileEdit } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { RecentFiles } from '../components/RecentFiles';
import { ResultBanner } from '../components/ResultBanner';
import { BatchFileList, type BatchFile } from '../components/BatchFileList';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { addPdfSecurity, decryptPdf } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';
import { Toggle } from '../components/Toggle';

interface SecurityPageProps {
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function SecurityPage({ notify, isActive }: SecurityPageProps) {
  const { t } = useI18n();
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { recentFiles, addRecentFile } = useRecentFiles('security');
  const [mode, setMode] = useState<'protect' | 'unlock'>('protect');

  // Security Settings
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [allowModify, setAllowModify] = useState(true);

  // Decrypt Settings
  const [decryptPassword, setDecryptPassword] = useState('');

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  const handleAddFiles = (paths: string[], names: string[]) => {
    const remaining = 10 - files.length;
    const toAdd = paths.slice(0, remaining).map((p, i) => ({
      id: crypto.randomUUID(),
      path: p,
      name: names[i] || p.split('/').pop() || p,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...toAdd]);
  };

  const handleFileSelect = (path: any, name: any) => {
    if (Array.isArray(path)) {
      const n = Array.isArray(name) ? name : path.map((p: string) => p.split('/').pop() || p);
      handleAddFiles(path, n);
    } else {
      handleAddFiles([path], [name]);
    }
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const handleProcessAll = async () => {
    setIsProcessing(true);
    let success = 0;

    for (const file of files.filter((f) => f.status === 'pending')) {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' as const } : f))
      );

      try {
        let result;
        if (mode === 'protect') {
          result = await addPdfSecurity(
            file.path,
            userPassword || undefined,
            ownerPassword || undefined,
            allowPrint,
            allowCopy,
            allowModify
          );
        } else {
          result = await decryptPdf(file.path, decryptPassword);
        }
        
        await addRecentFile(file.path, file.name);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'done' as const, result }
              : f
          )
        );
        success++;
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'error' as const, error: String(err) }
              : f
          )
        );
      }
    }

    setIsProcessing(false);

    if (success > 0 && !isActive) {
      notify(mode === 'protect' ? t('security.success') : t('security.decryptSuccess'), 'security');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <PageIntro page="security" title={t('security.title')} description={t('security.desc')} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8 xl:gap-10">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                {files.length === 0 ? t('common.step1') : t('common.step1.add')}
              </h3>
              {files.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={isProcessing}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors"
                >
                  {t('batch.clearAll')}
                </button>
              )}
            </div>
            
            <DropZone onFileSelect={handleFileSelect} multiple />
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
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <BatchFileList files={files} onRemove={handleRemove} t={t} />
              <div className="mt-4 px-4 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)]">
                <span>{files.length} Files</span>
                <span className="flex gap-3">
                  <span className="text-[var(--success)]">{doneCount} Done</span>
                  <span className="text-[var(--error)]">{errorCount} Errors</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Encrypt / Decrypt Form */}
        <div className={`space-y-5 transition-all duration-300 ${files.length > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-3">
                Security Mode
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('protect')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    mode === 'protect'
                      ? 'border-[var(--cat-security)] bg-[var(--cat-security-bg)] text-[var(--cat-security)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <Lock size={18} className={mode === 'protect' ? 'text-[var(--cat-security)]' : 'text-[var(--text-disabled)]'} />
                  <span className={`text-sm font-semibold ${mode === 'protect' ? 'text-[var(--cat-security)]' : 'text-[var(--text-primary)]'}`}>
                    Protect
                  </span>
                </button>
                <button
                  onClick={() => setMode('unlock')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    mode === 'unlock'
                      ? 'border-[var(--cat-security)] bg-[var(--cat-security-bg)] text-[var(--cat-security)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <Unlock size={18} className={mode === 'unlock' ? 'text-[var(--cat-security)]' : 'text-[var(--text-disabled)]'} />
                  <span className={`text-sm font-semibold ${mode === 'unlock' ? 'text-[var(--cat-security)]' : 'text-[var(--text-primary)]'}`}>
                    Unlock
                  </span>
                </button>
              </div>
            </div>

            {mode === 'protect' ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">{t('security.userPassword')}</p>
                    <div className="relative group">
                      <input
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="Required to open"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                      />
                      <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">{t('security.ownerPassword')}</p>
                    <div className="relative group">
                      <input
                        type="password"
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        placeholder="Required to change permissions"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                      />
                      <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-[var(--border)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-3">{t('security.permissions')}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)]">
                      <div className="flex items-center gap-3">
                        <Printer size={16} className="text-[var(--text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{t('security.allowPrint')}</span>
                      </div>
                      <Toggle enabled={allowPrint} onClick={setAllowPrint} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)]">
                      <div className="flex items-center gap-3">
                        <Copy size={16} className="text-[var(--text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{t('security.allowCopy')}</span>
                      </div>
                      <Toggle enabled={allowCopy} onClick={setAllowCopy} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)]">
                      <div className="flex items-center gap-3">
                        <FileEdit size={16} className="text-[var(--text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{t('security.allowModify')}</span>
                      </div>
                      <Toggle enabled={allowModify} onClick={setAllowModify} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--cat-security)] bg-[var(--cat-security-bg)]">
                  <div className="p-2 rounded-lg bg-[var(--cat-security)] text-white shrink-0">
                    <Unlock size={18} />
                  </div>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    Enter the password required to open this document. This will permanently remove all encryption and password protection.
                  </p>
                </div>
                
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)] mb-1.5">{t('security.password')}</p>
                  <div className="relative group">
                    <input
                      type="password"
                      value={decryptPassword}
                      onChange={(e) => setDecryptPassword(e.target.value)}
                      placeholder="User Password"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-hover)] focus:ring-1 focus:ring-[var(--text-secondary)]/20 transition-colors"
                    />
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleProcessAll}
            disabled={pendingCount === 0 || isProcessing || (mode === 'unlock' && !decryptPassword)}
            className={`w-full rounded-xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 shadow-sm ${
              pendingCount === 0 || isProcessing || (mode === 'unlock' && !decryptPassword)
                ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={15} className="animate-spin" /> {t('batch.processing')}
              </span>
            ) : t('batch.processAll')}
          </button>

          {doneCount > 0 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="success"
                message={mode === 'protect' ? t('security.success') : t('security.decryptSuccess')}
                details={`${doneCount} files processed.`}
              />
            </div>
          )}

          {errorCount > 0 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResultBanner
                type="error"
                message={t('security.failed')}
                details={`${errorCount} files failed.`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
