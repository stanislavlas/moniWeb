import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { listActiveYears } from "../services/entries.js";
import { getRangeDashboard } from "../services/dashboard.js";
import { entryEvents } from "../utils/entryEvents.js";
import { useCategoriesContext } from "../contexts/CategoriesContext.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { NecessityBreakdown } from "../components/NecessityBreakdown.jsx";
import { formatCurrency } from "../utils/money.js";

// Sentinel key used in the cache and selector for the rolling last-12-months view
const TRAILING12 = "trailing12";

const pad = n => String(n).padStart(2, "0");

/** Returns { fromDate, toDate } YYYY-MM-DD strings for a calendar year. */
function yearRange(year) {
  return { fromDate: `${year}-01-01`, toDate: `${year}-12-31` };
}

/**
 * Returns { fromDate, toDate } YYYY-MM-DD strings for a rolling last-12-months window.
 * fromDate = the 1st of the current month one year ago (inclusive).
 * toDate   = today.
 * Example: called on Oct 15 2026 → fromDate="2025-10-01", toDate="2026-10-15"
 */
function trailing12Range() {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-indexed
  const d = today.getDate();
  const toDate  = `${y}-${pad(m + 1)}-${pad(d)}`;
  // Go back exactly 12 months: same month, previous year (Date handles Jan → Jan prev year correctly)
  const from    = new Date(y - 1, m, 1);
  const fromDate = `${from.getFullYear()}-${pad(from.getMonth() + 1)}-01`;
  return { fromDate, toDate };
}

/** Returns true if the given YYYY entry date falls within the trailing-12 window. */
function isWithinTrailing12(entryYear, entryMonth) {
  const { fromDate } = trailing12Range();
  const fromYear  = parseInt(fromDate.slice(0, 4), 10);
  const fromMonth = parseInt(fromDate.slice(5, 7), 10);
  // Compare as YYYYMM integers for simplicity
  return entryYear * 100 + entryMonth >= fromYear * 100 + fromMonth;
}

