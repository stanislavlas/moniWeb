import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { listEntries } from "../services/entries.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function amt(entry) {
  return parseFloat(entry.amount?.value ?? entry.amount ?? 0);
}

export function YearOverviewPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear]           = useState(currentYear);
  const [monthlyData, setMonthly] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    async function loadYear() {
      setLoading(true); setError(null);
      try {
        const results = await Promise.all(
          Array.from({ length: 12 }, (_, i) => {
            const ym = `${year}-${String(i + 1).padStart(2, "0")}`;
            return listEntries(ym).catch(() => []);
          })
        );
        setMonthly(
          results.map((entries, i) => ({
            month:    MONTHS_SHORT[i],
            income:   entries.filter(e => e.type === "INCOME")   .reduce((s, e) => s + amt(e), 0),
            expenses: entries.filter(e => e.type === "EXPENSE")  .reduce((s, e) => s + amt(e), 0),
          }))
        );
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadYear();
  }, [year]);

  const totalIncome   = monthlyData.reduce((s, m) => s + m.income,   0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{year} Overview</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setYear(y => y - 1)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-800 text-sm font-medium hover:bg-gray-200"
          >
            ←
          </button>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-800 text-sm font-medium hover:bg-gray-200 disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>

      <FeedbackBanner message={error} type="error" />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-greenLight rounded-2xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Income</p>
          <p className="text-xl font-bold text-brand-green">€{totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-brand-redLight rounded-2xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Expenses</p>
          <p className="text-xl font-bold text-brand-red">€{totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={10} /></div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Monthly Breakdown</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `€${Number(v).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="income"   name="Income"   fill="#1D9E75" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#D85A30" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
