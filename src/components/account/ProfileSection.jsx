import { useState } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { PasswordInput } from "../PasswordInput.jsx";
import { Spinner } from "../Spinner.jsx";
import { INPUT_CLASS } from "../../utils/styles.js";

export function ProfileSection({ user, onUpdateProfile }) {
  const [name, setName]         = useState(user?.name  ?? "");
  const [email, setEmail]       = useState(user?.email ?? "");
  const [profilePw, setProfilePw] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName  = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const emailChanged = trimmedEmail !== (user?.email ?? "").toLowerCase();
    if (emailChanged && !profilePw) { setError("Enter your password to change email."); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const patch = { name: trimmedName };
      if (emailChanged) { patch.email = trimmedEmail; patch.currentPassword = profilePw; }
      await onUpdateProfile(patch);
      setSuccess("Profile updated.");
      setProfilePw("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <FeedbackBanner message={error}   type="error"   onDismiss={() => setError(null)}   />
      <FeedbackBanner message={success} type="success" onDismiss={() => setSuccess(null)} />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT_CLASS} />
        </div>
        {email.trim().toLowerCase() !== (user?.email ?? "").toLowerCase() && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Confirm with your password</label>
            <PasswordInput value={profilePw} onChange={e => setProfilePw(e.target.value)} placeholder="Your current password" />
          </div>
        )}
        <button type="submit" disabled={loading}
          className="w-full bg-brand-green text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
          {loading ? <Spinner size={5} /> : "Save changes"}
        </button>
      </form>
    </>
  );
}
