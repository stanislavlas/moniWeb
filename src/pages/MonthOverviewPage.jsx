import { useEffect, useRef, useState, useMemo } from "react";
import { useCategoriesContext } from "../contexts/CategoriesContext.jsx";
import { useDashboard } from "../hooks/useDashboard.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { NecessityBreakdown } from "../components/NecessityBreakdown.jsx";
import { MONTHS_SHORT, formatCurrency, formatYearMonth } from "../utils/money.js";

const INITIAL_LIMIT = 12;
const BAR_GAP = 1; // px between the two bars inside a column
const COL_GAP = 5; // px between columns
// Fallback column width before measurement (matches ~12 cols in a 320px card)
const COL_W_FALLBACK = 13;

function colWFromWidth(containerWidth, colCount) {
  // Fill the container exactly with colCount columns
  // colW = (containerWidth - COL_GAP * (colCount - 1)) / colCount
  // barW = (colW - BAR_GAP) / 2  — must be at least 3px
  const colW = (containerWidth - COL_GAP * (colCount - 1)) / colCount;
  const barW = Math.max(3, Math.floor((colW - BAR_GAP) / 2));
  return barW * 2 + BAR_GAP;
}

export function MonthOverviewPage({ user, showHousehold = false }) {
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { categories, colorMap } = useCategoriesContext();

  const { activeMonths, dashboardCache, fetchDashboard, hasMoreMonths, loadMoreMonths } =
    useDashboard(showHousehold, INITIAL_LIMIT);

  useEffect(() => { fetchDashboard(filterMonth); }, [filterMonth, fetchDashboard]);

  // Pre-fetch all visible months so bars have data
  useEffect(() => {
    activeMonths.forEach(ym => fetchDashboard(ym));
  }, [activeMonths, fetchDashboard]);

  const currentData = dashboardCache[filterMonth] ?? { data: null, loading: true, error: null };
  const dash    = currentData.data;
  const loading = currentData.loading;
  const error   = currentData.error;

  const monthLabel = formatYearMonth(filterMonth);
  const currency   = user?.currency ?? "EUR";
  const fmt        = (v) => formatCurrency(v, currency);

  // Per-month totals for the bar chart
  const chartMonths = useMemo(() =>
    activeMonths.map(ym => {
      const d = dashboardCache[ym]?.data;
      return {
        ym,
        month:    MONTHS_SHORT[parseInt(ym.slice(5, 7), 10) - 1],
        year2:    ym.slice(2, 4), // 2-digit year e.g. "25"
        income:   parseFloat(d?.totalIncome?.value      ?? 0),
        expenses: parseFloat(d?.totalExpenses?.value    ?? 0),
        invested: parseFloat(d?.totalInvestments?.value ?? 0),
      };
    }),
  [activeMonths, dashboardCache]);

  const chartBarMax = useMemo(() =>
    Math.max(...chartMonths.map(m => Math.max(m.income, m.expenses + m.invested)), 1),
  [chartMonths]);

  // Measure container width once on first render — fixed after that
  const cardRef      = useRef(null);
  const [colW, setColW] = useState(COL_W_FALLBACK);
  const measuredRef  = useRef(false);
  useEffect(() => {
    if (measuredRef.current || !cardRef.current) return;
    const w = cardRef.current.getBoundingClientRect().width;
    if (w > 0) {
      measuredRef.current = true;
      setColW(colWFromWidth(w, INITIAL_LIMIT));
    }
  }); // no dep array — runs after every render until measured
  const barW = Math.floor((colW - BAR_GAP) / 2);

  // Scroll handler: horizontal only, suppress vertical page scroll.
  // Must be registered as non-passive so preventDefault() is respected.
  const chartScrollRef = useRef(null);
  useEffect(() => {
    const el = chartScrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY + e.deltaX;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Selected month detail
  const income     = parseFloat(dash?.totalIncome?.value      ?? 0);
  const expense    = parseFloat(dash?.totalExpenses?.value    ?? 0);
  const investment = parseFloat(dash?.totalInvestments?.value ?? 0);
  const balance    = parseFloat(dash?.savedAmount?.value      ?? 0);
  const necessary  = parseFloat(dash?.necessaryVsOptional?.necessary?.value ?? 0);
  const optional   = parseFloat(dash?.necessaryVsOptional?.optional?.value  ?? 0);

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

  const memberBreakdown = dash?.memberBreakdown ?? [];
  const catMax          = catBreakdown[0]?.total || 1;
  const hasEntries      = income > 0 || expense > 0 || investment > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6">

      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Month Overview</p>
        <h1 className="text-xl font-bold">{monthLabel}</h1>
      </div>

      {/* Bar chart card */}
      <div ref={cardRef} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4">
        <div
          ref={chartScrollRef}
          className="thin-scrollbar"
          style={{ overflowX: "auto", overflowY: "hidden" }}
        >
          <div
            className="flex items-end"
            style={{ gap: `${COL_GAP}px`, height: "80px" }}
          >
            {chartMonths.map((m) => {
              const isActive  = m.ym === filterMonth;
              const incH      = (m.income              / chartBarMax) * 100;
              const expH      = (m.expenses             / chartBarMax) * 100;
              const invH      = (m.invested             / chartBarMax) * 100;
              const combinedH = expH + invH;
              const expFrac   = combinedH > 0 ? expH / combinedH : 1;
              const invFrac   = combinedH > 0 ? invH / combinedH : 0;
              const isLoading = !dashboardCache[m.ym]?.data && dashboardCache[m.ym]?.loading;
              return (
                <button
                  key={m.ym}
                  onClick={() => setFilterMonth(m.ym)}
                  className="flex flex-col items-center shrink-0"
                  style={{ width: `${colW}px` }}
                >
                  <div className="w-full flex items-end" style={{ height: "60px", gap: `${BAR_GAP}px` }}>
                    {isLoading ? (
                      <div className="rounded-sm bg-gray-100 dark:bg-neutral-800 self-end" style={{ width: `${barW}px`, height: "3px" }} />
                    ) : (
                      <>
                        {/* Income bar */}
                        <div style={{ width: `${barW}px`, height: `${incH}%`, backgroundColor: "#1D9E75", opacity: isActive ? 1 : 0.35, borderRadius: "2px 2px 0 0", minHeight: m.income > 0 ? "2px" : "0", flexShrink: 0 }} />
                        {/* Expenses + Invested stacked bar */}
                        <div style={{ width: `${barW}px`, height: `${combinedH}%`, opacity: isActive ? 1 : 0.35, borderRadius: "2px 2px 0 0", overflow: "hidden", minHeight: (m.expenses + m.invested) > 0 ? "2px" : "0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                          {m.invested > 0 && <div style={{ flex: invFrac, backgroundColor: "#378ADD" }} />}
                          <div style={{ flex: expFrac, backgroundColor: "#D85A30" }} />
                        </div>
                      </>
                    )}
                  </div>
                  {/* Label: month + 2-digit year */}
                  <div className="flex flex-col items-center mt-1" style={{ gap: "1px" }}>
                    <span className={`leading-none ${isActive ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`} style={{ fontSize: "7px", fontWeight: 600 }}>
                      {m.month}
                    </span>
                    <span className="leading-none text-gray-400" style={{ fontSize: "7px" }}>
                      {m.year2}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Show more button as final column — fixed width so label fits on mobile */}
            {hasMoreMonths && (
              <button
                onClick={loadMoreMonths}
                className="flex flex-col items-center justify-center shrink-0 gap-1 ml-2"
                style={{ width: "36px", height: "80px" }}
              >
                <div className="flex flex-col gap-[3px] items-center">
                  <div className="w-[3px] h-[3px] rounded-full bg-gray-300 dark:bg-neutral-600" />
                  <div className="w-[3px] h-[3px] rounded-full bg-gray-300 dark:bg-neutral-600" />
                  <div className="w-[3px] h-[3px] rounded-full bg-gray-300 dark:bg-neutral-600" />
                </div>
                <span className="text-gray-400 leading-none whitespace-nowrap" style={{ fontSize: "7px" }}>Show more</span>
              </button>
            )}
          </div>
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
      </div>

      <FeedbackBanner message={error} type="error" />

      {loading && <div className="flex justify-center py-12"><Spinner size={10} /></div>}

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
            <NecessityBreakdown necessary={necessary} optional={optional} total={expense} currency={currency} />
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
