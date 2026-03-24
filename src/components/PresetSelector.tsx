import { Preset } from '../lib/invoke';
import { useI18n } from '../lib/i18n';

interface PresetSelectorProps {
  value: Preset;
  onChange: (p: Preset) => void;
  fileSize: number | null;
}

export function PresetSelector({ value, onChange, fileSize }: PresetSelectorProps) {
  const { t } = useI18n();

  const PRESETS: { value: Preset; label: string; factor: number; desc: string }[] = [
    { value: 'screen', label: t('preset.low'), factor: 0.20, desc: t('preset.low.desc') },
    { value: 'ebook', label: t('preset.medium'), factor: 0.45, desc: t('preset.medium.desc') },
    { value: 'printer', label: t('preset.high'), factor: 0.75, desc: t('preset.high.desc') },
  ];

  const activePreset = PRESETS.find(p => p.value === value) || PRESETS[1];
  
  const estimatedSize = fileSize 
    ? (fileSize * activePreset.factor / 1024 / 1024).toFixed(2)
    : null;

  return (
    <div className="flex flex-col space-y-3">
      <div className="inline-flex bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-1 overflow-x-auto w-full relative">
        {PRESETS.map((preset) => {
          const isActive = value === preset.value;
          return (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              className={`flex-1 min-w-[100px] px-2 py-2 text-sm font-medium rounded-md transition-all duration-300 relative z-10 ${
                isActive
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 bg-[var(--bg-elevated)] shadow-sm rounded-md border border-[var(--border)] -z-10" />
              )}
              {preset.label}
            </button>
          );
        })}
      </div>
      
      <div className="flex justify-between items-start text-sm transition-all duration-300">
        <p className="text-[var(--text-secondary)]">{activePreset.desc}</p>
        {estimatedSize && (
          <p className="font-medium text-[var(--text-primary)] whitespace-nowrap ml-4">
            {t('preset.estSize')}: ~{estimatedSize} MB
          </p>
        )}
      </div>
    </div>
  );
}