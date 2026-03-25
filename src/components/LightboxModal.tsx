import { useEffect, useMemo, useState, WheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ThumbnailMap } from '../hooks/useThumbnailLoader';
import { OrganizePage } from './OrganizeGrid';

interface LightboxModalProps {
  isOpen: boolean;
  thumbnails: ThumbnailMap;
  pages: OrganizePage[];
  initialPage: number;
  onClose: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function LightboxModal({ isOpen, thumbnails, pages, initialPage, onClose }: LightboxModalProps) {
  const visiblePages = useMemo(() => pages.filter((page) => !page.deleted), [pages]);
  const initialIndex = Math.max(
    0,
    visiblePages.findIndex((page) => page.pageNumber === initialPage)
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [initialIndex, isOpen]);

  // Reset zoom when page changes
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        setCurrentIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === 'ArrowRight') {
        setCurrentIndex((index) => Math.min(index + 1, visiblePages.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, visiblePages.length]);

  if (!isOpen || visiblePages.length === 0) {
    return null;
  }

  const currentPage = visiblePages[currentIndex];
  const thumbnail = thumbnails[currentPage.pageNumber];

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((currentZoom) => clamp(currentZoom + (event.deltaY < 0 ? 0.15 : -0.15), 1, 4));
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 animate-in fade-in zoom-in-95 duration-200">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
      >
        <X size={18} />
      </button>

      <button
        type="button"
        onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
        disabled={currentIndex === 0}
        className="absolute left-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={22} />
      </button>

      <div className="flex h-full w-full items-center justify-center overflow-hidden" onWheel={handleWheel}>
        <div className="relative flex items-center justify-center p-8">
          {thumbnail ? (
            <img
              src={`data:image/png;base64,${thumbnail}`}
              alt={`Page ${currentPage.pageNumber}`}
              className="max-h-[85vh] max-w-[85vw] object-contain transition-transform duration-150 shadow-2xl"
              style={{
                transform: `scale(${zoom}) rotate(${currentPage.rotation}deg)`,
              }}
            />
          ) : (
            <div className="flex h-[60vh] w-[50vw] items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/70">
              Page preview unavailable
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCurrentIndex((index) => Math.min(index + 1, visiblePages.length - 1))}
        disabled={currentIndex === visiblePages.length - 1}
        className="absolute right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={22} />
      </button>

      <div className="absolute bottom-8 z-10 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur border border-white/10">
        Page {currentIndex + 1} of {visiblePages.length} · Zoom {Math.round(zoom * 100)}%
      </div>
    </div>,
    document.body
  );
}
