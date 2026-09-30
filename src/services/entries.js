import { authRequest } from "./auth.js";
import { logger } from "../utils/logger.js";

/**
 * Returns YYYY-MM strings for months that have at least one entry.
 * Cheap endpoint — only date keys, no entry payloads.
 * @param {boolean} household
 * @param {number} limit  0 = all months; >0 = only the N most-recent months
 */
export function listActiveMonths(household = false, limit = 0) {
  const params = new URLSearchParams();
  if (household) params.set("household", "true");
  if (limit > 0) params.set("limit", String(limit));
  const qs = params.toString();
  logger.info('entries', `listActiveMonths (household=${household}, limit=${limit})`);
  return authRequest(`/api/entries/months${qs ? "?" + qs : ""}`);
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
