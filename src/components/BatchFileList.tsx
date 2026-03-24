export type BatchFileStatus = 'pending' | 'processing' | 'done' | 'error';

export interface BatchFile {
  id: string;
  path: string;
  name: string;
  status: BatchFileStatus;
  result?: unknown;
  error?: string;
}

interface BatchFileListProps {
  files: BatchFile[];
  onRemove: (id: string) => void;
  onSaveText?: (id: string) => void;
  t: (key: string) => string;
}

export function BatchFileList({ files, onRemove, onSaveText, t }: BatchFileListProps) {
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {file.path}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {file.status === 'pending' && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {t('batch.status.pending')}
              </span>
            )}

            {file.status === 'processing' && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('batch.status.processing')}
              </span>
            )}

            {file.status === 'done' && (
              <>
                {onSaveText && (
                  <button
                    onClick={() => onSaveText(file.id)}
                    className="px-2 py-1 text-xs font-medium rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                  >
                    {t('ocr.saveText')}
                  </button>
                )}
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300">
                  {t('batch.status.done')}
                </span>
              </>
            )}

            {file.status === 'error' && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300" title={file.error}>
                {t('batch.status.error')}
              </span>
            )}

            {file.status !== 'processing' && (
              <button
                onClick={() => onRemove(file.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={t('batch.removeFile')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
