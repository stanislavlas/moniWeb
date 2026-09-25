import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../hooks/useCategories.js";
import { useAuth } from "../hooks/useAuth.js";
import { useMonthCache } from "../hooks/useMonthCache.js";
import { deleteEntry } from "../services/entries.js";
import { entryEvents } from "../utils/entryEvents.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { MONTHS_SHORT, getAmount, formatCurrency } from "../utils/money.js";

export function HistoryPage({ showHousehold = false, user: userProp }) {
  const navigate  = useNavigate();
  const { user: authUser } = useAuth();
  const user      = userProp ?? authUser;
  const currency  = user?.currency ?? "EUR";

  // An entry can be modified by its author OR by the household owner.
  const canModify = (entry) => {
    if (!user) return false;
    if (entry.userId === user.userId) return true;
    if (showHousehold && user.householdRole === "OWNER") return true;
    return false;
  };

  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [deleteError, setDeleteError]  = useState(null);

  const { categories, load: loadCats, colorMap } = useCategories();
  const { activeMonths, monthCache, fetchMonth } = useMonthCache(showHousehold);

  useEffect(() => { loadCats(); }, [loadCats]);
  useEffect(() => { fetchMonth(filterMonth); }, [filterMonth, fetchMonth]);

  const currentData = monthCache[filterMonth] ?? { entries: [], loading: true, error: null };
  const entries     = currentData.entries;
  const loading     = currentData.loading;
  const fetchError  = currentData.error;

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    setDeleteError(null);
    try {
      const entry = entries.find(e => e.entryId === id);
      await deleteEntry(id);
      if (entry?.date) entryEvents.emit(entry.date);
    } catch (err) {
      setDeleteError(err.message ?? "Failed to delete entry");
    }
  }, [entries]);

  function getCatInfo(entry) {
    const catId = entry.categoryId ?? entry.category?.categoryId;
    if (!catId) return null;
    const cat = categories.find(c => c.categoryId === catId);
    if (!cat) return null;
    return { icon: cat.icon ?? cat.emoji ?? "", name: cat.name, catId };
  }

  const [year, month] = filterMonth.split("-");
  const monthLabel = `${MONTHS_SHORT[parseInt(month, 10) - 1]} ${year}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">History</h1>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          {activeMonths.map(ym => {
            const [y, m] = ym.split("-");
            return (
              <option key={ym} value={ym}>
                {MONTHS_SHORT[parseInt(m, 10) - 1]} {y}
              </option>
            );
          })}
        </select>
      </div>

      <FeedbackBanner message={fetchError || deleteError} type="error" />

      {loading && <div className="flex justify-center py-12"><Spinner size={10} /></div>}

      {!loading && entries.length === 0 && (
        <p className="text-center text-gray-400 py-12">No entries for {monthLabel}.</p>
      )}

      <div className="space-y-2">
        {entries.map(entry => {
          const isIncome     = entry.type === "INCOME";
          const isInvestment = entry.type === "INVESTMENT";
          const sign         = isIncome ? "+" : "−";
          const amountColor  = isIncome ? "text-brand-green" : isInvestment ? "text-brand-blue" : "text-brand-red";

          const catInfo = getCatInfo(entry);
          const catId   = entry.categoryId ?? entry.category?.categoryId;
          const color   = catId ? colorMap[catId] : null;

          return (
            <div
              key={entry.entryId}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3"
            >
              {catInfo && (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: color ? color + "20" : "#8887801A" }}
                >
                  {catInfo.icon || "💰"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-base font-bold ${amountColor}`}>
                    {sign}{formatCurrency(getAmount(entry), currency)}
                  </span>
                  {catInfo && (
                    <span
                      className="text-xs rounded-xl px-2 py-0.5 font-medium"
                      style={color
                        ? { backgroundColor: color + "20", color }
                        : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                      }
                    >
                      {catInfo.name}
                    </span>
                  )}
                </div>
                {entry.note && <p className="text-sm text-gray-500 truncate">{entry.note}</p>}
                <p className="text-xs text-gray-400">{entry.date}</p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0 items-end">
                {canModify(entry) && (
                  <>
                    <button
                      onClick={() => navigate("/add", { state: { entry } })}
                      className="text-xs text-brand-blue hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.entryId)}
                      className="text-xs text-brand-red hover:underline"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
