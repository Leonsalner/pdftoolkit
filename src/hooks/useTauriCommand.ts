import { useState, useCallback } from 'react';

export interface UseTauriCommandReturn<T, Args extends any[]> {
  execute: (...args: Args) => Promise<T | undefined>;
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
    async (...args: Args): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await commandFn(...args);
        setResult(res);
        return res;
      } catch (err: any) {
        setError(typeof err === 'string' ? err : err.message || 'An unknown error occurred');
        return undefined;
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