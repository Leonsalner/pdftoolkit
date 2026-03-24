import { useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

export function useFileDialog() {
  const openDialog = useCallback(async (multiple: boolean = false): Promise<string | string[] | null> => {
    try {
      const selected = await open({
        multiple,
        filters: [
          {
            name: 'PDF',
            extensions: ['pdf'],
          },
        ],
      });

      return selected || null;
    } catch (error) {
      console.error('Failed to open file dialog', error);
      return null;
    }
  }, []);

  return { openDialog };
}