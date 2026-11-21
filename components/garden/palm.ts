/*
 * رسم نخيل واقعي بالكانفاس (بدون صور خارجية):
 * - جذع بقشور وأوراق قاعدية متقاطعة وتدرّج إضاءة وظل على الأرض
 * - سعف ريشي بسنوات (عدد كبير من الوريقات لكل سعفة) تنحني بفعل الجاذبية
 * - عراجين تمر تتدلّى من أسفل التاج (خلال ونضج)
 * - مشهد وقت الغروب: سماء متدرجة، شمس، كثبان بعيدة بضباب جوي، عشب مضيء من الخلف
 * كل نخلة تُرسم مرة واحدة في صورة خفية ثم تتمايل خفيفًا مع الرياح.
 */

export type Ctx = CanvasRenderingContext2D;

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function mk(w: number, h: number, dpr: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w * dpr));
  c.height = Math.max(2, Math.round(h * dpr));
  const x = c.getContext('2d')!;
  x.scale(dpr, dpr);
  return { c, x };
}

/* اتجاه الإضاءة: من أعلى اليسار (الشمس منخفضة على اليسار) */
const LIGHT = { x: -0.62, y: -0.78 };

export type PalmBitmaps = {
  trunk: HTMLCanvasElement;
  crown: HTMLCanvasElement;
  w: number; // css px
  h: number;
  baseX: number;
  baseY: number;
  crownX: number;
  crownY: number;
};

/** يرسم سعفة ريشية واحدة. dead = سعفة ميتة بنية متدلية على الجذع. */
function drawFrond(
  x: Ctx,
  r: () => number,
  cx: number,
  cy: number,
  dirx: number,
  L: number,
  el: number,
  droop: number,
  opt: { dead?: boolean; tone: number; front: boolean; H: number }
) {
  const N = 30;
  const pts: { x: number; y: number }[] = [{ x: cx, y: cy }];
  let vx = dirx * Math.cos(el);
  let vy = -Math.sin(el);
  let px = cx;
  let py = cy;
  const step = L / N;
  for (let i = 0; i < N; i++) {
    const k = i / N;
    vy += droop * (0.012 + 0.05 * k);
    const m = Math.hypot(vx, vy) || 1;
    vx /= m;
    vy /= m;
    px += vx * step;
    py += vy * step;
    pts.push({ x: px, y: py });
  }

  const sc = opt.H / 300;

  // العرق الرئيسي (rachis)
  x.lineCap = 'round';
  for (let i = 0; i < N; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const k = i / N;
    x.strokeStyle = opt.dead
      ? `hsl(28,35%,${24 + 6 * (1 - k)}%)`
      : `hsl(${70 + opt.tone * 6},38%,${26 + 10 * (1 - k)}%)`;
    x.lineWidth = Math.max(0.6, (3.1 - 2.4 * k) * sc);
    x.beginPath();
    x.moveTo(a.x, a.y);
    x.lineTo(b.x, b.y);
    x.stroke();
  }

  // الوريقات
  const leafMax = L * (opt.dead ? 0.12 : 0.215);
  const samples = opt.dead ? 26 : 62;
  for (let s = 0; s < samples; s++) {
    const t = 0.1 + (0.9 * s) / (samples - 1);
    const fi = t * N;
    const i0 = Math.min(N - 1, Math.floor(fi));
    const f = fi - i0;
    const a = pts[i0];
    const b = pts[i0 + 1];
    const bx = lerp(a.x, b.x, f);
    const by = lerp(a.y, b.y, f);
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const tm = Math.hypot(tx, ty) || 1;
    tx /= tm;
    ty /= tm;

    const prof = clamp(t / 0.2, 0, 1) * (1 - Math.pow(t, 1.9)) + 0.05;
    for (const side of [-1, 1]) {
      const phi = (0.62 + 0.18 * r()) * side; // زاوية الوريقة عن العرق
      const c = Math.cos(phi);
      const sn = Math.sin(phi);
      let dx = tx * c - ty * sn;
      let dy = tx * sn + ty * c;
      // جاذبية: الوريقات تميل للأسفل
      dy += 0.38 + (opt.dead ? 0.5 : 0);
      const dm = Math.hypot(dx, dy) || 1;
      dx /= dm;
      dy /= dm;

      const ll = leafMax * prof * (0.85 + 0.3 * r());
      const ex = bx + dx * ll;
      const ey = by + dy * ll;
      const mx = bx + dx * ll * 0.5;
      const my = by + dy * ll * 0.5 + ll * 0.07;
      const bw = Math.max(0.55, L * 0.0085) * (0.8 + 0.4 * r());
      const nx = -dy;
      const ny = dx;

      const lit = clamp((dx * LIGHT.x + dy * LIGHT.y) * 0.5 + 0.5, 0, 1);
      if (opt.dead) {
        x.fillStyle = `hsl(${30 + 6 * r()},38%,${22 + 16 * lit}%)`;
      } else {
        const hue = 112 - 34 * lit + opt.tone * 4 + 6 * r();
        const sat = 42 + 18 * lit;
        const li = 13 + 34 * lit + (opt.front ? 3 : 0) + 4 * r() - 3 * t;
        x.fillStyle = `hsl(${hue},${sat}%,${li}%)`;
      }
      x.beginPath();
      x.moveTo(bx + nx * bw, by + ny * bw);
      x.quadraticCurveTo(mx + nx * bw * 0.5, my + ny * bw * 0.5, ex, ey);
      x.quadraticCurveTo(mx - nx * bw * 0.5, my - ny * bw * 0.5, bx - nx * bw, by - ny * bw);
      x.closePath();
      x.fill();
    }
  }

  // لمعة على العرق من جهة الضوء
  if (!opt.dead) {
    x.strokeStyle = 'rgba(214,226,140,0.30)';
    x.lineWidth = Math.max(0.5, 0.9 * sc);
    x.beginPath();
    x.moveTo(pts[1].x, pts[1].y);
    for (let i = 2; i < N * 0.8; i++) x.lineTo(pts[i].x, pts[i].y);
    x.stroke();
  }
}

