import { useState, useEffect } from "react";
import { listCurrencies } from "../services/currencies.js";

export function useCurrencies() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCurrencies()
      .then(data => {
        if (cancelled) return;
        // API returns a plain object { "EUR": "Euro", "USD": "...", ... }
        const list = Object.entries(data)
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => a.code.localeCompare(b.code));
        setCurrencies(list);
      })
      .catch(() => {
        if (!cancelled) setCurrencies([
          { code: "EUR", name: "Euro" },
          { code: "USD", name: "United States Dollar" },
          { code: "CZK", name: "Czech Koruna" },
        ]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { currencies, loading };
}
