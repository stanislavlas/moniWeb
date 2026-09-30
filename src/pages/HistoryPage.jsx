import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCategoriesContext } from "../contexts/CategoriesContext.jsx";
import { useMonthCache } from "../hooks/useMonthCache.js";
import { deleteEntry } from "../services/entries.js";
import { entryEvents } from "../utils/entryEvents.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { getAmount, formatCurrency, formatYearMonth, fromApiNecessity } from "../utils/money.js";

export function HistoryPage({ showHousehold = false, user }) {
  const navigate  = useNavigate();
  const currency  = user?.currency ?? "EUR";

  // Only the entry author can edit or delete their own entries.
  const canModify = (entry) => !!(user && entry.userId === user.userId);

  // Use UTC month to stay consistent with recentMonths() in money.js (which uses getUTCMonth)
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [deleteError, setDeleteError]  = useState(null);
  const [fetchErrorHidden, setFetchErrorHidden] = useState(false);
  const [search, setSearch]           = useState("");
  const [typeFilter, setTypeFilter]   = useState("all");
  const [necFilter, setNecFilter]     = useState("all");

  // Reset dismiss state when the month changes (new fetch, new potential error)
  useEffect(() => { setFetchErrorHidden(false); }, [filterMonth]);

  const { categories, colorMap } = useCategoriesContext();
  const { activeMonths, monthCache, fetchMonth } = useMonthCache(showHousehold);

  useEffect(() => { fetchMonth(filterMonth); }, [filterMonth, fetchMonth]);

  const currentData = monthCache[filterMonth] ?? { entries: [], loading: true, error: null };
  const entries     = currentData.entries;
  const loading     = currentData.loading;
  const fetchError  = currentData.error;

  const filtered = useMemo(() => {
    let list = entries;
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter.toUpperCase());
    if (necFilter  !== "all") list = list.filter(e => fromApiNecessity(e.necessity) === necFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => {
        const cat = categories.find(c => c.categoryId === e.categoryId);
        return e.note?.toLowerCase().includes(q) || cat?.name?.toLowerCase().includes(q);
      });
    }
    return list;
  }, [entries, typeFilter, necFilter, search, categories]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    setDeleteError(null);
    try {
      const entry = entries.find(e => e.entryId === id);
      await deleteEntry(id);
      if (entry?.date) entryEvents.emit(entry.date);
    } catch (err) {
      setDeleteError(err.message ?? "Failed to delete entry");
    }
  }, [entries]);

  function getCatInfo(entry) {
    const catId = entry.categoryId;
    if (!catId) return null;
    const cat = categories.find(c => c.categoryId === catId);
    if (!cat) return null;
    return { icon: cat.icon ?? cat.emoji ?? "", name: cat.name, catId };
  }

  const monthLabel = formatYearMonth(filterMonth);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">History</h1>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          {!activeMonths.includes(filterMonth) && (
            <option key={filterMonth} value={filterMonth}>{formatYearMonth(filterMonth)}</option>
          )}
          {activeMonths.map(ym => (
            <option key={ym} value={ym}>{formatYearMonth(ym)}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-neutral-700">
        <span className="text-gray-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search transactions…"
          className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">×</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all",        label: "All" },
          { value: "income",     label: "💰 Income" },
          { value: "expense",    label: "💸 Expenses" },
          { value: "investment", label: "📈 Investments" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setTypeFilter(value); if (value === "investment") setNecFilter("all"); }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              typeFilter === value
                ? value === "income"     ? "bg-green-100  dark:bg-green-900/30  border-green-400  dark:border-green-600  text-green-700  dark:text-green-400"
                : value === "expense"    ? "bg-red-100    dark:bg-red-900/30    border-red-400    dark:border-red-600    text-red-700    dark:text-red-400"
                : value === "investment" ? "bg-blue-100   dark:bg-blue-900/30   border-blue-400   dark:border-blue-600   text-blue-700   dark:text-blue-400"
                :                         "bg-gray-200    dark:bg-neutral-700   border-gray-400   dark:border-neutral-500 text-gray-700  dark:text-gray-200"
                : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-neutral-500"
            }`}
          >
            {label}
          </button>
        ))}

        {typeFilter !== "investment" && (
          <>
            <div className="w-px bg-gray-200 dark:bg-neutral-700 self-stretch mx-1" />
            {[
              { value: "all",       label: "All types" },
              { value: "necessary", label: "🔒 Necessary" },
              { value: "optional",  label: "✂️ Optional" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setNecFilter(value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  necFilter === value
                    ? value === "necessary" ? "bg-red-100   dark:bg-red-900/30   border-red-400   dark:border-red-600   text-red-700   dark:text-red-400"
                    : value === "optional"  ? "bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400"
                    :                        "bg-gray-200   dark:bg-neutral-700  border-gray-400  dark:border-neutral-500 text-gray-700 dark:text-gray-200"
                    : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-neutral-500"
                }`}
              >
                {label}
              </button>
            ))}
          </>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}{loading ? " (loading…)" : ""}
      </p>

      <FeedbackBanner message={fetchErrorHidden ? null : fetchError} type="error" onDismiss={() => setFetchErrorHidden(true)} />
      <FeedbackBanner message={deleteError} type="error" onDismiss={() => setDeleteError(null)} />

      {loading && <div className="flex justify-center py-12"><Spinner size={10} /></div>}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">
          {search || typeFilter !== "all" || necFilter !== "all"
            ? "No matching transactions."
            : `No entries for ${monthLabel}.`}
        </p>
      )}

      <div className="space-y-2">
        {filtered.map(entry => {
          const isIncome     = entry.type === "INCOME";
          const isInvestment = entry.type === "INVESTMENT";
          const sign         = isIncome ? "+" : isInvestment ? "↗" : "−";
          const amountColor  = isIncome ? "text-brand-green" : isInvestment ? "text-brand-blue" : "text-brand-red";

          const catInfo = getCatInfo(entry);
          const catId   = entry.categoryId;
          const color   = catId ? colorMap[catId] : null;

          return (
            <div
              key={entry.entryId}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3"
            >
              {catInfo && (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: color ? color + "20" : "#8887801A" }}
                >
                  {catInfo.icon || "💰"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-base font-bold ${amountColor}`}>
                    {sign}{formatCurrency(getAmount(entry), currency)}
                  </span>
                  {catInfo && (
                    <span
                      className="text-xs rounded-xl px-2 py-0.5 font-medium"
                      style={color
                        ? { backgroundColor: color + "20", color }
                        : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                      }
                    >
                      {catInfo.name}
                    </span>
                  )}
                  {entry.type === "EXPENSE" && (
                    <span className={`text-xs rounded-xl px-2 py-0.5 font-medium ${
                      fromApiNecessity(entry.necessity) === "optional"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}>
                      {fromApiNecessity(entry.necessity) === "optional" ? "✂️" : "🔒"}
                    </span>
                  )}
                </div>
                {entry.note && <p className="text-sm text-gray-500 truncate">{entry.note}</p>}
                <p className="text-xs text-gray-400">
                  {entry.date}
                  {entry.authorName && (
                    <span className={entry.userId !== user?.userId ? "font-medium text-gray-500 dark:text-gray-400" : ""}>
                      {" · "}{entry.authorName}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0 items-end">
                {canModify(entry) && (
                  <>
                    <button
                      onClick={() => navigate("/add", { state: { entry } })}
                      className="text-xs text-brand-blue hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.entryId)}
                      className="text-xs text-brand-red hover:underline"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
