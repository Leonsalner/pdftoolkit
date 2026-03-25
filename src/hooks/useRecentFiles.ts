import { useCallback, useEffect, useState } from 'react';
import { initStore } from '../lib/store';

export interface RecentFile {
  path: string;
  name: string;
  lastUsed: number;
}

const MAX_RECENT_FILES = 5;

export function useRecentFiles(toolId: string) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    async function loadRecentFiles() {
      const store = await initStore();
      const stored = (await store.get(`recent_${toolId}`)) as RecentFile[] | null;
      setRecentFiles(Array.isArray(stored) ? stored : []);
    }

    loadRecentFiles();
  }, [toolId]);

  const persist = useCallback(async (nextFiles: RecentFile[]) => {
    const store = await initStore();
    await store.set(`recent_${toolId}`, nextFiles);
    await store.save();
  }, [toolId]);

  const addRecentFile = useCallback(
    async (path: string, name: string) => {
      const store = await initStore();
      const stored = (await store.get(`recent_${toolId}`)) as RecentFile[] | null;
      const existingFiles = Array.isArray(stored) ? stored : [];
      const nextFiles = [
        { path, name, lastUsed: Date.now() },
        ...existingFiles.filter((file) => file.path !== path),
      ]
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, MAX_RECENT_FILES);

      setRecentFiles(nextFiles);
      await persist(nextFiles);
    },
    [persist, toolId]
  );

  const clearRecent = useCallback(async () => {
    setRecentFiles([]);
    await persist([]);
  }, [persist]);

  return { recentFiles, addRecentFile, clearRecent };
}
