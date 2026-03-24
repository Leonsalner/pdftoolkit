import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useI18n } from '../lib/i18n';
import { initStore } from '../lib/store';
import { FolderOpen, Palette, Globe, HardDrive } from 'lucide-react';

export function SettingsPage() {
  const { lang, setLang, t } = useI18n();
  const [outputDir, setOutputDir] = useState<string>('');
  const [askEveryTime, setAskEveryTime] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    async function loadSettings() {
      const s = await initStore();
      const dir = await s.get('outputDir');
      if (dir) setOutputDir(dir as string);
      
      const ask = await s.get('askEveryTime');
      if (ask !== null && ask !== undefined) setAskEveryTime(ask as boolean);
      
      const t = await s.get('theme');
      if (t) setTheme(t as any);
    }
    loadSettings();
  }, []);

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

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const s = await initStore();
    await s.set('theme', newTheme);
    await s.save();
    
    // Apply theme immediately
    const systemIsDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (newTheme === 'dark' || (newTheme === 'system' && systemIsDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto">
      <div className="mb-10 border-b border-[var(--border)] pb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('settings.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('settings.desc')}</p>
      </div>

      <div className="space-y-10">
        {/* File Handling */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HardDrive size={18} className="text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">File Handling</h3>
          </div>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center hover:bg-[var(--bg-elevated)] transition-colors">
              <div className="pr-4">
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1 cursor-pointer" htmlFor="ask-toggle">
                  {t('settings.askEveryTime')}
                </label>
                <p className="text-xs text-[var(--text-secondary)]">Prompt for save location and filename for every operation.</p>
              </div>
              <input 
                id="ask-toggle"
                type="checkbox" 
                checked={askEveryTime} 
                onChange={(e) => handleAskEveryTimeChange(e.target.checked)} 
                className="rounded border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] h-5 w-5 cursor-pointer bg-[var(--bg-surface)] transition-all" 
              />
            </div>
            
            <div className={`p-5 flex justify-between items-center transition-all ${askEveryTime ? 'opacity-50 pointer-events-none' : 'hover:bg-[var(--bg-elevated)]'}`}>
              <div className="flex-1 pr-4">
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">
                  {t('settings.outputDir')}
                </label>
                <p className="text-xs text-[var(--text-secondary)] truncate mb-2">{t('settings.outputDirDesc')}</p>
                <div className="flex items-center space-x-2">
                  <FolderOpen size={16} className="text-[var(--text-disabled)]" />
                  <span className="text-sm text-[var(--text-primary)] font-mono bg-[var(--bg-base)] px-2 py-1 rounded border border-[var(--border)] truncate max-w-sm">
                    {outputDir || 'Default Document Directory'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSelectDir}
                disabled={askEveryTime}
                className="px-4 py-2 border border-[var(--border)] rounded-lg shadow-sm text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {t('settings.browse')}
              </button>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Palette size={18} className="text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Appearance</h3>
          </div>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 flex justify-between items-center hover:bg-[var(--bg-elevated)] transition-colors">
              <div className="pr-4">
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">
                  {t('settings.theme')}
                </label>
                <p className="text-xs text-[var(--text-secondary)]">Select your preferred color scheme.</p>
              </div>
              <div className="flex bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-1">
                {(['system', 'light', 'dark'] as const).map((tOpt) => (
                  <button
                    key={tOpt}
                    onClick={() => handleThemeChange(tOpt)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      theme === tOpt 
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t(`settings.theme.${tOpt}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Language */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Language</h3>
          </div>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 flex justify-between items-center hover:bg-[var(--bg-elevated)] transition-colors">
              <div className="pr-4">
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">
                  {t('settings.language')}
                </label>
                <p className="text-xs text-[var(--text-secondary)]">Choose the application language.</p>
              </div>
              <div className="flex bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-1">
                {(['en', 'sk', 'cs'] as const).map((lOpt) => (
                  <button
                    key={lOpt}
                    onClick={() => setLang(lOpt)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      lang === lOpt 
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t(`settings.language.${lOpt}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}