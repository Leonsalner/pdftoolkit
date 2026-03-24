import { useState, useCallback } from 'react';

export interface UseTauriCommandReturn<T, Args extends any[]> {
  execute: (...args: Args) => Promise<void>;
  result: T | null;
  error: string | null;
  loading: boolean;
  reset: () => void;
}

export function useTauriCommand<T, Args extends any[]>(
  commandFn: (...args: Args) => Promise<T>
): UseTauriCommandReturn<T, Args> {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const execute = useCallback(
    async (...args: Args) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await commandFn(...args);
        setResult(res);
      } catch (err: any) {
        setError(typeof err === 'string' ? err : err.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    },
    [commandFn]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, result, error, loading, reset };
}