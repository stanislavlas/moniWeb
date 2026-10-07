import { useState, useCallback } from "react";
import { listRecurring, updateRecurring, deactivateRecurring, reactivateRecurring, deleteRecurring } from "../services/recurring.js";
import { logger } from "../utils/logger.js";

export function useRecurring() {
  const [templates, setTemplates]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecurring();
      setTemplates(data ?? []);
    } catch (e) {
      logger.error("recurring", "load failed", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id, payload) => {
    try {
      const updated = await updateRecurring(id, payload);
      setTemplates(prev => prev.map(t => t.recurringId === id ? updated : t));
      return updated;
    } catch (e) {
      logger.error("recurring", "update failed", e.message);
      throw e;
    }
  }, []);

  const deactivate = useCallback(async (id) => {
    try {
      const updated = await deactivateRecurring(id);
      setTemplates(prev => prev.map(t => t.recurringId === id ? updated : t));
    } catch (e) {
      logger.error("recurring", "deactivate failed", e.message);
      throw e;
    }
  }, []);

  const reactivate = useCallback(async (id) => {
    try {
      const updated = await reactivateRecurring(id);
      setTemplates(prev => prev.map(t => t.recurringId === id ? updated : t));
    } catch (e) {
      logger.error("recurring", "reactivate failed", e.message);
      throw e;
    }
  }, []);

  const remove = useCallback(async (id) => {
    try {
      await deleteRecurring(id);
      setTemplates(prev => prev.filter(t => t.recurringId !== id));
    } catch (e) {
      logger.error("recurring", "delete failed", e.message);
      throw e;
    }
  }, []);

  return { templates, loading, error, load, update, deactivate, reactivate, remove, clearError: useCallback(() => setError(null), []) };
}
