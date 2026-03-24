interface ResultBannerProps {
  type: 'success' | 'error';
  message: string;
  details?: string;
}

export function ResultBanner({ type, message, details }: ResultBannerProps) {
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-red-50 dark:bg-red-900/10';
  const borderColor = isSuccess ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800';
  const textColor = isSuccess ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300';
  const titleColor = isSuccess ? 'text-emerald-900 dark:text-emerald-200' : 'text-red-900 dark:text-red-200';

  return (
    <div className={`p-4 rounded-lg border ${bgColor} ${borderColor} mt-4`}>
      <div className="flex">
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${titleColor}`}>{message}</h3>
          {details && (
            <div className={`mt-2 text-sm ${textColor}`}>
              <p>{details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}