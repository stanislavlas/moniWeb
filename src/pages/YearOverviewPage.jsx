import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { listActiveYears } from "../services/entries.js";
import { getYearDashboard } from "../services/dashboard.js";
import { entryEvents } from "../utils/entryEvents.js";
import { useCategoriesContext } from "../contexts/CategoriesContext.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { NecessityBreakdown } from "../components/NecessityBreakdown.jsx";
import { SummaryPills } from "../components/SummaryPills.jsx";
import { MONTHS_SHORT, formatCurrency } from "../utils/money.js";

export function YearOverviewPage({ user, showHousehold = false }) {
  const currentYear       = useMemo(() => new Date().getFullYear(), []);
  const currentMonthIndex = useMemo(() => new Date().getMonth(), []); // 0-indexed
  const currency          = user?.currency ?? "EUR";

  const [year, setYear]                = useState(currentYear);
  const [selectedMonthIndex, setMonth] = useState(currentMonthIndex);
  const [activeYears, setActiveYears]  = useState([currentYear]);

  // Year cache: { [year]: { data: YearDashboardResponse | null, loading, error } }
  const [yearCache, setYearCache] = useState({});

  const { categories, colorMap } = useCategoriesContext();

  // Fetch distinct years that have data; always include current year
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

  // Fetch the full year in one request — returns a cancel function
  const fetchYear = useCallback((y, force = false) => {
    let cancelled = false;
    setYearCache(prev => {
      if (!force && prev[y]?.data) return prev; // already cached, no-op
      return { ...prev, [y]: { data: prev[y]?.data ?? null, loading: true, error: null } };
    });
    getYearDashboard(y, showHousehold)
      .then(data => { if (!cancelled) setYearCache(prev => ({ ...prev, [y]: { data, loading: false, error: null } })); })
      .catch(err => { if (!cancelled) setYearCache(prev => ({ ...prev, [y]: { data: null, loading: false, error: err.message } })); });
    return () => { cancelled = true; };
  }, [showHousehold]);

  // Keep a stable ref to fetchYear so the year-change effect doesn't re-run when
  // fetchYear gets a new reference due to showHousehold changing.
  // The household-change effect below handles the household→reset→refetch path.
  const fetchYearRef = useRef(fetchYear);
  useEffect(() => { fetchYearRef.current = fetchYear; }, [fetchYear]);

  // Mount guard: skip the year-change effect on the very first render because
  // the household-change effect fires on mount and handles the initial fetch.
  const didMountRef = useRef(false);

  // Fetch on year change only (not on mount — household effect handles that)
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    const cancel = fetchYearRef.current(year);
    return cancel;
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset cache AND re-fetch when household toggle changes — merged into one effect
  useEffect(() => {
    setYearCache({});
    setActiveYears([currentYear]);
    const cancel = fetchYearRef.current(year);
    return cancel;
  // year and fetchYearRef are stable/refs — only showHousehold and currentYear should trigger this
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHousehold, currentYear]);

  // Invalidate year when an entry is mutated
  useEffect(() => {
    return entryEvents.subscribe(date => {
      if (!date) return;
      const affectedYear = parseInt(date.slice(0, 4), 10);
      setYearCache(prev => {
        if (!prev[affectedYear]) return prev;
        const next = { ...prev };
        delete next[affectedYear];
        return next;
      });
      setActiveYears(prev =>
        prev.includes(affectedYear) ? prev : [...prev, affectedYear].sort((a, b) => b - a)
      );
      if (affectedYear === year) fetchYearRef.current(year, true);
    });
  }, [year]); // fetchYearRef is a stable ref — no need to include it

  const cached    = yearCache[year] ?? { data: null, loading: true, error: null };
  const yearData  = cached.data;
  const loading   = cached.loading;
  const error     = cached.error;

  // Build 12-month display array from the single response
  const monthlyData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const mo   = String(i + 1).padStart(2, "0");
      const ym   = `${year}-${mo}`;
      const m    = yearData?.months?.[ym] ?? null;
      return {
        month:    MONTHS_SHORT[i],
        index:    i,
        ym,
        income:   parseFloat(m?.totalIncome?.value      ?? 0),
        expenses: parseFloat(m?.totalExpenses?.value    ?? 0),
        invested: parseFloat(m?.totalInvestments?.value ?? 0),
        saved:    parseFloat(m?.savedAmount?.value      ?? 0),
        necessary: parseFloat(m?.necessaryVsOptional?.necessary?.value ?? 0),
        optional:  parseFloat(m?.necessaryVsOptional?.optional?.value  ?? 0),
        expensesByCategory: m?.expensesByCategory ?? {},
        memberBreakdown:    m?.memberBreakdown    ?? [],
      };
    }),
  [year, yearData]);

  // Annual totals — read directly from API yearTotals (no client-side summation)
  const yt        = yearData?.yearTotals;
  const yearTotals = {
    income:   parseFloat(yt?.totalIncome?.value      ?? 0),
    expenses: parseFloat(yt?.totalExpenses?.value    ?? 0),
    invested: parseFloat(yt?.totalInvestments?.value ?? 0),
  };
  const yearBalance   = parseFloat(yt?.savedAmount?.value ?? 0);
  const yearNecessary = parseFloat(yt?.necessaryVsOptional?.necessary?.value ?? 0);
  const yearOptional  = parseFloat(yt?.necessaryVsOptional?.optional?.value  ?? 0);
  const yearMembers   = yt?.memberBreakdown ?? [];

  const barMax = useMemo(() =>
    Math.max(...monthlyData.map(m => Math.max(m.income, m.expenses, m.invested)), 1),
  [monthlyData]);

  const selData = monthlyData[selectedMonthIndex] ?? null;

  const yearScrollerRef = useRef(null);
  const handleYearWheel = (e) => {
    if (!yearScrollerRef.current) return;
    e.preventDefault();
    yearScrollerRef.current.scrollLeft += e.deltaY + e.deltaX;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6">

      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Year Overview</p>
        <h1 className="text-xl font-bold">{year}</h1>
      </div>

      {/* Year scroller */}
      <div ref={yearScrollerRef} onWheel={handleYearWheel} className="overflow-x-auto thin-scrollbar pb-1">
        <div className="flex gap-2 w-max px-1">
          {activeYears.map(y => (
            <button
              key={y}
              onClick={() => { setYear(y); setMonth(y === currentYear ? currentMonthIndex : 0); }}
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

      {/* Only render summary data when there is something to show */}
      {(!error || yearData) && (
        <>
          {/* Annual balance — shown even while loading if stale data available */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Annual Balance</p>
            <p className={`text-4xl sm:text-5xl font-bold font-mono ${yearBalance >= 0 ? "text-brand-green" : "text-brand-red"}`}>
              {formatCurrency(yearBalance, currency)}
            </p>
          </div>

          {/* Annual pills */}
          <SummaryPills income={yearTotals.income} expense={yearTotals.expenses} investment={yearTotals.invested} currency={currency} />

          {/* Annual expense breakdown */}
          {yearTotals.expenses > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Expense breakdown</h2>
              <NecessityBreakdown necessary={yearNecessary} optional={yearOptional} total={yearTotals.expenses} currency={currency} />
            </div>
          )}

          {/* Annual member breakdown — household mode only */}
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
        </>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={10} /></div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4">
            <div className="flex items-end gap-0.5" style={{ height: "100px" }}>
              {monthlyData.map((m, i) => {
                const isActive = selectedMonthIndex === i;
                const incH = (m.income   / barMax) * 100;
                const expH = (m.expenses / barMax) * 100;
                const invH = (m.invested / barMax) * 100;
                return (
                  <button
                    key={m.month}
                    onClick={() => setMonth(i)}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div className="w-full flex items-end gap-[1px]" style={{ height: "80px" }}>
                      <div style={{ flex: 1, height: `${incH}%`, backgroundColor: "#1D9E75", opacity: isActive ? 1 : 0.3, borderRadius: "2px 2px 0 0", minHeight: m.income   > 0 ? "2px" : "0" }} />
                      <div style={{ flex: 1, height: `${expH}%`, backgroundColor: "#D85A30", opacity: isActive ? 1 : 0.3, borderRadius: "2px 2px 0 0", minHeight: m.expenses > 0 ? "2px" : "0" }} />
                      <div style={{ flex: 1, height: `${invH}%`, backgroundColor: "#378ADD", opacity: isActive ? 1 : 0.3, borderRadius: "2px 2px 0 0", minHeight: m.invested > 0 ? "2px" : "0" }} />
                    </div>
                    <span className={`text-[9px] font-medium mt-1 ${isActive ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`}>
                      {m.month}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex gap-4 mt-3 justify-center">
              {[
                { color: "#1D9E75", label: "Income"   },
                { color: "#D85A30", label: "Expenses" },
                { color: "#378ADD", label: "Invested" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                  <span className="text-[11px] text-gray-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected month detail */}
          {selData && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <p className="text-xs font-semibold text-gray-400 text-center uppercase tracking-wide">
                {MONTHS_SHORT[selData.index]} {year}
              </p>

              <div className="text-center py-3">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Balance</p>
                <p className={`text-3xl sm:text-4xl font-bold font-mono ${
                  selData.saved >= 0 ? "text-brand-green" : "text-brand-red"
                }`}>
                  {formatCurrency(selData.saved, currency)}
                </p>
              </div>

              <SummaryPills income={selData.income} expense={selData.expenses} investment={selData.invested} currency={currency} />

              {selData.expenses > 0 && (
                <NecessityBreakdown necessary={selData.necessary} optional={selData.optional} total={selData.expenses} currency={currency} />
              )}

              {/* By category for selected month */}
              {Object.keys(selData.expensesByCategory).length > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">By category</h2>
                  {(() => {
                    const catMax = Object.values(selData.expensesByCategory)
                      .reduce((mx, a) => Math.max(mx, parseFloat(a.value ?? 0)), 1);
                    return Object.entries(selData.expensesByCategory)
                      .map(([catId, amount]) => ({ catId, total: parseFloat(amount.value ?? 0) }))
                      .sort((a, b) => b.total - a.total)
                      .map(({ catId, total }) => {
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
