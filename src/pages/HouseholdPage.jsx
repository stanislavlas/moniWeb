import { useEffect, useState } from "react";
import { useHousehold } from "../hooks/useHousehold.js";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { Spinner } from "../components/Spinner.jsx";

export function HouseholdPage({ user }) {
  const { household, loading, error, load, create, addMember, removeMember } = useHousehold();
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode]       = useState("");
  const [actionError, setActionError]     = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.householdId) load(user.householdId);
  }, [user, load]);

  async function handleCreate(e) {
    e.preventDefault();
    setActionLoading(true); setActionError(null);
    try { await create(householdName); setHouseholdName(""); }
    catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setActionLoading(true); setActionError(null);
    try { await addMember(household.householdId, inviteCode); setInviteCode(""); }
    catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  }

  async function handleRemove(uid) {
    if (!window.confirm("Remove this member?")) return;
    await removeMember(household.householdId, uid);
  }

  const inputClass = "bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green";

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size={12} /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Household</h1>
      <FeedbackBanner message={error || actionError} onDismiss={() => setActionError(null)} />

      {!household && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Create Household</h2>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={householdName}
              onChange={e => setHouseholdName(e.target.value)}
              placeholder="Household name"
              required
              className={`flex-1 ${inputClass}`}
            />
            <button type="submit" disabled={actionLoading}
              className="bg-brand-green text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 flex items-center">
              {actionLoading ? <Spinner size={4} /> : "Create"}
            </button>
          </form>
        </div>
      )}

      {household && (
        <>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4">
            <h2 className="font-bold text-lg mb-1">{household.name}</h2>
            {household.inviteCode && (
              <p className="text-sm text-gray-500">
                Invite code:{" "}
                <span className="font-mono font-bold text-gray-700 dark:text-gray-200">{household.inviteCode}</span>
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Members ({household.members?.length ?? 0})
            </h2>
            {household.members?.map(m => (
              <div key={m.userId} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-neutral-800 last:border-0">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
                {m.userId !== user?.userId && (
                  <button onClick={() => handleRemove(m.userId)} className="text-xs text-brand-red hover:underline">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Add Member by Invite Code</h2>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Invite code"
                required
                className={`flex-1 font-mono ${inputClass}`}
              />
              <button type="submit" disabled={actionLoading}
                className="bg-brand-blue text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 flex items-center">
                {actionLoading ? <Spinner size={4} /> : "Add"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
