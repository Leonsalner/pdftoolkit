import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useI18n } from '../lib/i18n';
import { initStore } from '../lib/store';

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
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('settings.desc')}</p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.outputDir')}</h3>
          <div className="flex items-center space-x-4 mb-3">
            <input
              type="text"
              readOnly
              value={outputDir}
              placeholder={t('settings.outputDirDesc')}
              disabled={askEveryTime}
              className="flex-1 block w-full rounded-md border-gray-300 bg-gray-50 dark:bg-gray-800 shadow-sm sm:text-sm dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400 disabled:opacity-50"
            />
            <button
              onClick={handleSelectDir}
              disabled={askEveryTime}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              {t('settings.browse')}
            </button>
          </div>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={askEveryTime} 
              onChange={(e) => handleAskEveryTimeChange(e.target.checked)} 
              className="text-indigo-600 focus:ring-indigo-500 rounded border-gray-300 h-4 w-4" 
            />
            <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t('settings.askEveryTime')}</span>
          </label>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.theme')}</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" value="system" checked={theme === 'system'} onChange={() => handleThemeChange('system')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t('settings.theme.system')}</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" value="light" checked={theme === 'light'} onChange={() => handleThemeChange('light')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t('settings.theme.light')}</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" value="dark" checked={theme === 'dark'} onChange={() => handleThemeChange('dark')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t('settings.theme.dark')}</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.language')}</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" value="en" checked={lang === 'en'} onChange={() => setLang('en')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t('settings.language.en')}</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" value="sk" checked={lang === 'sk'} onChange={() => setLang('sk')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t('settings.language.sk')}</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" value="cs" checked={lang === 'cs'} onChange={() => setLang('cs')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t('settings.language.cs')}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}