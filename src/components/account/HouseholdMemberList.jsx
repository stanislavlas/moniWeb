import { Spinner } from "../Spinner.jsx";

/**
 * Displays the list of household members with optional remove buttons for the owner.
 */
export function HouseholdMemberList({ members, currentUserId, ownerId, isOwner, onRemove, actionLoading }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
      {(members || []).map((m, i) => {
        const isMe        = m.userId === currentUserId;
        const mOwner      = m.userId === ownerId;
        const displayName = m.name ?? "?";
        return (
          <div
            key={m.userId}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-gray-50 dark:border-neutral-800" : ""}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              mOwner ? "bg-brand-greenLight text-brand-greenDark" : "bg-gray-100 dark:bg-neutral-800 text-gray-500"
            }`}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}{isMe ? " (you)" : ""}</p>
              <p className="text-xs text-gray-400 truncate">{m.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                mOwner
                  ? "bg-brand-greenLight border-brand-greenBorder text-brand-greenDark"
                  : "bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500"
              }`}>
                {mOwner ? "Owner" : "Member"}
              </span>
              {isOwner && !mOwner && (
                <button
                  onClick={() => onRemove(m.userId)}
                  disabled={actionLoading}
                  className="text-brand-red text-base leading-none hover:opacity-70 disabled:opacity-50"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
