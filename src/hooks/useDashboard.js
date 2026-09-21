import { useState, useCallback } from "react";
import { getDashboard } from "../services/dashboard.js";

export function useDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async (yearMonth, household = false) => {
    setLoading(true); setError(null);
    try {
      const result = await getDashboard(yearMonth, household);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, load };
}
