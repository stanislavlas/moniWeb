import { formatCurrency } from "../utils/money.js";

/**
 * Necessary / Optional expense breakdown as summary bars.
 * Props: { necessary, optional, total, currency }
 */
export function NecessityBreakdown({ necessary, optional, total, currency }) {
  const fmt = (v) => formatCurrency(v, currency);
  const barMax = Math.max(necessary, optional, 1);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Expense breakdown</h2>
      {[
        { label: "🔒 Necessary", val: necessary, color: "#D85A30" },
        { label: "✂️ Optional",  val: optional,  color: "#EF9F27" },
      ].map(({ label, val, color }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{fmt(val)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(val / barMax) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
