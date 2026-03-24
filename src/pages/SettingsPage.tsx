import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { load } from '@tauri-apps/plugin-store';

let store: any = null;
const initStore = async () => {
  if (!store) store = await load('settings.json');
  return store;
};

export function SettingsPage() {
  const [outputDir, setOutputDir] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const s = await initStore();
      const dir = await s.get('outputDir');
      if (dir) setOutputDir(dir as string);
      
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
      setSaved(false);
    }
  };

  const handleSave = async () => {
    const s = await initStore();
    await s.set('outputDir', outputDir);
    await s.set('theme', theme);
    await s.save();
    setSaved(true);
    
    // Apply theme
    if (theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Output Directory</h3>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              readOnly
              value={outputDir}
              placeholder="Default (Downloads folder)"
              className="flex-1 block w-full rounded-md border-gray-300 bg-gray-50 dark:bg-gray-800 shadow-sm sm:text-sm dark:border-gray-700 dark:text-white px-3 py-2 border placeholder-gray-400"
            />
            <button
              onClick={handleSelectDir}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Browse
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">All modified PDFs will be saved here. If left blank, your default Downloads folder is used.</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme Appearance</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" value="system" checked={theme === 'system'} onChange={() => {setTheme('system'); setSaved(false);}} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">System Default</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" value="light" checked={theme === 'light'} onChange={() => {setTheme('light'); setSaved(false);}} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Light Mode</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" value="dark" checked={theme === 'dark'} onChange={() => {setTheme('dark'); setSaved(false);}} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Dark Mode</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-3 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {saved ? 'Saved Successfully!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}