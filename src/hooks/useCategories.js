import { useState, useCallback } from "react";
import { listCategories, createCategory, deleteCategory } from "../services/categories.js";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await listCategories();
      setCategories(data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (category) => {
    const created = await createCategory(category);
    setCategories(prev => [...prev, created]);
    return created;
  }, []);

  const remove = useCallback(async (id) => {
    await deleteCategory(id);
    setCategories(prev => prev.filter(c => c.categoryId !== id));
  }, []);

  return { categories, loading, error, load, add, remove };
}
