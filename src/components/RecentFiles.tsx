import { Clock3, FileText } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { RecentFile } from '../hooks/useRecentFiles';

interface RecentFilesProps {
  files: RecentFile[];
  onSelect: (path: string, name: string) => void;
}

function formatRelativeTime(timestamp: number, locale: string) {
  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

export function RecentFiles({ files, onSelect }: RecentFilesProps) {
  const { lang, t } = useI18n();

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="pt-2">
      <div className="mb-3 flex items-center gap-2">
        <Clock3 size={14} className="text-[var(--text-disabled)]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
          {t('recent.label')}
        </p>
      </div>
      <div className="space-y-2">
        {files.map((file) => (
          <button
            key={file.path}
            onClick={() => onSelect(file.path, file.name)}
            className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--border-hover)] hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
              <FileText size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{file.name}</p>
              <p className="truncate text-xs text-[var(--text-secondary)]">{file.path}</p>
            </div>
            <span className="whitespace-nowrap text-xs text-[var(--text-disabled)]">
              {formatRelativeTime(file.lastUsed, lang)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
