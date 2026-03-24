import { useState, useCallback } from 'react';
import { DropZone } from '../components/DropZone';
import { OrganizeGrid, type OrganizePage as OrganizePageType } from '../components/OrganizeGrid';
import { OrganizePreviewModal } from '../components/OrganizePreviewModal';
import { useThumbnailLoader } from '../hooks/useThumbnailLoader';
import { getPdfPageCount, saveOrganizedPdf } from '../lib/invoke';
import { useI18n } from '../lib/i18n';
import { Page } from '../components/Sidebar';

interface OrganizePageProps {
  gsAvailable: boolean;
  notify: (message: string, sourcePage: Page) => void;
  isActive: boolean;
}

export function OrganizePage({ gsAvailable, notify, isActive }: OrganizePageProps) {
  const { t } = useI18n();
  const [inputPath, setInputPath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pages, setPages] = useState<OrganizePageType[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<OrganizePageType | null>(null);

  const { thumbnails } = useThumbnailLoader({
    inputPath,
    totalPages,
    batchSize: 8,
  });

  const handleFileSelect = useCallback(async (path: any, name: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    const n = Array.isArray(name) ? name[0] : name;
    
    setInputPath(p);
    setFileName(n);
    setError(null);
    setShowPreview(false);

    try {
      const count = await getPdfPageCount(p);
      setTotalPages(count);
      const initialPages: OrganizePageType[] = Array.from({ length: count }, (_, i) => ({
        pageNumber: i + 1,
        rotation: 0,
        deleted: false,
      }));
      setPages(initialPages);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  const handleReorder = useCallback((newOrder: OrganizePageType[]) => {
    setPages(newOrder);
  }, []);

  const handleRotate = useCallback((pageNumber: number, direction: 'cw' | 'ccw') => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.pageNumber === pageNumber) {
          const delta = direction === 'cw' ? 90 : -90;
          const newRotation = ((p.rotation + delta) % 360 + 360) % 360;
          return { ...p, rotation: newRotation };
        }
        return p;
      })
    );
  }, []);

  const handleDelete = useCallback((pageNumber: number) => {
    setPages((prev) => {
      const page = prev.find((p) => p.pageNumber === pageNumber);
      if (page && !page.deleted) {
        setLastDeleted(page);
      }
      return prev.map((p) => {
        if (p.pageNumber === pageNumber) {
          return { ...p, deleted: !p.deleted };
        }
        return p;
      });
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (lastDeleted) {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber === lastDeleted.pageNumber
            ? { ...p, deleted: false }
            : p
        )
      );
      setLastDeleted(null);
    }
  }, [lastDeleted]);

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleConfirmSave = async () => {
    if (!inputPath) return;

    setIsSaving(true);
    setError(null);

    try {
      const visiblePages = pages.filter((p) => !p.deleted);
      const pageOrder = visiblePages.map((p) => p.pageNumber);
      const rotations: Record<string, number> = {};

      for (const p of visiblePages) {
        if (p.rotation !== 0) {
          rotations[p.pageNumber.toString()] = p.rotation;
        }
      }

      await saveOrganizedPdf(inputPath, pageOrder, rotations);

      if (!isActive) {
        notify(t('organize.success'), 'organize');
      }

      setShowPreview(false);
      setInputPath(null);
      setFileName(null);
      setPages([]);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartOver = () => {
    setInputPath(null);
    setFileName(null);
    setTotalPages(0);
    setPages([]);
    setShowPreview(false);
    setError(null);
  };

  const visiblePages = pages.filter((p) => !p.deleted);

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('organize.title')}</h2>

      {!gsAvailable && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200">
          <p className="font-semibold">{t('organize.gsWarning')}</p>
          <p className="text-sm mt-1">{t('organize.gsWarningDetail')}</p>
        </div>
      )}

      <div className="space-y-8">
        {!inputPath ? (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('common.step1')}
            </h3>
            <DropZone onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <>
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center transition-all duration-300">
              <div className="flex flex-col truncate mr-4">
                <span className="font-medium truncate">{fileName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('organize.pageCount')}: {visiblePages.length} / {totalPages}
                </span>
              </div>
              <button
                onClick={handleStartOver}
                className="text-sm text-gray-500 hover:text-red-500 flex-shrink-0 transition-colors"
              >
                {t('common.change')}
              </button>
            </div>

            <div className="border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
              <OrganizeGrid
                pages={pages}
                thumbnails={thumbnails}
                onReorder={handleReorder}
                onRotate={handleRotate}
                onDelete={handleDelete}
                t={t}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              {lastDeleted && (
                <button
                  onClick={handleUndo}
                  disabled={isSaving}
                  className="px-4 py-3 rounded-lg font-medium transition-all duration-300 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 border border-amber-300 dark:border-amber-700"
                >
                  ↩ {t('organize.undoDelete')} ({t('organize.preview.page')} {lastDeleted.pageNumber})
                </button>
              )}
              <button
                onClick={handlePreview}
                disabled={pages.length === 0 || isSaving}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  pages.length === 0 || isSaving
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t('organize.preview.title')}
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={visiblePages.length === 0 || isSaving}
                className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                  visiblePages.length === 0 || isSaving
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                }`}
              >
                {isSaving ? t('organize.saveLoading') : t('organize.save')}
              </button>
            </div>

            <OrganizePreviewModal
              isOpen={showPreview}
              originalPageCount={totalPages}
              currentPages={pages}
              onConfirm={handleConfirmSave}
              onClose={() => setShowPreview(false)}
              t={t}
            />
          </>
        )}
      </div>
    </div>
  );
}
