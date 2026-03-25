import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { OrganizePage } from './OrganizeGrid';

interface OrganizePreviewModalProps {
  isOpen: boolean;
  originalPageCount: number;
  currentPages: OrganizePage[];
  onConfirm: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export function OrganizePreviewModal({
  isOpen,
  originalPageCount,
  currentPages,
  onConfirm,
  onClose,
  t,
}: OrganizePreviewModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const deletedPages = currentPages.filter((p) => p.deleted);
  const rotatedPages = currentPages.filter((p) => p.rotation !== 0);
  const nonDeletedPages = currentPages.filter((p) => !p.deleted);
  const sortedByNumber = [...nonDeletedPages].sort((a, b) => a.pageNumber - b.pageNumber);
  const reorderedPages = nonDeletedPages
    .map((p, idx) => ({
      page: p,
      newPosition: idx + 1,
      originalPosition: sortedByNumber.findIndex((op) => op.pageNumber === p.pageNumber) + 1,
    }))
    .filter(({ originalPosition, newPosition }) => originalPosition !== newPosition);

  const hasChanges = deletedPages.length > 0 || rotatedPages.length > 0 || reorderedPages.length > 0;

  const visiblePages = currentPages.filter((p) => !p.deleted);
  const outputPageCount = visiblePages.length;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100vh-1.5rem)] flex flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)] px-5 py-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {t('organize.preview.title')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--text-disabled)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!hasChanges ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 h-12 w-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-disabled)]">
                <X size={24} />
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{t('organize.noChanges')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl bg-[var(--bg-elevated)] px-4 py-3 text-sm">
                <span className="font-medium text-[var(--text-secondary)]">
                  {t('organize.pageCount')}:
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {outputPageCount} / {originalPageCount}
                </span>
              </div>

              {deletedPages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--error)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--error)]" />
                    {t('organize.preview.deletions')} ({deletedPages.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {deletedPages.map((p) => (
                      <span
                        key={p.pageNumber}
                        className="rounded-lg bg-[var(--error-bg)] px-2.5 py-1 text-xs font-medium text-[var(--error)] border border-[var(--error)]/20"
                      >
                        {t('organize.preview.page')} {p.pageNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rotatedPages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {t('organize.preview.rotations')} ({rotatedPages.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {rotatedPages.map((p) => (
                      <span
                        key={p.pageNumber}
                        className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      >
                        {t('organize.preview.page')} {p.pageNumber}: {p.rotation}°
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {reorderedPages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cat-documents)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--cat-documents)]" />
                    {t('organize.preview.reorders')} ({reorderedPages.length})
                  </h4>
                  <div className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-3">
                    {reorderedPages.slice(0, 8).map(({ page, originalPosition, newPosition }) => (
                      <div
                        key={page.pageNumber}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border)] last:border-0"
                      >
                        <span className="font-medium text-[var(--text-secondary)]">
                          {t('organize.preview.page')} {page.pageNumber}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--text-disabled)] line-through">{originalPosition}</span>
                          <span className="text-[var(--text-disabled)]">→</span>
                          <span className="font-bold text-[var(--cat-documents)]">
                            {newPosition}
                          </span>
                        </div>
                      </div>
                    ))}
                    {reorderedPages.length > 8 && (
                      <p className="pt-2 text-center text-[10px] font-medium uppercase tracking-wider text-[var(--text-disabled)]">
                        +{reorderedPages.length - 8} {t('common.more')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--bg-base)] px-5 py-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-elevated)] active:scale-[0.98]"
          >
            {t('organize.preview.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasChanges}
            className={`w-full sm:w-auto rounded-xl px-6 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98] ${
              !hasChanges
                ? 'cursor-not-allowed bg-[var(--bg-elevated)] text-[var(--text-disabled)]'
                : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90'
            }`}
          >
            {t('organize.preview.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
