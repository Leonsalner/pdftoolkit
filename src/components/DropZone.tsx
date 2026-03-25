import { useCallback, useEffect, useState } from 'react';
import { useFileDialog } from '../hooks/useFileDialog';
import { useI18n } from '../lib/i18n';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { UploadCloud } from 'lucide-react';

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
    const webview = getCurrentWebview();
    
    const unlistenPromise = webview.onDragDropEvent((event) => {
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

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [onFileSelect, multiple]);

  return (
    <div
      className={`relative cursor-pointer rounded-xl border border-dashed px-6 py-8 text-center transition-all duration-300 ${
        isHovered 
          ? 'border-[var(--text-secondary)] bg-[var(--bg-elevated)] scale-[1.01] shadow-sm' 
          : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'
      }`}
      onClick={handleBrowse}
    >
      <div className="flex flex-col items-center justify-center space-y-2">
        <UploadCloud 
          size={32} 
          strokeWidth={1.5} 
          className={`transition-colors duration-300 ${isHovered ? 'text-[var(--text-primary)]' : 'text-[var(--text-disabled)]'}`} 
        />
        <div className="text-[var(--text-secondary)]">
          <span className={`font-medium transition-colors duration-300 ${isHovered ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
            {isHovered ? 'Drop to upload' : t('common.clickToBrowse')}
          </span>
          {!isHovered && <span className="ml-1">or drag and drop</span>}
        </div>
        <p className="text-xs text-[var(--text-disabled)]">{t('common.localFilesOnly')} (.pdf)</p>
      </div>
    </div>
  );
}
