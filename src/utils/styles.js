/**
 * Shared Tailwind class constants for moniWeb.
 * Import these instead of repeating long class strings across pages.
 */

/** Standard full-width form input (used on auth, add, account, household pages). */
export const INPUT_CLASS =
  "w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 " +
  "rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 " +
  "outline-none focus:ring-2 focus:ring-brand-green";

/** Compact inline input (used inside forms with sibling elements, e.g. category add). */
export const INPUT_SM_CLASS =
  "bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 " +
  "rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 " +
  "outline-none focus:ring-2 focus:ring-brand-green";
