export function CategoryChips({ categories, selected, onSelect, colorMap = {} }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => {
        const isActive = selected?.categoryId === cat.categoryId;
        const color = colorMap[cat.categoryId];
        return (
          <button
            key={cat.categoryId ?? cat.name}
            type="button"
            onClick={() => onSelect(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
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
      })}
    </div>
  );
}
