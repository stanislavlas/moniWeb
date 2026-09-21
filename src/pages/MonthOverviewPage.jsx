import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useDashboard } from "../hooks/useDashboard.js";
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

function SummaryCard({ label, value, color }) {
  const styles = {
    green: { bg: "bg-brand-greenLight", text: "text-brand-green" },
    red:   { bg: "bg-brand-redLight",   text: "text-brand-red"   },
    blue:  { bg: "bg-brand-blueLight",  text: "text-brand-blue"  },
  }[color] ?? { bg: "bg-gray-100", text: "text-gray-700" };

  return (
    <div className={`${styles.bg} rounded-2xl p-4`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold ${styles.text}`}>€{(value ?? 0).toFixed(2)}</p>
    </div>
  );
}

export function MonthOverviewPage() {
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { data, loading, error, load } = useDashboard();

  useEffect(() => { load(filterMonth); }, [filterMonth, load]);

  const months = buildMonths();
  const [year, month] = filterMonth.split("-");
  const monthLabel = `${MONTHS[parseInt(month, 10) - 1]} ${year}`;

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

      {!loading && data && (
        <>
          {/* Summary pills */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="Income"   value={data.totalIncome}   color="green" />
            <SummaryCard label="Expenses" value={data.totalExpenses} color="red"   />
            <SummaryCard
              label="Balance"
              value={(data.totalIncome ?? 0) - (data.totalExpenses ?? 0)}
              color="blue"
            />
          </div>

          {/* Category breakdown bar chart */}
          {data.categoryBreakdown?.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">By Category</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.categoryBreakdown} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `€${Number(v).toFixed(2)}`} />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                    {data.categoryBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.type === "income" ? "#1D9E75" : "#D85A30"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Necessity vs. want */}
          {data.necessityBreakdown && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Necessity</p>
                <p className="text-xl font-bold text-brand-green">€{(data.necessityBreakdown.necessity ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Want</p>
                <p className="text-xl font-bold text-brand-amber">€{(data.necessityBreakdown.want ?? 0).toFixed(2)}</p>
              </div>
            </div>
          )}

          {!data.categoryBreakdown?.length && !data.necessityBreakdown && (
            <p className="text-center text-gray-400 py-8">No data for this month.</p>
          )}
        </>
      )}

      {!loading && !data && !error && (
        <p className="text-center text-gray-400 py-8">No data for this month.</p>
      )}
    </div>
  );
}
