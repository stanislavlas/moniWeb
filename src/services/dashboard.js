import { authRequest } from "./auth.js";

export function getDashboard(yearMonth, household = false) {
  const params = new URLSearchParams();
  if (yearMonth) params.set("yearMonth", yearMonth);
  if (household) params.set("household", "true");
  const qs = params.toString();
  return authRequest(`/api/dashboard${qs ? "?" + qs : ""}`);
}
