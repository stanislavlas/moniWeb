import { authRequest } from "./auth.js";
import { logger } from "../utils/logger.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const SW_PATH  = "/sw.js";
const KEY_SUB  = "moni_push_subscription_endpoint";

/**
 * Request notification permission from the browser.
 * Returns "granted" | "denied" | "default".
 */
export async function requestPermission() {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

/**
 * Fetch the VAPID public key from the API.
 * Falls back to the env-var baked in at build time.
 */
async function getVapidPublicKey() {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey) return envKey;
  const res = await fetch(`${API_BASE}/api/notifications/vapid-public-key`);
  if (!res.ok) throw new Error(`Failed to fetch VAPID key: ${res.status}`);
  const data = await res.json();
  if (!data.publicKey) throw new Error("VAPID key missing from server response");
  return data.publicKey;
}

/**
 * Register the service worker and return its registration.
 * Returns null if service workers are not supported.
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    logger.info("notifications", "Service worker registered");
    return registration;
  } catch (err) {
    logger.error("notifications", "Service worker registration failed", err);
    return null;
  }
}

/**
 * Convert a base64url string to a Uint8Array (required by pushManager.subscribe).
 */
function urlBase64ToUint8Array(base64String) {
  if (!base64String) throw new Error("VAPID public key is empty");
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

/**
 * Subscribe to browser push notifications.
 * Always unsubscribes any existing subscription first to ensure the VAPID key is applied.
 * Returns the PushSubscription or null on failure.
 */
async function subscribeToPush(registration) {
  try {
    // Discard any existing subscription — it may have been created without a VAPID key
    // (legacy FCM endpoint) or with a different key pair.
    const existing = await registration.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const vapidPublicKey = await getVapidPublicKey();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    logger.info("notifications", "Push subscription created");
    return subscription;
  } catch (err) {
    logger.error("notifications", "Push subscribe failed", err);
    return null;
  }
}

/**
 * Send the push subscription to the moniAPI so the server can push to this browser.
 */
async function sendSubscriptionToServer(subscription) {
  const json = subscription.toJSON();
  await authRequest("/api/notifications/subscribe", {
    method: "POST",
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh:   json.keys.p256dh,
      auth:     json.keys.auth,
    }),
  });
  // Remember the endpoint so we can unsubscribe later
  localStorage.setItem(KEY_SUB, json.endpoint);
}

/**
 * Unsubscribe from push notifications on this browser and notify the server.
 */
export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  const storedEndpoint = localStorage.getItem(KEY_SUB);

  if (subscription) {
    await subscription.unsubscribe();
    authRequest("/api/notifications/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => {});
  } else if (storedEndpoint) {
    // No local subscription but server may still have a record — clean it up
    authRequest("/api/notifications/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint: storedEndpoint }),
    }).catch(() => {});
  }

  localStorage.removeItem(KEY_SUB);
  logger.info("notifications", "Unsubscribed from push");
}

/**
 * Apply notification preferences for the web — mirrors moniMobile/src/services/notifications.js.
 *
 * If enabled:
 *   1. Register service worker
 *   2. Request browser permission
 *   3. Subscribe to push (always fresh — unsubscribes existing first)
 *   4. Send subscription to server (replaces all previous for this user)
 *
 * If disabled: unsubscribe.
 *
 * @param {{ notificationsEnabled: boolean }} prefs
 * @returns {{ permissionDenied: boolean }}
 */
export async function applyNotificationPreferences(prefs) {
  const { notificationsEnabled } = prefs ?? {};

  if (!notificationsEnabled) {
    await unsubscribeFromPush().catch(() => {});
    return { permissionDenied: false };
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    logger.warn("notifications", "Service workers not supported");
    return { permissionDenied: false };
  }

  const permission = await requestPermission();
  if (permission !== "granted") {
    logger.warn("notifications", `Notification permission: ${permission}`);
    return { permissionDenied: permission === "denied" };
  }

  const subscription = await subscribeToPush(registration);
  if (!subscription) {
    logger.warn("notifications", "subscribeToPush returned null — push subscription was not created");
    return { permissionDenied: false };
  }

  await sendSubscriptionToServer(subscription);
  logger.info("notifications", "Push subscription sent to server");

  return { permissionDenied: false };
}

/**
 * Register the service worker on app startup without creating a new push subscription.
 * Call this once on load so the SW is active and ready to receive pushes for the
 * existing subscription already stored on the server.
 */
export async function ensureServiceWorkerRegistered() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
  } catch (err) {
    logger.error('notifications', `SW registration failed`, err);
  }
}
