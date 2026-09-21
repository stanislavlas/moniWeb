export function CurrencyPicker({ value, onChange, currencies = [] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green w-full"
    >
      {currencies.length === 0
        ? <option value={value}>{value}</option>
        : currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)
      }
    </select>
  );
}
