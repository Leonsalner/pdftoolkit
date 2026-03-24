import { useState, useEffect, useCallback, useRef } from 'react';
import { useThumbnailLoader } from '../hooks/useThumbnailLoader';
import { useI18n } from '../lib/i18n';

interface ThumbnailPickerModalProps {
  isOpen: boolean;
  inputPath: string;
  totalPages: number;
  onConfirm: (selectedPages: number[]) => void;
  onClose: () => void;
}

export function ThumbnailPickerModal({
  isOpen,
  inputPath,
  totalPages,
  onConfirm,
  onClose,
}: ThumbnailPickerModalProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lastSelected, setLastSelected] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { thumbnails, isLoadingBatch, registerPageRef } = useThumbnailLoader({
    inputPath: isOpen ? inputPath : null,
    totalPages,
    batchSize: 8,
    bufferAhead: 5,
  });

  const handleClick = useCallback(
    (pageNum: number, event: React.MouseEvent) => {
      if (event.shiftKey && lastSelected !== null) {
        const start = Math.min(lastSelected, pageNum);
        const end = Math.max(lastSelected, pageNum);
        const range = new Set<number>();
        for (let i = start; i <= end; i++) {
          range.add(i);
        }
        setSelected((prev) => {
          const next = new Set(prev);
          for (const p of range) {
            if (next.has(p)) {
              next.delete(p);
            } else {
              next.add(p);
            }
          }
          return next;
        });
      } else {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(pageNum)) {
            next.delete(pageNum);
          } else {
            next.add(pageNum);
          }
          return next;
        });
        setLastSelected(pageNum);
      }
    },
    [lastSelected]
  );

  const handleConfirm = useCallback(() => {
    const sorted = Array.from(selected).sort((a, b) => a - b);
    onConfirm(sorted);
  }, [selected, onConfirm]);

  useEffect(() => {
    if (!isOpen) {
      setSelected(new Set());
      setLastSelected(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('thumbnail.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('thumbnail.selectHint')}
          </p>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1">
            {t('thumbnail.selectedCount')}: {selected.size}
          </p>
        </div>

        <div
          ref={gridRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {isLoadingBatch && Object.keys(thumbnails).length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-500">{t('thumbnail.loading')}</span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            {pages.map((pageNum) => {
              const thumb = thumbnails[pageNum];
              const isSelected = selected.has(pageNum);

              return (
                <div
                  key={pageNum}
                  ref={(el) => registerPageRef(pageNum, el)}
                  data-page={pageNum}
                  onClick={(e) => handleClick(pageNum, e)}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900 scale-95'
                      : 'hover:ring-2 hover:ring-indigo-300 hover:scale-95'
                  }`}
                >
                  {thumb ? (
                    <img
                      src={`data:image/png;base64,${thumb}`}
                      alt={`${t('thumbnail.page')} ${pageNum}`}
                      className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
                      <span className="text-gray-400 text-sm">{pageNum}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <span className="text-white text-xs font-medium">
                      {t('thumbnail.page')} {pageNum}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('thumbnail.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              selected.size === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {t('thumbnail.useSelection')}
          </button>
        </div>
      </div>
    </div>
  );
}

function rangesToString(pages: number[]): string {
  if (pages.length === 0) return '';
  
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);

  return ranges.join(', ');
}

export { rangesToString };
