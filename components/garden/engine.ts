import { clamp, lerp, mk, renderPalm, rng, type Ctx, type PalmBitmaps } from './palm';
import { drawFlowerClump, renderFruitTree, renderPalace, renderPavilion } from './sprites';
import type { GView } from './store';

/* ---------------- مواضع العناصر (نسبة من العرض/الارتفاع) ---------------- */
const PALM_SLOTS: { x: number; y: number; s: number }[] = [
  { x: 0.13, y: 0.94, s: 1.0 },
  { x: 0.87, y: 0.91, s: 0.92 },
  { x: 0.27, y: 0.7, s: 0.62 },
  { x: 0.74, y: 0.72, s: 0.6 },
  { x: 0.04, y: 0.74, s: 0.7 },
  { x: 0.97, y: 0.76, s: 0.68 },
  { x: 0.82, y: 0.5, s: 0.4 },
  { x: 0.18, y: 0.5, s: 0.4 },
  { x: 0.93, y: 0.52, s: 0.34 },
  { x: 0.07, y: 0.53, s: 0.34 },
  { x: 0.68, y: 0.48, s: 0.27 },
  { x: 0.32, y: 0.48, s: 0.27 },
  { x: 0.25, y: 0.97, s: 0.78 },
  { x: 0.76, y: 0.97, s: 0.78 },
];
export const MAX_PALMS = PALM_SLOTS.length;

const TREE_SLOTS: { x: number; y: number; s: number }[] = [
  { x: 0.2, y: 0.86, s: 0.44 },
  { x: 0.8, y: 0.88, s: 0.46 },
  { x: 0.36, y: 0.63, s: 0.34 },
  { x: 0.64, y: 0.64, s: 0.34 },
  { x: 0.1, y: 0.66, s: 0.4 },
  { x: 0.92, y: 0.68, s: 0.4 },
  { x: 0.3, y: 0.56, s: 0.26 },
  { x: 0.7, y: 0.56, s: 0.26 },
  { x: 0.5, y: 0.5, s: 0.2 },
  { x: 0.02, y: 0.9, s: 0.5 },
];
export const MAX_TREES = TREE_SLOTS.length;

const PALACE_SLOTS: { x: number; y: number; w: number }[] = [
  { x: 0.5, y: 0.462, w: 0.4 },
  { x: 0.17, y: 0.468, w: 0.27 },
  { x: 0.84, y: 0.468, w: 0.27 },
  { x: 0.33, y: 0.452, w: 0.19 },
  { x: 0.68, y: 0.452, w: 0.19 },
];
export const MAX_PALACES = PALACE_SLOTS.length;

const HOUSE_SLOTS: { x: number; y: number; w: number }[] = [
  { x: 0.06, y: 0.6, w: 0.17 },
  { x: 0.94, y: 0.61, w: 0.17 },
  { x: 0.4, y: 0.545, w: 0.12 },
  { x: 0.6, y: 0.545, w: 0.12 },
  { x: 0.16, y: 0.56, w: 0.11 },
  { x: 0.84, y: 0.565, w: 0.11 },
];
export const MAX_HOUSES = HOUSE_SLOTS.length;

const HORIZON = 0.44;

/* ---------------- مسار النهر ---------------- */
function riverC(t: number, W: number, H: number) {
  const y = H * (0.465 + 0.535 * t);
  const x = W * (0.5 - 0.06 * t + 0.055 * Math.sin(t * 5.1 + 0.4) * (0.25 + t));
  return { x, y };
}
function riverW(t: number, W: number, scale: number) {
  return W * (0.008 + 0.27 * Math.pow(t, 1.45)) * scale;
}

function riverPolys(W: number, H: number, scale: number) {
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  const n = 70;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const c = riverC(t, W, H);
    const w = riverW(t, W, scale) / 2;
    L.push([c.x - w, c.y]);
    R.push([c.x + w, c.y]);
  }
  return { L, R };
}

function polyPath(L: [number, number][], R: [number, number][], grow = 0): Path2D {
  const p = new Path2D();
  L.forEach(([x, y], i) => (i ? p.lineTo(x - grow, y) : p.moveTo(x - grow, y)));
  for (let i = R.length - 1; i >= 0; i--) p.lineTo(R[i][0] + grow, R[i][1]);
  p.closePath();
  return p;
}

function inRiver(px: number, py: number, W: number, H: number, scale: number, pad: number) {
  if (py < H * 0.465) return false;
  const t = (py / H - 0.465) / 0.535;
  const c = riverC(t, W, H);
  return Math.abs(px - c.x) < riverW(t, W, scale) / 2 + pad;
}

/* قنوات اللبن (يمين) والعسل (يسار) تصب في النهر */
const CANAL_Y = 0.585;
function canalPoint(side: -1 | 1, W: number, H: number, u: number) {
  const y = H * CANAL_Y;
  const t = (CANAL_Y - 0.465) / 0.535;
  const c = riverC(t, W, H);
  const x0 = side < 0 ? -6 : W + 6;
  const x1 = c.x;
  const cx = lerp(x0, x1, 0.5);
  return { x0, x1, y, cx, cy: y + (side < 0 ? 6 : -6) * u };
}

type Rec = {
  kind: 'palm' | 'tree';
  slot: { x: number; y: number; s: number };
  key: string;
  born: number;
  phase: number;
};
type Sprite = { c: HTMLCanvasElement; w: number; h: number; baseX: number; baseY: number; crownX?: number; crownY?: number; trunk?: HTMLCanvasElement };

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';
/** الوقت بحسب ساعة الجهاز: فجر ٥–٧، نهار ٧–١٧، غروب ١٧–١٩، ليل بعد ذلك */
export function currentPhase(d = new Date()): Phase {
  try {
    const f = (window as unknown as { __gardenPhase?: Phase }).__gardenPhase;
    if (f) return f;
  } catch {}
  const h = d.getHours();
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}

