'use client';

import { useEffect, useState } from 'react';
import { lsGet, lsSet } from '@/components/quran/data';

export type Last = { dir: string; ki: number; bi: number; label: string };
export type Fav = { id: string; dir: string; ki: number; bi: number; book: string; where: string; t: string; at: number };

const FAV = 'ilm.fav';
const LAST = 'ilm.last';

export const getLast = () => lsGet<Last | null>(LAST, null);
export const setLast = (l: Last) => lsSet(LAST, l);
export const getFavs = () => lsGet<Fav[]>(FAV, []);

function saveFavs(f: Fav[]) {
  lsSet(FAV, f);
  try {
    window.dispatchEvent(new Event('ilm-fav'));
  } catch {}
}
export function toggleFav(f: Omit<Fav, 'at'>) {
  const cur = getFavs();
  if (cur.some((x) => x.id === f.id)) saveFavs(cur.filter((x) => x.id !== f.id));
  else saveFavs([{ ...f, t: f.t.slice(0, 1500), at: Date.now() }, ...cur].slice(0, 500));
}
export function removeFav(id: string) {
  saveFavs(getFavs().filter((x) => x.id !== id));
}

export function useFavs(): Fav[] {
  const [f, setF] = useState<Fav[]>([]);
  useEffect(() => {
    const up = () => setF(getFavs());
    up();
    window.addEventListener('ilm-fav', up);
    return () => window.removeEventListener('ilm-fav', up);
  }, []);
  return f;
}
