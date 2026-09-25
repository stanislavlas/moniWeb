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
 */
export function formatCurrency(value, currency = "EUR") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
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
 * Normalise an API necessity string to lowercase UI form ("necessary" | "optional").
 * Accepts both the new values (NECESSARY/OPTIONAL) and legacy (NEED/WANT) that may
 * still be present in cached client data.
 */
export function fromApiNecessity(value) {
  if (value === "NECESSARY" || value === "NEED") return "necessary";
  if (value === "OPTIONAL"  || value === "WANT") return "optional";
  return "necessary"; // default
}

