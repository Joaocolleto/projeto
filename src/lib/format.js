const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export const brl = (n) => brlFmt.format(Number.isFinite(n) ? n : 0);
export const num = (n) => numFmt.format(Number.isFinite(n) ? n : 0);
export const pct = (n, d = 1) =>
  Number.isFinite(n) ? `${(n * 100).toFixed(d).replace('.', ',')}%` : '—';
export const units = (n) => (Number.isFinite(n) ? `${Math.ceil(n).toLocaleString('pt-BR')} un` : '—');

// Aceita "8,50", "8.50" e "1.234,56"
export function toNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v ?? '').trim();
  if (!s) return 0;
  const norm = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(norm);
  return Number.isFinite(n) ? n : 0;
}

export const daysSince = (iso) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

export const ageLabel = (d) => (d === 0 ? 'Hoje' : d === 1 ? 'Há 1 dia' : `Há ${d} dias`);
export const ageTone = (d) => (d <= 30 ? 'ok' : d <= 60 ? 'warn' : 'late');

export const dateBR = (iso) => new Date(iso).toLocaleDateString('pt-BR');

export const qtyLabel = (qty, unit) => `${num(qty)} ${unit}`;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function downloadCSV(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
