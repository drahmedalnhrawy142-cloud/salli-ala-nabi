/**
 * التلاوة الصوتية آية بآية. الملفات تُجلب من everyayah.com (تلاوات مجانية للاستماع) ولا تُضمَّن في التطبيق.
 * للاستماع بلا نت: يحمّل المستخدم السورة فتُخزَّن في مخزن المتصفح (Cache Storage) على جهازه.
 * حقوق التلاوات لأصحابها؛ التطبيق مجاني بلا إعلانات.
 */
export type Reciter = { id: string; name: string; folder: string };

export const RECITERS: Reciter[] = [
  { id: 'husary', name: 'محمود خليل الحصري (مرتل)', folder: 'Husary_64kbps' },
  { id: 'minshawy', name: 'محمد صديق المنشاوي (مرتل)', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'basit', name: 'عبد الباسط عبد الصمد (مرتل)', folder: 'Abdul_Basit_Murattal_64kbps' },
  { id: 'shuraim', name: 'سعود الشريم', folder: 'Saood_ash-Shuraym_128kbps' },
  { id: 'shatri', name: 'أبو بكر الشاطري', folder: 'Abu_Bakr_Ash-Shaatree_128kbps' },
];

const pad = (n: number, w = 3) => String(n).padStart(w, '0');
export const ayahUrl = (r: Reciter, s: number, a: number) => `https://everyayah.com/data/${r.folder}/${pad(s)}${pad(a)}.mp3`;

const CACHE = 'salli-audio-v1';

async function cacheOpen(): Promise<Cache | null> {
  try {
    return typeof caches !== 'undefined' ? await caches.open(CACHE) : null;
  } catch {
    return null;
  }
}

type CapHttp = { get?: (o: { url: string; responseType: string }) => Promise<{ status: number; data: string }> };
function capHttp(): CapHttp | null {
  try {
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { CapacitorHttp?: CapHttp } } };
    return w.Capacitor?.isNativePlatform?.() ? w.Capacitor.Plugins?.CapacitorHttp ?? null : null;
  } catch {
    return null;
  }
}

/** يجلب الملف: على الأندرويد عبر CapacitorHttp (يتجاوز قيود CORS)، وإلا fetch عادي */
async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const h = capHttp();
  if (h?.get) {
    const r = await h.get({ url, responseType: 'blob' });
    if (r.status !== 200) throw new Error('http ' + r.status);
    const bin = atob(r.data);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }
  const r = await fetch(url);
  if (!r.ok) throw new Error('http ' + r.status);
  return r.arrayBuffer();
}

/** مصدر التشغيل: الملف المحمَّل إن وُجد (بلا نت) وإلا الرابط المباشر */
export async function audioSrc(url: string): Promise<{ src: string; local: boolean }> {
  const c = await cacheOpen();
  if (c) {
    const m = await c.match(url);
    if (m) return { src: URL.createObjectURL(await m.blob()), local: true };
  }
  return { src: url, local: false };
}

export async function surahDownloaded(r: Reciter, s: number, n: number): Promise<boolean> {
  const c = await cacheOpen();
  if (!c) return false;
  // نتحقق من الآية الأولى والأخيرة فقط (سريع)، والتحميل نفسه يكمل أي نقص
  return !!(await c.match(ayahUrl(r, s, 1))) && !!(await c.match(ayahUrl(r, s, n)));
}

export async function downloadSurah(
  r: Reciter,
  s: number,
  n: number,
  onProgress: (done: number) => void,
  stop: { v: boolean },
): Promise<'ok' | 'stopped' | 'fail'> {
  const c = await cacheOpen();
  if (!c) return 'fail';
  let done = 0;
  for (let a = 1; a <= n; a++) {
    if (stop.v) return 'stopped';
    const url = ayahUrl(r, s, a);
    try {
      if (!(await c.match(url))) {
        const buf = await fetchBytes(url);
        await c.put(url, new Response(buf, { headers: { 'Content-Type': 'audio/mpeg' } }));
      }
      onProgress(++done);
    } catch {
      return 'fail';
    }
  }
  return 'ok';
}

export async function deleteSurah(r: Reciter, s: number, n: number) {
  const c = await cacheOpen();
  if (!c) return;
  for (let a = 1; a <= n; a++) await c.delete(ayahUrl(r, s, a));
}
