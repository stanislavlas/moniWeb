import { formatCurrency } from "../utils/money.js";

/**
 * Two-column Necessary / Optional expense card.
 * Props: { necessary, optional, total, currency }
 */
export function NecessityBreakdown({ necessary, optional, total, currency }) {
  const fmt = (v) => formatCurrency(v, currency);
  const necessaryPct = total > 0 ? Math.round((necessary / total) * 100) : 0;
  const optionalPct  = total > 0 ? Math.round((optional  / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-redLight dark:bg-brand-redDark/20 rounded-2xl border border-brand-red/20 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-brand-redDark uppercase tracking-wide">🔒 Necessary</p>
            <span className="text-xs font-semibold text-brand-red">{necessaryPct}%</span>
          </div>
          <p className="text-xl font-bold font-mono text-brand-redDark">{fmt(necessary)}</p>
        </div>
        <div className="bg-brand-amberLight dark:bg-brand-amberDark/20 rounded-2xl border border-brand-amber/20 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-brand-amberDark uppercase tracking-wide">✂️ Optional</p>
            <span className="text-xs font-semibold text-brand-amber">{optionalPct}%</span>
          </div>
          <p className="text-xl font-bold font-mono text-brand-amberDark">{fmt(optional)}</p>
        </div>
      </div>
      {(necessary + optional) > 0 && (
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden flex">
          <div className="bg-brand-red opacity-80" style={{ flex: necessary }} />
          <div className="bg-brand-amber opacity-80" style={{ flex: optional }} />
        </div>
      )}
    </div>
  );
}
