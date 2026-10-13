import { authRequest } from "./auth.js";
import { logger } from "../utils/logger.js";

/**
 * Fetch dashboard aggregates for a date range.
 *
 * @param {string} fromDate  - YYYY-MM-DD (first day of range, inclusive)
 * @param {string} toDate    - YYYY-MM-DD (last day of range, inclusive)
 * @param {boolean} household - when true, returns household-scoped data
 *
 * @returns {Promise<{
 *   totalIncome:          { value: number, currency: string },
 *   totalExpenses:        { value: number, currency: string },
 *   totalInvestments:     { value: number, currency: string },
 *   savedAmount:          { value: number, currency: string },
 *   necessaryVsOptional:  { necessary: { value, currency }, optional: { value, currency } },
 *   expensesByCategory:   { [categoryId: string]: { value: number, currency: string } },
 *   memberBreakdown:      Array<{
 *     userId: string,
 *     name: string,
 *     totalIncome: { value: number, currency: string },
 *     totalExpenses: { value: number, currency: string },
 *     totalInvestments: { value: number, currency: string },
 *     savedAmount: { value: number, currency: string },
 *   }> | null,
 *   householdName:        string | null,
 * }>}
 */
export function getDashboard(fromDate, toDate, household = false) {
  const params = new URLSearchParams({ fromDate, toDate });
  if (household) params.set("household", "true");
  logger.info("dashboard", `getDashboard (${fromDate} → ${toDate}, household=${household})`);
  return authRequest(`/api/dashboard?${params.toString()}`);
}

/**
 * Fetch the last N calendar months of dashboard data in a single request.
 * Returns per-month summaries plus totals. Same shape as getYearDashboard.
 *
 * @param {number}  months    - number of recent months to include (default 12)
 * @param {boolean} household - when true, returns household-scoped data
 */
export function getRecentDashboard(months = 12, household = false) {
  const params = new URLSearchParams({ months: String(months) });
  if (household) params.set("household", "true");
  logger.info("dashboard", `getRecentDashboard (months=${months}, household=${household})`);
  return authRequest(`/api/dashboard/recent?${params.toString()}`);
}

/**
 * Fetch a full year of dashboard data in a single request.
 * Returns pre-split monthly summaries plus annual totals.
 *
 * @param {number}  year      - 4-digit year (e.g. 2026)
 * @param {boolean} household - when true, returns household-scoped data
 */
export function getYearDashboard(year, household = false) {
  const params = new URLSearchParams({ year: String(year) });
  if (household) params.set("household", "true");
  logger.info("dashboard", `getYearDashboard (year=${year}, household=${household})`);
  return authRequest(`/api/dashboard/year?${params.toString()}`);
}
