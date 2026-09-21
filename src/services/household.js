import { authRequest } from "./auth.js";

export function createHousehold(name) {
  return authRequest("/api/households", { method: "POST", body: JSON.stringify({ name }) });
}

export function getHousehold(id) {
  return authRequest(`/api/households/${id}`);
}

export function addMember(householdId, inviteCode) {
  return authRequest(`/api/households/${householdId}/members`, {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

export function removeMember(householdId, uid) {
  return authRequest(`/api/households/${householdId}/members/${uid}`, { method: "DELETE" });
}
