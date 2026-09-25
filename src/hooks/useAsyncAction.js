import { useState, useCallback } from "react";

/**
 * Provides a `run(fn)` helper with loading / error / success state.
 * Used across account sub-components to avoid duplicated state management.
 *
 * @returns {{ loading, error, success, run, clearError }}
 */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await fn();
      setSuccess(true);
      return result;
    } catch (err) {
      setError(err.message ?? "Something went wrong");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, run, clearError };
}
