import { useI18n } from '../lib/i18n';

export type Page = 'compress' | 'extract' | 'merge' | 'split' | 'ocr' | 'settings';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { t } = useI18n();

  const navItems = [
    { id: 'compress' as Page, label: t('nav.compress') },
    { id: 'extract' as Page, label: t('nav.extract') },
    { id: 'merge' as Page, label: t('nav.merge') },
    { id: 'split' as Page, label: t('nav.split') },
    { id: 'ocr' as Page, label: t('nav.ocr') },
  ];

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full flex flex-col transition-colors duration-300">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2 transition-colors duration-300">
          <span>{t('app.title')}</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 scale-100'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 hover:scale-[1.02]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
            activePage === 'settings'
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 scale-100'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 hover:scale-[1.02]'
          }`}
        >
          {t('nav.settings')}
        </button>
      </div>
    </div>
  );
}