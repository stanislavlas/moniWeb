import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEntries } from "../hooks/useEntries.js";
import { useCategories } from "../hooks/useCategories.js";
import { Spinner } from "../components/Spinner.jsx";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildMonthOptions() {
  return Array.from({ length: 36 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ym = d.toISOString().slice(0, 7);
    const [y, m] = ym.split("-");
    return { value: ym, label: `${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}` };
  });
}

export function HistoryPage() {
  const navigate = useNavigate();
  const monthOptions = buildMonthOptions();
  const [filterMonth, setFilterMonth] = useState(monthOptions[0].value);
  const { entries, loading, error, load, remove } = useEntries();
  const { categories, load: loadCats } = useCategories();

  useEffect(() => { loadCats(); }, [loadCats]);
  useEffect(() => { load(filterMonth); }, [filterMonth, load]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await remove(id);
  }, [remove]);

  function getCatLabel(cat) {
    if (!cat) return null;
    if (cat.name) return `${cat.icon ?? ""} ${cat.name}`.trim();
    const found = categories.find(c => c.categoryId === cat.categoryId);
    return found ? `${found.icon ?? ""} ${found.name}`.trim() : null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">History</h1>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm"
        >
          {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <FeedbackBanner message={error} type="error" />

      {loading && <div className="flex justify-center py-12"><Spinner size={10} /></div>}

      {!loading && entries.length === 0 && (
        <p className="text-center text-gray-400 py-12">No entries for this month.</p>
      )}

      <div className="space-y-2">
        {entries.map(entry => (
          <div
            key={entry.entryId}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 px-4 py-3 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-base font-bold ${entry.type === "income" ? "text-brand-green" : "text-brand-red"}`}>
                  {entry.type === "income" ? "+" : "−"}€{parseFloat(entry.amount).toFixed(2)}
                </span>
                {getCatLabel(entry.category) && (
                  <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-500 rounded-full px-2 py-0.5">
                    {getCatLabel(entry.category)}
                  </span>
                )}
              </div>
              {entry.note && <p className="text-sm text-gray-500 truncate">{entry.note}</p>}
              <p className="text-xs text-gray-400">{entry.date}</p>
            </div>
            <div className="flex gap-3 shrink-0">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
