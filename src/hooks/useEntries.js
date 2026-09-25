import { useState, useCallback } from "react";
import { listEntries, createEntry, updateEntry, deleteEntry } from "../services/entries.js";
import { entryEvents } from "../utils/entryEvents.js";

export function useEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async (yearMonth, household = false) => {
    setLoading(true); setError(null);
    try {
      const data = await listEntries(yearMonth, household);
      setEntries(data ?? []);
    } catch (e) {
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
      return created;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  const edit = useCallback(async (id, entry) => {
    try {
      const updated = await updateEntry(id, entry);
      setEntries(prev => prev.map(e => e.entryId === id ? updated : e));
      entryEvents.emit(updated.date);
      return updated;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  const remove = useCallback(async (id) => {
    // Find the entry's date before deleting so we can emit the right period
    const existing = entries.find(e => e.entryId === id);
    await deleteEntry(id);
    setEntries(prev => prev.filter(e => e.entryId !== id));
    if (existing?.date) entryEvents.emit(existing.date);
  }, [entries]);

  return { entries, loading, error, load, add, edit, remove };
}
