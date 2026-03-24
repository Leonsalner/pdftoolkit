interface ResultBannerProps {
  type: 'success' | 'error';
  message: string;
  details?: string;
}

export function ResultBanner({ type, message, details }: ResultBannerProps) {
  const isSuccess = type === 'success';

  return (
    <div 
      className="p-4 rounded-lg border mt-4"
      style={{
        backgroundColor: isSuccess ? 'var(--success-bg)' : 'var(--error-bg)',
        borderColor: isSuccess ? 'var(--success)' : 'var(--error)',
        opacity: 0.9
      }}
    >
      <div className="flex">
        <div className="ml-2">
          <h3 
            className="text-sm font-medium"
            style={{ color: isSuccess ? 'var(--success)' : 'var(--error)' }}
          >
            {message}
          </h3>
          {details && (
            <div 
              className="mt-1 text-sm opacity-90"
              style={{ color: isSuccess ? 'var(--success)' : 'var(--error)' }}
            >
              <p>{details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}