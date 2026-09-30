import { createContext, useContext } from "react";
import { useCategories } from "../hooks/useCategories.js";

const CategoriesContext = createContext(null);

/**
 * Provides a single shared categories state for the whole app.
 * Load is NOT triggered on mount — it must be triggered by App.jsx after
 * authentication is confirmed, to avoid spurious 401s on cold start.
 * Shared across AddPage, HistoryPage, MonthOverviewPage, YearOverviewPage,
 * and CategoriesSection — preventing redundant API calls on every navigation.
 */
export function CategoriesProvider({ children }) {
  const categories = useCategories();
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
