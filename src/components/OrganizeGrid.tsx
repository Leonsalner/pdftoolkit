import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ThumbnailMap } from '../hooks/useThumbnailLoader';
import { RotateCcw, RotateCw, X, Undo2 } from 'lucide-react';

export interface OrganizePage {
  pageNumber: number;
  rotation: number;
  deleted: boolean;
}

interface OrganizeGridProps {
  pages: OrganizePage[];
  thumbnails: ThumbnailMap;
  onReorder: (newOrder: OrganizePage[]) => void;
  onRotate: (pageNumber: number, direction: 'cw' | 'ccw') => void;
  onDelete: (pageNumber: number) => void;
  t: (key: string) => string;
}

interface SortableItemProps {
  page: OrganizePage;
  thumbnail?: string;
  onRotate: (direction: 'cw' | 'ccw') => void;
  onDelete: () => void;
  t: (key: string) => string;
}

function SortableItem({ page, thumbnail, onRotate, onDelete, t }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.pageNumber });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : page.deleted ? 0.5 : 1,
  };

  const rotationStyle = page.rotation !== 0
    ? { transform: `rotate(${page.rotation}deg)` }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-[3/4] rounded-lg overflow-hidden bg-[var(--bg-surface)] border-2 transition-colors ${
        page.deleted ? 'border-[var(--error)]' : 'border-[var(--border)]'
      } ${isDragging ? 'z-50 shadow-xl' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        {thumbnail ? (
          <img
            src={`data:image/png;base64,${thumbnail}`}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-contain"
            style={rotationStyle}
          />
        ) : (
          <div className="w-full h-full bg-[var(--bg-elevated)] animate-pulse flex items-center justify-center">
            <span className="text-[var(--text-disabled)] text-sm">{page.pageNumber}</span>
          </div>
        )}
      </div>

      {page.deleted && (
        <div className="absolute inset-0 bg-[var(--bg-base)]/50 flex items-center justify-center">
          <div className="text-[var(--error)] text-xs font-bold px-2 py-1 rounded transform -rotate-12 border border-[var(--error)] bg-[var(--error-bg)]">
            {t('organize.preview.deleted')}
          </div>
        </div>
      )}

      <div className="absolute top-1.5 left-1.5 bg-[var(--bg-surface)]/80 backdrop-blur-sm text-[var(--text-primary)] text-xs font-medium px-2 py-0.5 rounded-md border border-[var(--border)] shadow-sm">
        {page.pageNumber}
      </div>

      {!page.deleted && (
        <div className="absolute bottom-1.5 right-1.5 flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRotate('ccw');
            }}
            className="w-7 h-7 rounded-md bg-[var(--bg-surface)]/90 backdrop-blur-sm hover:bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)] shadow-sm transition-colors"
            title={t('organize.rotateCCW')}
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRotate('cw');
            }}
            className="w-7 h-7 rounded-md bg-[var(--bg-surface)]/90 backdrop-blur-sm hover:bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)] shadow-sm transition-colors"
            title={t('organize.rotateCW')}
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-7 h-7 rounded-md flex items-center justify-center shadow-sm transition-colors border"
            style={{ 
              backgroundColor: 'var(--error-bg)', 
              color: 'var(--error)',
              borderColor: 'var(--error)' 
            }}
            title={t('organize.deletePage')}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {page.deleted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-md bg-[var(--bg-surface)]/90 backdrop-blur-sm hover:bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border)] shadow-sm transition-colors"
        >
          <Undo2 size={14} />
        </button>
      )}
    </div>
  );
}

export function OrganizeGrid({ pages, thumbnails, onReorder, onRotate, onDelete, t }: OrganizeGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.pageNumber === active.id);
      const newIndex = pages.findIndex((p) => p.pageNumber === over.id);
      const newPages = arrayMove(pages, oldIndex, newIndex);
      onReorder(newPages);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={pages.map((p) => p.pageNumber)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4">
          {pages.map((page) => (
            <SortableItem
              key={page.pageNumber}
              page={page}
              thumbnail={thumbnails[page.pageNumber]}
              onRotate={(dir) => onRotate(page.pageNumber, dir)}
              onDelete={() => onDelete(page.pageNumber)}
              t={t}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
