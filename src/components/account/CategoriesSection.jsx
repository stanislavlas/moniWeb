import { useEffect, useRef, useState } from "react";
import { FeedbackBanner } from "../FeedbackBanner.jsx";
import { Spinner } from "../Spinner.jsx";
import { useCategories } from "../../hooks/useCategories.js";
import { INPUT_CLASS, INPUT_SM_CLASS } from "../../utils/styles.js";

const EMOJI_LIST = [
  "🛍️","🎮","🐾","🌿","🏖️","🎵","🍷","📚","🧘","🚴","🏥","🎁",
  "🧹","🔧","🌍","🍔","☕","🎓","💊","🏋️","🎨","✈️","🧴","🧃",
  "🥗","🍰","🚌","🎯","💡","🪴","🎪","🧩","🛒","🏠","💼","📱",
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🦁","🐮","🐸","🐙",
  "🌸","🌺","🌻","🍎","🍊","🍋","🍇","🍓","🥑","🌮","🍕","🍣",
  "⚽","🏀","🎾","🏊","🚵","🎻","🎹","🎲","🧸","💎","🔑","🎀",
  "💰","💳","🏦","📈","🏡","🚗","🚂","⛵","🎡","🎢","🏕️","🗺️",
];

const TABS = [
  { id: "expense",    label: "💸 Expenses" },
  { id: "income",     label: "💰 Income"   },
  { id: "investment", label: "📈 Invest"   },
];

const TAB_COLORS = {
  expense:    { btn: "bg-brand-red",   active: "border-brand-red text-brand-red" },
  income:     { btn: "bg-brand-green", active: "border-brand-green text-brand-green" },
  investment: { btn: "bg-brand-blue",  active: "border-brand-blue text-brand-blue" },
};

export function CategoriesSection() {
  const {
    categories, loading: catsLoading, error: catsError,
    load: loadCategories, add: addCategory, remove: removeCategory,
  } = useCategories();

  const [tab, setTab]               = useState("expense");
  const [showForm, setShowForm]     = useState(false);
  const [catName, setCatName]       = useState("");
  const [catIcon, setCatIcon]       = useState("");
  const [catAddError, setCatAddError]   = useState(null);
  const [catAdding, setCatAdding]       = useState(false);
  const [catSuccess, setCatSuccess]     = useState(null);
  const [catDeleteError, setCatDeleteError] = useState(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiInput, setEmojiInput]           = useState("");
  const emojiOverlayRef = useRef(null);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    function onMouseDown(e) {
      if (emojiOverlayRef.current && !emojiOverlayRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showEmojiPicker]);

  // Close on Escape
  useEffect(() => {
    if (!showEmojiPicker) return;
    function onKey(e) { if (e.key === "Escape") setShowEmojiPicker(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showEmojiPicker]);

  function openEmojiPicker() {
    setEmojiInput(catIcon);
    setShowEmojiPicker(true);
  }

  function handleEmojiInputChange(val) {
    setEmojiInput(val);
    const chars = [...val];
    if (chars.length > 0) setCatIcon(chars[chars.length - 1]);
    else setCatIcon("");
  }

  function pickEmoji(e) {
    setCatIcon(e);
    setShowEmojiPicker(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!catName.trim()) { setCatAddError("Name is required"); return; }
    setCatAdding(true); setCatAddError(null);
    try {
      await addCategory({ name: catName.trim(), icon: catIcon.trim() || undefined, type: tab });
      setCatName(""); setCatIcon(""); setShowForm(false);
      setCatSuccess("Category added.");
      setTimeout(() => setCatSuccess(null), 3000);
    } catch (err) {
      setCatAddError(err.message);
    } finally {
      setCatAdding(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this category?")) return;
    setCatDeleteError(null);
    try {
      await removeCategory(id);
    } catch (err) {
      setCatDeleteError(err.message);
    }
  }

  const tabColor = TAB_COLORS[tab];
  const visibleCats = categories.filter(c => (c.type || "expense") === tab);

  return (
    <div className="space-y-6">
      <FeedbackBanner message={catsError} type="error" />
      <FeedbackBanner message={catDeleteError} type="error" onDismiss={() => setCatDeleteError(null)} />
      <FeedbackBanner message={catSuccess} type="success" onDismiss={() => setCatSuccess(null)} />

      {/* Tab toggle */}
      <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setShowForm(false); setCatAddError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border-b-2 ${
              tab === t.id
                ? `bg-white dark:bg-neutral-900 shadow-sm ${TAB_COLORS[t.id].active}`
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Custom categories</h2>
          <button
            onClick={() => { setShowForm(v => !v); setCatName(""); setCatIcon(""); setCatAddError(null); }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="space-y-3 pt-1">
            <FeedbackBanner message={catAddError} onDismiss={() => setCatAddError(null)} />

            {/* Emoji button + name input */}
            <div className="flex gap-2">
              {/* Emoji picker trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={openEmojiPicker}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-2xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  {catIcon || "🙂"}
                </button>

                {/* Bottom-sheet style picker */}
                {showEmojiPicker && (
                  <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" style={{ pointerEvents: "all" }}>
                    <div
                      ref={emojiOverlayRef}
                      className="bg-white dark:bg-neutral-900 rounded-t-2xl w-full max-w-lg pb-8 shadow-xl"
                    >
                      {/* Handle */}
                      <div className="flex justify-center pt-3 pb-1">
                        <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-neutral-600" />
                      </div>

                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-3">
                        <span className="font-semibold text-gray-900 dark:text-white">Choose emoji</span>
                        <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                          Done
                        </button>
                      </div>

                      {/* Free-type input */}
                      <div className="px-5 mb-3">
                        <input
                          type="text"
                          value={emojiInput}
                          onChange={e => handleEmojiInputChange(e.target.value)}
                          placeholder="Or type / paste any emoji"
                          className={INPUT_CLASS}
                          autoFocus
                        />
                      </div>

                      {/* Emoji grid */}
                      <div className="px-4 flex flex-wrap gap-1 overflow-y-auto max-h-56">
                        {EMOJI_LIST.map(e => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => pickEmoji(e)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-colors ${
                              catIcon === e
                                ? "bg-gray-200 dark:bg-neutral-700"
                                : "hover:bg-gray-100 dark:hover:bg-neutral-800"
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder={tab === "expense" ? "e.g. Pet care, Parking…" : tab === "income" ? "e.g. Bonus, Side job…" : "e.g. ETF, Crypto…"}
                required
                className={`flex-1 ${INPUT_SM_CLASS}`}
              />
            </div>

            <button
              type="submit"
              disabled={catAdding}
              className={`w-full ${tabColor.btn} text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity`}
            >
              {catAdding ? <Spinner size={4} /> : "Save category"}
            </button>
          </form>
        )}
      </div>

      {/* List */}
      {catsLoading && <div className="flex justify-center py-8"><Spinner size={8} /></div>}
      {!catsLoading && (
        <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
          {visibleCats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No custom {tab} categories yet.</p>
          ) : (
            visibleCats.map((cat, i) => (
              <div key={cat.categoryId}>
                {i > 0 && <div className="h-px bg-gray-100 dark:bg-neutral-800" />}
                <div className="bg-white dark:bg-neutral-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon || "🙂"}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                      {cat.isDefault && (
                        <span className="ml-2 text-xs text-gray-400 bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">built-in</span>
                      )}
                    </div>
                  </div>
                  {!cat.isDefault && (
                    <button onClick={() => handleDelete(cat.categoryId)} className="text-xs text-brand-red hover:underline px-2 py-1">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
