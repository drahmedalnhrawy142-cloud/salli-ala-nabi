/**
 * مطابقة التسميع الصوتي: يقارن الكلمات التي سمعها التعرّف على الكلام بكلمات الآيات المطلوبة.
 * التعرّف على الكلام يعيد نصًّا إملائيًّا بلا تشكيل، فنطابق على الرسم الإملائي (simple.json) بعد توحيد الحروف،
 * ونعرض للمستخدم النص العثماني نفسه. التطبيق يتسامح مع فروق النطق البسيطة (حرف في الكلمة الطويلة).
 */
export const norm = (w: string) =>
  w
    .replace(/[ً-ٰٟۖ-ۭـ‌‍]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/[^ء-ي]/g, '');

function lev(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** حروف يخلط بينها التعرّف الآلي كثيرًا (ض/ظ، ذ/ز، ث/س، ص/س، ط/ت، ق/ك، غ/خ، ح/ه): نوحّدها عند المقارنة فقط لئلا نظلم القارئ بخطأ الجهاز */
const SOFT: Record<string, string> = { ض: 'ظ', ذ: 'ز', ث: 'س', ص: 'س', ط: 'ت', ق: 'ك', غ: 'خ', ح: 'ه' };
const soft = (w: string) => w.replace(/[ضذثصطقغح]/g, (c) => SOFT[c]);

/** هل الكلمة المسموعة هي الكلمة المطلوبة (بتسامح محسوب)؟ */
export function same(heard: string, want: string): boolean {
  if (!heard || !want) return false;
  if (heard === want) return true;
  const sh = soft(heard);
  const sw = soft(want);
  if (sh === sw) return true;
  const len = Math.max(heard.length, want.length);
  if (len <= 3) return false;
  const tol = Math.floor((len - 1) / 4);
  return lev(heard, want) <= tol || lev(sh, sw) <= tol;
}

/** وحدة مطلوبة: كلمة عثمانية واحدة وهدفها الإملائي */
export type Unit = { ai: number; k: number; t: string };
/** حالة الكلمة: 0 لم تُقل بعد، 1 صحيحة، 2 خاطئة، 3 فاتتك (قفزتَ عنها) */
export type Res = { p: number; st: number[]; heard: string[]; bas: boolean };

export const emptyRes = (n: number): Res => ({ p: 0, st: new Array(n).fill(0), heard: new Array(n).fill(''), bas: false });

/** يقسّم رسمًا إملائيًّا على كلمات عثمانية (61 آية فقط يختلف عدد كلماتها بين الرسمين) */
export function unitsForAyah(ai: number, uth: string, simple: string): Unit[] {
  const uw = uth.split(' ');
  const sw = simple.split(' ').map(norm).filter(Boolean);
  const out: Unit[] = [];
  if (uw.length === sw.length) {
    uw.forEach((_, k) => out.push({ ai, k, t: sw[k] }));
    return out;
  }
  let j = 0;
  for (let k = 0; k < uw.length; k++) {
    const want = norm(uw[k]).length;
    let t = '';
    while (j < sw.length && (t.length < want || k === uw.length - 1) && !(t && t.length >= want)) t += sw[j++];
    out.push({ ai, k, t: t || norm(uw[k]) });
  }
  return out;
}

const BASM = ['بسم', 'الله', 'الرحمن', 'الرحيم'];

/**
 * يطبّق ما سمعه التعرّف (كل كلمات الجلسة الحالية) على حالة البداية ويعيد الحالة الجديدة.
 * final=false: نتيجة مؤقتة قد تتغيّر، فلا نحكم بالخطأ على كلمة لم تطابق (ننتظر) بل نتوقف عندها.
 */
export function align(units: Unit[], base: Res, spoken: string[], skipBasmala: boolean, final = true): Res {
  const n = units.length;
  const r: Res = { p: base.p, st: base.st.slice(), heard: base.heard.slice(), bas: base.bas };
  let H = spoken.map(norm).filter(Boolean);
  const raw = spoken.filter((w) => norm(w));
  if (skipBasmala && base.p === 0) {
    let i = 0;
    while (i < H.length && i < 4 && same(H[i], BASM[i])) i++;
    if (i >= 2) {
      H = H.slice(i);
      raw.splice(0, i);
      r.bas = true;
    }
  }
  for (let j = 0; j < H.length && r.p < n; j++) {
    const h = H[j];
    let hit = -1;
    let used = 1;
    let span = 1;
    for (let k = 0; k < 4 && r.p + k < n; k++) {
      const t = units[r.p + k].t;
      // لا نقفز إلى كلمة قصيرة شائعة (من، في، ما…) فقد تكون صدفة: القفز مسموح إلى كلمة مميّزة فقط
      if (k > 0 && t.length < 4) continue;
      if (same(h, t)) {
        hit = k;
        break;
      }
      if (j + 1 < H.length && same(h + H[j + 1], t)) {
        hit = k;
        used = 2;
        break;
      }
      // كلمة واحدة مسموعة تغطي كلمتين متتاليتين (التعرّف يدمجهما أحيانًا)
      if (k === 0 && r.p + 1 < n && h.length >= 6 && (h === t + units[r.p + 1].t || soft(h) === soft(t + units[r.p + 1].t))) {
        hit = 0;
        span = 2;
        break;
      }
    }
    if (hit >= 0) {
      for (let q = 0; q < hit; q++) r.st[r.p + q] = 3;
      for (let q = 0; q < span; q++) r.st[r.p + hit + q] = 1;
      r.p += hit + span;
      j += used - 1;
      continue;
    }
    // كلمة زائدة (ضجيج أو تردد): إن كانت التي بعدها هي المطلوبة نتجاهلها
    // (إن كانت التي بعدها تطابق الكلمة التالية فهذه إبدال لا ضجيج: تُعدّ خطأً)
    if (j + 1 < H.length && same(H[j + 1], units[r.p].t)) continue;
    // كلمة قصيرة جدًّا لا تطابق: غالبًا ضجيج، لا نحاسب عليها
    if (h.length <= 2) continue;
    // نتيجة مؤقتة: ننتظر التثبيت بدل الحكم بالخطأ
    if (!final) break;
    r.st[r.p] = 2;
    r.heard[r.p] = raw[j];
    r.p += 1;
  }
  return r;
}
