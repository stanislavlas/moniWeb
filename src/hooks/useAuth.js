import { useState, useEffect, useCallback } from "react";
import { useAsyncAction } from "./useAsyncAction.js";
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
  const [pendingRegistration, setPending] = useState(null); // { email, ... }

  const { loading, error, run: withLoading, clearError } = useAsyncAction();

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setReady(true);
  }, []);

  // Auto-logout when any authRequest detects an expired/invalid session
  useEffect(() => {
    function handleExpired() { setUser(null); }
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      await withLoading(async () => {
        const u = await apiLogin(credentials);
        setUser(u);
      });
    } catch { /* error already stored in state */ }
  }, [withLoading]);

  const register = useCallback(async (data) => {
    try {
      await withLoading(async () => {
        const result = await apiRegister(data);
        setPending({ email: data.email, ...result });
      });
    } catch { /* error already stored in state */ }
  }, [withLoading]);

  const verifyRegistration = useCallback(async (code) => {
    try {
      await withLoading(async () => {
        const u = await apiVerify(code);
        setUser(u);
        setPending(null);
      });
    } catch { /* error already stored in state */ }
  }, [withLoading]);

  const resendRegistrationCode = useCallback(async (email) => {
    try {
      await withLoading(() => apiResend(email));
    } catch { /* error already stored in state */ }
  }, [withLoading]);

  const cancelRegistrationVerification = useCallback(() => setPending(null), []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async (password) => {
    try {
      await withLoading(async () => {
        await apiDelete(password);
        setUser(null);
      });
    } catch { /* error already stored in state */ }
  }, [withLoading]);

  const changePassword = useCallback(async (data) => {
    return withLoading(() => apiChangePassword(data));
  }, [withLoading]);

  const updateProfile = useCallback(async (patch) => {
    return withLoading(async () => {
      const updated = await apiUpdateProfile(patch);
      setUser(updated);
      return updated;
    });
  }, [withLoading]);

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
