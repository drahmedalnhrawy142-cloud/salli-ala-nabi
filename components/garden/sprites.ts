import { clamp, lerp, mk, rng, type Ctx } from './palm';

/* ألوان السماء المستعملة لإضفاء ضباب الجو على الأجسام البعيدة */
const HAZE = '206,232,240';

function tint(x: Ctx, w: number, h: number, a: number) {
  if (a <= 0) return;
  x.save();
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = `rgba(${HAZE},${a})`;
  x.fillRect(0, 0, w, h);
  x.restore();
}

/** قوس معماري: مستطيل بنصف دائرة في أعلاه */
function archPath(x: Ctx, cx: number, bottom: number, w: number, h: number) {
  const r = w / 2;
  x.beginPath();
  x.moveTo(cx - r, bottom);
  x.lineTo(cx - r, bottom - h + r);
  x.arc(cx, bottom - h + r, r, Math.PI, 0);
  x.lineTo(cx + r, bottom);
  x.closePath();
}

function dome(x: Ctx, cx: number, base: number, rx: number, ry: number, gold: boolean) {
  // جسم القبة
  const g = x.createLinearGradient(cx - rx, 0, cx + rx, 0);
  if (gold) {
    g.addColorStop(0, '#8a5a12');
    g.addColorStop(0.22, '#e7b53a');
    g.addColorStop(0.38, '#fff0a6');
    g.addColorStop(0.55, '#e0a82c');
    g.addColorStop(1, '#6e4609');
  } else {
    g.addColorStop(0, '#7fb5b0');
    g.addColorStop(0.4, '#e8f6f2');
    g.addColorStop(1, '#5d8d89');
  }
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(cx - rx, base);
  x.bezierCurveTo(cx - rx, base - ry * 0.7, cx - rx * 0.45, base - ry * 1.05, cx, base - ry * 1.28);
  x.bezierCurveTo(cx + rx * 0.45, base - ry * 1.05, cx + rx, base - ry * 0.7, cx + rx, base);
  x.closePath();
  x.fill();
  // خطوط الضلوع الخفيفة
  x.strokeStyle = 'rgba(80,48,6,0.22)';
  x.lineWidth = Math.max(0.4, rx * 0.012);
  for (let i = -3; i <= 3; i++) {
    x.beginPath();
    x.moveTo(cx + (i * rx) / 3.4, base);
    x.quadraticCurveTo(cx + (i * rx) / 5, base - ry * 0.8, cx, base - ry * 1.26);
    x.stroke();
  }
  // لمعة
  const h = x.createRadialGradient(cx - rx * 0.35, base - ry * 0.75, 0, cx - rx * 0.35, base - ry * 0.75, rx * 0.5);
  h.addColorStop(0, 'rgba(255,255,235,0.8)');
  h.addColorStop(1, 'rgba(255,255,235,0)');
  x.fillStyle = h;
  x.fillRect(cx - rx, base - ry * 1.3, rx * 2, ry * 1.3);
  // قمة
  x.strokeStyle = gold ? '#f2c94c' : '#d9efe9';
  x.lineWidth = Math.max(0.7, rx * 0.06);
  x.beginPath();
  x.moveTo(cx, base - ry * 1.26);
  x.lineTo(cx, base - ry * 1.26 - ry * 0.34);
  x.stroke();
  x.fillStyle = gold ? '#ffe27a' : '#ffffff';
  x.beginPath();
  x.arc(cx, base - ry * 1.26 - ry * 0.2, Math.max(0.8, rx * 0.09), 0, Math.PI * 2);
  x.fill();
}

