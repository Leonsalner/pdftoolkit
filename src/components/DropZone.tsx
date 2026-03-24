import { useCallback, useEffect, useState } from 'react';
import { useFileDialog } from '../hooks/useFileDialog';
import { useI18n } from '../lib/i18n';
import { getCurrentWebview } from '@tauri-apps/api/webview';

interface DropZoneProps {
  onFileSelect: (path: any, name: any) => void;
  accept?: string;
  multiple?: boolean;
}

export function DropZone({ onFileSelect, multiple = false }: DropZoneProps) {
  const { openDialog } = useFileDialog();
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

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

  useEffect(() => {
    let unlisten: any;
    
    async function setupDragDrop() {
      const webview = getCurrentWebview();
      
      unlisten = await webview.onDragDropEvent((event) => {
        if (event.payload.type === 'enter') {
          setIsHovered(true);
        } else if (event.payload.type === 'leave') {
          setIsHovered(false);
        } else if (event.payload.type === 'drop') {
          setIsHovered(false);
          const paths = event.payload.paths;
          
          // Filter for PDF files only
          const pdfPaths = paths.filter(p => p.toLowerCase().endsWith('.pdf'));
          
          if (pdfPaths.length > 0) {
            if (multiple) {
              const names = pdfPaths.map(p => p.split('/').pop() || p.split('\\').pop() || 'Selected File');
              onFileSelect(pdfPaths, names);
            } else {
              const p = pdfPaths[0];
              const name = p.split('/').pop() || p.split('\\').pop() || 'Selected File';
              onFileSelect(p, name);
            }
          }
        }
      });
    }

    setupDragDrop();

    return () => {
      if (unlisten) {
        unlisten.then((f: any) => f());
      }
    };
  }, [onFileSelect, multiple]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
        isHovered 
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]' 
          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={handleBrowse}
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        <svg className={`w-10 h-10 transition-colors duration-300 ${isHovered ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div className="text-gray-600 dark:text-gray-400">
          <span className={`font-semibold transition-colors duration-300 ${isHovered ? 'text-indigo-600 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {isHovered ? 'Drop to upload' : t('common.clickToBrowse')}
          </span>
          {!isHovered && <span className="ml-1">or drag and drop</span>}
        </div>
        <p className="text-xs text-gray-500">{t('common.localFilesOnly')} (.pdf)</p>
      </div>
    </div>
  );
}