export function YearOverviewPage({ user, showHousehold = false }) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currency    = user?.currency ?? "EUR";

  // Selected period: TRAILING12 sentinel or a calendar year number
  const [selected, setSelected]       = useState(TRAILING12);
  const [activeYears, setActiveYears] = useState([currentYear]);
  const [showAvg, setShowAvg]         = useState(false);

  // Cache keyed by year number or TRAILING12
  const [cache, setCache] = useState({});

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

  const fetchPeriod = useCallback((key, force = false) => {
    let cancelled = false;
    setCache(prev => {
      if (!force && prev[key]?.data) return prev;
      return { ...prev, [key]: { data: prev[key]?.data ?? null, loading: true, error: null } };
    });
    const { fromDate, toDate } = key === TRAILING12 ? trailing12Range() : yearRange(key);
    getRangeDashboard(fromDate, toDate, showHousehold)
      .then(data => { if (!cancelled) setCache(prev => ({ ...prev, [key]: { data, loading: false, error: null } })); })
      .catch(err  => { if (!cancelled) setCache(prev => ({ ...prev, [key]: { data: null, loading: false, error: err.message } })); });
    return () => { cancelled = true; };
  }, [showHousehold]);

  const fetchPeriodRef = useRef(fetchPeriod);
  useEffect(() => { fetchPeriodRef.current = fetchPeriod; }, [fetchPeriod]);

  // Reset cache AND re-fetch on mount and whenever the household toggle changes.
  // This single effect handles the initial fetch, replacing the fragile didMountRef
  // + separate selection effect pattern.
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    setCache({});
    setActiveYears([currentYear]);
    const cancel = fetchPeriodRef.current(selectedRef.current);
    return cancel;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHousehold, currentYear]);

  // Fetch when the selected period changes (skip the very first render — the
  // household effect above handles the initial fetch).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const cancel = fetchPeriodRef.current(selected);
    return cancel;
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Invalidate cache when an entry is mutated.
  // Only evict and re-fetch keys that are actually affected.
  useEffect(() => {
    return entryEvents.subscribe(date => {
      if (!date) return;
      const affectedYear  = parseInt(date.slice(0, 4), 10);
      const affectedMonth = parseInt(date.slice(5, 7), 10);
      const trailing12Affected = isWithinTrailing12(affectedYear, affectedMonth);

      setCache(prev => {
        const next = { ...prev };
        delete next[affectedYear];
        if (trailing12Affected) delete next[TRAILING12];
        return next;
      });
      setActiveYears(prev =>
        prev.includes(affectedYear) ? prev : [...prev, affectedYear].sort((a, b) => b - a)
      );

      // Only re-fetch the currently selected period if it was actually invalidated
      const cur = selectedRef.current;
      if (cur === affectedYear || (cur === TRAILING12 && trailing12Affected)) {
        fetchPeriodRef.current(cur, true);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cached   = cache[selected] ?? { data: null, loading: true, error: null };
  const yearData = cached.data;
  const loading  = cached.loading;
  const error    = cached.error;

  // Bug 4: treat { data:null, loading:false, error:null } (cancelled fetch) as loading
  const effectiveLoading = loading || (!yearData && !error);

  const isTrailing = selected === TRAILING12;

  // Pick the right summary depending on the toggle
  const src = showAvg ? yearData?.monthlyAverages : yearData?.yearTotals;

  const totals = {
    income:   parseFloat(src?.totalIncome?.value      ?? 0),
    expenses: parseFloat(src?.totalExpenses?.value    ?? 0),
    invested: parseFloat(src?.totalInvestments?.value ?? 0),
  };
  const balance            = parseFloat(src?.savedAmount?.value ?? 0);
  const necessary          = parseFloat(src?.necessaryVsOptional?.necessary?.value ?? 0);
  const optional           = parseFloat(src?.necessaryVsOptional?.optional?.value  ?? 0);
  const members            = src?.memberBreakdown ?? [];
  const expensesByCategory = src?.expensesByCategory ?? {};
  const activeMonthCount   = yearData?.activeMonthCount ?? 0;
  const noData             = showAvg && activeMonthCount === 0 && yearData !== null;

  // Balance label adapts to both dimensions: period type × toggle state
  const balanceLabel = isTrailing
    ? (showAvg ? "Avg Monthly Balance · Last year" : "Total Balance · Last year")
    : (showAvg ? "Avg Monthly Balance" : "Annual Balance");

  const scrollerRef = useRef(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Fix 12: prefer deltaX for horizontal swipes, fall back to deltaY for vertical scroll wheel
    const onWheel = (e) => {
      e.preventDefault();
      el.scrollLeft += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6">

      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Year Overview</p>
        <h1 className="text-xl font-bold">{isTrailing ? "Last year" : selected}</h1>
      </div>

      {/* Period scroller: Last year pill + year pills */}
      <div ref={scrollerRef} className="overflow-x-auto thin-scrollbar pb-1">
        <div className="flex gap-2 w-max px-1">
          {/* Last year pill */}
          <button
            onClick={() => setSelected(TRAILING12)}
            className={`px-5 py-2.5 rounded-xl border font-bold text-sm transition-colors ${
              selected === TRAILING12
                ? "bg-brand-green border-brand-green text-white"
                : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            Last year
          </button>

          {/* Divider */}
          <div className="w-px bg-gray-200 dark:bg-neutral-700 self-stretch mx-1" />

          {/* Calendar year pills */}
          {activeYears.map(y => (
            <button
              key={y}
              onClick={() => setSelected(y)}
              className={`px-5 py-2.5 rounded-xl border font-bold text-sm transition-colors ${
                y === selected
                  ? "bg-brand-green border-brand-green text-white"
                  : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Total / Average toggle */}
      {!effectiveLoading && yearData && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden text-sm font-semibold">
            <button
              onClick={() => setShowAvg(false)}
              className={`px-5 py-2 transition-colors ${
                !showAvg
                  ? "bg-brand-green text-white"
                  : "bg-white dark:bg-neutral-900 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Total
            </button>
            <button
              onClick={() => setShowAvg(true)}
              className={`px-5 py-2 transition-colors ${
                showAvg
                  ? "bg-brand-green text-white"
                  : "bg-white dark:bg-neutral-900 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Avg/mo
              {showAvg && activeMonthCount > 0 && (
                <span className="ml-1.5 opacity-70 font-normal text-xs">({activeMonthCount}mo)</span>
              )}
            </button>
          </div>
        </div>
      )}

      <FeedbackBanner message={error} type="error" />

      {effectiveLoading ? (
        <div className="flex justify-center py-12"><Spinner size={10} /></div>
      ) : (
        (!error || yearData) && (
          <>
            {/* No-data notice when avg mode is on but there are no active months */}
            {noData && (
              <p className="text-center text-sm text-gray-400">No data to average for this period.</p>
            )}

            {/* Balance */}
            <div className="text-center py-2">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">{balanceLabel}</p>
              <p className={`text-4xl sm:text-5xl font-bold font-mono ${balance >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                {formatCurrency(balance, currency)}
              </p>
            </div>

            {/* Summary bars */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Summary</h2>
              {(() => {
                const summaryMax = Math.max(totals.income, totals.expenses, totals.invested, 1);
                return [
                  { label: "💰 Income",   val: totals.income,   color: "#1D9E75" },
                  { label: "💳 Expenses", val: totals.expenses, color: "#D85A30" },
                  ...(totals.invested > 0
                    ? [{ label: "📈 Invested", val: totals.invested, color: "#378ADD" }]
                    : []),
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{formatCurrency(val, currency)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(val / summaryMax) * 100}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Expense breakdown */}
            {totals.expenses > 0 && (
              <NecessityBreakdown necessary={necessary} optional={optional} currency={currency} />
            )}

            {/* By member — household mode only */}
            {members.length > 0 && showHousehold && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">By member</h2>
                {members.map(m => (
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
