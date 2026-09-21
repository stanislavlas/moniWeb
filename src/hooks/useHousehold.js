import { useState, useCallback } from "react";
import {
  createHousehold as apiCreate,
  getHousehold as apiGet,
  addMember as apiAddMember,
  removeMember as apiRemoveMember,
} from "../services/household.js";

export function useHousehold() {
  const [household, setHousehold] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async (id) => {
    setLoading(true); setError(null);
    try {
      const data = await apiGet(id);
      setHousehold(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (name) => {
    setLoading(true); setError(null);
    try {
      const data = await apiCreate(name);
      setHousehold(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (householdId, inviteCode) => {
    const data = await apiAddMember(householdId, inviteCode);
    setHousehold(data);
    return data;
  }, []);

  const removeMember = useCallback(async (householdId, uid) => {
    await apiRemoveMember(householdId, uid);
    setHousehold(prev => prev ? {
      ...prev,
      members: prev.members.filter(m => m.userId !== uid),
    } : prev);
  }, []);

  return { household, loading, error, load, create, addMember, removeMember };
}
