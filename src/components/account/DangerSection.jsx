import { useState } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { PasswordInput } from "../PasswordInput.jsx";
import { Spinner } from "../Spinner.jsx";

export function DangerSection({ onDeleteAccount }) {
  const [deletePw, setDeletePw] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleDelete(e) {
    e.preventDefault();
    if (!window.confirm("This will permanently delete your account and all data. Continue?")) return;
    setLoading(true); setError(null);
    try { await onDeleteAccount(deletePw); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <>
      <FeedbackBanner message={error} type="error" onDismiss={() => setError(null)} />
      <div className="bg-brand-redLight border border-brand-redBorder rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-brand-redDark">Delete Account</p>
        <p className="text-xs text-brand-redDark">This action is irreversible. All your data will be permanently deleted.</p>
        <form onSubmit={handleDelete} className="space-y-3">
          <PasswordInput value={deletePw} onChange={e => setDeletePw(e.target.value)} placeholder="Confirm your password" />
          <button type="submit" disabled={loading}
            className="w-full bg-brand-red text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
            {loading ? <Spinner size={5} /> : "Delete my account"}
          </button>
        </form>
      </div>
    </>
  );
}
