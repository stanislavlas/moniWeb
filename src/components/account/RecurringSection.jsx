import { useEffect, useState } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { Spinner } from "../Spinner.jsx";
import { CategoryChips } from "../CategoryChips.jsx";
import { useCategoriesContext } from "../../contexts/CategoriesContext.jsx";
import { useCurrencies } from "../../hooks/useCurrencies.js";
import { useRecurring } from "../../hooks/useRecurring.js";
import { createRecurring } from "../../services/recurring.js";
import { formatCurrency } from "../../utils/money.js";
import { INPUT_CLASS } from "../../utils/styles.js";

const FREQUENCY_OPTIONS = [
  { id: "MONTHLY", label: "📅 Monthly" },
  { id: "WEEKLY",  label: "📆 Weekly"  },
  { id: "YEARLY",  label: "🗓 Yearly"  },
  { id: "DAILY",   label: "⏱ Daily"   },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_FULL = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const FREQ_LABEL = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly" };

function typeColor(type) {
  if (type === "INCOME")     return { bg: "#E1F5EE", text: "#0F6E56", border: "#9BD4BE" };
  if (type === "INVESTMENT") return { bg: "#DBEEFF", text: "#1565C0", border: "#93C5FD" };
  return                            { bg: "#FAECE7", text: "#993C1D", border: "#F4B8A0" };
}

function typeEmoji(type) {
  if (type === "INCOME")     return "💰";
  if (type === "INVESTMENT") return "📈";
  return "💸";
}

function scheduleLabel({ frequency, dayOfWeek, dayOfMonth, monthOfYear }) {
  if (frequency === "WEEKLY")  return `Every ${DAY_LABELS[(dayOfWeek ?? 1) - 1]}`;
  if (frequency === "MONTHLY") return `Every month on day ${dayOfMonth}`;
  if (frequency === "YEARLY")  return `Every ${MONTH_NAMES[monthOfYear] ?? ""} on day ${dayOfMonth}`;
  return "Every day";
}

function nextLabel(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d, 10)} ${MONTH_NAMES[parseInt(m, 10)]} ${y}`;
}

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RecurringSection({ user }) {
  const { templates, loading, error, load, update, deactivate, reactivate, remove, clearError } = useRecurring();
  const { categories, colorMap } = useCategoriesContext();
  const { currencies } = useCurrencies();

  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null); // recurringId being edited
  const [actionError, setActionError] = useState(null);
  const [confirming, setConfirming]   = useState(null);

  // ── Shared form state (used for both Add and Edit) ────────────────────────
  const [type, setType]               = useState("expense");
  const [amount, setAmount]           = useState("");
  const [currency, setCurrency]       = useState(user?.currency ?? "EUR");
  const [note, setNote]               = useState("");
  const [categoryId, setCategoryId]   = useState(null);
  const [necessity, setNecessity]     = useState("necessary");
  const [frequency, setFrequency]     = useState("MONTHLY");
  const [dayOfMonth, setDayOfMonth]   = useState("1");
  const [dayOfWeek, setDayOfWeek]     = useState("1");
  const [monthOfYear, setMonthOfYear] = useState("1");
  const [startDate, setStartDate]     = useState(localToday());
  const [endDate, setEndDate]         = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState(null);

  useEffect(() => { load(); }, [load]);

  const catsByType = {
    expense:    categories.filter(c => !c.type || c.type === "expense"),
    income:     categories.filter(c => c.type === "income"),
    investment: categories.filter(c => c.type === "investment"),
  };
  const visibleCats = catsByType[type]?.length > 0 ? catsByType[type] : categories;
  const selectedCategory = visibleCats.find(c => c.categoryId === categoryId) ?? null;

  function switchType(t) {
    setType(t);
    const list = catsByType[t]?.length > 0 ? catsByType[t] : categories;
    setCategoryId(list[0]?.categoryId ?? list[0]?.id ?? null);
  }

  function resetForm() {
    setType("expense"); setAmount(""); setCurrency(user?.currency ?? "EUR");
    setNote(""); setCategoryId(null); setNecessity("necessary");
    setFrequency("MONTHLY"); setDayOfMonth("1"); setDayOfWeek("1");
    setMonthOfYear("1"); setStartDate(localToday()); setEndDate("");
    setFormError(null); setEditing(null);
  }

  function openEdit(t) {
    setEditing(t.recurringId);
    setShowForm(false); // close add form if open
    setType(t.type.toLowerCase());
    setAmount(String(parseFloat(t.amount?.value ?? 0)));
    setCurrency(t.amount?.currency ?? user?.currency ?? "EUR");
    setNote(t.note ?? "");
    setCategoryId(t.categoryId ?? null);
    setNecessity(t.necessity === "OPTIONAL" ? "optional" : "necessary");
    setFrequency(t.frequency);
    setDayOfMonth(String(t.dayOfMonth ?? 1));
    setDayOfWeek(String(t.dayOfWeek ?? 1));
    setMonthOfYear(String(t.monthOfYear ?? 1));
    setStartDate(t.startDate ?? localToday());
    setEndDate(t.endDate ?? "");
    setFormError(null);
    setConfirming(null);
  }

  function buildPayload() {
    const parsed = parseFloat(amount.replace(/,/g, "."));
    // Type and necessity maps mirror toApiTransactionType / toApiNecessity in moniMobile/src/utils/enums.js
    const apiType      = { expense: "EXPENSE", income: "INCOME", investment: "INVESTMENT" }[type] ?? "EXPENSE";
    const apiNecessity = type === "expense" ? (necessity === "optional" ? "OPTIONAL" : "NECESSARY") : "NECESSARY";
    return {
      amount:      { value: parsed, currency },
      categoryId,
      name:        note.trim() && selectedCategory?.name
                     ? `${note.trim()} - ${selectedCategory.name}`
                     : (note.trim() || selectedCategory?.name || type),
      note:        note || "",
      type:        apiType,
      necessity:   apiNecessity,
      frequency,
      dayOfMonth:  ["MONTHLY", "YEARLY"].includes(frequency) ? parseInt(dayOfMonth, 10) : null,
      dayOfWeek:   frequency === "WEEKLY" ? parseInt(dayOfWeek, 10) : null,
      monthOfYear: frequency === "YEARLY" ? parseInt(monthOfYear, 10) : null,
      startDate,
      endDate:     endDate || null,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(/,/g, "."));
    if (!amount || isNaN(parsed) || parsed <= 0) { setFormError("Enter a valid amount"); return; }
    if (!categoryId)                              { setFormError("Please select a category"); return; }

    setFormLoading(true); setFormError(null);
    try {
      if (editing) {
        await update(editing, buildPayload());
        await load();
      } else {
        await createRecurring(buildPayload());
        setShowForm(false);
        await load();
      }
      resetForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeactivate(id) {
    setActionError(null);
    try { await deactivate(id); } catch (e) { setActionError(e.message); }
  }

  async function handleReactivate(id) {
    setActionError(null);
    try { await reactivate(id); } catch (e) { setActionError(e.message); }
  }

  async function handleDelete(id) {
    setActionError(null);
    try { await remove(id); setConfirming(null); } catch (e) { setActionError(e.message); }
  }

  const isEditing   = editing !== null;
  const formVisible = showForm || isEditing;
  const accent      = type === "income" ? "#1D9E75" : type === "investment" ? "#378ADD" : "#D85A30";
  const labelClass  = "text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block";
  const active      = templates.filter(t => t.active);
  const inactive    = templates.filter(t => !t.active);

  // ── Shared form JSX (used for both Add and Edit) ──────────────────────────
  function renderForm() {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <FeedbackBanner message={formError} onDismiss={() => setFormError(null)} />

        {/* Type */}
        <div className="flex gap-2">
          {[
            { id: "expense",    label: "💸 Expense",  borderColor: "#D85A30", bgLight: "#FAECE7", textDark: "#993C1D" },
            { id: "income",     label: "💰 Income",   borderColor: "#1D9E75", bgLight: "#E1F5EE", textDark: "#0F6E56" },
            { id: "investment", label: "📈 Invest",   borderColor: "#378ADD", bgLight: "#DBEEFF", textDark: "#1565C0" },
          ].map(t => {
            const isActive = type === t.id;
            return (
              <button key={t.id} type="button" onClick={() => switchType(t.id)}
                className="flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-colors"
                style={{
                  borderColor:     isActive ? t.borderColor : "#e5e7eb",
                  backgroundColor: isActive ? t.bgLight : "transparent",
                  color:           isActive ? t.textDark : "#9ca3af",
                }}
              >{t.label}</button>
            );
          })}
        </div>

        {/* Amount + currency */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass}>Amount</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="bg-brand-greenLight border border-brand-greenBorder text-brand-greenDark rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-green"
            >
              {currencies.length === 0
                ? <option value={currency}>{currency}</option>
                : currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)
              }
            </select>
          </div>
          <input type="number" inputMode="decimal" min="0" step="0.01"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" required
            className="w-full bg-gray-100 dark:bg-neutral-800 rounded-xl px-4 py-3 text-2xl font-bold font-mono text-center placeholder-gray-300 outline-none focus:ring-2"
            style={{ borderWidth: "2px", borderColor: accent }}
          />
        </div>

        {/* Necessity */}
        {type === "expense" && (
          <div>
            <label className={labelClass}>Type</label>
            <div className="flex gap-2">
              {[
                { id: "necessary", icon: "🔒", label: "Necessary", sub: "Can't cut this",  activeColor: "#D85A30", activeBg: "#FAECE7", activeText: "text-brand-redDark" },
                { id: "optional",  icon: "✂️", label: "Optional",  sub: "Could save here", activeColor: "#EF9F27", activeBg: "#FAEEDA", activeText: "text-brand-amberDark" },
              ].map(n => (
                <button key={n.id} type="button" onClick={() => setNecessity(n.id)}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-colors text-left"
                  style={{ borderColor: necessity === n.id ? n.activeColor : "#e5e7eb", backgroundColor: necessity === n.id ? n.activeBg : "transparent" }}
                >
                  <span className="text-xl">{n.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${necessity === n.id ? n.activeText : "text-gray-600 dark:text-gray-300"}`}>{n.label}</p>
                    <p className="text-[11px] text-gray-400">{n.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category */}
        {visibleCats.length > 0 && (
          <div>
            <label className={labelClass}>Category</label>
            <CategoryChips categories={visibleCats} selected={selectedCategory}
              onSelect={cat => setCategoryId(cat?.categoryId ?? cat?.id ?? cat)} colorMap={colorMap} />
          </div>
        )}

        {/* Note */}
        <div>
          <label className={labelClass}>Note (optional)</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="What is it for?" className={INPUT_CLASS} />
        </div>

        {/* Frequency */}
        <div>
          <label className={labelClass}>Repeats</label>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCY_OPTIONS.map(f => {
              const isActive = frequency === f.id;
              return (
                <button key={f.id} type="button" onClick={() => setFrequency(f.id)}
                  className="py-2 rounded-xl border-2 text-sm font-semibold transition-colors"
                  style={{
                    borderColor:     isActive ? "#6B63B5" : "#e5e7eb",
                    backgroundColor: isActive ? "#ECEAF8" : "transparent",
                    color:           isActive ? "#4A4390" : "#9ca3af",
                  }}
                >{f.label}</button>
              );
            })}
          </div>
        </div>

        {/* Day of week */}
        {frequency === "WEEKLY" && (
          <div>
            <label className={labelClass}>Day of week</label>
            <div className="flex gap-1">
              {DAY_LABELS.map((d, i) => {
                const val = String(i + 1);
                const isActive = dayOfWeek === val;
                return (
                  <button key={val} type="button" onClick={() => setDayOfWeek(val)}
                    className="flex-1 py-2 rounded-lg border-2 text-xs font-semibold transition-colors"
                    style={{ borderColor: isActive ? "#6B63B5" : "#e5e7eb", backgroundColor: isActive ? "#ECEAF8" : "transparent", color: isActive ? "#4A4390" : "#9ca3af" }}
                  >{d}</button>
                );
              })}
            </div>
          </div>
        )}

        {(frequency === "MONTHLY" || frequency === "YEARLY") && (
          <div>
            <label className={labelClass}>Day of month</label>
            <select value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} className={INPUT_CLASS}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        {frequency === "YEARLY" && (
          <div>
            <label className={labelClass}>Month of year</label>
            <select value={monthOfYear} onChange={e => setMonthOfYear(e.target.value)} className={INPUT_CLASS}>
              {MONTH_NAMES_FULL.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
        )}

        {/* Dates */}
        <div>
          <label className={labelClass}>Starts on</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className={labelClass}>Ends on (optional)</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={INPUT_CLASS} />
        </div>

        <button type="submit" disabled={formLoading}
          className="w-full text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 flex justify-center items-center"
          style={{ backgroundColor: accent }}
        >
          {formLoading ? <Spinner size={4} /> : isEditing ? "Save changes" : "Save recurring payment"}
        </button>
      </form>
    );
  }

  // ── Card action row ───────────────────────────────────────────────────────
  function renderActions(t, isPaused) {
    const isConfirming = confirming === t.recurringId;
    if (editing === t.recurringId) return null; // inline edit form is shown instead
    if (isConfirming) {
      return (
        <div className="flex gap-2">
          <button onClick={() => setConfirming(null)}
            className="flex-1 py-2 rounded-xl border-2 border-gray-200 dark:border-neutral-700 text-sm font-semibold text-gray-500">Cancel</button>
          <button onClick={() => handleDelete(t.recurringId)}
            className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold">Delete permanently</button>
        </div>
      );
    }
    return (
      <div className="flex gap-2">
        <button onClick={() => openEdit(t)}
          className="flex-1 py-2 rounded-xl border-2 border-gray-200 dark:border-neutral-700 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
          ✏️ Edit
        </button>
        {isPaused ? (
          <button onClick={() => handleReactivate(t.recurringId)}
            className="flex-1 py-2 rounded-xl border-2 border-gray-200 dark:border-neutral-700 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
            ▶ Resume
          </button>
        ) : (
          <button onClick={() => handleDeactivate(t.recurringId)}
            className="flex-1 py-2 rounded-xl border-2 border-gray-200 dark:border-neutral-700 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
            ⏸ Pause
          </button>
        )}
        <button onClick={() => setConfirming(t.recurringId)}
          className="flex-1 py-2 rounded-xl border-2 border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
          🗑 Delete
        </button>
      </div>
    );
  }

  // ── Single card renderer (active and paused) ──────────────────────────────
  function renderCard(t, isPaused) {
    const colors = isPaused ? null : typeColor(t.type);
    const amt    = parseFloat(t.amount?.value ?? 0);
    const cur    = t.amount?.currency ?? "EUR";
    const cat    = categories.find(c => c.categoryId === t.categoryId);
    const isCurrentlyEditing = editing === t.recurringId;

    return (
      <div key={t.recurringId}
        className="rounded-2xl border p-4 space-y-3 bg-white dark:bg-neutral-900"
        style={{
          borderColor: isCurrentlyEditing ? "#6B63B5" : (colors?.border ?? "#e5e7eb"),
          opacity:     isPaused && !isCurrentlyEditing ? 0.6 : 1,
        }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">{typeEmoji(t.type)}</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{t.name}</p>
              <p className="text-xs text-gray-400">{scheduleLabel(t)}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-base" style={{ color: colors?.text ?? "#9ca3af" }}>
              {formatCurrency(amt, cur)}
            </p>
            {!isPaused && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: colors?.bg, color: colors?.text }}>
                {FREQ_LABEL[t.frequency]}
              </span>
            )}
          </div>
        </div>

        {/* Category chip */}
        {cat && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{cat.emoji || cat.icon}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: (colorMap[t.categoryId] ?? "#888") + "22", color: colorMap[t.categoryId] ?? "#888" }}>
              {cat.name}
            </span>
          </div>
        )}

        {/* Next / end dates */}
        {t.nextPostDate && (
          <p className="text-xs text-gray-400">
            {isPaused ? "Resumes: " : "Next: "}
            <span className="text-gray-600 dark:text-gray-300 font-medium">{nextLabel(t.nextPostDate)}</span>
            {t.endDate && <> · Ends <span className="font-medium">{nextLabel(t.endDate)}</span></>}
          </p>
        )}

        {/* Inline edit form or action buttons */}
        {isCurrentlyEditing ? (
          <div className="border-t border-gray-100 dark:border-neutral-700 pt-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#6B63B5] uppercase tracking-wide">Editing</span>
              <button type="button" onClick={resetForm}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Cancel</button>
            </div>
            {renderForm()}
          </div>
        ) : renderActions(t, isPaused)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeedbackBanner message={error ?? actionError} onDismiss={() => { clearError(); setActionError(null); }} />

      {/* ── Add card ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Add recurring payment</h2>
          <button
            onClick={() => { if (showForm) { setShowForm(false); resetForm(); } else { setEditing(null); resetForm(); setShowForm(true); } }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add"}
          </button>
        </div>

        {showForm && renderForm()}
      </div>

      {/* ── Template list ─────────────────────────────────────────────────── */}
      {loading && <div className="flex justify-center py-8"><Spinner size={8} /></div>}

      {!loading && templates.length === 0 && !formVisible && (
        <p className="text-sm text-gray-400 text-center py-8">No recurring payments yet. Tap <strong>+ Add</strong> to set one up.</p>
      )}

      {!loading && active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active</h2>
          {active.map(t => renderCard(t, false))}
        </div>
      )}

      {!loading && inactive.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Paused</h2>
          {inactive.map(t => renderCard(t, true))}
        </div>
      )}
    </div>
  );
}
