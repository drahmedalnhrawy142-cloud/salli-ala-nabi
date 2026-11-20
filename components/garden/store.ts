'use client';

import { bumpAct } from '@/components/weekStats';

/**
 * بستانك: يكبر مع كل ذكر.
 *  - total: أذكار السبحة والأذكار وسبحة البستان (الصلاة على النبي تُضاف من عدّادها الأصلي prayer_personal_count)
 *  - palm: عدد مرات «سبحان الله العظيم وبحمده» (نخلة لكل مرة، كما في الحديث)
 *  - ikhlas: عدد مرات قراءة «قل هو الله أحد» (قصر لكل عشر)
 *  - f: عدّادات غراس الجنة الأربعة
 *  - houses: أيام صلاة ١٢ ركعة سنة (بيت لكل يوم)
 */
export type GState = {
  t: number;
  palm: number;
  ikhlas: number;
  f: { sub: number; hamd: number; tahl: number; akbar: number };
  houses: string[];
};

const KEY = 'garden_v1';
export const GARDEN_EVENT = 'garden-change';

const EMPTY: GState = { t: 0, palm: 0, ikhlas: 0, f: { sub: 0, hamd: 0, tahl: 0, akbar: 0 }, houses: [] };

export function gardenRead(): GState {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && typeof v === 'object') {
      return { ...EMPTY, ...v, f: { ...EMPTY.f, ...(v.f || {}) }, houses: Array.isArray(v.houses) ? v.houses : [] };
    }
  } catch {}
  return { ...EMPTY, f: { ...EMPTY.f }, houses: [] };
}

function write(s: GState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(GARDEN_EVENT));
  } catch {}
}

/** ذكر عادي من أي عدّاد في التطبيق (يزيد البستان دون تخصيص) */
export function gardenAdd(n = 1) {
  stamp();
  bumpAct('d', n);
  const s = gardenRead();
  s.t += n;
  write(s);
}

/** آخر يوم زِيد فيه البستان (لرسالة العتاب اللطيف عند الغياب) */
export const LAST_KEY = 'garden_last';
type GNative = { gardenSet?: (o: { on?: boolean; min?: number; last?: string }) => Promise<void>; gardenStatus?: () => Promise<{ on: boolean; min: number }> };
/** إضافة الأندرويد (غير موجودة في المتصفح) */
export function gardenNative(): GNative | null {
  try {
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { FloatingButton?: GNative } } };
    if (!w.Capacitor?.isNativePlatform?.()) return null;
    return w.Capacitor.Plugins?.FloatingButton ?? null;
  } catch {
    return null;
  }
}
let syncTimer: ReturnType<typeof setTimeout> | undefined;
function stamp() {
  const k = todayKey();
  try {
    if (localStorage.getItem(LAST_KEY) === k) return;
    localStorage.setItem(LAST_KEY, k);
  } catch {}
  // أبلغ الأندرويد أن اليوم ذُكر فيه الله فلا يُرسل عتابًا
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    gardenNative()?.gardenSet?.({ last: k })?.catch?.(() => {});
  }, 800);
}
/** عدد الأيام منذ آخر ذكر؛ null إن لم يبدأ بعد */
export function daysAway(): number | null {
  try {
    const l = localStorage.getItem(LAST_KEY);
    if (!l) return null;
    const [y, m, d] = l.split('-').map(Number);
    const a = new Date(y, m - 1, d).getTime();
    const n = new Date();
    const b = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    return Math.max(0, Math.round((b - a) / 86400000));
  } catch {
    return null;
  }
}

export type GKind = 'palm' | 'ikhlas' | 'sub' | 'hamd' | 'tahl' | 'akbar';

/** نقرة من سبحة البستان */
export function gardenTap(kind: GKind) {
  stamp();
  bumpAct('d', 1);
  const s = gardenRead();
  s.t += 1;
  if (kind === 'palm') s.palm += 1;
  else if (kind === 'ikhlas') s.ikhlas += 1;
  else s.f[kind] += 1;
  write(s);
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function gardenToggleHouse() {
  const s = gardenRead();
  const k = todayKey();
  s.houses = s.houses.includes(k) ? s.houses.filter((x) => x !== k) : [...s.houses, k];
  write(s);
}

export function salawatTotal(): number {
  try {
    return Number(localStorage.getItem('prayer_personal_count') || 0) || 0;
  } catch {
    return 0;
  }
}

export type GView = {
  /** إجمالي الأذكار التي تُنمي البيئة (ماء وعشب وورود…) */
  N: number;
  palms: number;
  palaces: number;
  houses: number;
  /** غراس الجنة (شجر مثمر): لكل ٣٣ من الأذكار الأربعة */
  trees: number;
  s: GState;
};

export function gardenView(s: GState = gardenRead()): GView {
  const four = s.f.sub + s.f.hamd + s.f.tahl + s.f.akbar;
  return {
    N: s.t + salawatTotal(),
    palms: s.palm,
    palaces: Math.floor(s.ikhlas / 10),
    houses: s.houses.length,
    trees: Math.floor(four / 33),
    s,
  };
}

/** مراحل تظهر عند بلوغ عدد معيّن من إجمالي الأذكار */
export const MILESTONES: { at: number; text: string }[] = [
  { at: 25, text: 'ينبت العشب على الأرض' },
  { at: 100, text: 'يجري نهر من ماء' },
  { at: 250, text: 'تتفتح الورود' },
  { at: 400, text: 'تحلّق الطيور في سمائك' },
  { at: 600, text: 'تنبع عين ماء' },
  { at: 1500, text: 'يلمع الذهب على الدروب' },
  { at: 2000, text: 'يجري نهر من لبن' },
  { at: 4000, text: 'يجري نهر من عسل مصفّى' },
  { at: 7000, text: 'تتكاثف الأنوار فوق البستان' },
];
