import { authRequest } from "./auth.js";

export function createHousehold(name) {
  return authRequest("/api/households", { method: "POST", body: JSON.stringify({ name }) });
}

export function getHousehold() {
  return authRequest("/api/households");
}

export function removeMember(uid) {
  return authRequest(`/api/households/members/${uid}`, { method: "DELETE" });
}

export function leaveHousehold() {
  return authRequest("/api/households/leave", { method: "POST" });
}

export function deleteHousehold() {
  return authRequest("/api/households", { method: "DELETE" });
}

export function renameHousehold(name) {
  return authRequest("/api/households", { method: "PUT", body: JSON.stringify({ name }) });
}

export function sendInvitation(email) {
  return authRequest("/api/households/invitations", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getPendingInvitations() {
  return authRequest("/api/households/invitations");
}

export function getSentInvitations() {
  return authRequest("/api/households/invitations/sent");
}

export function acceptInvitation(invitationId) {
  return authRequest(`/api/households/invitations/${invitationId}/accept`, { method: "POST" });
}

export function rejectInvitation(invitationId) {
  return authRequest(`/api/households/invitations/${invitationId}/reject`, { method: "POST" });
}

export function cancelInvitation(invitationId) {
  return authRequest(`/api/households/invitations/${invitationId}`, { method: "DELETE" });
}
