import { useState } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { Spinner } from "../Spinner.jsx";
import { INPUT_CLASS } from "../../utils/styles.js";
import { applyNotificationPreferences } from "../../services/notifications.js";

const FREQUENCY_OPTIONS = [
  { value: "daily",   label: "Daily" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom",  label: "Custom" },
];

/**
 * Convert a "HH:mm" UTC string (as stored on the server) to a local "HH:mm" string
 * for display in the time picker.
 */
function utcTimeToLocal(utcHHmm) {
  if (!utcHHmm || !/^\d{2}:\d{2}$/.test(utcHHmm)) return "20:00";
  const [h, m] = utcHHmm.split(":").map(Number);
  const d = new Date();
  d.setUTCHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * Convert a local "HH:mm" string (from the time picker) to a UTC "HH:mm" string
 * for storage on the server.
 */
function localTimeToUtc(localHHmm) {
  const [h, m] = localHHmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  const utcH = String(d.getUTCHours()).padStart(2, "0");
  const utcM = String(d.getUTCMinutes()).padStart(2, "0");
  return `${utcH}:${utcM}`;
}

export function NotificationsSection({ user, onUpdateProfile }) {
  const [enabled,    setEnabled]    = useState(user?.notificationsEnabled   ?? false);
  const [frequency,  setFrequency]  = useState(user?.notificationFrequency  ?? "daily");
  const [customDays, setCustomDays] = useState(user?.notificationCustomDays ?? 1);
  // Display the stored UTC time converted to the user's local timezone
  const [localTime,  setLocalTime]  = useState(utcTimeToLocal(user?.notificationTime ?? "20:00"));
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const prefs = {
      notificationsEnabled:   enabled,
      notificationFrequency:  frequency,
      notificationCustomDays: Number(customDays),
      // Convert local time back to UTC before storing
      notificationTime:       localTimeToUtc(localTime),
    };

    try {
      // 1. Persist prefs to the server (shared with mobile)
      await onUpdateProfile(prefs);

      // 2. Wire up / tear down the browser push subscription
      const { permissionDenied } = await applyNotificationPreferences(prefs);

      if (permissionDenied) {
        setError(
          "Notification permission was denied. Enable it in your browser settings and try again."
        );
        // Disable the toggle so the stored pref reflects reality
        setEnabled(false);
        await onUpdateProfile({ notificationsEnabled: false }).catch(() => {});
        return;
      }

      setSuccess(enabled ? "Notifications enabled." : "Notifications disabled.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <FeedbackBanner message={error}   type="error"   onDismiss={() => setError(null)}   />
      <FeedbackBanner message={success} type="success" onDismiss={() => setSuccess(null)} />

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">Budget Reminders</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Receive OS-level notifications even when the browser tab is closed.
            Settings sync with the mobile app.
          </p>
        </div>

        {/* Enable toggle */}
        <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
          <span className="text-sm">Enable notifications</span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-brand-green" : "bg-gray-300 dark:bg-neutral-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>

        {/* Frequency + time — only shown when enabled */}
        {enabled && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className={INPUT_CLASS}
              >
                {FREQUENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {frequency === "custom" && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Every N days</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={e => setCustomDays(Math.min(365, Math.max(1, Number(e.target.value))))}
                  className={INPUT_CLASS}
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Time</label>
              <input
                type="time"
                value={localTime}
                onChange={e => setLocalTime(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-brand-green text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center"
      >
        {loading ? <Spinner size={5} /> : "Save notification settings"}
      </button>
    </div>
  );
}