export class GardenScene {
  private cv: HTMLCanvasElement;
  private ctx: Ctx;
  private W: number;
  private H: number;
  private dpr: number;
  private statics: HTMLCanvasElement | null = null;
  private overlay: HTMLCanvasElement | null = null;
  private sig = '';
  private recs: Rec[] = [];
  private sprites = new Map<string, Sprite>();
  private pending: (() => void)[] = [];
  private timer = 0;
  private raf = 0;
  private running = false;
  private last = 0;
  private reduce = false;
  private v: GView | null = null;
  private river: Path2D | null = null;
  private lastPalms = -1;
  private lastTrees = -1;
  private spring: { x: number; y: number; r: number } | null = null;
  private birds: { x: number; y: number; v: number; p: number; s: number }[] = [];
  private sparks: { x: number; y: number; p: number; s: number }[] = [];
  private phase: Phase = 'day';
  private zoom = 0;
  private lights: { x: number; y: number; r: number }[] = [];
  private stars: { x: number; y: number; r: number; p: number }[] = [];

  constructor(cv: HTMLCanvasElement, W: number, H: number, dpr: number) {
    this.cv = cv;
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    this.ctx = cv.getContext('2d')!;
    this.reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const r = rng(9);
    for (let i = 0; i < 6; i++) this.birds.push({ x: r() * W, y: H * (0.08 + r() * 0.2), v: 8 + r() * 10, p: r() * 6, s: 0.8 + r() * 0.8 });
    for (let i = 0; i < 38; i++) this.sparks.push({ x: r() * W, y: H * (0.3 + r() * 0.65), p: r() * 6, s: 0.5 + r() * 1.3 });
    for (let i = 0; i < 90; i++) this.stars.push({ x: r() * W, y: r() * H * 0.4, r: 0.4 + r() * 1.1, p: r() * 6 });
    this.buildOverlay();
  }

