export function CategoryChips({ categories, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => (
        <button
          key={cat.categoryId ?? cat.name}
          type="button"
          onClick={() => onSelect(cat)}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
            selected?.categoryId === cat.categoryId
              ? "bg-brand-green text-white border-brand-green"
              : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700"
          }`}
        >
          {cat.icon ? `${cat.icon} ` : ""}{cat.name}
        </button>
      ))}
    </div>
  );
}
