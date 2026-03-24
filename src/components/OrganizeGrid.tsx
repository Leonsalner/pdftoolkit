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
      className={`relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 transition-colors ${
        page.deleted ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
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
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-sm">{page.pageNumber}</span>
          </div>
        )}
      </div>

      {page.deleted && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
          <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded transform -rotate-12">
            {t('organize.preview.deleted')}
          </div>
        </div>
      )}

      <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
        {page.pageNumber}
      </div>

      {!page.deleted && (
        <div className="absolute bottom-1 right-1 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRotate('ccw');
            }}
            className="w-7 h-7 rounded bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-sm transition-colors"
            title={t('organize.rotateCCW')}
          >
            ↺
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRotate('cw');
            }}
            className="w-7 h-7 rounded bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-sm transition-colors"
            title={t('organize.rotateCW')}
          >
            ↻
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-7 h-7 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm transition-colors"
            title={t('organize.deletePage')}
          >
            ✕
          </button>
        </div>
      )}

      {page.deleted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1 right-1 w-6 h-6 rounded bg-gray-200/90 dark:bg-gray-700/90 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 shadow-sm transition-colors text-xs"
        >
          ↩
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
