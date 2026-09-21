import { useState } from "react";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { PasswordInput } from "../components/PasswordInput.jsx";
import { Spinner } from "../components/Spinner.jsx";

export function AccountPage({ user, onChangePassword, onUpdateProfile, onDeleteAccount }) {
  const [section, setSection]       = useState("profile"); // profile | password | danger
  const [name, setName]             = useState(user?.name  ?? "");
  const [email, setEmail]           = useState(user?.email ?? "");
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [deletePw, setDeletePw]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);

  function resetFeedback() { setError(null); setSuccess(null); }

  async function handleProfileSave(e) {
    e.preventDefault();
    setLoading(true); resetFeedback();
    try {
      await onUpdateProfile({ name, email });
      setSuccess("Profile updated.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPw !== confirmPw) { setError("Passwords do not match"); return; }
    setLoading(true); resetFeedback();
    try {
      await onChangePassword({ currentPassword: currentPw, newPassword: newPw });
      setSuccess("Password changed.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (!window.confirm("This will permanently delete your account and all data. Continue?")) return;
    setLoading(true); resetFeedback();
    try { await onDeleteAccount(deletePw); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const inputClass = "w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-neutral-800">
        {[
          { id: "profile",  label: "Profile"     },
          { id: "password", label: "Password"    },
          { id: "danger",   label: "Danger Zone" },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => { setSection(s.id); resetFeedback(); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              section === s.id
                ? "border-brand-green text-brand-green"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <FeedbackBanner message={error}   type="error"   onDismiss={() => setError(null)}   />
      <FeedbackBanner message={success} type="success" onDismiss={() => setSuccess(null)} />

      {section === "profile" && (
        <form onSubmit={handleProfileSave} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-green text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
            {loading ? <Spinner size={5} /> : "Save changes"}
          </button>
        </form>
      )}

      {section === "password" && (
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <PasswordInput value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" />
          <PasswordInput value={newPw}     onChange={e => setNewPw(e.target.value)}     placeholder="New password"      />
          <PasswordInput value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" />
          <button type="submit" disabled={loading}
            className="w-full bg-brand-green text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
            {loading ? <Spinner size={5} /> : "Change password"}
          </button>
        </form>
      )}

      {section === "danger" && (
        <div className="bg-brand-redLight border border-brand-redBorder rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-brand-redDark">Delete Account</p>
          <p className="text-xs text-brand-redDark">This action is irreversible. All your data will be permanently deleted.</p>
          <form onSubmit={handleDeleteAccount} className="space-y-3">
            <PasswordInput value={deletePw} onChange={e => setDeletePw(e.target.value)} placeholder="Confirm your password" />
            <button type="submit" disabled={loading}
              className="w-full bg-brand-red text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
              {loading ? <Spinner size={5} /> : "Delete my account"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
