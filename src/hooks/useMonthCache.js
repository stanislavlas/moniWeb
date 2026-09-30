import { useState, useCallback, useEffect, useRef } from "react";
import { listEntries, listActiveMonths } from "../services/entries.js";
import { entryEvents } from "../utils/entryEvents.js";
import { recentMonths } from "../utils/money.js";
import { logger } from "../utils/logger.js";

const LOAD_MORE_STEP      = 6;

/**
 * Shared hook that manages a per-month entry cache for HistoryPage.
 *
 * Provides:
 *   - activeMonths     — visible YYYY-MM slice for the scroller
 *   - monthCache       — { [YYYY-MM]: { entries, loading, error } }
 *   - fetchMonth(ym)   — fetch a single month on demand (idempotent)
 *   - hasMoreMonths    — true when hidden months remain
 *   - loadMoreMonths() — reveal the next LOAD_MORE_STEP months (no extra API call)
 *
 * @param {boolean} showHousehold
 * @param {number}  initialLimit  — how many months to show initially (default 6)
 *
 * Automatically:
 *   - Fetches ALL months upfront on mount / household toggle
 *   - Invalidates a month when entryEvents fires for a date in that month
 *   - Resets all state when showHousehold toggles
 */
export function useMonthCache(showHousehold, initialLimit = 6) {
  const [allMonths, setAllMonths]       = useState(() => recentMonths(3));
  const [visibleCount, setVisibleCount] = useState(initialLimit);
  const [monthCache, setMonthCache]     = useState({});
  const [hasMoreMonths, setHasMoreMonths] = useState(false);
  const fetchedMonths                   = useRef(new Set());

  // Derive the visible slice
  const activeMonths = allMonths.slice(0, visibleCount);

  // Sync visibleCount + hasMoreMonths when initialLimit is measured/updated
  useEffect(() => {
    setVisibleCount(initialLimit);
    setHasMoreMonths(allMonths.length > initialLimit);
  }, [initialLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive the visible slice
  const activeMonths = allMonths.slice(0, visibleCount);

  // Fetch all months upfront; reset cache on household toggle.
  useEffect(() => {
    logger.info('cache', `household toggle changed (${showHousehold}) — resetting cache`);
    setMonthCache({});
    fetchedMonths.current = new Set();
    setAllMonths(recentMonths(3));
    setVisibleCount(initialLimit);
    setHasMoreMonths(false);

    let cancelled = false;
    listActiveMonths(showHousehold, 0)
      .then(data => {
        if (cancelled) return;
        const recent = new Set(recentMonths(3));
        const all = new Set([...(Array.isArray(data) ? data : []), ...recent]);
        const sorted = [...all].sort((a, b) => b.localeCompare(a));
        logger.info('cache', `activeMonths loaded: ${sorted.length} months (household=${showHousehold})`);
        setAllMonths(sorted);
        setHasMoreMonths(sorted.length > initialLimit);
      })
      .catch((e) => {
        logger.warn('cache', 'Failed to load activeMonths — keeping seed', e?.message);
      });
    return () => { cancelled = true; };
  }, [showHousehold]);

  // Reveal the next batch — no API call needed
  const loadMoreMonths = useCallback(() => {
    setVisibleCount(prev => {
      const next = prev + LOAD_MORE_STEP;
      setHasMoreMonths(next < allMonths.length);
      return next;
    });
    logger.info('cache', `loadMoreMonths: revealing next ${LOAD_MORE_STEP}`);
  }, [allMonths.length]);

  // Fetch a single month on demand — idempotent
  const fetchMonth = useCallback(async (ym) => {
    if (fetchedMonths.current.has(ym)) return;
    fetchedMonths.current.add(ym);
    logger.info('cache', `fetchMonth: ${ym}`);
    setMonthCache(prev => ({ ...prev, [ym]: { entries: [], loading: true, error: null } }));
    try {
      const data = await listEntries(ym, showHousehold);
      const entries = Array.isArray(data) ? data : [];
      logger.info('cache', `fetchMonth success: ${ym} — ${entries.length} entries`);
      setMonthCache(prev => ({ ...prev, [ym]: { entries, loading: false, error: null } }));
    } catch (err) {
      logger.error('cache', `fetchMonth error: ${ym}`, err.message);
      fetchedMonths.current.delete(ym); // allow retry on error
      setMonthCache(prev => ({ ...prev, [ym]: { entries: [], loading: false, error: err.message } }));
    }
  }, [showHousehold]);

  // Invalidate a month when an entry in that month is mutated, then immediately re-fetch
  useEffect(() => {
    return entryEvents.subscribe(date => {
      if (!date) return;
      const ym = date.slice(0, 7);
      logger.info('cache', `invalidating month: ${ym} (entry event)`);
      fetchedMonths.current.delete(ym);
      setMonthCache(prev => {
        if (!prev[ym]) return prev;
        const next = { ...prev };
        delete next[ym];
        return next;
      });
      setAllMonths(prev =>
        prev.includes(ym) ? prev : [...prev, ym].sort((a, b) => b.localeCompare(a))
      );
      fetchMonth(ym);
    });
  }, [fetchMonth]);

  return { activeMonths, monthCache, fetchMonth, hasMoreMonths, loadMoreMonths };
}
