import { useState } from "react";
import { Spinner } from "../Spinner.jsx";
import { FeedbackBanner } from "../FeedbackBanner.jsx";

/**
 * Displays a card for each pending household invitation with Accept / Reject buttons.
 */
export function PendingInvitationsCard({ invitations, onAccept, onReject, loading }) {
  const [error, setError] = useState(null);

  if (!invitations || invitations.length === 0) return null;

  async function handle(fn) {
    setError(null);
    try { await fn(); }
    catch (err) { setError(err.message); }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Pending invitations</h2>
      <FeedbackBanner message={error} type="error" onDismiss={() => setError(null)} />
      {invitations.map(inv => (
        <div
          key={inv.invitationId}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-sm font-semibold">{inv.householdName}</p>
            <p className="text-xs text-gray-400">Invited by {inv.invitedByName}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handle(() => onAccept(inv.invitationId))}
              disabled={loading}
              className="px-3 py-1.5 bg-brand-green text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => handle(() => onReject(inv.invitationId))}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-xl text-xs text-gray-500 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
