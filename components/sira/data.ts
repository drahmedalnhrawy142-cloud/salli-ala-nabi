'use client';

/**
 * سيرة ابن هشام — النص من مكتبة OpenITI (مشروع KITAB) عن المكتبة الشاملة،
 * تحقيق مصطفى السقا وإبراهيم الأبياري وعبد الحفيظ الشلبي (ط٢ ١٣٧٥هـ/١٩٥٥م).
 * الترخيص: CC BY-NC-SA 4.0. البيانات مولّدة بـ tools/build_sira.py دون أي تعديل في الألفاظ.
 */
/** فقرة نثرية، أو بيت شعر [الشطر الأول، الشطر الثاني]، أو عنوان فصل فرعي */
export type Block = string | [string, string] | { h: string };
export type Chapter = { t: string; b: Block[] };
export type ChIdx = {
  i: number;
  t: string;
  /** [جزء الطبعة، صفحة] */
  pg: [number, number];
  /** رقم الشريحة وموضع الباب داخلها */
  s: number;
  o: number;
  /** [عنوان الفصل الفرعي، رقم الكتلة داخل الباب] */
  subs: [string, number][];
};
export type SiraIndex = {
  title: string;
  author: string;
  edition: string;
  source: string;
  license: string;
  shards: number;
  chapters: ChIdx[];
};

let idxCache: Promise<SiraIndex> | null = null;
const shardCache = new Map<number, Promise<Chapter[]>>();

export function loadSiraIndex(): Promise<SiraIndex> {
  if (!idxCache) {
    idxCache = fetch('/sira/index.json').then((r) => {
      if (!r.ok) throw new Error('sira index');
      return r.json() as Promise<SiraIndex>;
    });
    idxCache.catch(() => {
      idxCache = null;
    });
  }
  return idxCache;
}

export function loadShard(n: number): Promise<Chapter[]> {
  let p = shardCache.get(n);
  if (!p) {
    p = fetch(`/sira/s${n}.json`).then((r) => {
      if (!r.ok) throw new Error('sira shard');
      return r.json() as Promise<Chapter[]>;
    });
    p.catch(() => shardCache.delete(n));
    shardCache.set(n, p);
  }
  return p;
}

export async function loadChapter(ix: SiraIndex, i: number): Promise<Chapter> {
  const c = ix.chapters[i];
  const sh = await loadShard(c.s);
  return sh[c.o];
}

export function blockText(b: Block): string {
  return typeof b === 'string' ? b : Array.isArray(b) ? `${b[0]} ${b[1]}` : b.h;
}
