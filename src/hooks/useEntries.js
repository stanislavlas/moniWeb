import { useState, useCallback } from "react";
import { listEntries, createEntry, updateEntry, deleteEntry } from "../services/entries.js";

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
    const created = await createEntry(entry);
    setEntries(prev => [created, ...prev]);
    return created;
  }, []);

  const edit = useCallback(async (id, entry) => {
    const updated = await updateEntry(id, entry);
    setEntries(prev => prev.map(e => e.entryId === id ? updated : e));
    return updated;
  }, []);

  const remove = useCallback(async (id) => {
    await deleteEntry(id);
    setEntries(prev => prev.filter(e => e.entryId !== id));
  }, []);

  return { entries, loading, error, load, add, edit, remove };
}
