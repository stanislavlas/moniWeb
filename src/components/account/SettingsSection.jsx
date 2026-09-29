import { useState } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { CurrencyPicker } from "../CurrencyPicker.jsx";
import { Spinner } from "../Spinner.jsx";
import { useCurrencies } from "../../hooks/useCurrencies.js";

export function SettingsSection({ user, onUpdateProfile }) {
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(null);
  const [loading, setLoading]           = useState(false);
  // Track a local pending value so we can revert on error
  const [localCurrency, setLocalCurrency] = useState(null);
  const { currencies }                  = useCurrencies();

  // Displayed currency: use pending local value while saving, fall back to user prop
  const displayCurrency = localCurrency ?? user?.currency ?? "EUR";

  async function handleCurrencyChange(code) {
    setLocalCurrency(code);
    setLoading(true); setError(null); setSuccess(null);
    try {
      await onUpdateProfile({ currency: code });
      setSuccess("Display currency updated.");
      setLocalCurrency(null); // clear local override — user prop is now up to date
    } catch (err) {
      setError(err.message);
      setLocalCurrency(null); // revert picker to the user's saved value
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <FeedbackBanner message={error}   type="error"   onDismiss={() => setError(null)}   />
      <FeedbackBanner message={success} type="success" onDismiss={() => setSuccess(null)} />
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">Display Currency</p>
          <p className="text-xs text-gray-400 mt-0.5">Stored in original currency, converted on display</p>
        </div>
        <CurrencyPicker
          value={displayCurrency}
          onChange={handleCurrencyChange}
          currencies={currencies}
        />
        {loading && <div className="flex justify-center py-1"><Spinner size={4} /></div>}
      </div>
    </div>
  );
}
