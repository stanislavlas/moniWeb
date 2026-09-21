import { useState, useEffect, useCallback } from "react";
import {
  getStoredUser,
  login as apiLogin,
  register as apiRegister,
  verifyRegistration as apiVerify,
  resendVerificationCode as apiResend,
  logout as apiLogout,
  deleteAccount as apiDelete,
  changePassword as apiChangePassword,
  updateProfile as apiUpdateProfile,
} from "../services/auth.js";

export function useAuth() {
  const [user, setUser]                   = useState(null);
  const [ready, setReady]                 = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [pendingRegistration, setPending] = useState(null); // { email, ... }

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setReady(true);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (credentials) => {
    setLoading(true); setError(null);
    try {
      const u = await apiLogin(credentials);
      setUser(u);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const result = await apiRegister(data);
      setPending({ email: data.email, ...result });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyRegistration = useCallback(async (code) => {
    setLoading(true); setError(null);
    try {
      const u = await apiVerify(code);
      setUser(u);
      setPending(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const resendRegistrationCode = useCallback(async (email) => {
    setLoading(true); setError(null);
    try {
      await apiResend(email);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelRegistrationVerification = useCallback(() => setPending(null), []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async (password) => {
    setLoading(true); setError(null);
    try {
      await apiDelete(password);
      setUser(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      await apiChangePassword(data);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (patch) => {
    setLoading(true); setError(null);
    try {
      const updated = await apiUpdateProfile(patch);
      setUser(updated);
      return updated;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    ready,
    loading,
    error,
    clearError,
    login,
    register,
    verifyRegistration,
    resendRegistrationCode,
    cancelRegistrationVerification,
    logout,
    deleteAccount,
    changePassword,
    updateProfile,
    pendingRegistration,
  };
}