function drawDates(
  x: Ctx,
  r: () => number,
  cx: number,
  cy: number,
  H: number,
  lean: number
) {
  const bunches = 3;
  for (let b = 0; b < bunches; b++) {
    const side = b === 0 ? -1 : b === 1 ? 1 : 0.2;
    const ripe = r() > 0.35;
    const x0 = cx + side * H * 0.035;
    const y0 = cy + H * 0.012;
    const drop = H * (0.11 + 0.05 * r());
    const sway = side * H * 0.05 + lean * 0.1;
    // الشمراخ الرئيسي
    x.strokeStyle = 'hsl(44,40%,36%)';
    x.lineWidth = Math.max(1, H * 0.006);
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(x0, y0);
    x.quadraticCurveTo(x0 + sway * 0.2, y0 + drop * 0.4, x0 + sway * 0.4, y0 + drop * 0.55);
    x.stroke();
    const strands = 9;
    for (let s = 0; s < strands; s++) {
      const k = s / (strands - 1);
      const sx = x0 + sway * 0.1 * k + (k - 0.5) * H * 0.028;
      const sy = y0 + drop * 0.12 + k * drop * 0.1;
      const ex = sx + (k - 0.5) * H * 0.045 + sway * 0.35;
      const ey = sy + drop * (0.75 - Math.abs(k - 0.5) * 0.35);
      x.strokeStyle = 'hsl(40,35%,32%)';
      x.lineWidth = Math.max(0.6, H * 0.0028);
      x.beginPath();
      x.moveTo(sx, sy);
      x.quadraticCurveTo((sx + ex) / 2 + 2, (sy + ey) / 2, ex, ey);
      x.stroke();
      const nd = 6 + Math.floor(r() * 3);
      for (let d = 0; d < nd; d++) {
        const u = (d + 0.6) / nd;
        const qx = lerp(sx, ex, u) + (r() - 0.5) * H * 0.006;
        const qy = lerp(sy, ey, u);
        const rx = H * 0.0078 * (0.9 + 0.25 * r());
        const ry = rx * 1.55;
        const hue = ripe ? 18 + 14 * r() : 44 + 10 * r();
        const sat = ripe ? 78 : 66;
        const li = ripe ? 30 + 12 * r() : 46 + 8 * r();
        const g = x.createRadialGradient(qx - rx * 0.4, qy - ry * 0.4, rx * 0.1, qx, qy, ry * 1.1);
        g.addColorStop(0, `hsl(${hue},${sat}%,${li + 22}%)`);
        g.addColorStop(0.55, `hsl(${hue},${sat}%,${li}%)`);
        g.addColorStop(1, `hsl(${hue},${sat - 10}%,${li - 14}%)`);
        x.fillStyle = g;
        x.beginPath();
        x.ellipse(qx, qy, rx, ry, (r() - 0.5) * 0.5, 0, Math.PI * 2);
        x.fill();
      }
    }
  }
}

