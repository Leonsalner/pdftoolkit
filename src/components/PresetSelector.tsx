import { Preset } from '../lib/invoke';

interface PresetSelectorProps {
  value: Preset;
  onChange: (p: Preset) => void;
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'screen', label: 'Screen' },
  { value: 'ebook', label: 'Ebook' },
  { value: 'printer', label: 'Printer' },
  { value: 'prepress', label: 'Prepress' },
];

export function PresetSelector({ value, onChange }: PresetSelectorProps) {
  return (
    <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {PRESETS.map((preset) => {
        const isActive = value === preset.value;
        return (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}