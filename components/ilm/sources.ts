import { toAr } from '@/components/quran/data';

/**
 * محمّل موحّد لكل الكتب (كتب ← أبواب ← فقرات): ملفات index.json وk{n}.json، وكتب الحديث والسيرة من بياناتها الأصلية.
 * dir يميّز الكتاب: /library/<id>/ و/fiqh/ و/arkan/ (ملفات جاهزة) و/hadith/<id>/ و/sira/ (تُحوَّل عند القراءة).
 */
export type K = { t: string; b: number; n: number };
export type Bab = { t: string; e: string[] };
export type Kit = { t: string; b: Bab[] };

const jget = <T,>(u: string): Promise<T> => fetch(u).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(u))));
const memo = <T,>(m: Map<string, Promise<T>>, key: string, f: () => Promise<T>): Promise<T> => {
  let p = m.get(key);
  if (!p) {
    p = f();
    p.catch(() => m.delete(key));
    m.set(key, p);
  }
  return p;
};

const idxC = new Map<string, Promise<K[]>>();
const kitC = new Map<string, Promise<Kit>>();
const CH = 20; // أحاديث في كل «باب» من كتب الحديث

type HBook = { id: string; title: string; chapters: { id: number; t: string; n: number }[] };
let hIdx: Promise<HBook[]> | null = null;
const hbooks = () => (hIdx ||= jget<HBook[]>('/hadith/index.json').catch((e) => ((hIdx = null), Promise.reject(e))));
type SChap = { i: number; t: string; s: number };
let sIdx: Promise<{ chapters: SChap[] }> | null = null;
const sira = () => (sIdx ||= jget<{ chapters: SChap[] }>('/sira/index.json').catch((e) => ((sIdx = null), Promise.reject(e))));

export function loadIndex(dir: string): Promise<K[]> {
  return memo(idxC, dir, async () => {
    const hm = dir.match(/^\/hadith\/([^/]+)\/$/);
    if (hm) {
      const b = (await hbooks()).find((x) => x.id === hm[1]);
      if (!b) throw new Error('hadith');
      return b.chapters.map((c) => ({ t: c.t, b: Math.max(1, Math.ceil(c.n / CH)), n: c.n }));
    }
    if (dir === '/sira/') {
      const ch = (await sira()).chapters;
      const files = Math.max(...ch.map((c) => c.s)) + 1;
      return Array.from({ length: files }, (_, s) => {
        const mine = ch.filter((c) => c.s === s);
        const first = mine[0]?.t || '';
        return { t: `القسم ${toAr(s + 1)}: ${first.length > 44 ? first.slice(0, 43) + '…' : first}`, b: mine.length, n: mine.length * 12 };
      });
    }
    return jget<K[]>(`${dir}index.json`);
  });
}

export function loadKit(dir: string, ki: number): Promise<Kit> {
  return memo(kitC, `${dir}${ki}`, async () => {
    const hm = dir.match(/^\/hadith\/([^/]+)\/$/);
    if (hm) {
      const b = (await hbooks()).find((x) => x.id === hm[1])!;
      const c = b.chapters[ki];
      const items = await jget<[string, string][]>(`/hadith/${b.id}/${c.id}.json`);
      const secs: Bab[] = [];
      for (let i = 0; i < items.length; i += CH) {
        const part = items.slice(i, i + CH);
        secs.push({ t: items.length <= CH ? c.t : `${c.t} — الأحاديث ${toAr(i + 1)}–${toAr(i + part.length)}`, e: part.map(([n, t]) => `(${n}) ${t}`) });
      }
      return { t: c.t, b: secs };
    }
    if (dir === '/sira/') {
      const ch = (await sira()).chapters.filter((c) => c.s === ki);
      const arr = await jget<{ t: string; b: string[] }[]>(`/sira/s${ki}.json`);
      const idx = await loadIndex(dir);
      // فقرات السيرة: نص، أو شعر (قائمة أشطر)، أو عنوان فرعي {h}. تُرمَّز بحرف أول ليعرضها القارئ بشكلها
      const conv = (x: unknown): string => (typeof x === 'string' ? x : Array.isArray(x) ? '\u0002' + x.join(' ... ') : '\u0001' + String((x as { h?: string }).h || ''));
      return { t: idx[ki].t, b: arr.map((c) => ({ t: c.t, e: (c.b as unknown[]).map(conv).filter((x) => x.length > 1) })).filter(() => ch.length > 0) };
    }
    return jget<Kit>(`${dir}k${ki}.json`);
  });
}