/** يرسم نخلة كاملة في طبقتين (جذع / تاج) لنتمكن من تمويج التاج وحده. */
export function renderPalm(
  seed: number,
  age: number,
  fruit: boolean,
  H: number,
  dpr: number,
  hazeTone = 0
): PalmBitmaps {
  const r = rng(seed);
  const W = Math.round(H * 1.05);
  const T = mk(W, H, dpr);
  const C = mk(W, H, dpr);
  const a = clamp(age, 0.12, 1);

  const baseY = H - 3;
  const Th = H * (0.15 + 0.42 * a);
  const Lf = H * (0.17 + 0.205 * a);
  const lean = (r() - 0.5) * 0.12 * H * (0.4 + a);
  const ph = r() * 6;
  const baseX = W / 2 - lean * 0.35;
  const Wb = H * (0.02 + 0.028 * a);

  // نقاط خط الجذع
  const n = 48;
  const cl: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    cl.push({
      x: baseX + lean * t * t + Math.sin(t * 3.1 + ph) * H * 0.006 * a,
      y: baseY - Th * t,
      w: Wb * (1 - 0.3 * t) + Wb * 0.95 * Math.pow(1 - t, 7),
    });
  }
  const topX = cl[n].x;
  const topY = cl[n].y;

  // ===== الجذع =====
  const L1: { x: number; y: number }[] = [];
  const R1: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const p = cl[Math.max(0, i - 1)];
    const q = cl[Math.min(n, i + 1)];
    let tx = q.x - p.x;
    let ty = q.y - p.y;
    const m = Math.hypot(tx, ty) || 1;
    tx /= m;
    ty /= m;
    L1.push({ x: cl[i].x + ty * cl[i].w, y: cl[i].y - tx * cl[i].w });
    R1.push({ x: cl[i].x - ty * cl[i].w, y: cl[i].y + tx * cl[i].w });
  }
  const tp = T.x;
  tp.save();
  tp.beginPath();
  tp.moveTo(L1[0].x, L1[0].y);
  for (let i = 1; i <= n; i++) tp.lineTo(L1[i].x, L1[i].y);
  for (let i = n; i >= 0; i--) tp.lineTo(R1[i].x, R1[i].y);
  tp.closePath();
  const gx0 = baseX - Wb * 1.2;
  const gx1 = baseX + Wb * 1.2;
  const tg = tp.createLinearGradient(gx0, 0, gx1, 0);
  tg.addColorStop(0, '#6a4a2c');
  tg.addColorStop(0.28, '#9a7347');
  tg.addColorStop(0.55, '#6f4e30');
  tg.addColorStop(1, '#2a1b10');
  tp.fillStyle = tg;
  tp.fill();
  tp.clip();

  // قواعد السعف القديمة: صفوف متقاطعة (نمط الشبكة المميز للنخيل)
  const rowGap = Wb * 0.62;
  const rows = Math.floor(Th / rowGap);
  for (let i = 1; i < rows; i++) {
    const t = (i * rowGap) / Th;
    const idx = Math.min(n, Math.round(t * n));
    const c = cl[idx];
    const w = c.w;
    const off = (i % 2) * w * 0.5;
    // ندبة قوسية
    tp.strokeStyle = 'rgba(24,14,7,0.55)';
    tp.lineWidth = Math.max(0.8, H * 0.0042);
    tp.beginPath();
    tp.moveTo(c.x - w * 1.1, c.y - rowGap * 0.1);
    tp.quadraticCurveTo(c.x - off * 0.2, c.y + rowGap * 0.55, c.x + w * 1.1, c.y - rowGap * 0.1);
    tp.stroke();
    // ضوء تحت الندبة
    tp.strokeStyle = 'rgba(214,170,112,0.22)';
    tp.lineWidth = Math.max(0.6, H * 0.0026);
    tp.beginPath();
    tp.moveTo(c.x - w * 0.95, c.y + rowGap * 0.12);
    tp.quadraticCurveTo(c.x - off * 0.2, c.y + rowGap * 0.72, c.x + w * 0.95, c.y + rowGap * 0.12);
    tp.stroke();
    // أجزاء عمودية قصيرة بين الندبات
    const pieces = 3;
    for (let k = 0; k < pieces; k++) {
      const px = c.x - w + ((k + 0.5) / pieces) * 2 * w + off * 0.4 - w * 0.25 * (i % 2);
      tp.strokeStyle = 'rgba(30,18,9,0.35)';
      tp.lineWidth = Math.max(0.6, H * 0.0022);
      tp.beginPath();
      tp.moveTo(px, c.y + rowGap * 0.2);
      tp.lineTo(px + (r() - 0.5) * 2, c.y + rowGap * 0.95);
      tp.stroke();
    }
  }
  // ألياف خشنة
  for (let k = 0; k < 90; k++) {
    const t = r();
    const idx = Math.min(n, Math.round(t * n));
    const c = cl[idx];
    const px = c.x + (r() - 0.5) * 2 * c.w;
    tp.strokeStyle = r() > 0.5 ? 'rgba(255,225,170,0.10)' : 'rgba(20,10,4,0.16)';
    tp.lineWidth = 0.7;
    tp.beginPath();
    tp.moveTo(px, c.y);
    tp.lineTo(px + (r() - 0.5) * 2, c.y + H * (0.01 + 0.03 * r()));
    tp.stroke();
  }
  // ظل تلامس الأرض وظل التاج على أعلى الجذع
  const ao = tp.createLinearGradient(0, baseY, 0, baseY - Th * 0.22);
  ao.addColorStop(0, 'rgba(10,6,3,0.65)');
  ao.addColorStop(1, 'rgba(10,6,3,0)');
  tp.fillStyle = ao;
  tp.fillRect(0, baseY - Th * 0.22, W, Th * 0.22 + 4);
  const ao2 = tp.createLinearGradient(0, topY, 0, topY + Th * 0.3);
  ao2.addColorStop(0, 'rgba(8,5,2,0.7)');
  ao2.addColorStop(1, 'rgba(8,5,2,0)');
  tp.fillStyle = ao2;
  tp.fillRect(0, topY, W, Th * 0.3);
  tp.restore();

  // سعف ميت متدلٍ حول أعلى الجذع
  const deadN = 3 + Math.floor(a * 5);
  for (let i = 0; i < deadN; i++) {
    const dir = i % 2 === 0 ? -1 : 1;
    drawFrond(
      T.x,
      r,
      topX + dir * Wb * 0.4,
      topY + Th * 0.035,
      dir * (0.55 + 0.3 * r()),
      Lf * (0.5 + 0.25 * r()),
      0.05 - 0.35 * r(),
      2.4,
      { dead: true, tone: 0, front: false, H }
    );
  }

  // التمر
  if (fruit && a > 0.55) drawDates(T.x, r, topX, topY, H, lean);

  // ===== التاج =====
  const nF = Math.round(9 + 13 * a);
  const fronds: { z: number; th: number; rr: number }[] = [];
  for (let i = 0; i < nF; i++) {
    const th = i * 2.39996 + r() * 0.5;
    const rr = Math.pow((i + r()) / nF, 0.85);
    fronds.push({ z: Math.sin(th), th, rr });
  }
  fronds.sort((p, q) => p.z - q.z);
  // نواة خضراء داكنة (قلب النخلة) تحت السعف
  const bulb = C.x.createRadialGradient(topX, topY, 0, topX, topY, Wb * 1.5);
  bulb.addColorStop(0, 'hsl(70,35%,22%)');
  bulb.addColorStop(1, 'hsla(70,35%,18%,0)');
  C.x.fillStyle = bulb;
  C.x.beginPath();
  C.x.arc(topX, topY, Wb * 1.5, 0, Math.PI * 2);
  C.x.fill();

  for (const f of fronds) {
    const hx = Math.cos(f.th);
    const fore = 0.55 + 0.45 * Math.abs(hx);
    const dirx = hx >= 0 ? Math.max(0.2, hx) : Math.min(-0.2, hx);
    const L = Lf * (0.82 + 0.26 * r()) * fore;
    const el = lerp(1.3, 0.28, f.rr) + (r() - 0.5) * 0.18;
    drawFrond(C.x, r, topX, topY, dirx, L, el, 0.9 + 1.5 * f.rr, {
      tone: hazeTone,
      front: f.z > 0,
      H,
    });
  }

  return { trunk: T.c, crown: C.c, w: W, h: H, baseX, baseY, crownX: topX, crownY: topY };
}

/* ---------------- المشهد ---------------- */
