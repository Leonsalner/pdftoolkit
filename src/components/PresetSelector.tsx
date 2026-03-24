import { Preset } from '../lib/invoke';

interface PresetSelectorProps {
  value: Preset;
  onChange: (p: Preset) => void;
  fileSize: number | null;
}

const PRESETS: { value: Preset; label: string; factor: number; desc: string }[] = [
  { value: 'screen', label: 'Low', factor: 0.15, desc: 'Best for web & email. Lowest resolution.' },
  { value: 'ebook', label: 'Medium', factor: 0.35, desc: 'Good balance of size and quality.' },
  { value: 'printer', label: 'High', factor: 0.75, desc: 'High resolution for home/office printing.' },
];

export function PresetSelector({ value, onChange, fileSize }: PresetSelectorProps) {
  const activePreset = PRESETS.find(p => p.value === value) || PRESETS[1];
  
  const estimatedSize = fileSize 
    ? (fileSize * activePreset.factor / 1024 / 1024).toFixed(2)
    : null;

  return (
    <div className="flex flex-col space-y-3">
      <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto w-full">
        {PRESETS.map((preset) => {
          const isActive = value === preset.value;
          return (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              className={`flex-1 min-w-[100px] px-2 py-2 text-sm font-medium rounded-md transition-colors ${
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
      
      <div className="flex justify-between items-start text-sm">
        <p className="text-gray-500 dark:text-gray-400">{activePreset.desc}</p>
        {estimatedSize && (
          <p className="font-medium text-indigo-600 dark:text-indigo-400">
            Est. Size: ~{estimatedSize} MB
          </p>
        )}
      </div>
    </div>
  );
}