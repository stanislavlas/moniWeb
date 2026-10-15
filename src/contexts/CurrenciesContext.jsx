import { createContext, useContext } from "react";
import { useCurrencies } from "../hooks/useCurrencies.js";

const CurrenciesContext = createContext(null);

/**
 * Provides a single shared currencies list for the whole app.
 * Prevents redundant /api/currencies fetches when multiple components
 * (AddPage, RecurringSection, ProfileSection, AuthPage) need the same data.
 */
export function CurrenciesProvider({ children }) {
  const value = useCurrencies();
  return (
    <CurrenciesContext.Provider value={value}>
      {children}
    </CurrenciesContext.Provider>
  );
}

export function useCurrenciesContext() {
  const ctx = useContext(CurrenciesContext);
  if (!ctx) throw new Error("useCurrenciesContext must be used inside CurrenciesProvider");
  return ctx;
}
