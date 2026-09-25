const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const KEY_ACCESS  = "moni_access_token";
const KEY_REFRESH = "moni_refresh_token";
const KEY_USER    = "moni_user";

export function getAccessToken()  { return localStorage.getItem(KEY_ACCESS); }
export function getRefreshToken() { return localStorage.getItem(KEY_REFRESH); }
export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(KEY_USER)); } catch { return null; }
}

function storeTokens({ accessToken, refreshToken, user }) {
  localStorage.setItem(KEY_ACCESS,  accessToken);
  localStorage.setItem(KEY_REFRESH, refreshToken);
  localStorage.setItem(KEY_USER,    JSON.stringify(user));
}

export function clearTokens() {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  localStorage.removeItem(KEY_USER);
}

function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !payload.exp || Date.now() / 1000 > payload.exp - 30;
  } catch { return true; }
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    window.dispatchEvent(new Event("auth:expired"));
    throw Object.assign(new Error("No refresh token"), { code: "AUTH_EXPIRED" });
  }
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    clearTokens();
    window.dispatchEvent(new Event("auth:expired"));
    throw Object.assign(new Error("Session expired"), { code: "AUTH_EXPIRED" });
  }
  localStorage.setItem(KEY_ACCESS,  data.accessToken);
  if (data.refreshToken) localStorage.setItem(KEY_REFRESH, data.refreshToken);
  return data.accessToken;
}

export async function authRequest(path, options = {}) {
  let token = getAccessToken();
  if (!token || isExpired(token)) {
    token = await refreshAccessToken();
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearTokens();
    window.dispatchEvent(new Event("auth:expired"));
    throw Object.assign(new Error("Session expired. Please log in again."), { code: "AUTH_EXPIRED" });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `API error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Login failed");
  storeTokens(data);
  return data.user;
}

export async function register({ name, email, password, currency }) {
  const res = await fetch(`${API_BASE}/api/auth/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, currency: currency || "EUR" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Registration failed");
  return data; // returns pending verification state
}

export async function verifyRegistration(code) {
  const res = await fetch(`${API_BASE}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Verification failed");
  storeTokens(data);
  return data.user;
}

export async function resendVerificationCode(email) {
  const res = await fetch(`${API_BASE}/api/auth/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Failed to resend code");
  return data;
}

export async function forgotPassword(email) {
  const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Failed to request password reset");
  return data;
}

export async function resetPassword(code, newPassword) {
  const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Failed to reset password");
  return data;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  clearTokens();
  // best-effort — don't await
  fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}

export async function deleteAccount(password) {
  await authRequest("/api/auth/account", { method: "DELETE", body: JSON.stringify({ password }) });
  clearTokens();
}

export async function changePassword({ currentPassword, newPassword }) {
  return authRequest("/api/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });
}

export async function updateProfile(patch) {
  const data = await authRequest("/api/user", { method: "PATCH", body: JSON.stringify(patch) });
  const existing = getStoredUser();
  const updated = { ...(existing ?? {}), ...data };
  localStorage.setItem(KEY_USER, JSON.stringify(updated));
  return updated;
}
