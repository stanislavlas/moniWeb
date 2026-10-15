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
 * }>}
 */
export function getDashboard(fromDate, toDate, household = false) {
  const params = new URLSearchParams({ fromDate, toDate });
  if (household) params.set("household", "true");
  logger.info("dashboard", `getDashboard (${fromDate} → ${toDate}, household=${household})`);
  return authRequest(`/api/dashboard?${params.toString()}`);
}

/**
 * Fetch a range-based dashboard with totals and monthly averages.
 *
 * @param {string}  fromDate  - YYYY-MM-DD (first day of range, inclusive)
 * @param {string}  toDate    - YYYY-MM-DD (last day of range, inclusive)
 * @param {boolean} household - when true, returns household-scoped data; omit to default false
 */
export function getRangeDashboard(fromDate, toDate, household = false) {
  const params = new URLSearchParams({ fromDate, toDate });
  if (household) params.set("household", "true");
  logger.info("dashboard", `getRangeDashboard (${fromDate} → ${toDate}, household=${household})`);
  return authRequest(`/api/dashboard/year?${params.toString()}`);
}
