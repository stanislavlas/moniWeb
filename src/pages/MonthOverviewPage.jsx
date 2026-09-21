import { useEffect, useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useEntries } from "../hooks/useEntries.js";
import { useCategories } from "../hooks/useCategories.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildMonths() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });
}

function amt(entry) {
  // entry.amount is { value: string|number, currency: string }
  return parseFloat(entry.amount?.value ?? entry.amount ?? 0);
}

function SummaryCard({ label, value, color }) {
  const styles = {
    green: { bg: "bg-brand-greenLight", text: "text-brand-green" },
    red:   { bg: "bg-brand-redLight",   text: "text-brand-red"   },
    blue:  { bg: "bg-brand-blueLight",  text: "text-brand-blue"  },
    amber: { bg: "bg-brand-amberLight", text: "text-brand-amber" },
  }[color] ?? { bg: "bg-gray-100", text: "text-gray-700" };

  return (
    <div className={`${styles.bg} rounded-2xl p-4`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold ${styles.text}`}>€{Number(value).toFixed(2)}</p>
    </div>
  );
}

export function MonthOverviewPage() {
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { entries, loading, error, load } = useEntries();
  const { categories, load: loadCats } = useCategories();

  useEffect(() => { load(filterMonth); }, [filterMonth, load]);
  useEffect(() => { loadCats(); }, [loadCats]);

  const months = buildMonths();
  const [year, month] = filterMonth.split("-");
  const monthLabel = `${MONTHS[parseInt(month, 10) - 1]} ${year}`;

  // Compute totals client-side (mirrors mobile MonthOverviewScreen)
  const totals = useMemo(() => {
    const income     = entries.filter(e => e.type === "INCOME")    .reduce((s, e) => s + amt(e), 0);
    const expense    = entries.filter(e => e.type === "EXPENSE")   .reduce((s, e) => s + amt(e), 0);
    const investment = entries.filter(e => e.type === "INVESTMENT").reduce((s, e) => s + amt(e), 0);
    return { income, expense, investment, balance: income - expense - investment };
  }, [entries]);

  // Needs vs wants
  const necessityTotals = useMemo(() => {
    const expenses = entries.filter(e => e.type === "EXPENSE");
    const needs = expenses.filter(e => e.necessity === "NEED") .reduce((s, e) => s + amt(e), 0);
    const wants = expenses.filter(e => e.necessity === "WANT") .reduce((s, e) => s + amt(e), 0);
    return { needs, wants };
  }, [entries]);

  // Category breakdown
  const catBreakdown = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const id = e.categoryId;
      if (!id) return;
      map[id] = (map[id] || 0) + amt(e);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([catId, total]) => {
        const cat = categories.find(c => c.categoryId === catId);
        return { name: cat ? `${cat.icon ?? ""} ${cat.name}`.trim() : catId.slice(0, 8), total };
      });
  }, [entries, categories]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{monthLabel}</h1>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm"
        >
          {months.map(m => {
            const [y, mo] = m.split("-");
            return <option key={m} value={m}>{MONTHS[parseInt(mo, 10) - 1]} {y}</option>;
          })}
        </select>
      </div>

      <FeedbackBanner message={error} type="error" />

      {loading && <div className="flex justify-center py-12"><Spinner size={10} /></div>}

      {!loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Income"     value={totals.income}     color="green" />
            <SummaryCard label="Expenses"   value={totals.expense}    color="red"   />
            <SummaryCard label="Balance"    value={totals.balance}    color="blue"  />
            {totals.investment > 0 && (
              <SummaryCard label="Invested" value={totals.investment} color="amber" />
            )}
          </div>

          {/* Needs vs Wants */}
          {totals.expense > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Needs</p>
                <p className="text-xl font-bold text-brand-green">€{necessityTotals.needs.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Wants</p>
                <p className="text-xl font-bold text-brand-amber">€{necessityTotals.wants.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Category bar chart */}
          {catBreakdown.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">By Category</h2>
              <ResponsiveContainer width="100%" height={Math.max(180, catBreakdown.length * 36)}>
                <BarChart data={catBreakdown} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `€${Number(v).toFixed(2)}`} />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#D85A30" />
                </BarChart>
              </ResponsiveContainer>
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
