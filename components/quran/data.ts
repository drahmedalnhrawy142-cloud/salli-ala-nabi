'use client';

import { useEffect, useState } from 'react';

/** نص المصحف: مجمع الملك فهد لطباعة المصحف الشريف — رواية حفص عن عاصم (الرسم العثماني)، ترقيم مصحف المدينة (٦٠٤ صفحة). */
export type Sura = { n: number; name: string; ayas: number; page: number; juz: number };
/** [سورة، آية، صفحة، جزء، النص] */
export type Aya = [number, number, number, number, string];
export type QData = { suras: Sura[]; ayas: Aya[]; pageIndex: number[] };

let cache: Promise<QData> | null = null;
let simpleCache: Promise<string[]> | null = null;

export function loadQuran(): Promise<QData> {
  if (!cache) {
    cache = fetch('/quran/hafs.json').then((r) => {
      if (!r.ok) throw new Error('quran data');
      return r.json() as Promise<QData>;
    });
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

export function loadSimple(): Promise<string[]> {
  if (!simpleCache) {
    simpleCache = fetch('/quran/simple.json').then((r) => {
      if (!r.ok) throw new Error('quran simple');
      return r.json() as Promise<string[]>;
    });
    simpleCache.catch(() => {
      simpleCache = null;
    });
  }
  return simpleCache;
}

/** اختلاف شعبة عن حفص (كلاهما عن عاصم): آية، من كلمة، إلى كلمة (غير شاملة)، نص شعبة */
export type QV = { a: number; f: number; t: number; v: string };
let qvCache: Promise<QV[]> | null = null;
export function loadQiraat(): Promise<QV[]> {
  if (!qvCache) {
    qvCache = fetch('/quran/qiraat.json').then((r) => {
      if (!r.ok) throw new Error('qiraat');
      return r.json() as Promise<QV[]>;
    });
    qvCache.catch(() => {
      qvCache = null;
    });
  }
  return qvCache;
}

export function useQuran(): { data: QData | null; error: boolean } {
  const [data, setData] = useState<QData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    loadQuran()
      .then((d) => live && setData(d))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, []);
  return { data, error };
}

/** رقم → أرقام عربية-هندية */
export function toAr(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

/** تبسيط للبحث: إزالة التشكيل وتوحيد الألف والياء والتاء المربوطة */
export function norm(s: string): string {
  return s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/** اسم السورة بدون تشكيل زائد للعرض */
export function suraTitle(s: Sura): string {
  return `سورة ${s.name}`;
}

/** فهرس أول آية لكل صفحة */
export function pageAyas(d: QData, page: number): number[] {
  const a = d.pageIndex[page];
  const b = d.pageIndex[page + 1];
  const out: number[] = [];
  for (let i = a; i < b; i++) out.push(i);
  return out;
}

export function ayaIndex(d: QData, sura: number, aya: number): number {
  const s = d.suras[sura - 1];
  const first = d.pageIndex[s.page];
  for (let i = first; i < d.ayas.length; i++) {
    if (d.ayas[i][0] === sura && d.ayas[i][1] === aya) return i;
  }
  return -1;
}

export const BASMALA = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';

export function lsGet<T>(k: string, def: T): T {
  try {
    const v = localStorage.getItem(k);
    return v == null ? def : (JSON.parse(v) as T);
  } catch {
    return def;
  }
}
export function lsSet(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
