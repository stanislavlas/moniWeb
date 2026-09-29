# AGENTS.md

## Version bumping

This repo is a Home Assistant add-on. HA detects updates by comparing the `version` field in `config.yaml`.

**Before every commit:**
1. Determine the appropriate version bump based on the change:
   - `PATCH` (x.x.1) — bug fixes, config tweaks, documentation
   - `MINOR` (x.1.0) — new features, non-breaking changes
   - `MAJOR` (2.0.0) — breaking changes
2. Propose the new version to the user: "I'll bump the version from `1.0.0` to `1.0.1` (patch — reason). OK?"
3. Wait for confirmation or override before committing.
4. Bump **both** files in the same commit:
   - `package.json` — `"version"` field
   - `config.yaml` — `version` field

---

## Code structure

```
src/
  App.jsx               # Root: owns useAuth, useTheme; renders AuthPage or routed app
  main.jsx              # Vite entry — mounts <App /> inside <BrowserRouter>/<ErrorBoundary>/<HouseholdProvider>/<CategoriesProvider>
  pages/                # One file per route; receive props from App.jsx
  components/           # Reusable UI (no data-fetching); account/ subdirectory for AccountPage sections
  hooks/                # Custom hooks; own their state and expose it via return values
  contexts/             # React Context wrappers around hooks (HouseholdContext, CategoriesContext)
  services/             # Raw API calls only — thin wrappers around authRequest()
  utils/                # Pure helpers: money.js, logger.js, styles.js, entryEvents.js
```

### State management
No Redux or Zustand. State lives in hooks (`useState`/`useCallback`) and is shared up through props or via React Context.

- **`useAuth`** (App.jsx) — source of truth for `user`. On session restore, immediately renders from `localStorage`, then fires `getProfile()` in the background to sync server state.
- **`HouseholdContext`** / **`CategoriesContext`** — wrap their respective hooks so deeply nested components can read household/category data without prop-drilling. Load is triggered by `App.jsx` after auth, not on mount.
- All other hooks (`useHousehold`, `useCategories`, `useCurrencies`, `useMonthCache`) are consumed locally.

### Services layer (`src/services/`)
Each file maps to one API resource. All calls go through `authRequest()` from `auth.js`, which handles token refresh and 401 auto-logout automatically. Services are **pure functions** — no state, no side effects beyond the network call.

```js
// Pattern for every service call:
export function listEntries(yearMonth, household = false) {
  return authRequest(`/api/entries?...`);
}
```

### Adding a new page
1. Create `src/pages/MyPage.jsx` — accept props, no direct API calls.
2. Add a `<Route>` in `App.jsx` wrapped in `<PrivateRoute>`.
3. Add a nav link in `NavBar.jsx`.

### Adding a new service call
1. Add a function to the relevant file in `src/services/`.
2. If state management is needed, add a `useCallback` wrapper in the matching hook in `src/hooks/`.

### Money / formatting
Always use the helpers in `src/utils/money.js`:
- `getAmount(entry)` — extracts numeric value from `{ value, currency }` or plain number shapes.
- `formatCurrency(value, currency)` — `Intl.NumberFormat` with per-currency formatter cache.
- `sumEntriesByType(entries)`, `sumNecessity(entries)` — never re-implement these inline.

### Logging
Use `logger` from `src/utils/logger.js`. Never use `console.log` directly.
```js
logger.info('entries', 'fetching month data');
logger.warn('auth', 'token expired');
logger.error('household', 'load failed', e.message);
```
