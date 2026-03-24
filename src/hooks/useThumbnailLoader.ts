import { useState, useCallback, useRef, useEffect } from 'react';
import { generatePageThumbnails } from '../lib/invoke';

export interface UseThumbnailLoaderOptions {
  inputPath: string | null;
  totalPages: number;
  batchSize?: number;
  bufferAhead?: number;
}

export type ThumbnailMap = { [pageNumber: number]: string };

export function useThumbnailLoader({
  inputPath,
  totalPages,
  batchSize = 8,
  bufferAhead = 5,
}: UseThumbnailLoaderOptions) {
  const [thumbnails, setThumbnails] = useState<ThumbnailMap>({});
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const pageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const requestedPages = useRef<Set<number>>(new Set());
  const pendingBatches = useRef<Set<string>>(new Set());

  const fetchBatch = useCallback(
    async (pageNumbers: number[]) => {
      if (!inputPath || pageNumbers.length === 0) return;

      const batchKey = [...pageNumbers].sort((a, b) => a - b).join(',');
      if (pendingBatches.current.has(batchKey)) return;
      pendingBatches.current.add(batchKey);

      setIsLoadingBatch(true);
      try {
        const results = await generatePageThumbnails(inputPath, pageNumbers, 150);
        setThumbnails((prev) => {
          const next = { ...prev };
          for (const thumb of results) {
            next[thumb.page_number] = thumb.data;
            requestedPages.current.add(thumb.page_number);
          }
          return next;
        });
      } catch (err) {
        console.error('Failed to load thumbnails:', err);
      } finally {
        pendingBatches.current.delete(batchKey);
        setIsLoadingBatch(false);
      }
    },
    [inputPath]
  );

  const registerPageRef = useCallback(
    (pageNum: number, el: HTMLDivElement | null) => {
      pageRefs.current.set(pageNum, el);
    },
    []
  );

  useEffect(() => {
    if (!inputPath || totalPages === 0) return;

    const visiblePages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      const el = pageRefs.current.get(i);
      if (el && el.offsetParent !== null) {
        visiblePages.push(i);
      }
    }

    const toFetch: number[] = [];
    for (const pageNum of visiblePages) {
      if (!requestedPages.current.has(pageNum)) {
        toFetch.push(pageNum);
      }
    }

    const nextBuffer: number[] = [];
    const lastVisible = visiblePages[visiblePages.length - 1] || 0;
    for (let i = lastVisible + 1; i <= Math.min(lastVisible + bufferAhead, totalPages); i++) {
      if (!requestedPages.current.has(i)) {
        nextBuffer.push(i);
      }
    }

    const allToFetch = [...toFetch, ...nextBuffer].slice(0, batchSize);
    if (allToFetch.length > 0) {
      fetchBatch(allToFetch);
    }
  }, [inputPath, totalPages, batchSize, bufferAhead, fetchBatch]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const toFetch: number[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page'));
            if (!requestedPages.current.has(pageNum)) {
              toFetch.push(pageNum);
            }
          }
        }

        if (toFetch.length > 0) {
          const sorted = toFetch.sort((a, b) => a - b).slice(0, batchSize);
          fetchBatch(sorted);
        }
      },
      { rootMargin: '200px' }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [batchSize, fetchBatch]);

  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;

    for (const [pageNum, el] of pageRefs.current) {
      if (el && !requestedPages.current.has(pageNum)) {
        observer.observe(el);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [thumbnails, totalPages]);

  return {
    thumbnails,
    isLoadingBatch,
    registerPageRef,
  };
}
