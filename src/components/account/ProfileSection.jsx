import { useState, useEffect } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { PasswordInput } from "../PasswordInput.jsx";
import { CurrencyPicker } from "../CurrencyPicker.jsx";
import { Spinner } from "../Spinner.jsx";
import { useCurrencies } from "../../hooks/useCurrencies.js";
import { INPUT_CLASS } from "../../utils/styles.js";

const sectionClass = "bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3";
const headingClass = "text-xs font-semibold text-gray-400 uppercase tracking-wide";
const labelClass   = "text-xs text-gray-500 mb-1 block";

export function ProfileSection({ user, onUpdateProfile, onChangePassword, onDeleteAccount }) {

  // ── Name / email ──────────────────────────────────────────────────────────
  const [name, setName]         = useState(user?.name  ?? "");
  const [email, setEmail]       = useState(user?.email ?? "");
  const [profilePw, setProfilePw] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError]     = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  useEffect(() => {
    setName(user?.name  ?? "");
    setEmail(user?.email ?? "");
  }, [user?.name, user?.email]);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    const trimmedName  = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const emailChanged = trimmedEmail !== (user?.email ?? "").toLowerCase();
    if (emailChanged && !profilePw) { setProfileError("Enter your password to change email."); return; }
    setProfileLoading(true); setProfileError(null); setProfileSuccess(null);
    try {
      const patch = { name: trimmedName };
      if (emailChanged) { patch.email = trimmedEmail; patch.currentPassword = profilePw; }
      await onUpdateProfile(patch);
      setProfileSuccess("Profile updated.");
      setProfilePw("");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Currency ──────────────────────────────────────────────────────────────
  const { currencies }                        = useCurrencies();
  const [localCurrency, setLocalCurrency]     = useState(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError]     = useState(null);
  const [currencySuccess, setCurrencySuccess] = useState(null);
  const displayCurrency = localCurrency ?? user?.currency ?? "EUR";

  async function handleCurrencyChange(code) {
    setLocalCurrency(code);
    setCurrencyLoading(true); setCurrencyError(null); setCurrencySuccess(null);
    try {
      await onUpdateProfile({ currency: code });
      setCurrencySuccess("Currency updated.");
      setLocalCurrency(null);
    } catch (err) {
      setCurrencyError(err.message);
      setLocalCurrency(null);
    } finally {
      setCurrencyLoading(false);
    }
  }

  // ── Password ──────────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwError, setPwError]       = useState(null);
  const [pwSuccess, setPwSuccess]   = useState(null);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    setPwLoading(true); setPwError(null); setPwSuccess(null);
    try {
      await onChangePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwSuccess("Password changed.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const [deletePw, setDeletePw]     = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState(null);

  async function handleDelete(e) {
    e.preventDefault();
    if (!deletePw.trim()) { setDeleteError("Please enter your password to confirm."); return; }
    if (!window.confirm("This will permanently delete your account and all data. Continue?")) return;
    setDeleteLoading(true); setDeleteError(null);
    try { await onDeleteAccount(deletePw); }
    catch (err) { setDeleteError(err.message); }
    finally { setDeleteLoading(false); }
  }

  return (
    <div className="space-y-6">

      {/* ── Name & email ─────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <p className={headingClass}>Personal info</p>
        <FeedbackBanner message={profileError}   type="error"   onDismiss={() => setProfileError(null)}   />
        <FeedbackBanner message={profileSuccess} type="success" onDismiss={() => setProfileSuccess(null)} />
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT_CLASS} />
          </div>
          {email.trim().toLowerCase() !== (user?.email ?? "").toLowerCase() && (
            <div>
              <label className={labelClass}>Confirm with your password</label>
              <PasswordInput value={profilePw} onChange={e => setProfilePw(e.target.value)} placeholder="Your current password" />
            </div>
          )}
          <button type="submit" disabled={profileLoading}
            className="w-full bg-brand-green text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
            {profileLoading ? <Spinner size={5} /> : "Save changes"}
          </button>
        </form>
      </div>

      {/* ── Display currency ─────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <p className={headingClass}>Display currency</p>
        <FeedbackBanner message={currencyError}   type="error"   onDismiss={() => setCurrencyError(null)}   />
        <FeedbackBanner message={currencySuccess} type="success" onDismiss={() => setCurrencySuccess(null)} />
        <p className="text-xs text-gray-400">Entries are stored in their original currency and converted on display.</p>
        <CurrencyPicker value={displayCurrency} onChange={handleCurrencyChange} currencies={currencies} />
        {currencyLoading && <div className="flex justify-center py-1"><Spinner size={4} /></div>}
      </div>

      {/* ── Change password ───────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <p className={headingClass}>Change password</p>
        <FeedbackBanner message={pwError}   type="error"   onDismiss={() => setPwError(null)}   />
        <FeedbackBanner message={pwSuccess} type="success" onDismiss={() => setPwSuccess(null)} />
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <PasswordInput value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password"     />
          <PasswordInput value={newPw}     onChange={e => setNewPw(e.target.value)}     placeholder="New password"         />
          <PasswordInput value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" />
          <button type="submit" disabled={pwLoading}
            className="w-full bg-brand-green text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
            {pwLoading ? <Spinner size={5} /> : "Change password"}
          </button>
        </form>
      </div>

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <div className="bg-brand-redLight border border-brand-redBorder rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-brand-redDark uppercase tracking-wide">Delete account</p>
        <p className="text-xs text-brand-redDark">This action is irreversible. All your data will be permanently deleted.</p>
        <FeedbackBanner message={deleteError} type="error" onDismiss={() => setDeleteError(null)} />
        <form onSubmit={handleDelete} className="space-y-3">
          <PasswordInput value={deletePw} onChange={e => setDeletePw(e.target.value)} placeholder="Confirm your password" />
          <button type="submit" disabled={deleteLoading}
            className="w-full bg-brand-red text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
            {deleteLoading ? <Spinner size={5} /> : "Delete my account"}
          </button>
        </form>
      </div>

    </div>
  );
}