  /* ---------- الطبقة العلوية: أشعة ضوء وتعتيم الأطراف ---------- */
  private buildOverlay() {
    const { W, H, dpr } = this;
    const o = mk(W, H, dpr);
    const x = o.x;
    // أشعة من أعلى اليسار
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const a0 = 0.2 + i * 0.13;
      const g = x.createLinearGradient(W * 0.1, 0, W * (0.1 + a0), H * 0.9);
      g.addColorStop(0, 'rgba(255,240,190,0.16)');
      g.addColorStop(1, 'rgba(255,240,190,0)');
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(W * 0.05, -10);
      x.lineTo(W * 0.14 + i * 4, -10);
      x.lineTo(W * (0.45 + a0 * 1.2) + 30, H);
      x.lineTo(W * (0.45 + a0 * 1.2) - 40, H);
      x.closePath();
      x.fill();
    }
    x.restore();
    const vg = x.createRadialGradient(W * 0.5, H * 0.56, H * 0.34, W * 0.5, H * 0.56, H * 0.82);
    vg.addColorStop(0, 'rgba(0,20,10,0)');
    vg.addColorStop(1, 'rgba(0,20,10,0.34)');
    x.fillStyle = vg;
    x.fillRect(0, 0, W, H);
    this.overlay = o.c;
  }

  /* ---------- عرض الحالة ---------- */
  setView(v: GView, now = performance.now()) {
    this.v = v;
    const N = v.N;
    const g = clamp(N / 250, 0, 1);
    const q = (a: number, b: number) => Math.round(a * b);
    const riverOn = N >= 100;
    const rs = riverOn ? 0.55 + 0.45 * clamp((N - 100) / 1500, 0, 1) : 0;
    const flowers = clamp((N - 250) / 1200, 0, 1);
    const ph = currentPhase();
    const sig = [
      ph,
      q(g, 30),
      riverOn ? q(rs, 20) : -1,
      q(flowers, 24),
      N >= 600 ? 1 : 0,
      N >= 1500 ? 1 : 0,
      N >= 2000 ? 1 : 0,
      N >= 4000 ? 1 : 0,
      Math.min(v.palaces, MAX_PALACES),
      Math.min(v.houses, MAX_HOUSES),
      Math.min(v.palms, MAX_PALMS),
      Math.min(v.trees, MAX_TREES),
      q(clamp(N / 3000, 0, 1), 8),
    ].join('|');
    if (sig === this.sig) return;
    this.sig = sig;
    this.phase = ph;

    // قائمة الأشجار
    const palms = Math.min(v.palms, MAX_PALMS);
    const trees = Math.min(v.trees, MAX_TREES);
    const grow = clamp(N / 3000, 0, 1);
    const recs: Rec[] = [];
    for (let i = 0; i < palms; i++) {
      const age = clamp(0.42 + 0.58 * grow - i * 0.015, 0.3, 1);
      const slot = PALM_SLOTS[i];
      const Hp = Math.round(this.H * 0.62 * slot.s);
      const ageQ = Math.round(age * 10) / 10;
      const key = `p${i}:${Hp}:${ageQ}`;
      recs.push({ kind: 'palm', slot, key, born: i === palms - 1 && palms > this.lastPalms && this.lastPalms >= 0 ? now : -1e9, phase: i * 1.7 });
      this.want(key, () => {
        const bm: PalmBitmaps = renderPalm(1000 + i * 77, ageQ, ageQ > 0.7 && i % 2 === 0, Hp, this.dpr, slot.s < 0.5 ? 1 : 0);
        return { c: bm.crown, trunk: bm.trunk, w: bm.w, h: bm.h, baseX: bm.baseX, baseY: bm.baseY, crownX: bm.crownX, crownY: bm.crownY };
      });
    }
    for (let i = 0; i < trees; i++) {
      const slot = TREE_SLOTS[i];
      const Ht = Math.round(this.H * 0.55 * slot.s);
      const key = `t${i}:${Ht}`;
      recs.push({ kind: 'tree', slot, key, born: i === trees - 1 && trees > this.lastTrees && this.lastTrees >= 0 ? now : -1e9, phase: i * 2.3 });
      this.want(key, () => {
        const t = renderFruitTree(300 + i * 31, Ht, this.dpr, (i % 2) as 0 | 1, slot.y < 0.6 ? 0.35 : 0);
        return { c: t.c, w: t.w, h: t.h, baseX: t.baseX, baseY: t.baseY };
      });
    }
    this.lastPalms = palms;
    this.lastTrees = trees;
    this.recs = recs;
    this.buildStatics(v);
    this.pump();
    this.drawFrame(now);
  }

  /* ---------- قائمة توليد الصور بالتتابع لتجنّب التجمّد ---------- */
  private want(key: string, make: () => Sprite) {
    if (this.sprites.has(key)) return;
    this.pending.push(() => {
      if (!this.sprites.has(key)) this.sprites.set(key, make());
    });
  }
  private pump() {
    if (this.timer || !this.pending.length) return;
    this.timer = window.setTimeout(() => {
      this.timer = 0;
      const job = this.pending.shift();
      if (job) job();
      this.drawFrame(performance.now());
      this.pump();
    }, 0);
  }
  /** يبني كل شيء فورًا (للاختبار) */
  flush() {
    while (this.pending.length) this.pending.shift()!();
    this.drawFrame(performance.now());
  }

  /* ---------- الطبقة الثابتة ---------- */
  private buildStatics(v: GView) {
    const { W, H, dpr } = this;
    const N = v.N;
    const g = clamp(N / 250, 0, 1);
    const S = mk(W, H, dpr);
    const x = S.x;
    const u = W / 390;
    this.lights = [];
    this.drawSky(x, W, H);
    this.drawHills(x, W, H, g);
    this.drawGround(x, W, H, g);

    const riverOn = N >= 100;
    const rs = riverOn ? 0.55 + 0.45 * clamp((N - 100) / 1500, 0, 1) : 0;
    const milk = N >= 2000;
    const honey = N >= 4000;
    this.river = null;
    if (milk) this.drawCanal(x, 1, W, H, u, 'milk');
    if (honey) this.drawCanal(x, -1, W, H, u, 'honey');
    if (riverOn) this.drawRiver(x, W, H, rs, N >= 1500 ? 0.25 : 0.0);

    // مسار ذهبي
    if (N >= 1500) this.drawGoldPath(x, W, H);

    // ورود
    const fl = clamp((N - 250) / 1200, 0, 1);
    if (fl > 0) this.drawFlowers(x, W, H, fl, rs, milk, honey, u);

    // عين الماء
    this.spring = null;
    if (N >= 600) {
      const sp = { x: W * 0.74, y: H * 0.585, r: W * 0.075 };
      // نتجنب اللبن على اليمين: العين على بعد من القناة
      sp.y = H * 0.64;
      this.spring = sp;
      this.drawSpringBase(x, sp);
    }

    // قصور وبيوت (من الأبعد إلى الأقرب)
    const haze = 0.28;
    const items: { y: number; draw: () => void }[] = [];
    for (let i = 0; i < Math.min(v.palaces, MAX_PALACES); i++) {
      const s = PALACE_SLOTS[i];
      const pw = Math.round(W * s.w);
      items.push({
        y: s.y,
        draw: () => {
          const bx = s.x * W;
          const by = s.y * H;
          // ظل القصر
          const sh = x.createRadialGradient(bx, by + 2, 0, bx, by + 2, pw * 0.6);
          sh.addColorStop(0, 'rgba(0,25,10,0.45)');
          sh.addColorStop(1, 'rgba(0,25,10,0)');
          x.save();
          x.translate(0, by);
          x.scale(1, 0.12);
          x.translate(0, -by);
          x.fillStyle = sh;
          x.fillRect(bx - pw * 0.7, by - pw, pw * 1.4, pw * 2);
          x.restore();
          this.lights.push({ x: bx, y: by - pw * 0.36, r: pw * 0.55 });
          const sp = renderPalace(pw, dpr, haze + (1 - s.w / 0.4) * 0.12, 3 + i);
          x.drawImage(sp, bx - pw / 2, by - pw * 0.86 + pw * 0.04, pw, pw * 0.86);
        },
      });
    }
    for (let i = 0; i < Math.min(v.houses, MAX_HOUSES); i++) {
      const s = HOUSE_SLOTS[i];
      const pw = Math.round(W * s.w);
      items.push({
        y: s.y,
        draw: () => {
          const bx = s.x * W;
          const by = s.y * H;
          x.fillStyle = 'rgba(0,25,10,0.3)';
          x.beginPath();
          x.ellipse(bx, by + 1, pw * 0.5, pw * 0.07, 0, 0, Math.PI * 2);
          x.fill();
          this.lights.push({ x: bx, y: by - pw * 0.4, r: pw * 0.5 });
          const sp = renderPavilion(pw, dpr, 0.12);
          x.drawImage(sp, bx - pw / 2, by - pw * 0.95, pw, pw * 1.05);
        },
      });
    }
    items.sort((a, b) => a.y - b.y).forEach((i) => i.draw());

    // ظلال الأشجار
    for (const r of [...this.recs].sort((a, b) => a.slot.y - b.slot.y)) {
      const bx = r.slot.x * W;
      const by = r.slot.y * H;
      const len = (r.kind === 'palm' ? H * 0.62 * 0.75 : H * 0.55 * 0.5) * r.slot.s;
      x.save();
      x.translate(bx, by);
      x.transform(1, 0, -0.9, 0.18, 0, 0);
      const gg = x.createLinearGradient(0, 0, len * 0.5, -len);
      gg.addColorStop(0, 'rgba(6,28,10,0.5)');
      gg.addColorStop(1, 'rgba(6,28,10,0)');
      x.fillStyle = gg;
      x.beginPath();
      x.ellipse(0, -len * 0.4, len * 0.1, len * 0.5, 0, 0, Math.PI * 2);
      x.fill();
      x.restore();
      x.fillStyle = 'rgba(6,28,10,0.32)';
      x.beginPath();
      x.ellipse(bx + len * 0.05, by + 2, len * 0.2, len * 0.04, 0, 0, Math.PI * 2);
      x.fill();
    }
    this.statics = S.c;
  }

  private drawSky(x: Ctx, W: number, H: number) {
    const ph = this.phase;
    const pal: Record<Phase, string[]> = {
      day: ['#3f93dc', '#86c4ee', '#cde9f1', '#fff0cc'],
      dawn: ['#35508f', '#9a7fb0', '#f0a58a', '#ffd9a0'],
      dusk: ['#2b3f7a', '#8a5d96', '#e8895a', '#ffc27a'],
      night: ['#050b1f', '#0a1634', '#132447', '#1d3358'],
    };
    const c = pal[ph];
    const g = x.createLinearGradient(0, 0, 0, H * 0.5);
    g.addColorStop(0, c[0]);
    g.addColorStop(0.35, c[1]);
    g.addColorStop(0.72, c[2]);
    g.addColorStop(1, c[3]);
    x.fillStyle = g;
    x.fillRect(0, 0, W, H * 0.55);
    if (ph === 'night') {
      for (const st of this.stars) {
        x.fillStyle = `rgba(255,250,230,${0.45 + 0.4 * Math.abs(Math.sin(st.p))})`;
        x.beginPath();
        x.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        x.fill();
      }
      // هلال القمر مع هالته
      const mx = W * 0.78;
      const my = H * 0.13;
      const mr = W * 0.06;
      const halo = x.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 6);
      halo.addColorStop(0, 'rgba(240,240,210,0.38)');
      halo.addColorStop(1, 'rgba(240,240,210,0)');
      x.fillStyle = halo;
      x.fillRect(mx - mr * 6, my - mr * 6, mr * 12, mr * 12);
      x.fillStyle = '#f4efd2';
      x.beginPath();
      x.arc(mx, my, mr, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#0a1634';
      x.beginPath();
      x.arc(mx + mr * 0.45, my - mr * 0.15, mr * 0.92, 0, Math.PI * 2);
      x.fill();
      return;
    }
    // وهج الشمس (عالية في النهار، قريبة من الأفق عند الفجر والغروب)
    const sx = ph === 'day' ? W * 0.16 : ph === 'dawn' ? W * 0.82 : W * 0.2;
    const sy = ph === 'day' ? H * 0.12 : H * 0.4;
    const sun = x.createRadialGradient(sx, sy, 0, sx, sy, W * 0.75);
    sun.addColorStop(0, 'rgba(255,250,224,1)');
    sun.addColorStop(0.06, 'rgba(255,244,200,0.95)');
    sun.addColorStop(0.2, ph === 'day' ? 'rgba(255,226,150,0.45)' : 'rgba(255,170,100,0.5)');
    sun.addColorStop(1, 'rgba(255,226,150,0)');
    x.fillStyle = sun;
    x.fillRect(0, 0, W, H * 0.6);
    // غيوم
    const r = rng(21);
    for (let i = 0; i < 7; i++) {
      const cx = r() * W;
      const cy = H * (0.05 + r() * 0.2);
      const sc = 0.6 + r() * 0.9;
      for (let k = 0; k < 14; k++) {
        const px = cx + (r() - 0.5) * 70 * sc;
        const py = cy + (r() - 0.5) * 12 * sc;
        const rad = (10 + r() * 20) * sc;
        const gg = x.createRadialGradient(px - rad * 0.2, py - rad * 0.3, 0, px, py, rad);
        gg.addColorStop(0, 'rgba(255,255,255,0.78)');
        gg.addColorStop(0.7, 'rgba(236,246,252,0.4)');
        gg.addColorStop(1, 'rgba(210,230,245,0)');
        x.fillStyle = gg;
        x.beginPath();
        x.arc(px, py, rad, 0, Math.PI * 2);
        x.fill();
      }
    }
  }

  private drawHills(x: Ctx, W: number, H: number, g: number) {
    const layers = [
      { base: 0.395, amp: 0.045, haze: 0.62, seed: 4 },
      { base: 0.42, amp: 0.035, haze: 0.42, seed: 7 },
      { base: 0.44, amp: 0.022, haze: 0.22, seed: 12 },
    ];
    for (const L of layers) {
      const r = rng(L.seed);
      const ph = [r() * 6, r() * 6, r() * 6];
      const col = (k: number) => {
        const sand = [196, 170, 118];
        const gr = [78, 138, 72];
        const c = sand.map((s, i) => lerp(s, gr[i], g));
        return c.map((v, i) => Math.round(lerp(v, [206, 232, 240][i], L.haze) * k + (1 - k) * 40));
      };
      const hg = x.createLinearGradient(0, H * (L.base - L.amp), 0, H * (HORIZON + 0.03));
      const c1 = col(1);
      const c2 = col(0.85);
      hg.addColorStop(0, `rgb(${c1})`);
      hg.addColorStop(1, `rgb(${c2})`);
      x.fillStyle = hg;
      x.beginPath();
      x.moveTo(0, H * 0.5);
      for (let px = 0; px <= W; px += 5) {
        const t = px / W;
        const y = H * L.base - H * L.amp * (0.5 + 0.5 * Math.sin(t * 5 + ph[0]) * 0.6 + 0.3 * Math.sin(t * 11 + ph[1]) + 0.2 * Math.sin(t * 23 + ph[2]));
        x.lineTo(px, y);
      }
      x.lineTo(W, H * 0.5);
      x.closePath();
      x.fill();
    }
  }

  private drawGround(x: Ctx, W: number, H: number, g: number) {
    const y0 = H * HORIZON;
    // رمل
    const sg = x.createLinearGradient(0, y0, 0, H);
    sg.addColorStop(0, '#d8c28e');
    sg.addColorStop(1, '#a98d55');
    x.fillStyle = sg;
    x.fillRect(0, y0, W, H - y0);
    const r = rng(33);
    for (let i = 0; i < 900; i++) {
      const px = r() * W;
      const py = y0 + (H - y0) * r();
      x.fillStyle = r() > 0.5 ? 'rgba(255,240,200,0.18)' : 'rgba(90,64,28,0.16)';
      x.fillRect(px, py, 1 + r() * 1.5, 1);
    }
    // عشب بقناع نمو
    const L = mk(W, H, this.dpr);
    const lg = L.x.createLinearGradient(0, y0, 0, H);
    lg.addColorStop(0, '#8db36a');
    lg.addColorStop(0.25, '#4e8a3a');
    lg.addColorStop(1, '#25601f');
    // القاعدة الخضراء تظهر تدريجيًا؛ في البداية تنبت أعشاب متفرقة فقط
    L.x.globalAlpha = clamp((g - 0.1) / 0.5, 0, 1);
    L.x.fillStyle = lg;
    L.x.fillRect(0, y0, W, H - y0);
    L.x.globalAlpha = 1;
    const br = rng(55);
    const blades = Math.round(3200 * (0.4 + 0.6 * g));
    for (let i = 0; i < blades; i++) {
      const gx = br() * W;
      const depth = Math.pow(br(), 0.8);
      const gy = y0 + (H - y0) * depth;
      const dz = (gy - y0) / (H - y0);
      const hh = (3 + 20 * dz) * (0.6 + br() * 0.8);
      const lean = (br() - 0.5) * 7 * (0.4 + dz);
      const lit = br();
      L.x.strokeStyle = `hsl(${88 + 24 * lit},${46 + 22 * lit}%,${14 + 28 * lit * (0.5 + dz)}%)`;
      L.x.lineWidth = 0.5 + 1.1 * dz;
      L.x.lineCap = 'round';
      L.x.beginPath();
      L.x.moveTo(gx, gy);
      L.x.quadraticCurveTo(gx + lean * 0.3, gy - hh * 0.6, gx + lean, gy - hh);
      L.x.stroke();
    }
    const M = mk(W, H, this.dpr);
    const R = g * W * 1.25 + 14;
    const centers: [number, number][] = [
      [0.5, 1.0], [0.1, 0.9], [0.9, 0.9], [0.5, 0.66], [0.2, 0.55], [0.8, 0.55], [0.5, 0.5],
    ];
    for (const [cx, cy] of centers) {
      const mg = M.x.createRadialGradient(cx * W, cy * H, 0, cx * W, cy * H, R);
      mg.addColorStop(0, 'rgba(0,0,0,1)');
      mg.addColorStop(0.72, 'rgba(0,0,0,1)');
      mg.addColorStop(1, 'rgba(0,0,0,0)');
      M.x.fillStyle = mg;
      M.x.fillRect(0, 0, W, H);
    }
    L.x.globalCompositeOperation = 'destination-in';
    L.x.drawImage(M.c, 0, 0, W, H);
    x.drawImage(L.c, 0, 0, W, H);
    // ضباب الأفق
    const hz = x.createLinearGradient(0, y0 - 3, 0, y0 + H * 0.09);
    hz.addColorStop(0, 'rgba(222,236,236,0.7)');
    hz.addColorStop(1, 'rgba(222,236,236,0)');
    x.fillStyle = hz;
    x.fillRect(0, y0 - 3, W, H * 0.09 + 3);
  }

  private drawRiver(x: Ctx, W: number, H: number, rs: number, gold: number) {
    const { L, R } = riverPolys(W, H, rs);
    // الضفاف
    x.fillStyle = '#2f4d2a';
    x.fill(polyPath(L, R, 5));
    x.fillStyle = 'rgba(190,176,130,0.55)';
    x.fill(polyPath(L, R, 2.5));
    const water = polyPath(L, R, 0);
    this.river = water;
    const wg = x.createLinearGradient(0, H * 0.46, 0, H);
    wg.addColorStop(0, '#bfe6ee');
    wg.addColorStop(0.3, '#59b9cf');
    wg.addColorStop(1, '#0f7da3');
    x.fillStyle = wg;
    x.fill(water);
    // انعكاس السماء
    x.save();
    x.clip(water);
    const rg = x.createLinearGradient(0, H * 0.46, 0, H);
    rg.addColorStop(0, 'rgba(255,248,214,0.55)');
    rg.addColorStop(0.5, 'rgba(140,200,235,0.18)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = rg;
    x.fillRect(0, 0, W, H);
    // ظل الضفة
    const sd = x.createLinearGradient(0, 0, W, 0);
    sd.addColorStop(0, 'rgba(0,40,30,0.22)');
    sd.addColorStop(0.2, 'rgba(0,40,30,0)');
    sd.addColorStop(0.8, 'rgba(0,40,30,0)');
    sd.addColorStop(1, 'rgba(0,40,30,0.18)');
    x.fillStyle = sd;
    x.fillRect(0, 0, W, H);
    x.restore();
    if (gold > 0) {
      x.strokeStyle = 'rgba(255,220,120,0.55)';
      x.lineWidth = 1.2;
      x.beginPath();
      L.forEach(([px, py], i) => (i ? x.lineTo(px - 2.5, py) : x.moveTo(px - 2.5, py)));
      x.stroke();
    }
  }

  private drawCanal(x: Ctx, side: -1 | 1, W: number, H: number, u: number, kind: 'milk' | 'honey') {
    const c = canalPoint(side, W, H, u);
    const lw = 11 * u;
    const path = new Path2D();
    path.moveTo(c.x0, c.y);
    path.quadraticCurveTo(c.cx, c.cy, c.x1, c.y + 1);
    x.lineCap = 'round';
    x.strokeStyle = '#2f4d2a';
    x.lineWidth = lw + 7 * u;
    x.stroke(path);
    x.strokeStyle = 'rgba(205,190,140,0.7)';
    x.lineWidth = lw + 3.5 * u;
    x.stroke(path);
    const g = x.createLinearGradient(0, c.y - lw, 0, c.y + lw);
    if (kind === 'milk') {
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.5, '#fbf7ea');
      g.addColorStop(1, '#d9e4ea');
    } else {
      g.addColorStop(0, '#ffe08a');
      g.addColorStop(0.5, '#eaa92a');
      g.addColorStop(1, '#b97612');
    }
    x.strokeStyle = g;
    x.lineWidth = lw;
    x.stroke(path);
    x.strokeStyle = 'rgba(255,255,255,0.5)';
    x.lineWidth = 1.2 * u;
    x.setLineDash([10 * u, 14 * u]);
    x.stroke(path);
    x.setLineDash([]);
  }

  private drawGoldPath(x: Ctx, W: number, H: number) {
    // درب ذهبي من الأسفل يسارًا إلى القصر
    const n = 40;
    const pts: { x: number; y: number; w: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const y = H * (0.99 - 0.52 * t);
      const xx = W * (0.19 + 0.16 * t + 0.06 * Math.sin(t * 3.2));
      pts.push({ x: xx, y, w: W * (0.07 * (1 - t) + 0.012) });
    }
    x.beginPath();
    pts.forEach((p, i) => (i ? x.lineTo(p.x - p.w, p.y) : x.moveTo(p.x - p.w, p.y)));
    for (let i = pts.length - 1; i >= 0; i--) x.lineTo(pts[i].x + pts[i].w, pts[i].y);
    x.closePath();
    const g = x.createLinearGradient(0, H * 0.47, 0, H);
    g.addColorStop(0, 'rgba(255,214,102,0.85)');
    g.addColorStop(1, 'rgba(214,154,36,0.95)');
    x.fillStyle = g;
    x.fill();
    x.strokeStyle = 'rgba(120,76,10,0.35)';
    x.lineWidth = 0.7;
    for (let i = 2; i < n; i += 2) {
      const p = pts[i];
      x.beginPath();
      x.moveTo(p.x - p.w, p.y);
      x.lineTo(p.x + p.w, p.y);
      x.stroke();
    }
    x.strokeStyle = 'rgba(255,244,190,0.8)';
    x.lineWidth = 1;
    x.beginPath();
    pts.forEach((p, i) => (i ? x.lineTo(p.x - p.w, p.y) : x.moveTo(p.x - p.w, p.y)));
    x.stroke();
  }

  private drawFlowers(x: Ctx, W: number, H: number, fl: number, rs: number, milk: boolean, honey: boolean, u: number) {
    const r = rng(101);
    const clumps = Math.round(15 + 110 * fl);
    const items: { x: number; y: number }[] = [];
    let guard = 0;
    while (items.length < clumps && guard++ < clumps * 12) {
      const px = r() * W;
      const py = H * (0.5 + 0.49 * Math.pow(r(), 0.7));
      if (rs > 0 && inRiver(px, py, W, H, rs, 10)) continue;
      const cy = H * CANAL_Y;
      if ((milk || honey) && Math.abs(py - cy) < 12 * u) continue;
      items.push({ x: px, y: py });
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) {
      const depth = (it.y / H - 0.5) / 0.5;
      drawFlowerClump(x, it.x, it.y, (0.55 + 1.3 * depth) * u, r);
    }
  }

  private drawSpringBase(x: Ctx, sp: { x: number; y: number; r: number }) {
    // حوض رخامي
    x.fillStyle = 'rgba(0,30,12,0.35)';
    x.beginPath();
    x.ellipse(sp.x + 3, sp.y + 4, sp.r * 1.05, sp.r * 0.36, 0, 0, Math.PI * 2);
    x.fill();
    const ring = x.createLinearGradient(sp.x - sp.r, 0, sp.x + sp.r, 0);
    ring.addColorStop(0, '#fffaf0');
    ring.addColorStop(1, '#bba97f');
    x.fillStyle = ring;
    x.beginPath();
    x.ellipse(sp.x, sp.y, sp.r, sp.r * 0.34, 0, 0, Math.PI * 2);
    x.fill();
    const w = x.createLinearGradient(0, sp.y - sp.r * 0.3, 0, sp.y + sp.r * 0.3);
    w.addColorStop(0, '#9fdcea');
    w.addColorStop(1, '#2796b8');
    x.fillStyle = w;
    x.beginPath();
    x.ellipse(sp.x, sp.y, sp.r * 0.84, sp.r * 0.26, 0, 0, Math.PI * 2);
    x.fill();
    x.strokeStyle = '#e6bc55';
    x.lineWidth = 1.2;
    x.beginPath();
    x.ellipse(sp.x, sp.y, sp.r, sp.r * 0.34, 0, 0, Math.PI * 2);
    x.stroke();
    // عمود النافورة
    x.fillStyle = '#efe4c6';
    x.fillRect(sp.x - 2.5, sp.y - sp.r * 0.55, 5, sp.r * 0.55);
  }

  /* ---------- الإطار المتحرك ---------- */
  private drawFrame(now: number) {
    const { ctx, W, H, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!this.statics) return;
    const t = now / 1000;
    const N = this.v?.N ?? 0;
    // الكاميرا تبتعد تدريجيًا مع نمو البستان: قريبة جدًا في البداية ثم تُظهر المشهد كاملًا
    const zt = 1 + 0.4 * (1 - clamp(Math.log10(1 + N) / Math.log10(4001), 0, 1));
    this.zoom = this.zoom === 0 || this.reduce ? zt : this.zoom + (zt - this.zoom) * 0.05;
    const z = this.zoom;
    const ax = W * 0.5;
    const ay = H * 0.9;
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (ax - ax * z), dpr * (ay - ay * z));
    ctx.drawImage(this.statics, 0, 0, W, H);

    // بريق الماء
    if (this.river) {
      ctx.save();
      ctx.clip(this.river);
      for (let i = 0; i < 46; i++) {
        const ph = (i * 0.137 + t * 0.05) % 1;
        const tt = Math.pow(ph, 1.2);
        const c = riverC(tt, W, H);
        const w = riverW(tt, W, 1);
        const px = c.x + Math.sin(i * 12.9898) * w * 0.4;
        ctx.globalAlpha = 0.16 + 0.22 * Math.abs(Math.sin(t * 1.4 + i));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(px, c.y, 3 + 14 * tt * (W / 390), 0.5 + 1.4 * tt, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // نافورة العين
    if (this.spring && !this.reduce) {
      const sp = this.spring;
      ctx.strokeStyle = 'rgba(210,245,255,0.85)';
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        const ph = (t * 0.9 + k * 0.17) % 1;
        const h = sp.r * 1.1 * Math.sin(ph * Math.PI);
        const dx = Math.cos(a) * sp.r * 0.6 * ph;
        ctx.globalAlpha = 0.9 * (1 - ph * 0.5);
        ctx.beginPath();
        ctx.arc(sp.x + dx, sp.y - sp.r * 0.55 - h, 1.3 + (k % 2) * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y - sp.r * 0.55);
      ctx.lineTo(sp.x, sp.y - sp.r * 1.35);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (this.spring) {
      const sp = this.spring;
      ctx.strokeStyle = 'rgba(210,245,255,0.8)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y - sp.r * 0.55);
      ctx.lineTo(sp.x, sp.y - sp.r * 1.2);
      ctx.stroke();
    }

    // الأشجار مرتبة بالعمق
    const list = [...this.recs].sort((a, b) => a.slot.y - b.slot.y);
    for (const rec of list) {
      const sp = this.sprites.get(rec.key);
      if (!sp) continue;
      const bx = rec.slot.x * W;
      const by = rec.slot.y * H;
      let g = 1;
      const age = now - rec.born;
      if (age >= 0 && age < 1800) {
        const u = age / 1800;
        g = clamp(1 - Math.pow(1 - u, 3) * (1 + 0.6 * Math.cos(u * 5)) * 0.9, 0.02, 1.08);
      }
      const sway = this.reduce ? 0 : Math.sin(t * 0.9 + rec.phase) * 0.012 + Math.sin(t * 2.3 + rec.phase) * 0.004;
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(g, g);
      ctx.translate(-sp.baseX, -sp.baseY);
      if (rec.kind === 'palm' && sp.trunk) {
        ctx.drawImage(sp.trunk, 0, 0, sp.w, sp.h);
        ctx.translate(sp.crownX!, sp.crownY!);
        ctx.rotate(sway * 1.6);
        ctx.translate(-sp.crownX!, -sp.crownY!);
        ctx.drawImage(sp.c, 0, 0, sp.w, sp.h);
      } else {
        ctx.translate(sp.baseX, sp.baseY);
        ctx.rotate(sway * 0.5);
        ctx.translate(-sp.baseX, -sp.baseY);
        ctx.drawImage(sp.c, 0, 0, sp.w, sp.h);
      }
      ctx.restore();
      if (age >= 0 && age < 1800) {
        const u = age / 1800;
        const rad = sp.h * (0.2 + 0.5 * u);
        const gl = ctx.createRadialGradient(bx, by - sp.h * 0.3 * g, 0, bx, by - sp.h * 0.3 * g, rad);
        gl.addColorStop(0, `rgba(255,224,130,${0.55 * (1 - u)})`);
        gl.addColorStop(1, 'rgba(255,224,130,0)');
        ctx.fillStyle = gl;
        ctx.fillRect(bx - rad, by - sp.h * 0.3 * g - rad, rad * 2, rad * 2);
      }
    }

    // بذرة في البداية
    if (this.recs.length === 0 && (this.v?.palaces ?? 0) === 0) this.drawSprout(ctx, W * 0.5, H * 0.86, t, clamp(N / 25, 0, 1));

    // تدرّج الإضاءة بحسب الوقت، ثم الأنوار فوقه
    const ph = this.phase;
    if (ph !== 'day') {
      const tint = ph === 'night' ? 'rgba(6,14,46,0.55)' : ph === 'dawn' ? 'rgba(255,150,120,0.14)' : 'rgba(255,120,60,0.2)';
      const tg = ctx.createLinearGradient(0, H * 0.2, 0, H * 0.5);
      tg.addColorStop(0, tint.replace(/[\d.]+\)$/, '0)'));
      tg.addColorStop(1, tint);
      ctx.fillStyle = tg;
      ctx.fillRect(0, H * 0.2, W, H * 0.3);
      ctx.fillStyle = tint;
      ctx.fillRect(0, H * 0.5, W, H * 0.5);
      if (ph === 'night') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const L of this.lights) {
          const f = 0.8 + 0.2 * Math.sin(t * 1.7 + L.x);
          const gl = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
          gl.addColorStop(0, `rgba(255,205,110,${0.3 * f})`);
          gl.addColorStop(0.4, `rgba(255,170,70,${0.1 * f})`);
          gl.addColorStop(1, 'rgba(255,170,70,0)');
          ctx.fillStyle = gl;
          ctx.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
        }
        ctx.restore();
      }
    }

    // طيور
    if (N >= 400 && ph !== 'night') {
      ctx.strokeStyle = 'rgba(40,50,60,0.75)';
      ctx.lineWidth = 1.2;
      for (const b of this.birds) {
        const px = (b.x + t * b.v) % (W + 40) - 20;
        const py = b.y + Math.sin(t * 0.7 + b.p) * 6;
        const fl = Math.sin(t * 7 + b.p) * 3 * b.s;
        ctx.beginPath();
        ctx.moveTo(px - 7 * b.s, py - fl);
        ctx.quadraticCurveTo(px - 3 * b.s, py - 3 * b.s - fl * 0.2, px, py);
        ctx.quadraticCurveTo(px + 3 * b.s, py - 3 * b.s - fl * 0.2, px + 7 * b.s, py - fl);
        ctx.stroke();
      }
    }

    // بريق ذهبي
    if (N >= 1500 || ph === 'night') {
      for (const s of this.sparks) {
        const a = 0.5 + 0.5 * Math.sin(t * 2 + s.p);
        if (a < 0.15) continue;
        const rad = (1 + 2.2 * a) * s.s;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad * 3);
        g.addColorStop(0, `rgba(255,236,160,${0.9 * a})`);
        g.addColorStop(1, 'rgba(255,236,160,0)');
        ctx.fillStyle = g;
        ctx.fillRect(s.x - rad * 3, s.y - rad * 3, rad * 6, rad * 6);
      }
    }

    // كثافة الأنوار في المراحل المتقدمة
    if (N >= 7000) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.14 + 0.05 * Math.sin(t * 0.8);
      const gl = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, H * 0.7);
      gl.addColorStop(0, 'rgba(255,232,160,1)');
      gl.addColorStop(1, 'rgba(255,232,160,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.overlay) {
      ctx.globalAlpha = ph === 'night' ? 0.3 : 1;
      ctx.drawImage(this.overlay, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  private drawSprout(x: Ctx, px: number, py: number, t: number, k: number) {
    const sway = Math.sin(t * 1.4) * 0.05;
    // وهج
    const g = x.createRadialGradient(px, py - 14, 0, px, py - 14, 46);
    g.addColorStop(0, `rgba(255,236,160,${0.35 + 0.15 * Math.sin(t * 2)})`);
    g.addColorStop(1, 'rgba(255,236,160,0)');
    x.fillStyle = g;
    x.fillRect(px - 50, py - 64, 100, 100);
    x.save();
    x.translate(px, py);
    x.rotate(sway);
    x.strokeStyle = '#4f8f2f';
    x.lineWidth = 2.2;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(0, 0);
    x.quadraticCurveTo(2, -9, 0, -16 - 6 * k);
    x.stroke();
    for (const s of [-1, 1]) {
      const lg = x.createLinearGradient(0, -16, s * 14, -24);
      lg.addColorStop(0, '#9fd062');
      lg.addColorStop(1, '#3f8a2a');
      x.fillStyle = lg;
      x.beginPath();
      x.moveTo(0, -14 - 6 * k);
      x.quadraticCurveTo(s * 10, -26 - 6 * k, s * 16, -18 - 6 * k);
      x.quadraticCurveTo(s * 8, -12 - 6 * k, 0, -14 - 6 * k);
      x.fill();
    }
    x.restore();
    x.fillStyle = 'rgba(70,46,20,0.65)';
    x.beginPath();
    x.ellipse(px, py + 1, 13, 3.4, 0, 0, Math.PI * 2);
    x.fill();
  }

  start() {
    if (this.running || this.reduce) return;
    this.running = true;
    this.last = 0;
    const loop = (ts: number) => {
      if (!this.running) return;
      if (ts - this.last > 40) {
        this.last = ts;
        this.drawFrame(ts);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    if (this.timer) clearTimeout(this.timer);
    this.timer = 0;
  }
}
