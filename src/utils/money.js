/**
 * Shared money utilities for moniWeb.
 * Centralises amount extraction, currency formatting, and month label constants
 * that were previously duplicated across MonthOverviewPage, YearOverviewPage, and HistoryPage.
 */

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Returns YYYY-MM strings for the last [n] months ending today, newest first.
 * Used to seed the month scroller before the API responds.
 * Uses UTC month/year to stay consistent with filterMonth (which uses toISOString).
 */
export function recentMonths(n = 3) {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth(); // 0-indexed
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(utcYear, utcMonth - i, 1));
    return d.toISOString().slice(0, 7);
  });
}

/**
 * Extract a plain numeric value from an entry's `amount` field.
 * The API can return either a plain number or an `{ value, currency }` object.
 */
export function getAmount(entry) {
  return parseFloat(entry.amount?.value ?? entry.amount ?? 0);
}

/**
 * Format a numeric value as a locale-sensitive currency string.
 * Falls back to EUR when no currency is supplied.
 * Formatters are cached by currency code to avoid recreating Intl.NumberFormat
 * on every render call — construction is expensive.
 */
const _formatters = {};
export function formatCurrency(value, currency = "EUR") {
  if (!_formatters[currency]) {
    _formatters[currency] = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  }
  return _formatters[currency].format(value);
}

/** Sum income, expense, and investment totals from a list of entries. */
export function sumEntriesByType(entries) {
  return {
    income:     entries.filter(e => e.type === "INCOME")    .reduce((s, e) => s + getAmount(e), 0),
    expense:    entries.filter(e => e.type === "EXPENSE")   .reduce((s, e) => s + getAmount(e), 0),
    investment: entries.filter(e => e.type === "INVESTMENT").reduce((s, e) => s + getAmount(e), 0),
  };
}

/** Sum necessary/optional expense totals from a list of entries. */
export function sumNecessity(entries) {
  const exp = entries.filter(e => e.type === "EXPENSE");
  return {
    necessary: exp.filter(e => e.necessity === "NECESSARY" || e.necessity === "NEED").reduce((s, e) => s + getAmount(e), 0),
    optional:  exp.filter(e => e.necessity === "OPTIONAL"  || e.necessity === "WANT").reduce((s, e) => s + getAmount(e), 0),
  };
}

/**
 * Format a YYYY-MM string as a human-readable month label, e.g. "Jan 2025".
 * Eliminates the repeated split+index pattern across MonthOverviewPage, HistoryPage, and YearOverviewPage.
 */
export function formatYearMonth(ym) {
  const [y, m] = ym.split("-");
  return `${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}`;
}

/**
 * Normalise an API necessity string to lowercase UI form ("necessary" | "optional").
 * Accepts both the new values (NECESSARY/OPTIONAL) and legacy (NEED/WANT) that may
 * still be present in cached client data.
 */
export function fromApiNecessity(value) {
  if (value === "NECESSARY" || value === "NEED") return "necessary";
  if (value === "OPTIONAL"  || value === "WANT") return "optional";
  return "necessary"; // default
}