/** قصر من الرخام العاجي بقباب ذهبية وأبراج ونوافذ مضيئة. w بالبكسل (CSS). */
export function renderPalace(w: number, dpr: number, haze: number, seed = 5): HTMLCanvasElement {
  const h = Math.round(w * 0.86);
  const C = mk(w, h, dpr);
  const x = C.x;
  const u = w / 100;
  const r = rng(seed);
  const wallBase = 84 * u;

  // ضوء ناعم خلف القصر
  const glow = x.createRadialGradient(50 * u, 44 * u, 0, 50 * u, 44 * u, 60 * u);
  glow.addColorStop(0, 'rgba(255,240,190,0.35)');
  glow.addColorStop(1, 'rgba(255,240,190,0)');
  x.fillStyle = glow;
  x.fillRect(0, 0, w, h);

  const marble = (x0: number, x1: number) => {
    const g = x.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#fffaf0');
    g.addColorStop(0.55, '#f1e6cc');
    g.addColorStop(1, '#bdae8d');
    return g;
  };

  // القاعدة والدرج
  for (let i = 0; i < 4; i++) {
    x.fillStyle = i % 2 ? '#e9dfc6' : '#f6eedb';
    const inset = 2 + i * 2.2;
    x.fillRect((4 + inset) * u, (wallBase + i * 1.7 * u) / 1, (92 - inset * 2) * u, 2 * u);
  }

  // أبراج جانبية
  for (const tx of [9, 91]) {
    x.fillStyle = marble((tx - 3.4) * u, (tx + 3.4) * u);
    x.fillRect((tx - 3.4) * u, 28 * u, 6.8 * u, wallBase - 28 * u);
    x.fillStyle = '#d6b45a';
    for (const by of [40, 56, 70]) x.fillRect((tx - 4.2) * u, by * u, 8.4 * u, 1.3 * u);
    for (const wy of [32, 47, 62]) {
      archPath(x, tx * u, (wy + 6) * u, 3 * u, 6 * u);
      const wg = x.createLinearGradient(0, wy * u, 0, (wy + 6) * u);
      wg.addColorStop(0, '#ffe9a8');
      wg.addColorStop(1, '#f0a93c');
      x.fillStyle = wg;
      x.fill();
    }
    dome(x, tx * u, 28 * u, 4.6 * u, 8.5 * u, true);
  }

  // الجناحان
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 14 : 62;
    x.fillStyle = marble(x0 * u, (x0 + 24) * u);
    x.fillRect(x0 * u, 50 * u, 24 * u, wallBase - 50 * u);
    // أقواس
    for (let i = 0; i < 3; i++) {
      const cx = (x0 + 4 + i * 8) * u;
      archPath(x, cx, wallBase - 2 * u, 5.6 * u, 24 * u);
      const ag = x.createLinearGradient(0, 56 * u, 0, wallBase);
      ag.addColorStop(0, '#2a1a0c');
      ag.addColorStop(0.55, '#5b3a18');
      ag.addColorStop(1, '#ffcf72');
      x.fillStyle = ag;
      x.fill();
    }
    // شريط ذهبي وحافة
    x.fillStyle = '#d9b04a';
    x.fillRect((x0 - 0.8) * u, 49 * u, 25.6 * u, 1.6 * u);
    dome(x, (x0 + 12) * u, 49 * u, 7.5 * u, 9.5 * u, true);
  }

  // الجزء الأوسط
  x.fillStyle = marble(34 * u, 66 * u);
  x.fillRect(36 * u, 36 * u, 28 * u, wallBase - 36 * u);
  // بوابة كبيرة
  archPath(x, 50 * u, wallBase - 2 * u, 14 * u, 34 * u);
  const dg = x.createLinearGradient(0, 52 * u, 0, wallBase);
  dg.addColorStop(0, '#24160a');
  dg.addColorStop(0.5, '#6a4620');
  dg.addColorStop(1, '#ffd679');
  x.fillStyle = dg;
  x.fill();
  x.strokeStyle = '#e6bc55';
  x.lineWidth = 0.9 * u;
  x.stroke();
  // نوافذ الدور الثاني
  for (let i = 0; i < 4; i++) {
    const cx = (40.5 + i * 6.4) * u;
    archPath(x, cx, 50 * u, 3.4 * u, 8 * u);
    const wg = x.createLinearGradient(0, 42 * u, 0, 50 * u);
    wg.addColorStop(0, '#fff0b8');
    wg.addColorStop(1, '#f1a93a');
    x.fillStyle = wg;
    x.fill();
  }
  x.fillStyle = '#d9b04a';
  x.fillRect(35 * u, 35 * u, 30 * u, 1.8 * u);
  // الرقبة
  x.fillStyle = marble(40 * u, 60 * u);
  x.fillRect(40 * u, 24 * u, 20 * u, 12 * u);
  for (let i = 0; i < 5; i++) {
    archPath(x, (43 + i * 3.5) * u, 34 * u, 2 * u, 6.5 * u);
    x.fillStyle = '#ffdf8e';
    x.fill();
  }
  x.fillStyle = '#d9b04a';
  x.fillRect(39 * u, 23 * u, 22 * u, 1.5 * u);
  dome(x, 50 * u, 23 * u, 13.5 * u, 15 * u, true);

  // نقوش خفيفة على الرخام
  x.globalAlpha = 0.07;
  for (let i = 0; i < 70; i++) {
    x.fillStyle = r() > 0.5 ? '#000' : '#a58b52';
    x.fillRect(r() * w, 30 * u + r() * 55 * u, 0.6 * u + r() * 3 * u, 0.4 * u);
  }
  x.globalAlpha = 1;

  tint(x, w, h, haze);
  return C.c;
}

