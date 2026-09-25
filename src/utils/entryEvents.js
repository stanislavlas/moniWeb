/**
 * Lightweight pub/sub for entry mutation events.
 * Allows MonthOverviewPage and YearOverviewPage to invalidate their
 * per-period caches when entries are added, edited, or deleted.
 *
 * Usage:
 *   // Emit after a mutation, passing the entry date ("YYYY-MM-DD")
 *   entryEvents.emit("2024-03-15");
 *
 *   // Listen in a component
 *   useEffect(() => {
 *     const unsub = entryEvents.subscribe(date => { ... });
 *     return unsub;
 *   }, []);
 */
const listeners = new Set();

export const entryEvents = {
  /** Notify all listeners that an entry on [date] was mutated. */
  emit(date) {
    listeners.forEach(fn => { try { fn(date); } catch {} });
  },
  /** Subscribe to mutation events. Returns an unsubscribe function. */
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
