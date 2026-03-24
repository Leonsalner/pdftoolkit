import { useCallback } from 'react';
import { useFileDialog } from '../hooks/useFileDialog';

interface DropZoneProps {
  onFileSelect: (path: any, name: any) => void;
  accept?: string;
  multiple?: boolean;
}

export function DropZone({ onFileSelect, multiple = false }: DropZoneProps) {
  const { openDialog } = useFileDialog();

  const handleBrowse = useCallback(async () => {
    const paths = await openDialog(multiple);
    if (paths) {
      if (Array.isArray(paths)) {
        const names = paths.map(p => p.split('/').pop() || p.split('\\').pop() || 'Selected File');
        onFileSelect(paths, names);
      } else {
        const name = paths.split('/').pop() || paths.split('\\').pop() || 'Selected File';
        onFileSelect(paths, name);
      }
    }
  }, [openDialog, onFileSelect, multiple]);

  return (
    <div
      className="relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={handleBrowse}
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div className="text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to browse for a PDF</span>
        </div>
        <p className="text-xs text-gray-500">Local files only</p>
      </div>
    </div>
  );
}