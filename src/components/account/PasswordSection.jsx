import { useState } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { PasswordInput } from "../PasswordInput.jsx";
import { Spinner } from "../Spinner.jsx";

export function PasswordSection({ onChangePassword }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPw !== confirmPw) { setError("Passwords do not match"); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      await onChangePassword({ currentPassword: currentPw, newPassword: newPw });
      setSuccess("Password changed.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
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
        <PasswordInput value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" />
        <PasswordInput value={newPw}     onChange={e => setNewPw(e.target.value)}     placeholder="New password"      />
        <PasswordInput value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" />
        <button type="submit" disabled={loading}
          className="w-full bg-brand-green text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
          {loading ? <Spinner size={5} /> : "Change password"}
        </button>
      </form>
    </>
  );
}
