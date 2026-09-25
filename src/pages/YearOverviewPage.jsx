import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { listEntriesByYear, listActiveYears } from "../services/entries.js";
import { entryEvents } from "../utils/entryEvents.js";
import { useCategories } from "../hooks/useCategories.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { NecessityBreakdown } from "../components/NecessityBreakdown.jsx";
import { SummaryPills } from "../components/SummaryPills.jsx";
import { MONTHS_SHORT, getAmount, formatCurrency, sumNecessity } from "../utils/money.js";

export function YearOverviewPage({ user, showHousehold = false }) {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-indexed
  const currency = user?.currency ?? "EUR";

  const [year, setYear]                   = useState(currentYear);
  const [selectedMonthIndex, setMonth]    = useState(currentMonthIndex);
  // Cache: { [year]: { entries, loading, error } }
  const [yearCache, setYearCache]         = useState({});
  // Seed with current year; replaced by API response
  const [activeYears, setActiveYears]     = useState([currentYear]);
  // Tracks years already fetched or in-flight — avoids dep on yearCache inside fetchYear
  const fetchedYears                      = useRef(new Set());

  const { categories, load: loadCats, colorMap } = useCategories();
  useEffect(() => { loadCats(); }, [loadCats]);

  // Fetch the distinct years that have data; always include current year
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

  // Fetch entries for the selected year on demand — stable callback, no yearCache dep
  const fetchYear = useCallback(async (y) => {
    if (fetchedYears.current.has(y)) return; // already fetched or in-flight
    fetchedYears.current.add(y);
    setYearCache(prev => ({ ...prev, [y]: { entries: [], loading: true, error: null } }));
    try {
      const data = await listEntriesByYear(y, showHousehold);
      setYearCache(prev => ({ ...prev, [y]: { entries: Array.isArray(data) ? data : [], loading: false, error: null } }));
    } catch (err) {
      fetchedYears.current.delete(y); // allow retry on error
      setYearCache(prev => ({ ...prev, [y]: { entries: [], loading: false, error: err.message } }));
    }
  }, [showHousehold]);

  useEffect(() => { fetchYear(year); }, [year, fetchYear]);

  // Invalidate a year's cache when an entry in that year is mutated
  useEffect(() => {
    return entryEvents.subscribe(date => {
      if (!date) return;
      const affectedYear = parseInt(date.slice(0, 4), 10);
      fetchedYears.current.delete(affectedYear);
      setYearCache(prev => {
        if (!prev[affectedYear]) return prev;
        const next = { ...prev };
        delete next[affectedYear];
        return next;
      });
      // Ensure the year appears in the scroller if it wasn't there
      setActiveYears(prev =>
        prev.includes(affectedYear) ? prev : [...prev, affectedYear].sort((a, b) => b - a)
      );
    });
  }, []);

  // Reset everything when household toggle changes
  useEffect(() => {
    setYearCache({});
    setActiveYears([currentYear]);
    fetchedYears.current = new Set();
  }, [showHousehold, currentYear]);

  const currentYearData = yearCache[year] ?? { entries: [], loading: true, error: null };
  const allEntries = currentYearData.entries;
  const allEntriesLoading = currentYearData.loading;
  const error = currentYearData.error;

  // Derive monthly breakdown from cached entries — no extra requests
  const monthlyData = useMemo(() => (
    Array.from({ length: 12 }, (_, i) => {
      const mo = String(i + 1).padStart(2, "0");
      const ym = `${year}-${mo}`;
      const monthEntries = allEntries.filter(e => e.date?.startsWith(ym));
      return {
        month:    MONTHS_SHORT[i],
        index:    i,
        income:   monthEntries.filter(e => e.type === "INCOME")    .reduce((s, e) => s + getAmount(e), 0),
        expenses: monthEntries.filter(e => e.type === "EXPENSE")   .reduce((s, e) => s + getAmount(e), 0),
        invested: monthEntries.filter(e => e.type === "INVESTMENT").reduce((s, e) => s + getAmount(e), 0),
        entries:  monthEntries,
      };
    })
  ), [year, allEntries]);

  // Annual totals
  const yearTotals = useMemo(() => ({
    income:   monthlyData.reduce((s, m) => s + m.income,   0),
    expenses: monthlyData.reduce((s, m) => s + m.expenses, 0),
    invested: monthlyData.reduce((s, m) => s + m.invested, 0),
  }), [monthlyData]);

  const yearBalance = yearTotals.income - yearTotals.expenses - yearTotals.invested;

  const yearNecessity = useMemo(() => sumNecessity(monthlyData.flatMap(m => m.entries)), [monthlyData]);

  const barMax = useMemo(() =>
    Math.max(...monthlyData.map(m => Math.max(m.income, m.expenses, m.invested)), 1),
  [monthlyData]);

  const selData = monthlyData[selectedMonthIndex] ?? null;
  const selEntries = selData?.entries ?? [];
  const selNecessity = useMemo(() => sumNecessity(selEntries), [selEntries]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6">

      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Year Overview</p>
        <h1 className="text-xl font-bold">{year}</h1>
      </div>

      {/* Year scroller */}
      <div className="overflow-x-auto no-scrollbar pb-1">
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

      {/* Annual balance */}
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
          <NecessityBreakdown necessary={yearNecessity.necessary} optional={yearNecessity.optional} total={yearTotals.expenses} currency={currency} />
        </div>
      )}

      {allEntriesLoading ? (
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
                  (selData.income - selData.expenses - selData.invested) >= 0 ? "text-brand-green" : "text-brand-red"
                }`}>
                  {formatCurrency(selData.income - selData.expenses - selData.invested, currency)}
                </p>
              </div>

              <SummaryPills income={selData.income} expense={selData.expenses} investment={selData.invested} currency={currency} />

              {selData.expenses > 0 && (
                <NecessityBreakdown necessary={selNecessity.necessary} optional={selNecessity.optional} total={selData.expenses} currency={currency} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
