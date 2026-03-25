import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { FolderOpen, Globe, HardDrive, Palette, RefreshCw } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { initStore } from '../lib/store';
import { Toggle } from '../components/Toggle';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemePreviewCardProps {
  mode: ThemeMode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

function ThemePreviewCard({ mode, label, selected, onClick }: ThemePreviewCardProps) {
  const baseClass = selected
    ? 'border-[var(--text-primary)] shadow-sm'
    : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:scale-[1.02]';

  return (
    <button type="button" onClick={onClick} className="text-left">
      <div className={`h-32 w-48 overflow-hidden rounded-lg border-2 transition-all duration-200 ${baseClass}`}>
        {mode === 'light' && (
          <div className="flex h-full bg-[#f5f5f7] p-1.5">
            <div className="mr-2 w-8 rounded-md bg-white/90 px-1 py-1.5">
              <div className="mb-1 h-1.5 rounded-full bg-zinc-300" />
              <div className="mb-1 h-1 rounded-full bg-zinc-200" />
              <div className="h-1 rounded-full bg-zinc-200" />
            </div>
            <div className="flex-1 rounded-md bg-white p-2">
              <div className="mb-2 h-2 rounded-full bg-zinc-300" />
              <div className="mb-1.5 h-1.5 rounded-full bg-zinc-200" />
              <div className="mb-1.5 h-1.5 w-4/5 rounded-full bg-zinc-200" />
              <div className="h-8 rounded-sm bg-zinc-100" />
            </div>
          </div>
        )}
        {mode === 'dark' && (
          <div className="flex h-full bg-[#1c1c1e] p-1.5">
            <div className="mr-2 w-8 rounded-md bg-[#2c2c2e] px-1 py-1.5">
              <div className="mb-1 h-1.5 rounded-full bg-white/25" />
              <div className="mb-1 h-1 rounded-full bg-white/15" />
              <div className="h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex-1 rounded-md bg-[#2c2c2e] p-2">
              <div className="mb-2 h-2 rounded-full bg-white/30" />
              <div className="mb-1.5 h-1.5 rounded-full bg-white/15" />
              <div className="mb-1.5 h-1.5 w-4/5 rounded-full bg-white/15" />
              <div className="h-8 rounded-sm bg-[#3a3a3c]" />
            </div>
          </div>
        )}
        {mode === 'system' && (
          <div className="flex h-full">
            <div className="flex flex-1 bg-[#f5f5f7] p-1.5">
              <div className="mr-1.5 w-6 rounded-md bg-white/90 px-1 py-1.5">
                <div className="mb-1 h-1 rounded-full bg-zinc-300" />
                <div className="h-1 rounded-full bg-zinc-200" />
              </div>
              <div className="flex-1 rounded-md bg-white p-1.5">
                <div className="mb-1.5 h-1.5 rounded-full bg-zinc-300" />
                <div className="h-6 rounded-sm bg-zinc-100" />
              </div>
            </div>
            <div className="flex flex-1 bg-[#1c1c1e] p-1.5">
              <div className="mr-1.5 w-6 rounded-md bg-[#2c2c2e] px-1 py-1.5">
                <div className="mb-1 h-1 rounded-full bg-white/25" />
                <div className="h-1 rounded-full bg-white/15" />
              </div>
              <div className="flex-1 rounded-md bg-[#2c2c2e] p-1.5">
                <div className="mb-1.5 h-1.5 rounded-full bg-white/25" />
                <div className="h-6 rounded-sm bg-[#3a3a3c]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-[13px] font-medium text-[var(--text-primary)]">{label}</p>
    </button>
  );
}

export function SettingsPage() {
  const { lang, setLang, t } = useI18n();
  const [outputDir, setOutputDir] = useState('');
  const [askEveryTime, setAskEveryTime] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const s = await initStore();
      const dir = await s.get('outputDir');
      const ask = await s.get('askEveryTime');
      const storedTheme = await s.get('theme');

      if (dir) setOutputDir(dir as string);
      if (ask !== null && ask !== undefined) setAskEveryTime(ask as boolean);
      if (storedTheme) setTheme(storedTheme as ThemeMode);
    }

    loadSettings();
  }, []);

  const applyTheme = (newTheme: ThemeMode) => {
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (newTheme === 'dark' || (newTheme === 'system' && systemIsDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    const s = await initStore();
    await s.set('theme', newTheme);
    await s.save();
    applyTheme(newTheme);
  };

  const handleSelectDir = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (selected && !Array.isArray(selected)) {
      setOutputDir(selected);
      const s = await initStore();
      await s.set('outputDir', selected);
      await s.save();
    }
  };

  const handleAskEveryTimeChange = async (checked: boolean) => {
    setAskEveryTime(checked);
    const s = await initStore();
    await s.set('askEveryTime', checked);
    await s.save();
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(t('settings.checking'));

    try {
      const update = await check();
      if (update) {
        setUpdateStatus(`${t('settings.downloading')} v${update.version}...`);
        await update.downloadAndInstall();
        setUpdateStatus(t('settings.restarting'));
        await relaunch();
      } else {
        setUpdateStatus(t('settings.upToDate'));
        setTimeout(() => setUpdateStatus(null), 3000);
      }
    } catch (error) {
      console.error(error);
      setUpdateStatus(t('settings.updateFailed'));
      setTimeout(() => setUpdateStatus(null), 3000);
    }

    setIsCheckingUpdate(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <div className="mb-10 border-b border-[var(--border)] pb-6">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
          {t('settings.preferencesLabel')}
        </p>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('settings.title')}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{t('settings.desc')}</p>
      </div>

      <div className="space-y-10">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <RefreshCw size={18} className="text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
              {t('settings.updatesSection')}
            </h3>
          </div>

          <div className="flex items-center justify-between gap-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-5">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{t('settings.applicationUpdates')}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                {t('settings.applicationUpdatesDesc')}
              </p>
            </div>
            <button
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateStatus ?? t('settings.checkUpdates')}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <HardDrive size={18} className="text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
              {t('settings.fileHandlingSection')}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-5">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{t('settings.askEveryTime')}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{t('settings.askEveryTimeDesc')}</p>
              </div>
              <Toggle enabled={askEveryTime} onClick={() => handleAskEveryTimeChange(!askEveryTime)} />
            </div>

            <div
              className={`flex items-center justify-between gap-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-5 transition-opacity ${
                askEveryTime ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{t('settings.outputDir')}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{t('settings.outputDirDesc')}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                  <FolderOpen size={15} className="text-[var(--text-disabled)]" />
                  <span className="truncate rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-xs">
                    {outputDir || t('settings.defaultDirectory')}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSelectDir}
                disabled={askEveryTime}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)] active:scale-[0.98]"
              >
                {t('settings.browse')}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Palette size={18} className="text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
              {t('settings.appearanceSection')}
            </h3>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <ThemePreviewCard
                mode="light"
                label={t('settings.theme.light')}
                selected={theme === 'light'}
                onClick={() => handleThemeChange('light')}
              />
              <ThemePreviewCard
                mode="dark"
                label={t('settings.theme.dark')}
                selected={theme === 'dark'}
                onClick={() => handleThemeChange('dark')}
              />
              <ThemePreviewCard
                mode="system"
                label={t('settings.theme.system')}
                selected={theme === 'system'}
                onClick={() => handleThemeChange('system')}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Globe size={18} className="text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
              {t('settings.languageSection')}
            </h3>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-5">
            <p className="text-sm font-medium text-[var(--text-primary)]">{t('settings.language')}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{t('settings.languageDesc')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['en', 'sk', 'cs'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setLang(option)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                    lang === option
                      ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-base)] shadow-sm'
                      : 'border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:-translate-y-[1px] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t(`settings.language.${option}`)}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
