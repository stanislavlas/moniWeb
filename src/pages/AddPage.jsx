import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CategoryChips } from "../components/CategoryChips.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { useCategories } from "../hooks/useCategories.js";
import { createEntry, updateEntry } from "../services/entries.js";

export function AddPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editing  = location.state?.entry ?? null; // passed via navigation state when editing

  const { categories, load: loadCats } = useCategories();
  useEffect(() => { loadCats(); }, [loadCats]);

  const [type, setType]           = useState(editing?.type       ?? "expense");
  const [amount, setAmount]       = useState(editing ? String(editing.amount) : "");
  const [note, setNote]           = useState(editing?.note        ?? "");
  const [category, setCategory]   = useState(editing?.category    ?? null);
  const [date, setDate]           = useState(editing?.date        ?? new Date().toISOString().slice(0, 10));
  const [necessity, setNecessity] = useState(editing?.necessity   ?? "want");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) { setError("Enter a valid amount"); return; }
    setLoading(true); setError(null);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        note: note || undefined,
        category: category ?? undefined,
        date,
        necessity: type === "expense" ? necessity : undefined,
      };
      if (editing) {
        await updateEntry(editing.entryId, payload);
      } else {
        await createEntry(payload);
      }
      navigate("/history");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold">{editing ? "Edit Entry" : "Add Entry"}</h1>
      <FeedbackBanner message={error} onDismiss={() => setError(null)} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700">
          {["expense", "income"].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors capitalize ${
                type === t
                  ? t === "expense" ? "bg-brand-red text-white" : "bg-brand-green text-white"
                  : "bg-gray-50 dark:bg-neutral-800 text-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Amount */}
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          required
          className={inputClass}
        />

        {/* Note */}
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Note (optional)"
          className={inputClass}
        />

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className={inputClass}
        />

        {/* Category chips */}
        {categories.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Category</p>
            <CategoryChips categories={categories} selected={category} onSelect={setCategory} />
          </div>
        )}

        {/* Necessity toggle (expenses only) */}
        {type === "expense" && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Type</p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700">
              {["necessity", "want"].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNecessity(n)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors capitalize ${
                    necessity === n
                      ? "bg-brand-amber text-white"
                      : "bg-gray-50 dark:bg-neutral-800 text-gray-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-green text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 flex justify-center items-center"
        >
          {loading ? <Spinner size={5} /> : editing ? "Save changes" : "Add entry"}
        </button>
      </form>
    </div>
  );
}
