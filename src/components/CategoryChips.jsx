import { useEffect, useRef } from "react";

export function CategoryChips({ categories, selected, onSelect, colorMap = {} }) {
  const scrollerRef = useRef(null);

  // Must be non-passive so preventDefault() actually suppresses vertical page scroll.
  // React's synthetic onWheel is passive by default (since React 17), so we wire it up
  // manually with { passive: false } instead.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY + e.deltaX;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const topRow    = categories.filter((_, i) => i % 2 === 0);
  const bottomRow = categories.filter((_, i) => i % 2 !== 0);

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
    <div ref={scrollerRef} className="overflow-x-auto thin-scrollbar pb-1">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 w-max">{topRow.map(renderChip)}</div>
        <div className="flex gap-2 w-max">{bottomRow.map(renderChip)}</div>
      </div>
    </div>
  );
}
