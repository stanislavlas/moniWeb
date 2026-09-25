import { authRequest } from "./auth.js";
import { logger } from "../utils/logger.js";

/**
 * Returns YYYY-MM strings for months that have at least one entry.
 * Cheap endpoint — only date keys, no entry payloads.
 */
export function listActiveMonths(household = false) {
  const qs = household ? "?household=true" : "";
  logger.info('entries', `listActiveMonths (household=${household})`);
  return authRequest(`/api/entries/months${qs}`);
}

export function listActiveYears(household = false) {
  const qs = household ? "?household=true" : "";
  logger.info('entries', `listActiveYears (household=${household})`);
  return authRequest(`/api/entries/years${qs}`);
}

export function listEntries(yearMonth = null, household = false) {
  const params = new URLSearchParams();
  if (yearMonth) params.set("yearMonth", yearMonth);
  if (household) params.set("household", "true");
  const qs = params.toString();
  logger.info('entries', `listEntries (yearMonth=${yearMonth}, household=${household})`);
  return authRequest(`/api/entries${qs ? "?" + qs : ""}`);
}

export function listEntriesByYear(year, household = false) {
  const params = new URLSearchParams();
  params.set("year", String(year));
  if (household) params.set("household", "true");
  logger.info('entries', `listEntriesByYear (year=${year}, household=${household})`);
  return authRequest(`/api/entries?${params.toString()}`);
}

export function createEntry(entry) {
  logger.info('entries', 'createEntry', { type: entry.type, date: entry.date });
  return authRequest("/api/entries", { method: "POST", body: JSON.stringify(entry) });
}

export function updateEntry(id, entry) {
  logger.info('entries', `updateEntry: ${id}`);
  return authRequest(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(entry) });
}

export function deleteEntry(id) {
  logger.warn('entries', `deleteEntry: ${id}`);
  return authRequest(`/api/entries/${id}`, { method: "DELETE" });
}
