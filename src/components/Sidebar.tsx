import { useI18n } from '../lib/i18n';
import { 
  Minimize2, FileOutput, Combine, Scissors, LayoutGrid,
  Repeat, Stamp, Tags,
  Lock, PenTool,
  Sparkles, ScanText,
  Settings
} from 'lucide-react';

export type Page = 'compress' | 'extract' | 'merge' | 'split' | 'convert' | 'watermark' | 'security' | 'sign' | 'ai' | 'ocr' | 'organize' | 'metadata' | 'settings';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

interface NavSection {
  title: string;
  categoryVar: string;
  items: { id: Page; labelKey: string; icon: React.ElementType }[];
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { t } = useI18n();

  const sections: NavSection[] = [
    {
      title: "Documents",
      categoryVar: "--cat-documents",
      items: [
        { id: 'extract', labelKey: 'nav.extract', icon: FileOutput },
        { id: 'compress', labelKey: 'nav.compress', icon: Minimize2 },
        { id: 'merge', labelKey: 'nav.merge', icon: Combine },
        { id: 'split', labelKey: 'nav.split', icon: Scissors },
        { id: 'organize', labelKey: 'nav.organize', icon: LayoutGrid },
      ]
    },
    {
      title: "Content",
      categoryVar: "--cat-content",
      items: [
        { id: 'convert', labelKey: 'nav.convert', icon: Repeat },
        { id: 'watermark', labelKey: 'nav.watermark', icon: Stamp },
        { id: 'metadata', labelKey: 'nav.metadata', icon: Tags },
      ]
    },
    {
      title: "Security & Sign",
      categoryVar: "--cat-security",
      items: [
        { id: 'security', labelKey: 'nav.security', icon: Lock },
        { id: 'sign', labelKey: 'nav.sign', icon: PenTool },
      ]
    },
    {
      title: "Intelligence",
      categoryVar: "--cat-intelligence",
      items: [
        { id: 'ai', labelKey: 'nav.ai', icon: Sparkles },
        { id: 'ocr', labelKey: 'nav.ocr', icon: ScanText },
      ]
    }
  ];

  return (
    <div className="w-64 bg-[var(--bg-surface)] border-r border-[var(--border)] h-full flex flex-col transition-colors duration-300">
      <div className="p-4 border-b border-[var(--border)] transition-colors duration-300">
        <h1 className="text-lg font-bold text-[var(--text-primary)] flex items-baseline space-x-2">
          <span>{t('app.title')}</span>
          <span className="text-[10px] font-normal text-[var(--text-disabled)] uppercase tracking-wider">v2.1</span>
        </h1>
      </div>
      
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto overflow-x-hidden">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-disabled)]">
              {section.title}
            </h2>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activePage === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    style={{
                      backgroundColor: isActive ? `var(${section.categoryVar}-bg)` : 'transparent',
                      color: isActive ? `var(${section.categoryVar})` : 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <Icon size={16} strokeWidth={2.5} className="flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="p-3 border-t border-[var(--border)] transition-colors duration-300">
        <button
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          style={{
            backgroundColor: activePage === 'settings' ? 'var(--cat-global-bg)' : 'transparent',
            color: activePage === 'settings' ? 'var(--cat-global)' : 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (activePage !== 'settings') {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activePage !== 'settings') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <Settings size={16} strokeWidth={2.5} className="flex-shrink-0" />
          <span>{t('nav.settings')}</span>
        </button>
      </div>
    </div>
  );
}