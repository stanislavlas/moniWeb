import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CategoryChips } from "../components/CategoryChips.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { useCategories } from "../hooks/useCategories.js";
import { useCurrencies } from "../hooks/useCurrencies.js";
import { createEntry, updateEntry } from "../services/entries.js";
import { INPUT_CLASS } from "../utils/styles.js";
import { fromApiNecessity } from "../utils/money.js";
import { entryEvents } from "../utils/entryEvents.js";

export function AddPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editing  = location.state?.entry ?? null;

  const { categories, load: loadCats, colorMap } = useCategories();
  useEffect(() => { loadCats(); }, [loadCats]);

  const { currencies } = useCurrencies();

  const defaultCurrency = editing?.currency ?? editing?.amount?.currency ?? user?.currency ?? "EUR";

  const editingType      = editing?.type ? editing.type.toLowerCase() : "expense";
  const editingNecessity = editing?.necessity
    ? fromApiNecessity(editing.necessity)
    : "necessary";

  const [type, setType]         = useState(editingType);
  const [amount, setAmount]     = useState(editing ? String(parseFloat(editing.amount?.value ?? editing.amount ?? "")) : "");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [note, setNote]         = useState(editing?.note ?? "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? null);
  const [date, setDate]         = useState(editing?.date ?? new Date().toISOString().slice(0, 10));
  const [necessity, setNecessity] = useState(editingNecessity);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);

  // When type changes, auto-select first category of that type
  const catsByType = {
    expense:    categories.filter(c => !c.type || c.type === "expense"    || c.type === "EXPENSE"),
    income:     categories.filter(c =>  c.type === "income"    || c.type === "INCOME"),
    investment: categories.filter(c =>  c.type === "investment" || c.type === "INVESTMENT"),
  };
  // Fallback: if type-filtered is empty, show all categories
  const visibleCats = (catsByType[type]?.length > 0 ? catsByType[type] : categories);
  const selectedCategory = visibleCats.find(c => c.categoryId === categoryId) ?? null;

  function switchType(t) {
    setType(t);
    const first = (catsByType[t]?.length > 0 ? catsByType[t] : categories)[0];
    if (!editing) setCategoryId(first?.categoryId ?? null);
  }

  const accent      = type === "income" ? "#1D9E75" : type === "investment" ? "#378ADD" : "#D85A30";

  async function handleSubmit(e) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount"); return;
    }
    if (!categoryId) {
      setError("Please select a category"); return;
    }
    setLoading(true); setError(null);
    try {
      const payload = {
        amount:     { value: String(parsedAmount), currency },
        categoryId,
        date,
        name:       note || type,
        note:       note || "",
        type:       type.toUpperCase(),
        necessity:  type === "expense"
          ? (necessity === "necessary" ? "NECESSARY" : "OPTIONAL")
          : "NECESSARY",
      };
      if (editing) {
        await updateEntry(editing.entryId, payload);
        entryEvents.emit(date);
        navigate("/history");
      } else {
        await createEntry(payload);
        entryEvents.emit(date);
        setAmount("");
        setNote("");
        setDate(new Date().toISOString().slice(0, 10));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const labelClass = "text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <FeedbackBanner message={error} onDismiss={() => setError(null)} />
      <FeedbackBanner message={success ? "Entry added" : null} type="success" onDismiss={() => setSuccess(false)} />

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Type toggle — 3 bordered cards like mobile */}
        <div className="flex gap-2">
          {[
            { id: "expense",    label: "💸 Expense",  borderColor: "#D85A30", bgLight: "#FAECE7", textDark: "#993C1D" },
            { id: "income",     label: "💰 Income",   borderColor: "#1D9E75", bgLight: "#E1F5EE", textDark: "#0F6E56" },
            { id: "investment", label: "📈 Invest",   borderColor: "#378ADD", bgLight: "#DBEEFF", textDark: "#1565C0" },
          ].map(t => {
            const isActive = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchType(t.id)}
                className="flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-colors"
                style={{
                  borderColor: isActive ? t.borderColor : "#e5e7eb",
                  backgroundColor: isActive ? t.bgLight : "transparent",
                  color: isActive ? t.textDark : "#9ca3af",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Amount + currency */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass}>Amount</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="bg-brand-greenLight border border-brand-greenBorder text-brand-greenDark rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-green"
            >
              {currencies.length === 0
                ? <option value={currency}>{currency}</option>
                : currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)
              }
            </select>
          </div>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="w-full bg-gray-100 dark:bg-neutral-800 rounded-xl px-4 py-4 text-3xl font-bold font-mono text-center placeholder-gray-300 outline-none focus:ring-2"
            style={{ borderWidth: "2px", borderColor: accent }}
          />
        </div>

        {/* Necessity — expense only, icon+subtitle cards like mobile */}
        {type === "expense" && (
          <div>
            <label className={labelClass}>Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNecessity("necessary")}
                className="flex-1 flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-colors text-left"
                style={{
                  borderColor: necessity === "necessary" ? "#D85A30" : "#e5e7eb",
                  backgroundColor: necessity === "necessary" ? "#FAECE7" : "transparent",
                }}
              >
                <span className="text-2xl">🔒</span>
                <div>
                  <p className={`text-sm font-bold ${necessity === "necessary" ? "text-brand-redDark" : "text-gray-600 dark:text-gray-300"}`}>
                    Necessary
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Can't cut this</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setNecessity("optional")}
                className="flex-1 flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-colors text-left"
                style={{
                  borderColor: necessity === "optional" ? "#EF9F27" : "#e5e7eb",
                  backgroundColor: necessity === "optional" ? "#FAEEDA" : "transparent",
                }}
              >
                <span className="text-2xl">✂️</span>
                <div>
                  <p className={`text-sm font-bold ${necessity === "optional" ? "text-brand-amberDark" : "text-gray-600 dark:text-gray-300"}`}>
                    Optional
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Could save here</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Category */}
        {visibleCats.length > 0 && (
          <div>
            <label className={labelClass}>Category</label>
            <CategoryChips
              categories={visibleCats}
              selected={selectedCategory}
              onSelect={cat => setCategoryId(cat.categoryId)}
              colorMap={colorMap}
            />
          </div>
        )}

        {/* Note */}
        <div>
          <label className={labelClass}>Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What was it for?"
            className={INPUT_CLASS}
          />
        </div>

        {/* Date */}
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full text-white rounded-xl py-4 font-semibold text-base disabled:opacity-50 flex justify-center items-center"
          style={{ backgroundColor: accent }}
        >
          {loading
            ? <Spinner size={5} />
            : editing
            ? "Save changes"
            : type === "investment" ? "Add investment" : `Add ${type}`
          }
        </button>
      </form>
    </div>
  );
}
