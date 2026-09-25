import { useState } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { CurrencyPicker } from "../CurrencyPicker.jsx";
import { Spinner } from "../Spinner.jsx";
import { useCurrencies } from "../../hooks/useCurrencies.js";

export function SettingsSection({ user, onUpdateProfile }) {
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { currencies }        = useCurrencies();

  async function handleCurrencyChange(code) {
    setLoading(true); setError(null); setSuccess(null);
    try {
      await onUpdateProfile({ currency: code });
      setSuccess("Display currency updated.");
    } catch (err) {
      setError(err.message);
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
          value={user?.currency ?? "EUR"}
          onChange={handleCurrencyChange}
          currencies={currencies}
        />
        {loading && <div className="flex justify-center py-1"><Spinner size={4} /></div>}
      </div>
    </div>
  );
}
