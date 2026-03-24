interface RangeInputProps {
  value: string;
  onChange: (v: string) => void;
  totalPages: number | null;
}

export function RangeInput({ value, onChange, totalPages }: RangeInputProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Pages to Extract
        </label>
        {totalPages !== null && (
          <span className="text-xs text-[var(--text-disabled)]">
            of {totalPages} pages
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 1-5, 10, 14-20"
        className="block w-full rounded-md border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] sm:text-sm font-mono px-3 py-2 border transition-colors outline-none"
      />
    </div>
  );
}