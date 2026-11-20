'use client';

/** سجل نشاط يومي خفيف (على الجهاز فقط) لحصاد الأسبوع: d = أذكار، q = صفحات ورد القرآن. */
const KEY = 'stats_days_v1';
type Day = { d?: number; q?: number };

export function dayKeyOf(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA');
}

export function readDays(): Record<string, Day> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function bumpAct(kind: 'd' | 'q', n = 1) {
  try {
    const all = readDays();
    const k = dayKeyOf();
    const row = all[k] || {};
    row[kind] = (row[kind] || 0) + n;
    all[k] = row;
    const keys = Object.keys(all).sort();
    while (keys.length > 120) delete all[keys.shift() as string];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}
