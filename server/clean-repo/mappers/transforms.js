// server/mappers/transforms.js (ESM or CJS friendly)

export function normDate(s) {
  if (!s) return null;
  const str = String(s).trim();
  // Affinda standard often returns YYYY-MM-DD or YYYY-MM
  const ymd = str.match(/^(\d{4})[-/\.](\d{1,2})[-/\.](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${String(ymd[2]).padStart(2,'0')}`;
  const ym = str.match(/^(\d{4})[-/\.](\d{1,2})$/);
  if (ym) return `${ym[1]}-${String(ym[2]).padStart(2,'0')}`;
  const y = str.match(/^(19|20)\d{2}$/);
  if (y) return `${str}-01`;
  return null;
}

export function toBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v || '').trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1';
}

export function splitLines(text) {
  if (!text) return [];
  return String(text)
    .split(/\r?\n|•\s+/)
    .map(t => t.trim())
    .filter(Boolean);
}