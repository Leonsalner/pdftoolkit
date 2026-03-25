interface ToggleProps {
  enabled: boolean;
  onClick: (enabled: boolean) => void;
  className?: string;
}

export function Toggle({ enabled, onClick, className = '' }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={() => onClick(!enabled)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--text-secondary)]/20 ${
        enabled ? 'bg-[var(--success)]' : 'bg-[var(--text-disabled)]'
      } ${className}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
