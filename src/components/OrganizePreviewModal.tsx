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
  if (!isOpen) return null;

  const deletedPages = currentPages.filter((p) => p.deleted);
  const rotatedPages = currentPages.filter((p) => p.rotation !== 0);
  const reorderedPages = currentPages
    .map((p, idx) => ({ page: p, originalPosition: idx + 1 }))
    .filter(({ page, originalPosition }) => page.pageNumber !== originalPosition);

  const hasChanges = deletedPages.length > 0 || rotatedPages.length > 0 || reorderedPages.length > 0;

  const visiblePages = currentPages.filter((p) => !p.deleted);
  const outputPageCount = visiblePages.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('organize.preview.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!hasChanges ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">{t('organize.noChanges')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('organize.pageCount')}:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {outputPageCount} / {originalPageCount}
                </span>
              </div>

              {deletedPages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    {t('organize.preview.deletions')} ({deletedPages.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {deletedPages.map((p) => (
                      <span
                        key={p.pageNumber}
                        className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded"
                      >
                        {t('organize.preview.page')} {p.pageNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rotatedPages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                    {t('organize.preview.rotations')} ({rotatedPages.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {rotatedPages.map((p) => (
                      <span
                        key={p.pageNumber}
                        className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded"
                      >
                        {t('organize.preview.page')} {p.pageNumber}: {t('organize.preview.rotatedBy')} {p.rotation}°
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {reorderedPages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                    {t('organize.preview.reorders')} ({reorderedPages.length})
                  </h4>
                  <div className="space-y-1">
                    {reorderedPages.slice(0, 5).map(({ page, originalPosition }) => (
                      <div
                        key={page.pageNumber}
                        className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <span className="font-medium">
                          {t('organize.preview.page')} {page.pageNumber}
                        </span>
                        <span className="text-gray-400">{originalPosition}</span>
                        <span>→</span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {currentPages.findIndex((p) => p.pageNumber === page.pageNumber) + 1}
                        </span>
                      </div>
                    ))}
                    {reorderedPages.length > 5 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{reorderedPages.length - 5} more...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('organize.preview.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              !hasChanges
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {t('organize.preview.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
