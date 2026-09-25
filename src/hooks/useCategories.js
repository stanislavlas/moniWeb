import { useState, useCallback, useMemo } from "react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../services/categories.js";

const COLOR_PALETTE = [
  "#7F77DD","#1D9E75","#D85A30","#378ADD","#EF9F27",
  "#D4537E","#5DCAA5","#534AB7","#BA7517","#185FA5",
  "#993556","#63B3ED","#888780","#F0997B","#AFA9EC",
];

// Normalize API response: ensure icon field is populated from emoji if missing
function normalizeCategory(cat, index) {
  return {
    ...cat,
    icon:  cat.icon  ?? cat.emoji ?? "",
    emoji: cat.emoji ?? cat.icon  ?? "",
    color: cat.color || COLOR_PALETTE[index % COLOR_PALETTE.length],
    type:  (cat.type ?? "").toLowerCase(),
  };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await listCategories();
      setCategories((data ?? []).map(normalizeCategory));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (category) => {
    const created = await createCategory(category);
    setCategories(prev => [...prev, normalizeCategory(created, prev.length)]);
    return created;
  }, []);

  const update = useCallback(async (id, patch) => {
    const updated = await updateCategory(id, patch);
    setCategories(prev => prev.map((c, i) => c.categoryId === id ? normalizeCategory(updated, i) : c));
    return updated;
  }, []);

  const remove = useCallback(async (id) => {
    await deleteCategory(id);
    setCategories(prev => prev.filter(c => c.categoryId !== id));
  }, []);

  const colorMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.categoryId, c.color])),
  [categories]);

  return { categories, loading, error, load, add, update, remove, colorMap };
}
