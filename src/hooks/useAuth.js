import { useState, useEffect, useCallback } from "react";
import { useAsyncAction } from "./useAsyncAction.js";
import { logger } from "../utils/logger.js";
import {
  getStoredUser,
  getProfile as apiGetProfile,
  login as apiLogin,
  register as apiRegister,
  verifyRegistration as apiVerify,
  resendVerificationCode as apiResend,
  logout as apiLogout,
  deleteAccount as apiDelete,
  changePassword as apiChangePassword,
  updateProfile as apiUpdateProfile,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
} from "../services/auth.js";

export function useAuth() {
  const [user, setUser]                   = useState(null);
  const [ready, setReady]                 = useState(false);
  const [pendingRegistration, setPending] = useState(null); // { email, ... }

  const { loading, error, run: withLoading, clearError } = useAsyncAction();

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      logger.auth(`Session restored: ${stored.email}`);
      setUser(stored);
      // Fetch fresh profile in the background to sync any changes made on other devices
      apiGetProfile()
        .then((fresh) => setUser(fresh))
        .catch(() => {}); // Non-critical — cached value is still usable
    }
    setReady(true);
  }, []);

  // Auto-logout when any authRequest detects an expired/invalid session
  useEffect(() => {
    function handleExpired() {
      logger.warn('auth', 'Session expired — auto logout');
      setUser(null);
      setPending(null); // clear stale pending registration so OTP screen doesn't reappear
    }
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    await withLoading(async () => {
      const u = await apiLogin(credentials);
      setUser(u);
    });
  }, [withLoading]);

  const register = useCallback(async (data) => {
    await withLoading(async () => {
      const result = await apiRegister(data);
      setPending({ email: data.email, ...result });
    });
  }, [withLoading]);

  const verifyRegistration = useCallback(async (code) => {
    await withLoading(async () => {
      const u = await apiVerify(code);
      setUser(u);
      setPending(null);
    });
  }, [withLoading]);

  const resendRegistrationCode = useCallback(async (email) => {
    await withLoading(() => apiResend(email));
  }, [withLoading]);

  const cancelRegistrationVerification = useCallback(() => setPending(null), []);

  const logout = useCallback(async () => {
    logger.auth('Logout initiated');
    await apiLogout();
    setUser(null);
    setPending(null); // clear stale pending registration
  }, []);

  const deleteAccount = useCallback(async (password) => {
    await withLoading(async () => {
      await apiDelete(password);
      setUser(null);
    });
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

  // Re-fetch the user profile from the server and update local state.
  // Call this after household membership changes (create, join, leave, delete) so that
  // user.householdId is up to date and household-gated UI (e.g. the toggle) appears immediately.
  const refreshProfile = useCallback(async () => {
    try {
      const fresh = await apiGetProfile();
      setUser(fresh);
      return fresh;
    } catch {
      // Non-critical — ignore failures silently
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return withLoading(() => apiForgotPassword(email));
  }, [withLoading]);

  const resetPassword = useCallback(async (code, newPassword) => {
    return withLoading(() => apiResetPassword(code, newPassword));
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
    refreshProfile,
    forgotPassword,
    resetPassword,
    pendingRegistration,
  };
}
