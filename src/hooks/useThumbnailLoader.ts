import { useState, useEffect } from 'react';
import { generatePageThumbnails } from '../lib/invoke';

export interface UseThumbnailLoaderOptions {
  inputPath: string | null;
  totalPages: number;
  batchSize?: number;
}

export type ThumbnailMap = { [pageNumber: number]: string };

export function useThumbnailLoader({
  inputPath,
  totalPages,
  batchSize = 8,
}: UseThumbnailLoaderOptions) {
  const [thumbnails, setThumbnails] = useState<ThumbnailMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    if (!inputPath || totalPages === 0) return;

    let cancelled = false;

    async function loadAll() {
      setIsLoading(true);
      setLoadedCount(0);

      const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);

      for (let i = 0; i < allPages.length && !cancelled; i += batchSize) {
        const batch = allPages.slice(i, i + batchSize);

        try {
          const results = await generatePageThumbnails(inputPath!, batch, 150);

          if (cancelled) break;

          setThumbnails((prev) => {
            const next = { ...prev };
            for (const thumb of results) {
              next[thumb.page_number] = thumb.data;
            }
            return next;
          });

          setLoadedCount((prev) => Math.min(prev + results.length, totalPages));
        } catch (err) {
          console.error('Failed to load thumbnails:', err);
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [inputPath, totalPages, batchSize]);

  return {
    thumbnails,
    isLoading,
    loadedCount,
  };
}
