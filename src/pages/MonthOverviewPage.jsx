import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useCategoriesContext } from "../contexts/CategoriesContext.jsx";
import { useDashboard } from "../hooks/useDashboard.js";
import { useMonthScrollerCount } from "../hooks/useMonthScrollerCount.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { NecessityBreakdown } from "../components/NecessityBreakdown.jsx";
import { MONTHS_SHORT, formatCurrency, formatYearMonth } from "../utils/money.js";
import { getRecentDashboard } from "../services/dashboard.js";
import { entryEvents } from "../utils/entryEvents.js";

export function MonthOverviewPage({ user, showHousehold = false }) {
  // Use UTC month to stay consistent with recentMonths() in money.js (which uses getUTCMonth)
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { categories, colorMap } = useCategoriesContext();

  const scrollerRef   = useRef(null);
  const initialLimit  = useMonthScrollerCount(scrollerRef);
  const { activeMonths, dashboardCache, fetchDashboard, hasMoreMonths, loadMoreMonths } = useDashboard(showHousehold, initialLimit);

  useEffect(() => { fetchDashboard(filterMonth); }, [filterMonth, fetchDashboard]);

  const currentData = dashboardCache[filterMonth] ?? { data: null, loading: true, error: null };
  const dash    = currentData.data;
  const loading = currentData.loading;
  const error   = currentData.error;

  const monthLabel = formatYearMonth(filterMonth);
  const currency   = user?.currency ?? "EUR";
  const fmt        = (v) => formatCurrency(v, currency);

  // Pre-computed totals from the API — no client-side summation needed
  const income     = parseFloat(dash?.totalIncome?.value     ?? 0);
  const expense    = parseFloat(dash?.totalExpenses?.value   ?? 0);
  const investment = parseFloat(dash?.totalInvestments?.value ?? 0);
  const balance    = parseFloat(dash?.savedAmount?.value     ?? 0);
  const necessary  = parseFloat(dash?.necessaryVsOptional?.necessary?.value ?? 0);
  const optional   = parseFloat(dash?.necessaryVsOptional?.optional?.value  ?? 0);

  // Category breakdown from API
  const catBreakdown = dash?.expensesByCategory
    ? Object.entries(dash.expensesByCategory)
        .map(([catId, amount]) => {
          const total = parseFloat(amount.value ?? 0);
          const cat   = categories.find(c => c.categoryId === catId);
          const icon  = cat?.icon ?? cat?.emoji ?? "";
          const name  = cat?.name ?? "Unknown";
          return { catId, label: icon ? `${icon} ${name}` : name, total };
        })
        .filter(({ total }) => total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
    : [];

  // memberBreakdown is pre-computed by the API in household mode; null in personal mode
  const memberBreakdown = dash?.memberBreakdown ?? [];

  const catMax    = catBreakdown[0]?.total || 1;
  const hasEntries = income > 0 || expense > 0 || investment > 0;

  // ── 12-month bar chart ────────────────────────────────────────────────────
  // Fetch the rolling 12-month overview once; invalidate on entry mutations.
  const [chartData, setChartData] = useState(null);
  const chartFetchedRef = useRef(false);

  const fetchChart = useCallback((force = false) => {
    if (!force && chartFetchedRef.current) return;
    chartFetchedRef.current = true;
    let cancelled = false;
    getRecentDashboard(12, showHousehold)
      .then(data => { if (!cancelled) setChartData(data); })
      .catch(() => { chartFetchedRef.current = false; }); // allow retry
    return () => { cancelled = true; };
  }, [showHousehold]);

  // Fetch on mount and when household changes
  useEffect(() => {
    chartFetchedRef.current = false;
    setChartData(null);
    const cancel = fetchChart(true);
    return cancel;
  }, [showHousehold]); // eslint-disable-line react-hooks/exhaustive-deps

  // Invalidate chart on entry mutations
  useEffect(() => {
    return entryEvents.subscribe(() => {
      chartFetchedRef.current = false;
      fetchChart(true);
    });
  }, [fetchChart]);

  // Build sorted month array from chart response
  const chartMonths = useMemo(() => {
    if (!chartData?.months) return [];
    return Object.entries(chartData.months).map(([ym, m]) => ({
      ym,
      month: MONTHS_SHORT[parseInt(ym.slice(5, 7), 10) - 1],
      income:   parseFloat(m?.totalIncome?.value      ?? 0),
      expenses: parseFloat(m?.totalExpenses?.value    ?? 0),
      invested: parseFloat(m?.totalInvestments?.value ?? 0),
    }));
  }, [chartData]);

  const chartBarMax = useMemo(() =>
    Math.max(...chartMonths.map(m => Math.max(m.income, m.expenses + m.invested)), 1),
  [chartMonths]);

  const handleWheel = (e) => {
    if (!scrollerRef.current) return;
    e.preventDefault();
    scrollerRef.current.scrollLeft += e.deltaY + e.deltaX;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6">

      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Month Overview</p>
        <h1 className="text-xl font-bold">{monthLabel}</h1>
      </div>

      {/* 12-month bar chart — replaces SummaryPills */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4">
        {chartMonths.length === 0 ? (
          <div className="flex justify-center py-6"><Spinner size={6} /></div>
        ) : (
          <>
            <div className="flex items-end gap-0.5" style={{ height: "80px" }}>
              {chartMonths.map((m) => {
                const isActive  = m.ym === filterMonth;
                const incH      = (m.income              / chartBarMax) * 100;
                const expH      = (m.expenses             / chartBarMax) * 100;
                const invH      = (m.invested             / chartBarMax) * 100;
                const combinedH = expH + invH;
                const expFrac   = combinedH > 0 ? expH / combinedH : 1;
                const invFrac   = combinedH > 0 ? invH / combinedH : 0;
                return (
                  <button
                    key={m.ym}
                    onClick={() => setFilterMonth(m.ym)}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div className="w-full flex items-end gap-[1px]" style={{ height: "64px" }}>
                      {/* Income bar */}
                      <div style={{ flex: 1, height: `${incH}%`, backgroundColor: "#1D9E75", opacity: isActive ? 1 : 0.3, borderRadius: "2px 2px 0 0", minHeight: m.income > 0 ? "2px" : "0" }} />
                      {/* Expenses + Invested stacked bar */}
                      <div style={{ flex: 1, height: `${combinedH}%`, opacity: isActive ? 1 : 0.3, borderRadius: "2px 2px 0 0", overflow: "hidden", minHeight: (m.expenses + m.invested) > 0 ? "2px" : "0", display: "flex", flexDirection: "column" }}>
                        {m.invested > 0 && <div style={{ flex: invFrac, backgroundColor: "#378ADD" }} />}
                        <div style={{ flex: expFrac, backgroundColor: "#D85A30" }} />
                      </div>
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
                { color: "#1D9E75", label: "Income" },
                { color: "#D85A30", label: "Expenses+Invested", secondColor: "#378ADD" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  {l.secondColor ? (
                    <div className="w-3 h-2 rounded-sm overflow-hidden flex flex-col">
                      <div className="flex-1" style={{ backgroundColor: l.secondColor }} />
                      <div className="flex-[2]" style={{ backgroundColor: l.color }} />
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                  )}
                  <span className="text-[11px] text-gray-400">{l.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Month scroller — width drives visible count via useMonthScrollerCount */}
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

      <FeedbackBanner message={error} type="error" />

      {loading && <div className="flex justify-center py-12"><Spinner size={10} /></div>}

      {/* Only render content when not loading AND either data exists or there is no error */}
      {!loading && (!error || dash) && (
        <>
          {/* Balance */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Balance</p>
            <p className={`text-4xl sm:text-5xl font-bold font-mono ${balance >= 0 ? "text-brand-green" : "text-brand-red"}`}>
              {fmt(balance)}
            </p>
          </div>

          {/* Summary bars */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Summary</h2>
            {[
              { label: "💰 Income",   val: income,     color: "#1D9E75" },
              { label: "💳 Expenses", val: expense,    color: "#D85A30" },
              ...(investment > 0
                ? [{ label: "📈 Invested", val: investment, color: "#378ADD" }]
                : []),
            ].map(({ label, val, color }) => {
              const summaryMax = Math.max(income, expense, investment, 1);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{fmt(val)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(val / summaryMax) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expense breakdown — Needs vs Wants */}
          {expense > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Expense breakdown</h2>
              <NecessityBreakdown necessary={necessary} optional={optional} total={expense} currency={currency} />
            </div>
          )}

          {/* By member — household only */}
          {memberBreakdown.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">By member</h2>
              {memberBreakdown.map(m => (
                <div key={m.userId} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-green-700 dark:text-green-400">{(m.name ?? "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{m.name}</span>
                  <div className="flex flex-col items-end">
                    {parseFloat(m.totalIncome?.value      ?? 0) > 0 && <span className="text-xs font-mono text-brand-green">+{fmt(parseFloat(m.totalIncome?.value ?? 0))}</span>}
                    {parseFloat(m.totalExpenses?.value    ?? 0) > 0 && <span className="text-xs font-mono text-brand-red">−{fmt(parseFloat(m.totalExpenses?.value ?? 0))}</span>}
                    {parseFloat(m.totalInvestments?.value ?? 0) > 0 && <span className="text-xs font-mono text-brand-blue">↗{fmt(parseFloat(m.totalInvestments?.value ?? 0))}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* By category */}
          {catBreakdown.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">By category</h2>
              {catBreakdown.map(({ catId, label, total }) => {
                const barColor = colorMap[catId] || "#D85A30";
                return (
                  <div key={catId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{fmt(total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(total / catMax) * 100}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!hasEntries && (
            <p className="text-center text-gray-400 py-8">No transactions this month.</p>
          )}
        </>
      )}
    </div>
  );
}
