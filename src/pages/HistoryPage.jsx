import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCategoriesContext } from "../contexts/CategoriesContext.jsx";
import { useMonthCache } from "../hooks/useMonthCache.js";
import { useMonthScrollerCount } from "../hooks/useMonthScrollerCount.js";
import { deleteEntry } from "../services/entries.js";
import { entryEvents } from "../utils/entryEvents.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { getAmount, formatCurrency, formatYearMonth, fromApiNecessity, MONTHS_SHORT } from "../utils/money.js";

// Deterministic per-user color palette derived from userId.
const USER_PALETTES = [
  { bg: "bg-violet-100 dark:bg-violet-900/30", border: "border-violet-400 dark:border-violet-600", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-pink-100 dark:bg-pink-900/30",     border: "border-pink-400 dark:border-pink-600",     text: "text-pink-700 dark:text-pink-300"   },
  { bg: "bg-teal-100 dark:bg-teal-900/30",     border: "border-teal-400 dark:border-teal-600",     text: "text-teal-700 dark:text-teal-300"   },
  { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400 dark:border-orange-600", text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/30",     border: "border-cyan-400 dark:border-cyan-600",     text: "text-cyan-700 dark:text-cyan-300"   },
  { bg: "bg-lime-100 dark:bg-lime-900/30",     border: "border-lime-400 dark:border-lime-600",     text: "text-lime-700 dark:text-lime-300"   },
];

function hashUserId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return Math.abs(h) % USER_PALETTES.length;
}

function userPalette(userId) {
  return USER_PALETTES[hashUserId(userId)];
}

// Toggle a value in/out of a Set, returning a new Set.
function toggle(set, value) {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
}

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
  // Sets of active values — empty means "show all"
  const [typeFilters, setTypeFilters] = useState(new Set());
  const [necFilters, setNecFilters]   = useState(new Set());
  const [userFilters, setUserFilters] = useState(new Set());

  // Reset dismiss state when the month changes (new fetch, new potential error)
  useEffect(() => { setFetchErrorHidden(false); }, [filterMonth]);

  const { categories, colorMap } = useCategoriesContext();
  const scrollerRef  = useRef(null);
  const initialLimit = useMonthScrollerCount(scrollerRef);
  const { activeMonths, monthCache, fetchMonth, hasMoreMonths, loadMoreMonths } = useMonthCache(showHousehold, initialLimit);

  useEffect(() => { fetchMonth(filterMonth); }, [filterMonth, fetchMonth]);

  const currentData = monthCache[filterMonth] ?? { entries: [], loading: true, error: null };
  const entries     = currentData.entries;
  const loading     = currentData.loading;
  const fetchError  = currentData.error;

  const filtered = useMemo(() => {
    let list = entries;
    if (typeFilters.size > 0) list = list.filter(e => typeFilters.has(e.type.toLowerCase()));
    if (necFilters.size  > 0) list = list.filter(e => necFilters.has(fromApiNecessity(e.necessity)));
    if (userFilters.size > 0) list = list.filter(e => userFilters.has(e.userId));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => {
        const cat = categories.find(c => c.categoryId === e.categoryId);
        return e.note?.toLowerCase().includes(q) || cat?.name?.toLowerCase().includes(q);
      });
    }
    return list;
  }, [entries, typeFilters, necFilters, userFilters, search, categories]);

  // Unique authors present in the current month — only useful in household mode.
  const authors = useMemo(() => {
    const seen = new Map();
    for (const e of entries) {
      if (e.userId && !seen.has(e.userId)) seen.set(e.userId, e.authorName || e.userId);
    }
    return Array.from(seen.entries()).map(([userId, name]) => ({ userId, name }));
  }, [entries]);

  const hasFilters = typeFilters.size > 0 || necFilters.size > 0 || userFilters.size > 0 || search.trim();

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

  const handleWheel = (e) => {
    if (!scrollerRef.current) return;
    e.preventDefault();
    scrollerRef.current.scrollLeft += e.deltaY + e.deltaX;
  };

  // Shared inactive chip classes
  const inactiveChip = "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-neutral-500";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-4">
      <h1 className="text-2xl font-bold">History</h1>

      {/* Month scroller */}
      <div ref={scrollerRef} onWheel={handleWheel} className="overflow-x-auto thin-scrollbar pb-1">
        <div className="flex gap-2 w-max px-1">
          {activeMonths.map(m => {
            const [y, mo] = m.split("-");
            const isActive = m === filterMonth;
            return (
              <button
                key={m}
                onClick={() => setFilterMonth(m)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-colors ${
                  isActive
                    ? "bg-brand-green border-brand-green text-white"
                    : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200"
                }`}
              >
                <span className="text-xs font-bold leading-tight">{MONTHS_SHORT[parseInt(mo, 10) - 1]}</span>
                <span className={`text-[10px] font-medium leading-tight mt-0.5 ${isActive ? "text-white/80" : "text-gray-400"}`}>{y}</span>
              </button>
            );
          })}
          {hasMoreMonths && (
            <button
              onClick={loadMoreMonths}
              className="flex flex-col items-center justify-center px-3 py-2 rounded-xl border border-dashed border-gray-300 dark:border-neutral-600 text-gray-400 dark:text-neutral-500 text-xs font-medium whitespace-nowrap transition-colors hover:border-gray-400 dark:hover:border-neutral-400 hover:text-gray-500 dark:hover:text-neutral-300"
            >
              Show more
            </button>
          )}
        </div>
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

      {/* Type filter — each chip is an independent toggle */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "income",     label: "💰 Income",      active: "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-700 dark:text-green-400" },
          { value: "expense",    label: "💸 Expenses",    active: "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-700 dark:text-red-400" },
          { value: "investment", label: "📈 Investments", active: "bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-400" },
        ].map(({ value, label, active }) => (
          <button
            key={value}
            onClick={() => {
              setTypeFilters(t => toggle(t, value));
              // Clear necessity filter when investment is deselected entirely and it was the only type
              if (value === "investment") setNecFilters(new Set());
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${typeFilters.has(value) ? active : inactiveChip}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Necessity filter — hidden when only investments are selected */}
      {!(typeFilters.size > 0 && typeFilters.size === [...typeFilters].filter(t => t === "investment").length) && (
        <div className="flex flex-wrap gap-2">
          {[
            { value: "necessary", label: "🔒 Necessary", active: "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-700 dark:text-red-400" },
            { value: "optional",  label: "✂️ Optional",  active: "bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400" },
          ].map(({ value, label, active }) => (
            <button
              key={value}
              onClick={() => setNecFilters(n => toggle(n, value))}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${necFilters.has(value) ? active : inactiveChip}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Member filter — only shown when multiple authors are present in this month */}
      {authors.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {authors.map(({ userId, name }) => {
            const p       = userPalette(userId);
            const isActive = userFilters.has(userId);
            return (
              <button
                key={userId}
                onClick={() => setUserFilters(u => toggle(u, userId))}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  isActive ? `${p.bg} ${p.border} ${p.text}` : inactiveChip
                }`}
              >
                {userId === user?.userId ? `${name} (you)` : name}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}{loading ? " (loading…)" : ""}
      </p>

      <FeedbackBanner message={fetchErrorHidden ? null : fetchError} type="error" onDismiss={() => setFetchErrorHidden(true)} />
      <FeedbackBanner message={deleteError} type="error" onDismiss={() => setDeleteError(null)} />

      {loading && <div className="flex justify-center py-12"><Spinner size={10} /></div>}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">
          {hasFilters
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