/** جناح صغير بأعمدة وقبة ذهبية (بيت الجنة لمن صلّى ١٢ ركعة) */
export function renderPavilion(w: number, dpr: number, haze: number): HTMLCanvasElement {
  const h = Math.round(w * 1.05);
  const C = mk(w, h, dpr);
  const x = C.x;
  const u = w / 100;
  // أرضية
  const fl = x.createLinearGradient(0, 80 * u, 0, 96 * u);
  fl.addColorStop(0, '#fff6df');
  fl.addColorStop(1, '#cdbd96');
  x.fillStyle = fl;
  x.beginPath();
  x.ellipse(50 * u, 88 * u, 46 * u, 9 * u, 0, 0, Math.PI * 2);
  x.fill();
  // خلفية داخلية مضيئة
  const ig = x.createLinearGradient(0, 44 * u, 0, 88 * u);
  ig.addColorStop(0, '#5b3a18');
  ig.addColorStop(1, '#ffd679');
  x.fillStyle = ig;
  x.fillRect(16 * u, 44 * u, 68 * u, 42 * u);
  // أعمدة
  for (const cx of [16, 36, 64, 84]) {
    const g = x.createLinearGradient((cx - 3) * u, 0, (cx + 3) * u, 0);
    g.addColorStop(0, '#fffaf0');
    g.addColorStop(1, '#b9a982');
    x.fillStyle = g;
    x.fillRect((cx - 3) * u, 44 * u, 6 * u, 44 * u);
    x.fillStyle = '#d9b04a';
    x.fillRect((cx - 4) * u, 43 * u, 8 * u, 2 * u);
  }
  // إفريز
  x.fillStyle = '#e9dcb8';
  x.fillRect(10 * u, 38 * u, 80 * u, 6 * u);
  x.fillStyle = '#d9b04a';
  x.fillRect(10 * u, 37 * u, 80 * u, 1.6 * u);
  dome(x, 50 * u, 37 * u, 30 * u, 26 * u, true);
  tint(x, w, h, haze);
  return C.c;
}

