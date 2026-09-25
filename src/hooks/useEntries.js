import { useState, useCallback } from "react";
import { listEntries, createEntry, updateEntry, deleteEntry } from "../services/entries.js";
import { entryEvents } from "../utils/entryEvents.js";
import { logger } from "../utils/logger.js";

export function useEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async (yearMonth, household = false) => {
    setLoading(true); setError(null);
    try {
      const data = await listEntries(yearMonth, household);
      setEntries(data ?? []);
      logger.info('entries', `load success: ${(data ?? []).length} entries for ${yearMonth}`);
    } catch (e) {
      logger.error('entries', `load error for ${yearMonth}`, e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (entry) => {
    try {
      const created = await createEntry(entry);
      setEntries(prev => [created, ...prev]);
      entryEvents.emit(created.date);
      logger.info('entries', `add success: ${created.entryId}`);
      return created;
    } catch (e) {
      logger.error('entries', 'add error', e.message);
      setError(e.message);
      throw e;
    }
  }, []);

  const edit = useCallback(async (id, entry) => {
    try {
      const updated = await updateEntry(id, entry);
      setEntries(prev => prev.map(e => e.entryId === id ? updated : e));
      entryEvents.emit(updated.date);
      logger.info('entries', `edit success: ${id}`);
      return updated;
    } catch (e) {
      logger.error('entries', `edit error: ${id}`, e.message);
      setError(e.message);
      throw e;
    }
  }, []);

  const remove = useCallback(async (id) => {
    const existing = entries.find(e => e.entryId === id);
    logger.warn('entries', `remove: ${id}`);
    await deleteEntry(id);
    setEntries(prev => prev.filter(e => e.entryId !== id));
    if (existing?.date) entryEvents.emit(existing.date);
  }, [entries]);

  return { entries, loading, error, load, add, edit, remove };
}
