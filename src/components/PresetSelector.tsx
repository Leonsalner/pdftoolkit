import { Monitor, BookOpen, Printer } from 'lucide-react';
import { Preset } from '../lib/invoke';
import { useI18n } from '../lib/i18n';

interface PresetSelectorProps {
  value: Preset;
  onChange: (p: Preset) => void;
  fileSize: number | null;
}

export function PresetSelector({ value, onChange, fileSize }: PresetSelectorProps) {
  const { t } = useI18n();

  const PRESETS = [
    { 
      value: 'screen' as Preset, 
      label: t('preset.low'), 
      factor: 0.20, 
      desc: t('preset.low.desc'),
      icon: Monitor 
    },
    { 
      value: 'ebook' as Preset, 
      label: t('preset.medium'), 
      factor: 0.45, 
      desc: t('preset.medium.desc'),
      icon: BookOpen 
    },
    { 
      value: 'printer' as Preset, 
      label: t('preset.high'), 
      factor: 0.75, 
      desc: t('preset.high.desc'),
      icon: Printer 
    },
  ];

  return (
    <div className="space-y-3">
      {PRESETS.map((preset) => {
        const isActive = value === preset.value;
        const Icon = preset.icon;
        const estimatedSize = fileSize 
          ? (fileSize * preset.factor / 1024 / 1024).toFixed(1)
          : null;

        return (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left group ${
              isActive
                ? 'border-[var(--cat-documents)] bg-[var(--cat-documents-bg)] shadow-sm'
                : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)] hover:-translate-y-[1px]'
            }`}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-[var(--cat-documents)] text-white' 
                : 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] group-hover:text-[var(--text-secondary)]'
            }`}>
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-semibold transition-colors ${
                  isActive ? 'text-[var(--cat-documents)]' : 'text-[var(--text-primary)]'
                }`}>
                  {preset.label}
                </p>
                {estimatedSize && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-[var(--cat-documents)] text-white' 
                      : 'bg-[var(--bg-elevated)] text-[var(--text-disabled)]'
                  }`}>
                    ~{estimatedSize} MB
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 leading-relaxed transition-colors ${
                isActive ? 'text-[var(--cat-documents)]/80' : 'text-[var(--text-secondary)]'
              }`}>
                {preset.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}