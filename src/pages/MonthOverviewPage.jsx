import { useEffect, useState, useMemo } from "react";
import { useEntries } from "../hooks/useEntries.js";
import { useCategories } from "../hooks/useCategories.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { NecessityBreakdown } from "../components/NecessityBreakdown.jsx";
import { SummaryPills } from "../components/SummaryPills.jsx";
import { MONTHS_SHORT, getAmount, formatCurrency, sumEntriesByType, sumNecessity } from "../utils/money.js";

export function MonthOverviewPage({ user, showHousehold = false }) {
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { entries, loading, error, load } = useEntries();
  const { categories, load: loadCats, colorMap } = useCategories();

  useEffect(() => { load(filterMonth, showHousehold); }, [filterMonth, showHousehold, load]);
  useEffect(() => { loadCats(); }, [loadCats]);

  // Build month list from entry dates already loaded + current month
  const months = useMemo(() => {
    const keys = new Set();
    keys.add(new Date().toISOString().slice(0, 7));
    entries.forEach(e => { if (e.date) keys.add(e.date.slice(0, 7)); });
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const [year, month] = filterMonth.split("-");
  const monthLabel = `${MONTHS_SHORT[parseInt(month, 10) - 1]} ${year}`;

  const currency = user?.currency ?? "EUR";
  const fmt = (v) => formatCurrency(v, currency);

  const totals = useMemo(() => {
    const { income, expense, investment } = sumEntriesByType(entries);
    return { income, expense, investment, balance: income - expense - investment };
  }, [entries]);

  const necessityTotals = useMemo(() => sumNecessity(entries), [entries]);

  const catBreakdown = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const id = e.categoryId;
      if (!id) return;
      map[id] = (map[id] || 0) + getAmount(e);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([catId, total]) => {
        const cat = categories.find(c => c.categoryId === catId);
        const icon = cat?.icon ?? cat?.emoji ?? "";
        const name = cat?.name ?? catId.slice(0, 8);
        return { catId, label: icon ? `${icon} ${name}` : name, total };
      });
  }, [entries, categories]);

  const catMax = catBreakdown[0]?.total || 1;
  const summaryMax = Math.max(totals.income, totals.expense, totals.investment, 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Month Overview</p>
        <h1 className="text-xl font-bold">{monthLabel}</h1>
      </div>

      {/* Month scroller — no scrollbar */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="flex gap-2 w-max px-1">
          {months.map(m => {
            const [y, mo] = m.split("-");
            const isActive = m === filterMonth;
            return (
              <button
                key={m}
                onClick={() => setFilterMonth(m)}
                className={`flex flex-col items-center px-4 py-2.5 rounded-xl border transition-colors ${
                  isActive
                    ? "bg-brand-green border-brand-green text-white"
                    : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200"
                }`}
              >
                <span className="text-sm font-bold leading-tight">{MONTHS_SHORT[parseInt(mo, 10) - 1]}</span>
                <span className={`text-[10px] font-medium leading-tight mt-0.5 ${isActive ? "text-white/80" : "text-gray-400"}`}>{y}</span>
              </button>
            );
          })}
        </div>
      </div>

      <FeedbackBanner message={error} type="error" />

      {loading && <div className="flex justify-center py-12"><Spinner size={10} /></div>}

      {!loading && (
        <>
          {/* Balance */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Balance</p>
            <p className={`text-5xl font-bold font-mono ${totals.balance >= 0 ? "text-brand-green" : "text-brand-red"}`}>
              {fmt(totals.balance)}
            </p>
          </div>

          {/* Pills — Income / Expenses / Invested */}
          <SummaryPills income={totals.income} expense={totals.expense} investment={totals.investment} currency={currency} />

          {/* Summary bars (like mobile) */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Summary</h2>
            {[
              { label: "💰 Income",   val: totals.income,     color: "#1D9E75" },
              { label: "💳 Expenses", val: totals.expense,    color: "#D85A30" },
              ...(totals.investment > 0
                ? [{ label: "📈 Invested", val: totals.investment, color: "#378ADD" }]
                : []),
            ].map(({ label, val, color }) => (
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
            ))}
          </div>

          {/* Expense breakdown — Needs vs Wants */}
          {totals.expense > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Expense breakdown</h2>
              <NecessityBreakdown needs={necessityTotals.needs} wants={necessityTotals.wants} total={totals.expense} currency={currency} />
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

          {entries.length === 0 && (
            <p className="text-center text-gray-400 py-8">No transactions this month.</p>
          )}
        </>
      )}
    </div>
  );
}
