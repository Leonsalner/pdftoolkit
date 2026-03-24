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
    <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
      <div className="mb-6 border-b border-[var(--border)] pb-6 flex justify-between items-end flex-shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('organize.title')}</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{t('organize.desc')}</p>
        </div>
        {inputPath && (
          <div className="flex gap-3">
            <button
              onClick={handleStartOver}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {t('common.change')}
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={visiblePages.length === 0 || isSaving}
              className={`py-2 px-6 rounded-lg font-semibold transition-all duration-300 shadow-sm text-sm ${
                visiblePages.length === 0 || isSaving
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
              }`}
            >
              {isSaving ? t('organize.saveLoading') : t('organize.save')}
            </button>
          </div>
        )}
      </div>

      {!gsAvailable && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 flex-shrink-0">
          <p className="font-semibold">{t('organize.gsWarning')}</p>
          <p className="text-sm mt-1">{t('organize.gsWarningDetail')}</p>
        </div>
      )}

      {!inputPath ? (
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
            {t('common.step1')}
          </h3>
          <DropZone onFileSelect={handleFileSelect} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-[var(--text-primary)] truncate max-w-xl">{fileName}</span>
            <span className="text-[var(--text-secondary)] bg-[var(--bg-surface)] px-3 py-1 rounded-full border border-[var(--border)] shadow-sm">
              {visiblePages.length} of {totalPages} pages
            </span>
          </div>

          <div className="flex-1 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm overflow-y-auto">
            <OrganizeGrid
              pages={pages}
              thumbnails={thumbnails}
              onReorder={handleReorder}
              onRotate={handleRotate}
              onDelete={handleDelete}
              t={t}
            />
          </div>

          <div className="flex justify-between items-center flex-shrink-0 pt-2">
            <div className="flex gap-4">
              {lastDeleted && (
                <button
                  onClick={handleUndo}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-[var(--cat-security-bg)] text-[var(--cat-security)] hover:opacity-80 border border-[var(--cat-security)]/30"
                >
                  ↩ {t('organize.undoDelete')} (Page {lastDeleted.pageNumber})
                </button>
              )}
            </div>
            
            <button
              onClick={handlePreview}
              disabled={pages.length === 0 || isSaving}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm ${
                pages.length === 0 || isSaving
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {t('organize.preview.title')}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-[var(--error-bg)] border border-[var(--error)] rounded-xl text-[var(--error)] text-sm shadow-sm flex-shrink-0">
              {error}
            </div>
          )}

          <OrganizePreviewModal
            isOpen={showPreview}
            originalPageCount={totalPages}
            currentPages={pages}
            onConfirm={handleConfirmSave}
            onClose={() => setShowPreview(false)}
            t={t}
          />
        </div>
      )}
    </div>
  );
}