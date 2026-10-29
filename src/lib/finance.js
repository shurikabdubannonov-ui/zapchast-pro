export function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}
export function calculateSale(items) {
  const total = items.reduce((s, item) => s + Number(item.qty || 0) * Number(item.price || 0), 0);
  const costTotal = items.reduce((s, item) => s + Number(item.qty || 0) * Number(item.cost || 0), 0);
  return { total, costTotal, grossProfit: total - costTotal };
}
export function formatUSD(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value) || 0);
}