/** شجرة مثمرة (رمان أو تين/زيتون) بقماش ورقي كثيف وثمار */
export function renderFruitTree(seed: number, H: number, dpr: number, variant: 0 | 1, haze: number) {
  const r = rng(seed);
  const W = Math.round(H * 0.98);
  const C = mk(W, H, dpr);
  const x = C.x;
  const s = H / 300;
  const baseX = W / 2;
  const baseY = H - 3;
  const trunkTop = H * 0.52;

  // الجذع وتفرعاته
  x.lineCap = 'round';
  const trunk = (x0: number, y0: number, x1: number, y1: number, w0: number, w1: number) => {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const ax = lerp(x0, x1, t0) + Math.sin(t0 * 3) * 2 * s;
      const ay = lerp(y0, y1, t0);
      const bx = lerp(x0, x1, t1) + Math.sin(t1 * 3) * 2 * s;
      const by = lerp(y0, y1, t1);
      const g = x.createLinearGradient(ax - w0 * 0.5, 0, ax + w0 * 0.5, 0);
      g.addColorStop(0, '#6f5236');
      g.addColorStop(0.4, '#8a6a46');
      g.addColorStop(1, '#3f2e1d');
      x.strokeStyle = g;
      x.lineWidth = lerp(w0, w1, t0);
      x.beginPath();
      x.moveTo(ax, ay);
      x.lineTo(bx, by);
      x.stroke();
    }
  };
  trunk(baseX, baseY, baseX - 4 * s, trunkTop, 15 * s, 9 * s);
  trunk(baseX - 4 * s, trunkTop + 8 * s, baseX - 46 * s, trunkTop - 40 * s, 7 * s, 3 * s);
  trunk(baseX - 4 * s, trunkTop + 8 * s, baseX + 44 * s, trunkTop - 46 * s, 7 * s, 3 * s);
  trunk(baseX - 4 * s, trunkTop + 2 * s, baseX - 2 * s, trunkTop - 70 * s, 6 * s, 3 * s);

  // التاج: أوراق مرتبة بالعمق من الداخل للخارج
  const cx = baseX - 2 * s;
  const cy = H * 0.37;
  const rx = W * 0.46;
  const ry = H * 0.34;
  type Leaf = { x: number; y: number; z: number; a: number; l: number };
  const leaves: Leaf[] = [];
  for (let i = 0; i < 1500; i++) {
    const ang = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    const lx = cx + Math.cos(ang) * rad * rx;
    const ly = cy + Math.sin(ang) * rad * ry * (Math.sin(ang) > 0 ? 0.8 : 1);
    leaves.push({ x: lx, y: ly, z: rad, a: r() * Math.PI * 2, l: (6 + r() * 6) * s });
  }
  leaves.sort((a, b) => a.z - b.z);
  const hue = variant === 0 ? 108 : 78;
  for (const lf of leaves) {
    // الإضاءة من أعلى اليسار
    const nx = (lf.x - cx) / rx;
    const ny = (lf.y - cy) / ry;
    const lit = clamp(0.5 - nx * 0.32 - ny * 0.38 + (r() - 0.5) * 0.28, 0, 1);
    const L = 14 + lit * 30 + lf.z * 6;
    x.fillStyle = `hsl(${hue + lit * 14},${44 + lit * 18}%,${L}%)`;
    x.save();
    x.translate(lf.x, lf.y);
    x.rotate(lf.a);
    x.beginPath();
    x.moveTo(0, 0);
    x.quadraticCurveTo(lf.l * 0.5, -lf.l * 0.32, lf.l, 0);
    x.quadraticCurveTo(lf.l * 0.5, lf.l * 0.32, 0, 0);
    x.fill();
    x.restore();
  }
  // ثمار
  const nF = variant === 0 ? 26 : 34;
  for (let i = 0; i < nF; i++) {
    const ang = r() * Math.PI * 2;
    const rad = 0.35 + r() * 0.62;
    const fx = cx + Math.cos(ang) * rad * rx;
    const fy = cy + Math.sin(ang) * rad * ry * 0.85;
    const fr = (3.2 + r() * 2.2) * s * 1.2;
    const col = variant === 0 ? ['#d6282f', '#b81e2a'] : ['#f2b630', '#e39a1d'];
    const g = x.createRadialGradient(fx - fr * 0.35, fy - fr * 0.35, 0, fx, fy, fr);
    g.addColorStop(0, '#ffe2d2');
    g.addColorStop(0.25, col[0]);
    g.addColorStop(1, col[1]);
    x.fillStyle = g;
    x.beginPath();
    x.arc(fx, fy, fr, 0, Math.PI * 2);
    x.fill();
    if (variant === 0) {
      x.fillStyle = '#7a1417';
      x.beginPath();
      x.arc(fx + fr * 0.1, fy - fr * 0.85, fr * 0.28, 0, Math.PI * 2);
      x.fill();
    }
  }
  tint(x, W, H, haze);
  return { c: C.c, w: W, h: H, baseX, baseY };
}

const PETALS = ['#e8315a', '#ffffff', '#ffd23f', '#b57bff', '#ff8a3d', '#ff9ec4', '#f9f2d3'];

/** عنقود ورود صغير عند (px,py) وبحجم s */
export function drawFlowerClump(x: Ctx, px: number, py: number, s: number, r: () => number) {
  const n = 3 + Math.floor(r() * 6);
  const col = PETALS[Math.floor(r() * PETALS.length)];
  const col2 = PETALS[Math.floor(r() * PETALS.length)];
  for (let i = 0; i < n; i++) {
    const fx = px + (r() - 0.5) * 16 * s;
    const fy = py + (r() - 0.5) * 5 * s;
    const sz = (1.9 + r() * 1.3) * s;
    const c = r() > 0.28 ? col : col2;
    x.strokeStyle = 'rgba(40,92,34,0.9)';
    x.lineWidth = 0.7 * s + 0.2;
    x.beginPath();
    x.moveTo(fx, fy);
    x.lineTo(fx + (r() - 0.5) * 1.5 * s, fy - (4 + r() * 4) * s);
    x.stroke();
    const hy = fy - (4.5 + r() * 3.5) * s;
    const k = 5 + Math.floor(r() * 3);
    x.fillStyle = c;
    for (let j = 0; j < k; j++) {
      const a = (j / k) * Math.PI * 2 + r() * 0.3;
      x.beginPath();
      x.ellipse(fx + Math.cos(a) * sz * 0.8, hy + Math.sin(a) * sz * 0.6, sz * 0.7, sz * 0.42, a, 0, Math.PI * 2);
      x.fill();
    }
    x.fillStyle = '#f2b91e';
    x.beginPath();
    x.arc(fx, hy, sz * 0.34, 0, Math.PI * 2);
    x.fill();
  }
}
