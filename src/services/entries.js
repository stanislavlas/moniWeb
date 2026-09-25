import { authRequest } from "./auth.js";

/**
 * Returns YYYY-MM strings for months that have at least one entry.
 * Cheap endpoint — only date keys, no entry payloads.
 */
export function listActiveMonths(household = false) {
  const qs = household ? "?household=true" : "";
  return authRequest(`/api/entries/months${qs}`);
}

/**
 * Returns distinct years (numbers) that have at least one entry.
 * Cheap endpoint — only year values, no entry payloads.
 */
export function listActiveYears(household = false) {
  const qs = household ? "?household=true" : "";
  return authRequest(`/api/entries/years${qs}`);
}

export function listEntries(yearMonth = null, household = false) {
  const params = new URLSearchParams();
  if (yearMonth) params.set("yearMonth", yearMonth);
  if (household) params.set("household", "true");
  const qs = params.toString();
  return authRequest(`/api/entries${qs ? "?" + qs : ""}`);
}

export function listEntriesByYear(year, household = false) {
  const params = new URLSearchParams();
  params.set("year", String(year));
  if (household) params.set("household", "true");
  return authRequest(`/api/entries?${params.toString()}`);
}

export function createEntry(entry) {
  return authRequest("/api/entries", { method: "POST", body: JSON.stringify(entry) });
}

export function updateEntry(id, entry) {
  return authRequest(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(entry) });
}

export function deleteEntry(id) {
  return authRequest(`/api/entries/${id}`, { method: "DELETE" });
}
