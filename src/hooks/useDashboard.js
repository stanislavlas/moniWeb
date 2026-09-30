import { useState, useCallback, useEffect, useRef } from "react";
import { getDashboard } from "../services/dashboard.js";
import { listActiveMonths } from "../services/entries.js";
import { entryEvents } from "../utils/entryEvents.js";
import { recentMonths } from "../utils/money.js";
import { logger } from "../utils/logger.js";

const LOAD_MORE_STEP = 6;

/**
 * Per-month dashboard cache backed by the GET /api/dashboard endpoint.
 *
 * Provides:
 *   - activeMonths          — sorted YYYY-MM[] for the month scroller (visible slice)
 *   - dashboardCache        — { [YYYY-MM]: { data, loading, error } }
 *   - fetchDashboard(ym)    — fetch a single month on demand (idempotent)
 *   - hasMoreMonths         — true when there are hidden months still to reveal
 *   - loadMoreMonths()      — reveal the next LOAD_MORE_STEP months
 *
 * @param {boolean} showHousehold
 * @param {number}  initialLimit  — how many months to show initially (default 6)
 *
 * Automatically:
 *   - Fetches all active months list on mount / household toggle
 *   - Invalidates a month when entryEvents fires for a date in that month
 *   - Resets all state when showHousehold toggles
 */
export function useDashboard(showHousehold, initialLimit = 6) {
  const [allMonths, setAllMonths]       = useState([]);
  const [visibleCount, setVisibleCount] = useState(initialLimit);
  const [dashboardCache, setDashboardCache] = useState({});
  const [hasMoreMonths, setHasMoreMonths] = useState(false);
  const fetchedMonths = useRef(new Set());

  // Derive the visible slice from allMonths + visibleCount
  const activeMonths = allMonths.slice(0, visibleCount);

  // Sync visibleCount + hasMoreMonths when initialLimit is measured/updated
  useEffect(() => {
    setVisibleCount(initialLimit);
    setHasMoreMonths(allMonths.length > initialLimit);
  }, [initialLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch the list of months that have data; merge with recent window.
  // Reset the cache first so the reset and fetch are atomic within one effect,
  // eliminating the race where a stale API response could overwrite the reset seed.
  useEffect(() => {
    logger.info("dashboard", `household toggle changed (${showHousehold}) — resetting dashboard cache`);
    setDashboardCache({});
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
        logger.info("dashboard", `activeMonths loaded: ${sorted.length} months (household=${showHousehold})`);
        setAllMonths(sorted);
        setHasMoreMonths(sorted.length > initialLimit);
      })
      .catch(e => {
        logger.warn("dashboard", "Failed to load activeMonths — keeping seed", e?.message);
      });
    return () => { cancelled = true; };
  }, [showHousehold]);

  // Reveal the next batch of months
  const loadMoreMonths = useCallback(() => {
    setVisibleCount(prev => {
      const next = prev + LOAD_MORE_STEP;
      setHasMoreMonths(next < allMonths.length);
      return next;
    });
    logger.info("dashboard", `loadMoreMonths: revealing next ${LOAD_MORE_STEP}`);
  }, [allMonths.length]);

  // Fetch dashboard data for a single month on demand — idempotent
  const fetchDashboard = useCallback(async (ym) => {
    if (fetchedMonths.current.has(ym)) return;
    fetchedMonths.current.add(ym);

    // Derive first/last day of the month from YYYY-MM
    const [y, mo] = ym.split("-");
    const fromDate = `${ym}-01`;
    const lastDay = new Date(Date.UTC(Number(y), Number(mo), 0)).getUTCDate();
    const toDate = `${ym}-${String(lastDay).padStart(2, "0")}`;

    logger.info("dashboard", `fetchDashboard: ${ym} (${fromDate} → ${toDate})`);
    setDashboardCache(prev => ({ ...prev, [ym]: { data: null, loading: true, error: null } }));
    try {
      const data = await getDashboard(fromDate, toDate, showHousehold);
      logger.info("dashboard", `fetchDashboard success: ${ym}`);
      setDashboardCache(prev => ({ ...prev, [ym]: { data, loading: false, error: null } }));
    } catch (err) {
      logger.error("dashboard", `fetchDashboard error: ${ym}`, err.message);
      fetchedMonths.current.delete(ym); // allow retry
      setDashboardCache(prev => ({ ...prev, [ym]: { data: null, loading: false, error: err.message } }));
    }
  }, [showHousehold]);

  // Invalidate a month when an entry in that month is mutated, then immediately re-fetch
  useEffect(() => {
    return entryEvents.subscribe(date => {
      if (!date) return;
      const ym = date.slice(0, 7);
      logger.info("dashboard", `invalidating dashboard cache: ${ym} (entry event)`);
      fetchedMonths.current.delete(ym);
      setDashboardCache(prev => {
        if (!prev[ym]) return prev;
        const next = { ...prev };
        delete next[ym];
        return next;
      });
      setAllMonths(prev =>
        prev.includes(ym) ? prev : [...prev, ym].sort((a, b) => b.localeCompare(a))
      );
      fetchDashboard(ym);
    });
  }, [fetchDashboard]);

  return { activeMonths, dashboardCache, fetchDashboard, hasMoreMonths, loadMoreMonths };
}

