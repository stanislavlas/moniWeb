import { useState, useCallback, useEffect, useRef } from "react";
import { listEntries, listActiveMonths } from "../services/entries.js";
import { entryEvents } from "../utils/entryEvents.js";
import { recentMonths } from "../utils/money.js";
import { logger } from "../utils/logger.js";

/**
 * Shared hook that manages a per-month entry cache for MonthOverviewPage and HistoryPage.
 *
 * Provides:
 *   - activeMonths  — sorted YYYY-MM list for the scroller
 *   - monthCache    — { [YYYY-MM]: { entries, loading, error } }
 *   - fetchMonth(ym) — fetch a single month on demand (idempotent)
 *
 * Automatically:
 *   - Fetches the list of months with data from the API
 *   - Invalidates a month when entryEvents fires for a date in that month
 *   - Resets all state when showHousehold toggles
 */
export function useMonthCache(showHousehold) {
  const [activeMonths, setActiveMonths] = useState(() => recentMonths(3));
  const [monthCache, setMonthCache]     = useState({});
  const fetchedMonths                   = useRef(new Set());

  // Fetch the list of months that have data; merge with recent window
  useEffect(() => {
    let cancelled = false;
    listActiveMonths(showHousehold)
      .then(data => {
        if (cancelled) return;
        const recent = new Set(recentMonths(3));
        const all = new Set([...(Array.isArray(data) ? data : []), ...recent]);
        const sorted = [...all].sort((a, b) => b.localeCompare(a));
        logger.info('cache', `activeMonths loaded: ${sorted.length} months (household=${showHousehold})`);
        setActiveMonths(sorted);
      })
      .catch((e) => {
        logger.warn('cache', 'Failed to load activeMonths — keeping seed', e?.message);
      });
    return () => { cancelled = true; };
  }, [showHousehold]);

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

  // Reset everything when household toggle changes
  useEffect(() => {
    logger.info('cache', `household toggle changed (${showHousehold}) — resetting cache`);
    setMonthCache({});
    fetchedMonths.current = new Set();
    setActiveMonths(recentMonths(3));
  }, [showHousehold]);

  // Invalidate a month when an entry in that month is mutated.
  // fetchMonth is included so the closure always has the current showHousehold value.
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
      setActiveMonths(prev =>
        prev.includes(ym) ? prev : [...prev, ym].sort((a, b) => b.localeCompare(a))
      );
    });
  }, [fetchMonth]);

  return { activeMonths, monthCache, fetchMonth };
}
