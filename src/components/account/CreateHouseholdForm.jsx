import { INPUT_CLASS } from "../../utils/styles.js";
import { Spinner } from "../Spinner.jsx";

/**
 * "No household yet" empty state + create household form.
 */
export function CreateHouseholdForm({ householdName, onNameChange, onSubmit, loading, hasPendingInvitations }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <p className="text-5xl mb-3">🏠</p>
        <h2 className="text-lg font-bold mb-2">No household yet</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          {hasPendingInvitations
            ? "Accept an invitation above, or create your own household."
            : "Create a household to share your budget. Everyone sees all transactions."}
        </p>
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">Household name</label>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            value={householdName}
            onChange={e => onNameChange(e.target.value)}
            placeholder="e.g. Our Home, Family Budget…"
            required
            className={INPUT_CLASS}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? <Spinner size={4} /> : "Create household"}
          </button>
        </form>
      </div>
    </div>
  );
}
