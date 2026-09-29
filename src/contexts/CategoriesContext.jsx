import { createContext, useContext, useEffect } from "react";
import { useCategories } from "../hooks/useCategories.js";

const CategoriesContext = createContext(null);

/**
 * Provides a single shared categories state for the whole app.
 * Categories are fetched once on mount (after auth, since this is inside the
 * authenticated shell) and shared across AddPage, HistoryPage, MonthOverviewPage,
 * YearOverviewPage, and CategoriesSection — preventing redundant API calls on
 * every navigation.
 */
export function CategoriesProvider({ children }) {
  const categories = useCategories();
  useEffect(() => { categories.load(); }, [categories.load]);
  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesContext() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategoriesContext must be used inside CategoriesProvider");
  return ctx;
}
