const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function listCurrencies() {
  const res = await fetch(`${API_BASE}/api/currencies`);
  if (!res.ok) throw new Error(`Failed to load currencies: ${res.status}`);
  return res.json();
}
