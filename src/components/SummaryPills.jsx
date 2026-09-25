import { formatCurrency } from "../utils/money.js";

/**
 * 3-column Income / Expenses / Invested pill grid.
 * Props: { income, expense, investment, currency }
 */
export function SummaryPills({ income, expense, investment, currency }) {
  const fmt = (v) => formatCurrency(v, currency);
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <div className="bg-brand-greenLight dark:bg-brand-greenDark/20 rounded-2xl p-3 sm:p-4 min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1 truncate">Income</p>
        <p className="text-sm sm:text-base font-bold font-mono text-brand-green truncate">{fmt(income)}</p>
      </div>
      <div className="bg-brand-redLight dark:bg-brand-redDark/20 rounded-2xl p-3 sm:p-4 min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1 truncate">Expenses</p>
        <p className="text-sm sm:text-base font-bold font-mono text-brand-red truncate">{fmt(expense)}</p>
      </div>
      <div className="bg-brand-amberLight dark:bg-brand-amberDark/20 rounded-2xl p-3 sm:p-4 min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1 truncate">Invested</p>
        <p className="text-sm sm:text-base font-bold font-mono text-brand-amber truncate">{fmt(investment)}</p>
      </div>
    </div>
  );
}

