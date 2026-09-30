import { useEffect, useRef, useState } from "react";

// Tailwind px-3 = 12px × 2, border 1px × 2, content ~22px wide ≈ 50px per pill
// gap-2 = 8px, px-1 inner padding = 8px total
const PILL_WIDTH = 50;
const GAP        = 8;
const PADDING    = 8; // px-1 on the inner flex div

/**
 * Measures a container element and returns how many month pills fit in it.
 * Updates automatically when the container is resized.
 *
 * @param {React.RefObject} ref - ref attached to the overflow container div
 * @param {number} fallback     - value to use before first measurement (default 6)
 * @returns {number}
 */
export function useMonthScrollerCount(ref, fallback = 6) {
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const calculate = (width) => {
      const n = Math.floor((width - PADDING + GAP) / (PILL_WIDTH + GAP));
      setCount(Math.max(1, n));
    };

    // Initial measurement
    calculate(el.getBoundingClientRect().width);

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        calculate(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return count;
}
