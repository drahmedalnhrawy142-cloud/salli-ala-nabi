'use client';

import { useEffect, useState } from 'react';
import { lsGet, lsSet } from '@/components/quran/data';

/** علامات الصفحات (الشريط المرجعي) وموضع القراءة في كل كتاب */
export type Mark = { id: string; dir: string; book: string; ki: number; bi: number; oi: number; off: number; where: string; t: string; at: number };
export type Pos = { ki: number; bi: number; oi: number; off: number };

const MARKS = 'bk.marks';
const POS = 'bk.pos';

export const getMarks = () => lsGet<Mark[]>(MARKS, []);
function saveMarks(m: Mark[]) {
  lsSet(MARKS, m);
  try {
    window.dispatchEvent(new Event('bk-marks'));
  } catch {}
}
export const addMark = (m: Omit<Mark, 'id' | 'at'>) => saveMarks([{ ...m, id: `${m.dir}|${m.ki}|${m.bi}|${m.oi}|${m.off}`, t: m.t.slice(0, 160), at: Date.now() }, ...getMarks()].slice(0, 300));
export const removeMark = (id: string) => saveMarks(getMarks().filter((x) => x.id !== id));
export function useMarks(): Mark[] {
  const [m, setM] = useState<Mark[]>([]);
  useEffect(() => {
    const up = () => setM(getMarks());
    up();
    window.addEventListener('bk-marks', up);
    return () => window.removeEventListener('bk-marks', up);
  }, []);
  return m;
}

export const getPos = (dir: string): Pos | null => lsGet<Record<string, Pos>>(POS, {})[dir] || null;
export const setPos = (dir: string, p: Pos) => lsSet(POS, { ...lsGet<Record<string, Pos>>(POS, {}), [dir]: p });
