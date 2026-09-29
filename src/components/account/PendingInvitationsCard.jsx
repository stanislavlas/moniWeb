import { useState } from "react";
import { Spinner } from "../Spinner.jsx";
import { FeedbackBanner } from "../FeedbackBanner.jsx";

/**
 * Displays a card for each pending household invitation with Accept / Reject buttons.
 * Each invitation has its own loading state so one action doesn't block others.
 */
export function PendingInvitationsCard({ invitations, onAccept, onReject }) {
  const [error, setError]               = useState(null);
  // Track which invitationId is currently being processed
  const [processingId, setProcessingId] = useState(null);

  if (!invitations || invitations.length === 0) return null;

  async function handle(invitationId, fn) {
    setError(null);
    setProcessingId(invitationId);
    try { await fn(); }
    catch (err) { setError(err.message); }
    finally { setProcessingId(null); }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Pending invitations</h2>
      <FeedbackBanner message={error} type="error" onDismiss={() => setError(null)} />
      {invitations.map(inv => {
        const isProcessing = processingId === inv.invitationId;
        return (
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
                onClick={() => handle(inv.invitationId, () => onAccept(inv.invitationId))}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-brand-green text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center min-w-[60px]"
              >
                {isProcessing ? <Spinner size={3} /> : "Accept"}
              </button>
              <button
                onClick={() => handle(inv.invitationId, () => onReject(inv.invitationId))}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-xl text-xs text-gray-500 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
