import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, Plus, RotateCcw, RotateCw, Undo2, X } from 'lucide-react';
import { ThumbnailMap } from '../hooks/useThumbnailLoader';

export interface OrganizePage {
  pageNumber: number;
  rotation: number;
  deleted: boolean;
}

interface OrganizeGridProps {
  pages: OrganizePage[];
  thumbnails: ThumbnailMap;
  bulkMode: boolean;
  selectedPages: Set<number>;
  zoomLevel: number;
  onReorder: (newOrder: OrganizePage[]) => void;
  onRotate: (pageNumber: number, direction: 'cw' | 'ccw') => void;
  onDelete: (pageNumber: number) => void;
  onToggleSelect: (pageNumber: number) => void;
  onThumbnailClick: (pageNumber: number) => void;
  t: (key: string) => string;
}

interface SortableItemProps {
  page: OrganizePage;
  thumbnail?: string;
  bulkMode: boolean;
  isSelected: boolean;
  onRotate: (direction: 'cw' | 'ccw') => void;
  onDelete: () => void;
  onToggleSelect: () => void;
  onThumbnailClick: () => void;
  t: (key: string) => string;
}

function getGridClass(zoomLevel: number) {
  if (zoomLevel <= 24) {
    return 'grid-cols-3 md:grid-cols-4 xl:grid-cols-5';
  }
  if (zoomLevel >= 70) {
    return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';
  }
  return 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
}

function SortableItem({
  page,
  thumbnail,
  bulkMode,
  isSelected,
  onRotate,
  onDelete,
  onToggleSelect,
  onThumbnailClick,
  t,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.pageNumber,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : page.deleted ? 0.55 : 1,
  };

  const rotationStyle = page.rotation !== 0 ? { transform: `rotate(${page.rotation}deg)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} className={`group ${isDragging ? 'z-50' : ''}`}>
      <div
        onClick={() => (bulkMode ? onToggleSelect() : onThumbnailClick())}
        className={`cursor-pointer rounded-xl border bg-[var(--bg-surface)] p-2 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg ${
          isSelected ? 'border-[var(--cat-documents)] shadow-md' : 'border-[var(--border)]'
        }`}
      >
        <div className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-zinc-950">
          <div className="aspect-[3/4] flex items-center justify-center bg-zinc-900">
            {thumbnail ? (
              <img
                src={`data:image/png;base64,${thumbnail}`}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full object-contain"
                style={rotationStyle}
              />
            ) : (
              <span className="text-sm text-white/60">{t('organize.loadPages')}</span>
            )}
          </div>

          {!page.deleted && (
            <button
              {...attributes}
              {...listeners}
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/30 text-white/90 opacity-0 transition-opacity duration-150 group-hover:opacity-100 cursor-grab active:cursor-grabbing hover:bg-black/50"
            >
              <GripVertical size={14} />
            </button>
          )}

          {page.deleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <div className="rounded-full border border-[var(--error)] bg-[var(--error-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--error)]">
                {t('organize.preview.deleted')}
              </div>
            </div>
          )}

          {bulkMode && !page.deleted && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelect();
              }}
              className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border text-white backdrop-blur ${
                isSelected
                  ? 'border-[var(--cat-documents)] bg-[var(--cat-documents)]'
                  : 'border-white/25 bg-black/35'
              }`}
            >
              {isSelected ? <Check size={14} /> : null}
            </button>
          )}

          {!bulkMode && !page.deleted && (
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRotate('ccw');
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white/90 transition-colors hover:bg-black/50"
                title={t('organize.rotateCCW')}
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRotate('cw');
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white/90 transition-colors hover:bg-black/50"
                title={t('organize.rotateCW')}
              >
                <RotateCw size={14} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white/90 transition-colors hover:bg-[var(--error)]"
                title={t('organize.deletePage')}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {page.deleted && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white/90 transition-colors hover:bg-black/50"
            >
              <Undo2 size={14} />
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">Page {page.pageNumber}</p>
          {page.rotation !== 0 && (
            <span className="rounded-full bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
              {page.rotation}°
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrganizeGrid({
  pages,
  thumbnails,
  bulkMode,
  selectedPages,
  zoomLevel,
  onReorder,
  onRotate,
  onDelete,
  onToggleSelect,
  onThumbnailClick,
  t,
}: OrganizeGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((page) => page.pageNumber === active.id);
      const newIndex = pages.findIndex((page) => page.pageNumber === over.id);
      onReorder(arrayMove(pages, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pages.map((page) => page.pageNumber)} strategy={rectSortingStrategy}>
        <div className={`grid ${getGridClass(zoomLevel)} gap-5 p-5`}>
          {pages.map((page) => (
            <SortableItem
              key={page.pageNumber}
              page={page}
              thumbnail={thumbnails[page.pageNumber]}
              bulkMode={bulkMode}
              isSelected={selectedPages.has(page.pageNumber)}
              onRotate={(direction) => onRotate(page.pageNumber, direction)}
              onDelete={() => onDelete(page.pageNumber)}
              onToggleSelect={() => onToggleSelect(page.pageNumber)}
              onThumbnailClick={() => onThumbnailClick(page.pageNumber)}
              t={t}
            />
          ))}

          <button
            type="button"
            className="flex aspect-[3/4] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-center text-[var(--text-secondary)] transition-colors hover:border-[var(--border-hover)]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm">
              <Plus size={18} />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{t('organize.insertPage')}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{t('organize.insertPageHint')}</p>
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
}
