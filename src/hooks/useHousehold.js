import { useState, useCallback } from "react";
import { logger } from "../utils/logger.js";
import {
  createHousehold as apiCreate,
  getHousehold as apiGet,
  removeMember as apiRemoveMember,
  leaveHousehold as apiLeave,
  deleteHousehold as apiDelete,
  renameHousehold as apiRename,
  sendInvitation as apiSendInvitation,
  getPendingInvitations as apiGetPending,
  getSentInvitations as apiGetSent,
  acceptInvitation as apiAccept,
  rejectInvitation as apiReject,
  cancelInvitation as apiCancel,
} from "../services/household.js";

export function useHousehold() {
  const [household, setHousehold]        = useState(null);
  const [loading, setLoading]            = useState(false);
  const [loaded, setLoaded]              = useState(false);
  const [error, setError]                = useState(null);
  const [pendingInvitations, setPending] = useState([]);
  const [sentInvitations, setSent]       = useState([]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [data, pending] = await Promise.all([apiGet(), apiGetPending().catch(() => [])]);
      setHousehold(data ?? null);
      setPending(pending ?? []);
      logger.info('household', `load success: household=${data?.name ?? 'none'}, pending=${(pending ?? []).length}`);
    } catch (e) {
      logger.error('household', 'load error', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  const loadSentInvitations = useCallback(async () => {
    try {
      const data = await apiGetSent();
      setSent(data ?? []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const create = useCallback(async (name) => {
    setLoading(true); setError(null);
    try {
      const data = await apiCreate(name);
      setHousehold(data);
      logger.info('household', `create success: ${data?.name}`);
      return data;
    } catch (e) {
      logger.error('household', 'create error', e.message);
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendInvitation = useCallback(async (email) => {
    const data = await apiSendInvitation(email);
    setSent(prev => [data, ...prev]);
    return data;
  }, []);

  const acceptInvitation = useCallback(async (invitationId) => {
    const data = await apiAccept(invitationId);
    setPending(prev => prev.filter(i => i.invitationId !== invitationId));
    try {
      const hh = await apiGet();
      setHousehold(hh ?? null);
    } catch {
      // apiGet failed after acceptance — reload household via the full load function as fallback
      await load();
    }
    return data;
  }, [load]);

  const rejectInvitation = useCallback(async (invitationId) => {
    await apiReject(invitationId);
    setPending(prev => prev.filter(i => i.invitationId !== invitationId));
  }, []);

  const cancelInvitation = useCallback(async (invitationId) => {
    await apiCancel(invitationId);
    setSent(prev => prev.filter(i => i.invitationId !== invitationId));
    // Refresh from server to ensure state is authoritative
    const fresh = await apiGetSent().catch(() => null);
    if (fresh) setSent(fresh);
  }, []);

  const removeMember = useCallback(async (uid) => {
    await apiRemoveMember(uid);
    setHousehold(prev => prev ? { ...prev, members: prev.members.filter(m => m.userId !== uid) } : prev);
  }, []);

  const leave = useCallback(async () => {
    logger.warn('household', 'leave household');
    await apiLeave();
    setHousehold(null);
  }, []);

  const deleteHousehold = useCallback(async () => {
    logger.warn('household', 'delete household');
    await apiDelete();
    setHousehold(null);
  }, []);

  const rename = useCallback(async (name) => {
    const data = await apiRename(name);
    setHousehold(prev => prev ? { ...prev, name: data?.name ?? name } : prev);
  }, []);

  return {
    household, loading, loaded, error,
    pendingInvitations, sentInvitations,
    load, loadSentInvitations,
    create, sendInvitation,
    acceptInvitation, rejectInvitation, cancelInvitation,
    removeMember, leave, deleteHousehold, rename,
  };
}
