import { useState, useCallback } from 'react';
import { DropZone } from '../components/DropZone';
import { LightboxModal } from '../components/LightboxModal';
import { PageIntro } from '../components/PageIntro';
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
  const [lightboxPage, setLightboxPage] = useState<number | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(50);

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
    setLightboxPage(null);
    setBulkMode(false);
    setSelectedPages(new Set());

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
    setSelectedPages((prev) => {
      const next = new Set(prev);
      next.delete(pageNumber);
      return next;
    });
    setPages((prev) => {
      return prev.map((p) => {
        if (p.pageNumber === pageNumber) {
          return { ...p, deleted: !p.deleted };
        }
        return p;
      });
    });
  }, []);

  const handleToggleSelect = useCallback((pageNumber: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  }, []);

  const handleRotateSelected = useCallback(() => {
    if (selectedPages.size === 0) return;

    setPages((prev) =>
      prev.map((page) => {
        if (!selectedPages.has(page.pageNumber)) {
          return page;
        }

        return {
          ...page,
          rotation: (page.rotation + 90) % 360,
        };
      })
    );
  }, [selectedPages]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedPages.size === 0) return;

    setPages((prev) =>
      prev.map((page) =>
        selectedPages.has(page.pageNumber) ? { ...page, deleted: true } : page
      )
    );
    setSelectedPages(new Set());
  }, [selectedPages]);

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
      setBulkMode(false);
      setSelectedPages(new Set());
      setLightboxPage(null);
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
    setLightboxPage(null);
    setBulkMode(false);
    setSelectedPages(new Set());
  };

  const visiblePages = pages.filter((p) => !p.deleted);

  return (
    <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full flex flex-col">
      <PageIntro
        page="organize"
        title={t('organize.title')}
        description={t('organize.desc')}
        className="flex-shrink-0"
        actions={
          inputPath ? (
            <>
              <button
                onClick={handleStartOver}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {t('common.change')}
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={visiblePages.length === 0 || isSaving}
                className={`rounded-lg px-6 py-2 text-sm font-semibold shadow-sm transition-all duration-300 ${
                  visiblePages.length === 0 || isSaving
                    ? 'cursor-not-allowed border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-disabled)]'
                    : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.98]'
                }`}
              >
                {isSaving ? t('organize.saveLoading') : t('organize.save')}
              </button>
            </>
          ) : undefined
        }
      />

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
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm font-medium">
            <span className="max-w-xl truncate text-[var(--text-primary)]">{fileName}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">
                  {t('organize.zoom')}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={zoomLevel}
                  onChange={(event) => setZoomLevel(Number(event.target.value))}
                  className="w-28 accent-[var(--text-primary)]"
                />
              </div>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-[var(--text-secondary)] shadow-sm">
                {visiblePages.length} of {totalPages} pages
              </span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
            <div className="flex-1 overflow-y-auto">
              <OrganizeGrid
                pages={pages}
                thumbnails={thumbnails}
                bulkMode={bulkMode}
                selectedPages={selectedPages}
                zoomLevel={zoomLevel}
                onReorder={handleReorder}
                onRotate={handleRotate}
                onDelete={handleDelete}
                onToggleSelect={handleToggleSelect}
                onThumbnailClick={(pageNumber) => setLightboxPage(pageNumber)}
                t={t}
              />
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] bg-[var(--bg-surface)]/95 px-5 py-4 backdrop-blur">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setBulkMode((current) => {
                      const next = !current;
                      if (!next) {
                        setSelectedPages(new Set());
                      }
                      return next;
                    });
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                    bulkMode
                      ? 'border border-[var(--cat-documents)] bg-[var(--cat-documents-bg)] text-[var(--cat-documents)]'
                      : 'border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  {t('organize.selectMultiple')}
                </button>
                {bulkMode && (
                  <>
                    <button
                      onClick={handleRotateSelected}
                      disabled={selectedPages.size === 0}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--border-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t('organize.rotateSelected')}
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedPages.size === 0}
                      className="rounded-xl border border-[var(--error)]/30 bg-[var(--error-bg)] px-4 py-2 text-sm font-medium text-[var(--error)] transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t('organize.deleteSelected')}
                    </button>
                  </>
                )}
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-disabled)]">
                  {t('organize.dragToReorder')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePreview}
                  disabled={pages.length === 0 || isSaving}
                  className={`rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 ${
                    pages.length === 0 || isSaving
                      ? 'cursor-not-allowed border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-disabled)]'
                      : 'border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] hover:border-[var(--border-hover)] active:scale-[0.98]'
                  }`}
                >
                  {t('organize.preview.title')}
                </button>
              </div>
            </div>
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

          <LightboxModal
            isOpen={lightboxPage !== null}
            thumbnails={thumbnails}
            pages={pages}
            initialPage={lightboxPage ?? 1}
            onClose={() => setLightboxPage(null)}
          />
        </div>
      )}
    </div>
  );
}
