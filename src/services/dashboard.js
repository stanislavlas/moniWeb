import { authRequest } from "./auth.js";

/**
 * yearMonth: "YYYY-MM" string (e.g. "2026-09")
 * The API requires fromDate / toDate as full ISO dates (first and last day of the month).
 */
export function getDashboard(yearMonth, household = false) {
  const params = new URLSearchParams();

  if (yearMonth) {
    const [year, month] = yearMonth.split("-").map(Number);
    const fromDate = `${yearMonth}-01`;
    const lastDay  = new Date(year, month, 0).getDate(); // day 0 of next month = last day of this month
    const toDate   = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
    params.set("fromDate", fromDate);
    params.set("toDate",   toDate);
  }

  if (household) params.set("household", "true");
  const qs = params.toString();
  return authRequest(`/api/dashboard${qs ? "?" + qs : ""}`);
}
