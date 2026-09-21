import { useEffect, useState } from "react";
import { useCategories } from "../hooks/useCategories.js";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { Spinner } from "../components/Spinner.jsx";

export function CategoriesPage() {
  const { categories, loading, error, load, add, remove } = useCategories();
  useEffect(() => { load(); }, [load]);

  const [name, setName]       = useState("");
  const [icon, setIcon]       = useState("");
  const [type, setType]       = useState("expense");
  const [addError, setAddError] = useState(null);
  const [adding, setAdding]   = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) { setAddError("Name is required"); return; }
    setAdding(true); setAddError(null);
    try {
      await add({ name: name.trim(), icon: icon.trim() || undefined, type });
      setName(""); setIcon("");
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this category?")) return;
    await remove(id);
  }

  const inputClass = "bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>
      <FeedbackBanner message={error} type="error" />

      {/* Add form */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">New Category</h2>
        <FeedbackBanner message={addError} onDismiss={() => setAddError(null)} />
        <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="Icon"
            maxLength={2}
            className={`w-16 text-center ${inputClass}`}
          />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name"
            required
            className={`flex-1 min-w-[120px] ${inputClass}`}
          />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className={inputClass}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button
            type="submit"
            disabled={adding}
            className="bg-brand-green text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 flex items-center gap-1"
          >
            {adding ? <Spinner size={4} /> : "Add"}
          </button>
        </form>
      </div>

      {/* List */}
      {loading && <div className="flex justify-center py-8"><Spinner size={8} /></div>}

      <div className="space-y-2">
        {categories.map(cat => (
          <div
            key={cat.categoryId}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 px-4 py-3 flex items-center justify-between"
          >
            <span className="text-sm font-medium">{cat.icon ? `${cat.icon} ` : ""}{cat.name}</span>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                cat.type === "income"
                  ? "bg-brand-greenLight text-brand-greenDark"
                  : "bg-brand-redLight text-brand-redDark"
              }`}>
                {cat.type}
              </span>
              {!cat.isDefault && (
                <button onClick={() => handleDelete(cat.categoryId)} className="text-xs text-brand-red hover:underline">
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
