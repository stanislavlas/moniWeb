import { authRequest } from "./auth.js";

export function listEntries(yearMonth = null, household = false) {
  const params = new URLSearchParams();
  if (yearMonth) params.set("yearMonth", yearMonth);
  if (household) params.set("household", "true");
  const qs = params.toString();
  return authRequest(`/api/entries${qs ? "?" + qs : ""}`);
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
