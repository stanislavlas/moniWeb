export function CategoryChips({ categories, selected, onSelect, colorMap = {} }) {
  function renderChip(cat) {
    const isActive = selected?.categoryId === cat.categoryId;
    const color    = colorMap[cat.categoryId];
    return (
      <button
        key={cat.categoryId ?? `cat-${cat.name}`}
        type="button"
        aria-pressed={isActive}
        onClick={() => onSelect(cat)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
          isActive
            ? ""
            : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700"
        }`}
        style={isActive && color ? {
          backgroundColor: color + "20",
          borderColor: color,
          color,
        } : undefined}
      >
        {cat.icon ? `${cat.icon} ` : ""}{cat.name}
      </button>
    );
  }

  return (
    <div className="overflow-y-auto thin-scrollbar max-h-28 pr-1">
      <div className="flex flex-wrap gap-2">
        {categories.map(renderChip)}
      </div>
    </div>
  );
}
