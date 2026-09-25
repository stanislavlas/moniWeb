import { useEffect, useState } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { Spinner } from "../Spinner.jsx";
import { useHouseholdContext } from "../../contexts/HouseholdContext.jsx";
import { PendingInvitationsCard } from "./PendingInvitationsCard.jsx";
import { HouseholdMemberList } from "./HouseholdMemberList.jsx";
import { CreateHouseholdForm } from "./CreateHouseholdForm.jsx";
import { INPUT_SM_CLASS } from "../../utils/styles.js";

export function HouseholdSection({ user, onUpdateProfile }) {
  const {
    household, loaded: householdLoaded, error: householdError,
    pendingInvitations,
    load: loadHousehold, create, sendInvitation,
    acceptInvitation, rejectInvitation, cancelInvitation,
    loadSentInvitations, sentInvitations,
    removeMember, leave, deleteHousehold, rename,
  } = useHouseholdContext();

  const [view, setView]               = useState("main"); // main | invite | rename
  const [householdName, setHouseholdName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [actionError, setActionError]     = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  function showSuccess(msg) {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  }

  const isOwner = household && user && household.ownerId === user.userId;

  useEffect(() => { loadHousehold(); }, [loadHousehold]);
  useEffect(() => { if (isOwner) loadSentInvitations().catch(() => {}); }, [isOwner, loadSentInvitations]);
  useEffect(() => { if (household?.name) setRenameValue(household.name); }, [household?.name]);

  async function run(fn) {
    setActionLoading(true); setActionError(null);
    try { return await fn(); }
    catch (err) { setActionError(err.message); throw err; }
    finally { setActionLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const data = await run(() => create(householdName));
      setHouseholdName("");
      showSuccess("Household created.");
      if (onUpdateProfile) await onUpdateProfile({ householdId: data.householdId });
    } catch {}
  }

  async function handleInvite(e) {
    e.preventDefault();
    try {
      await run(() => sendInvitation(inviteEmail));
      setInviteEmail(""); setView("main");
      showSuccess("Invitation sent.");
      loadSentInvitations().catch(() => {});
    } catch {}
  }

  async function handleRename(e) {
    e.preventDefault();
    try {
      await run(() => rename(renameValue));
      setView("main");
      showSuccess("Household renamed.");
    } catch {}
  }

  async function handleRemoveMember(uid) {
    if (!window.confirm("Remove this member?")) return;
    try { await run(() => removeMember(uid)); showSuccess("Member removed."); } catch {}
  }

  async function handleLeave() {
    if (isOwner) {
      alert("As the owner, you cannot leave. Delete the household instead.");
      return;
    }
    if (!window.confirm("Leave this household? You will lose access to shared data.")) return;
    try {
      await run(() => leave());
      if (onUpdateProfile) await onUpdateProfile({ householdId: null });
    } catch {}
  }

  async function handleDelete() {
    if (!window.confirm("Delete this household permanently? All shared data will be lost.")) return;
    try {
      await run(() => deleteHousehold());
      if (onUpdateProfile) await onUpdateProfile({ householdId: null });
    } catch {}
  }

  return (
    <div className="space-y-6">
      <FeedbackBanner message={householdError || actionError} onDismiss={() => setActionError(null)} />
      <FeedbackBanner message={actionSuccess} type="success" onDismiss={() => setActionSuccess(null)} />

      {!householdLoaded && !householdError && (
        <div className="flex justify-center py-16"><Spinner size={12} /></div>
      )}

      {householdLoaded && !household && !householdError && (
        <CreateHouseholdForm
          householdName={householdName}
          onNameChange={setHouseholdName}
          onSubmit={handleCreate}
          loading={actionLoading}
          hasPendingInvitations={pendingInvitations.length > 0}
        />
      )}

      {householdLoaded && !household && householdError && (
        <div className="text-center py-8 space-y-3">
          <p className="text-gray-400 text-sm">Could not load household data.</p>
          <button onClick={() => loadHousehold()} className="px-4 py-2 rounded-xl bg-brand-green text-white text-sm font-semibold">
            Retry
          </button>
        </div>
      )}

      {household && (
        <>
          {/* Household card */}
          <div className="bg-brand-greenLight dark:bg-brand-greenDark/20 rounded-2xl border border-brand-greenBorder/30 p-4">
            {view === "rename" ? (
              <form onSubmit={handleRename} className="space-y-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  required
                  autoFocus
                  className={`w-full ${INPUT_SM_CLASS}`}
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={actionLoading}
                    className="flex-1 bg-brand-green text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50">
                    Save
                  </button>
                  <button type="button" onClick={() => { setView("main"); setRenameValue(household.name); }}
                    className="flex-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl py-2 text-sm text-gray-600 dark:text-gray-300">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-brand-greenDark uppercase tracking-wide mb-1">Household</p>
                  <h2 className="text-xl font-bold text-brand-greenDark">{household.name}</h2>
                  <p className="text-xs text-brand-green mt-1">
                    {(household.members || []).length} member{(household.members || []).length !== 1 ? "s" : ""} · {isOwner ? "Owner" : "Member"}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => { setView("rename"); setRenameValue(household.name); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-brand-greenBorder text-brand-greenDark hover:bg-brand-green/10"
                  >
                    Rename
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Invite member */}
          {isOwner && view !== "invite" && view !== "rename" && (
            <button
              onClick={() => setView("invite")}
              className="w-full bg-brand-greenLight dark:bg-brand-greenDark/20 border border-brand-greenBorder/30 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-brand-greenDark font-semibold text-sm"
            >
              <span className="text-lg">✉️</span>
              Invite Member
            </button>
          )}

          {view === "invite" && isOwner && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Invite by email</h2>
              <form onSubmit={handleInvite} className="space-y-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="their@email.com"
                  required
                  autoFocus
                  className={`w-full ${INPUT_SM_CLASS}`}
                />
                <p className="text-xs text-gray-400">They will receive an invitation to accept or reject in the app.</p>
                <div className="flex gap-2">
                  <button type="submit" disabled={actionLoading}
                    className="flex-1 bg-brand-green text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50 flex justify-center items-center">
                    {actionLoading ? <Spinner size={4} /> : "Send invitation"}
                  </button>
                  <button type="button" onClick={() => { setView("main"); setInviteEmail(""); }}
                    className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-xl py-2 text-sm text-gray-500">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sent invitations (pending only) */}
          {isOwner && sentInvitations.filter(i => i.status === "PENDING").length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sent invitations (Pending)</h2>
              {sentInvitations.filter(i => i.status === "PENDING").map(inv => (
                <div key={inv.invitationId}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{inv.invitedEmail}</p>
                    <p className="text-xs text-gray-400">Waiting for response</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        setActionLoading(true);
                        await cancelInvitation(inv.invitationId);
                        showSuccess("Invitation cancelled.");
                      } catch (e) {
                        setActionError(e.message ?? "Failed to cancel invitation.");
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    disabled={actionLoading}
                    className="text-xs text-brand-red hover:underline disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}

          <HouseholdMemberList
            members={household.members}
            currentUserId={user?.userId}
            ownerId={household.ownerId}
            isOwner={isOwner}
            onRemove={handleRemoveMember}
            actionLoading={actionLoading}
          />

          {/* Danger zone */}
          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            {!isOwner && (
              <button onClick={handleLeave} disabled={actionLoading}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-brand-red hover:bg-brand-redLight/50 transition-colors">
                <span className="text-lg">🚪</span>
                <span className="text-sm font-medium">Leave household</span>
              </button>
            )}
            {isOwner && (
              <button onClick={handleDelete} disabled={actionLoading}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-brand-red hover:bg-brand-redLight/50 transition-colors">
                <span className="text-lg">🗑️</span>
                <span className="text-sm font-medium">Delete household</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
