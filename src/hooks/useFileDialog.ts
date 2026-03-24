import { useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

export function useFileDialog() {
  const openDialog = useCallback(async (): Promise<string | null> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'PDF',
            extensions: ['pdf'],
          },
        ],
      });

      if (Array.isArray(selected)) {
        return selected[0] || null;
      }
      return selected || null;
    } catch (error) {
      console.error('Failed to open file dialog', error);
      return null;
    }
  }, []);

  return { openDialog };
}