interface RangeInputProps {
  value: string;
  onChange: (v: string) => void;
  totalPages: number | null;
}

export function RangeInput({ value, onChange, totalPages }: RangeInputProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Pages to Extract
        </label>
        {totalPages !== null && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            of {totalPages} pages
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 1-5, 10, 14-20"
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono px-3 py-2 border"
      />
    </div>
  );
}