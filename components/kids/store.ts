'use client';

import { useEffect, useState } from 'react';

/** حالة الأطفال على الجهاز فقط (بلا خادم): نجوم، وعدّادات اليوم، وأيام اللعب، والمهام المستلمة. */
export type Kids = { stars: number; day: string; plays: number; tasbih: number; claimed: string[]; days: string[] };
const KEY = 'kg.v2';
const OLD = 'kg.v1';
const EV = 'kg-change';
const today = () => new Date().toISOString().slice(0, 10);

function load(): Kids {
  const t = today();
  let k: Kids = { stars: 0, day: t, plays: 0, tasbih: 0, claimed: [], days: [] };
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && typeof v.stars === 'number') k = { ...k, ...v };
    else k.stars = Number(localStorage.getItem(OLD)) || 0; // ترحيل نجوم النسخة السابقة
  } catch {}
  if (k.day !== t) k = { ...k, day: t, plays: 0, tasbih: 0, claimed: [] };
  return k;
}
function save(k: Kids) {
  try {
    localStorage.setItem(KEY, JSON.stringify(k));
  } catch {}
  window.dispatchEvent(new Event(EV));
}

export function addStars(n: number) {
  const k = load();
  save({ ...k, stars: k.stars + n });
}
export function bump(kind: 'plays' | 'tasbih', n = 1) {
  const k = load();
  const days = k.days.includes(k.day) ? k.days : [...k.days, k.day].slice(-400);
  save({ ...k, days, [kind]: k[kind] + n });
}
export function claim(id: string, stars: number) {
  const k = load();
  if (k.claimed.includes(id)) return;
  save({ ...k, claimed: [...k.claimed, id], stars: k.stars + stars });
}
export function streakDays(days: string[]): number {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const key = new Date(d.getTime() - i * 86400000).toISOString().slice(0, 10);
    if (set.has(key)) n++;
    else if (i > 0) break;
  }
  return n;
}
export function useKids(): Kids {
  const [k, setK] = useState<Kids>({ stars: 0, day: '', plays: 0, tasbih: 0, claimed: [], days: [] });
  useEffect(() => {
    const f = () => setK(load());
    f();
    window.addEventListener(EV, f);
    return () => window.removeEventListener(EV, f);
  }, []);
  return k;
}
/** استراحة لطيفة: بعد هذا العدد من الإجابات في اليوم نقترح التوقف */
export const DAILY_BREAK = 40;
