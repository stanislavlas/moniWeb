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
    needs: exp.filter(e => e.necessity === "NEED").reduce((s, e) => s + getAmount(e), 0),
    wants: exp.filter(e => e.necessity === "WANT").reduce((s, e) => s + getAmount(e), 0),
  };
}

/**
 * Normalise an API or UI necessity string to the UI format used in forms.
 * API format: "NEED" | "WANT"
 * UI format:  "necessary" | "optional"
 */
export function fromApiNecessity(value) {
  if (value === "NEED" || value === "necessary") return "necessary";
  if (value === "WANT" || value === "optional")  return "optional";
  return "necessary"; // default
}

