import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { listActiveYears } from "../services/entries.js";
import { getYearDashboard } from "../services/dashboard.js";
import { entryEvents } from "../utils/entryEvents.js";
import { useCategoriesContext } from "../contexts/CategoriesContext.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { NecessityBreakdown } from "../components/NecessityBreakdown.jsx";
import { formatCurrency } from "../utils/money.js";

export function YearOverviewPage({ user, showHousehold = false }) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currency    = user?.currency ?? "EUR";

  const [year, setYear]           = useState(currentYear);
  const [activeYears, setActiveYears] = useState([currentYear]);

  // Cache keyed by year number
  const [yearCache, setYearCache] = useState({});

  const { categories, colorMap } = useCategoriesContext();

  // Fetch distinct years that have data
  useEffect(() => {
    let cancelled = false;
    listActiveYears(showHousehold)
      .then(data => {
        if (cancelled) return;
        const all = new Set([currentYear, ...(Array.isArray(data) ? data : [])]);
        setActiveYears([...all].sort((a, b) => b - a));
      })
      .catch(() => { /* keep seed */ });
    return () => { cancelled = true; };
  }, [showHousehold, currentYear]);

  const fetchYear = useCallback((y, force = false) => {
    let cancelled = false;
    setYearCache(prev => {
      if (!force && prev[y]?.data) return prev;
      return { ...prev, [y]: { data: prev[y]?.data ?? null, loading: true, error: null } };
    });
    getYearDashboard(y, showHousehold)
      .then(data => { if (!cancelled) setYearCache(prev => ({ ...prev, [y]: { data, loading: false, error: null } })); })
      .catch(err  => { if (!cancelled) setYearCache(prev => ({ ...prev, [y]: { data: null, loading: false, error: err.message } })); });
    return () => { cancelled = true; };
  }, [showHousehold]);

  const fetchYearRef = useRef(fetchYear);
  useEffect(() => { fetchYearRef.current = fetchYear; }, [fetchYear]);

  const didMountRef = useRef(false);

  // Fetch on year change (not on mount — household effect handles that)
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    const cancel = fetchYearRef.current(year);
    return cancel;
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset cache AND re-fetch when household toggle changes
  useEffect(() => {
    setYearCache({});
    setActiveYears([currentYear]);
    const cancel = fetchYearRef.current(year);
    return cancel;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHousehold, currentYear]);

  // Invalidate cache when an entry is mutated
  useEffect(() => {
    return entryEvents.subscribe(date => {
      if (!date) return;
      const affectedYear = parseInt(date.slice(0, 4), 10);
      setYearCache(prev => {
        const next = { ...prev };
        delete next[affectedYear];
        return next;
      });
      setActiveYears(prev =>
        prev.includes(affectedYear) ? prev : [...prev, affectedYear].sort((a, b) => b - a)
      );
      if (affectedYear === year) fetchYearRef.current(year, true);
    });
  }, [year]);

  const cached   = yearCache[year] ?? { data: null, loading: true, error: null };
  const yearData = cached.data;
  const loading  = cached.loading;
  const error    = cached.error;

  // Totals from API
  const yt = yearData?.yearTotals;
  const yearTotals = {
    income:   parseFloat(yt?.totalIncome?.value      ?? 0),
    expenses: parseFloat(yt?.totalExpenses?.value    ?? 0),
    invested: parseFloat(yt?.totalInvestments?.value ?? 0),
  };
  const yearBalance        = parseFloat(yt?.savedAmount?.value ?? 0);
  const yearNecessary      = parseFloat(yt?.necessaryVsOptional?.necessary?.value ?? 0);
  const yearOptional       = parseFloat(yt?.necessaryVsOptional?.optional?.value  ?? 0);
  const yearMembers        = yt?.memberBreakdown ?? [];
  const expensesByCategory = yt?.expensesByCategory ?? {};

  const scrollerRef = useRef(null);
  const handleWheel = (e) => {
    if (!scrollerRef.current) return;
    e.preventDefault();
    scrollerRef.current.scrollLeft += e.deltaY + e.deltaX;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6">

      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Year Overview</p>
        <h1 className="text-xl font-bold">{year}</h1>
      </div>

      {/* Year scroller */}
      <div ref={scrollerRef} onWheel={handleWheel} className="overflow-x-auto thin-scrollbar pb-1">
        <div className="flex gap-2 w-max px-1">
          {activeYears.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-5 py-2.5 rounded-xl border font-bold text-sm transition-colors ${
                y === year
                  ? "bg-brand-green border-brand-green text-white"
                  : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <FeedbackBanner message={error} type="error" />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={10} /></div>
      ) : (
        (!error || yearData) && (
          <>
            {/* Annual balance */}
            <div className="text-center py-2">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Annual Balance</p>
              <p className={`text-4xl sm:text-5xl font-bold font-mono ${yearBalance >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                {formatCurrency(yearBalance, currency)}
              </p>
            </div>

            {/* Summary bars */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Summary</h2>
              {[
                { label: "💰 Income",   val: yearTotals.income,   color: "#1D9E75" },
                { label: "💳 Expenses", val: yearTotals.expenses, color: "#D85A30" },
                ...(yearTotals.invested > 0
                  ? [{ label: "📈 Invested", val: yearTotals.invested, color: "#378ADD" }]
                  : []),
              ].map(({ label, val, color }) => {
                const summaryMax = Math.max(yearTotals.income, yearTotals.expenses, yearTotals.invested, 1);
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{formatCurrency(val, currency)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(val / summaryMax) * 100}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expense breakdown */}
            {yearTotals.expenses > 0 && (
              <NecessityBreakdown necessary={yearNecessary} optional={yearOptional} total={yearTotals.expenses} currency={currency} />
            )}

            {/* By member — household mode only */}
            {yearMembers.length > 0 && showHousehold && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">By member</h2>
                {yearMembers.map(m => (
                  <div key={m.userId} className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-green-700 dark:text-green-400">{(m.name ?? "?").charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{m.name}</span>
                    <div className="flex flex-col items-end">
                      {parseFloat(m.totalIncome?.value      ?? 0) > 0 && <span className="text-xs font-mono text-brand-green">+{formatCurrency(parseFloat(m.totalIncome?.value ?? 0), currency)}</span>}
                      {parseFloat(m.totalExpenses?.value    ?? 0) > 0 && <span className="text-xs font-mono text-brand-red">−{formatCurrency(parseFloat(m.totalExpenses?.value ?? 0), currency)}</span>}
                      {parseFloat(m.totalInvestments?.value ?? 0) > 0 && <span className="text-xs font-mono text-brand-blue">↗{formatCurrency(parseFloat(m.totalInvestments?.value ?? 0), currency)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* By category */}
            {Object.keys(expensesByCategory).length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">By category</h2>
                {(() => {
                  const catList = Object.entries(expensesByCategory)
                    .map(([catId, amount]) => ({ catId, total: parseFloat(amount.value ?? 0) }))
                    .filter(({ total }) => total > 0)
                    .sort((a, b) => b.total - a.total);
                  const catMax = catList[0]?.total || 1;
                  return catList.map(({ catId, total }) => {
                    const barColor = colorMap[catId] || "#D85A30";
                    const cat      = categories.find(c => c.categoryId === catId);
                    const icon     = cat?.icon ?? cat?.emoji ?? "";
                    const name     = cat?.name ?? "Unknown";
                    const label    = icon ? `${icon} ${name}` : name;
                    return (
                      <div key={catId}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{formatCurrency(total, currency)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(total / catMax) * 100}%`, backgroundColor: barColor }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
