import { authRequest } from "./auth.js";
import { logger } from "../utils/logger.js";

export function createHousehold(name) {
  logger.info('household', 'createHousehold called', { name });
  return authRequest("/api/households", { method: "POST", body: JSON.stringify({ name }) });
}

export function getHousehold() {
  logger.info('household', 'getHousehold called');
  return authRequest("/api/households");
}

export function removeMember(uid) {
  logger.warn('household', `removeMember: ${uid}`);
  return authRequest(`/api/households/members/${uid}`, { method: "DELETE" });
}

export function leaveHousehold() {
  logger.warn('household', 'leaveHousehold called');
  return authRequest("/api/households/leave", { method: "POST" });
}

export function deleteHousehold() {
  logger.warn('household', 'deleteHousehold called');
  return authRequest("/api/households", { method: "DELETE" });
}

export function renameHousehold(name) {
  logger.info('household', 'renameHousehold called', { name });
  return authRequest("/api/households", { method: "PUT", body: JSON.stringify({ name }) });
}

export function sendInvitation(email) {
  logger.info('household', 'sendInvitation called', { email });
  return authRequest("/api/households/invitations", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getPendingInvitations() {
  logger.info('household', 'getPendingInvitations called');
  return authRequest("/api/households/invitations");
}

export function getSentInvitations() {
  logger.info('household', 'getSentInvitations called');
  return authRequest("/api/households/invitations/sent");
}

export function acceptInvitation(invitationId) {
  logger.info('household', `acceptInvitation: ${invitationId}`);
  return authRequest(`/api/households/invitations/${invitationId}/accept`, { method: "POST" });
}

export function rejectInvitation(invitationId) {
  logger.info('household', `rejectInvitation: ${invitationId}`);
  return authRequest(`/api/households/invitations/${invitationId}/reject`, { method: "POST" });
}

export function cancelInvitation(invitationId) {
  logger.info('household', `cancelInvitation: ${invitationId}`);
  return authRequest(`/api/households/invitations/${invitationId}`, { method: "DELETE" });
}
