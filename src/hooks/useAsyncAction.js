import { useState, useCallback } from "react";

/**
 * Provides a `run(fn)` helper with loading / error state.
 * Used across account sub-components to avoid duplicated state management.
 *
 * @returns {{ loading, error, run, clearError }}
 */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err.message ?? "Something went wrong");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run, clearError };
}
