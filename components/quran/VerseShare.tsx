'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toAr, type QData } from './data';

type Theme = { id: string; label: string; bg: [string, string]; text: string; gold: string; sub: string };
const THEMES: Theme[] = [
  { id: 'night', label: 'ليلي ذهبي', bg: ['#0b0905', '#1c1507'], text: '#f7ebc1', gold: '#e8c25a', sub: 'rgba(247,235,193,0.7)' },
  { id: 'paper', label: 'ورقي', bg: ['#fbf3dc', '#f1e3bb'], text: '#1c1405', gold: '#9a7420', sub: 'rgba(28,20,5,0.65)' },
  { id: 'green', label: 'أخضر', bg: ['#06231b', '#0d3f30'], text: '#f3ecd0', gold: '#d9b45a', sub: 'rgba(243,236,208,0.7)' },
];

const W = 1080;
const SIZES = { post: 1350, square: 1080, story: 1920 } as const;
type SizeKey = keyof typeof SIZES;

type Tok = { w: string } | { n: number };

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8 - Math.PI / 2;
    const rr = k % 2 === 0 ? r : r * 0.62;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function fam(name: string, fallback: string) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v ? `${v}, ${fallback}` : fallback;
  } catch {
    return fallback;
  }
}

type NativeShare = {
  shareImage?(o: { data: string; text: string }): Promise<void>;
  saveImage?(o: { data: string }): Promise<void>;
};
function nativeShare(): NativeShare | null {
  try {
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, unknown> } };
    if (!w.Capacitor?.isNativePlatform?.()) return null;
    return (w.Capacitor.Plugins?.FloatingButton as NativeShare) ?? null;
  } catch {
    return null;
  }
}

/** بطاقة آية برسم المصحف (خط مجمع الملك فهد) للمشاركة أو الحفظ كصورة. */
export function VerseShare({ data, idx, onClose }: { data: QData; idx: number; onClose: () => void }) {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const [count, setCount] = useState(1);
  const [theme, setTheme] = useState(0);
  const [size, setSize] = useState<SizeKey>('post');
  const [msg, setMsg] = useState('');
  const [img, setImg] = useState('');

  const last = Math.min(data.ayas.length - 1, idx + count - 1);
  const sura = data.ayas[idx][0];
  // لا نعبر حدود السورة
  let end = idx;
  while (end < last && data.ayas[end + 1][0] === sura) end++;

  const draw = useCallback(async () => {
    const c = cv.current;
    if (!c) return;
    const H = SIZES[size];
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const th = THEMES[theme];
    try {
      await document.fonts.load("60px 'KFGQPC Hafs'");
    } catch {}
    const kufi = fam('--font-kufi', 'sans-serif');

    // الخلفية
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.bg[0]);
    g.addColorStop(1, th.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, W * 0.8);
    glow.addColorStop(0, theme === 1 ? 'rgba(255,255,255,0.5)' : 'rgba(232,194,90,0.13)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // الإطار المزدوج
    ctx.strokeStyle = th.gold;
    ctx.lineWidth = 5;
    ctx.strokeRect(46, 46, W - 92, H - 92);
    ctx.lineWidth = 2;
    ctx.strokeRect(66, 66, W - 132, H - 132);
    // زخارف الأركان والقمة
    ctx.fillStyle = th.gold;
    for (const [px, py] of [
      [66, 66],
      [W - 66, 66],
      [66, H - 66],
      [W - 66, H - 66],
    ]) {
      star(ctx, px, py, 26);
      ctx.fill();
    }
    star(ctx, W / 2, 66, 34);
    ctx.fill();
    star(ctx, W / 2, H - 66, 34);
    ctx.fill();

    // البسملة والعنوان
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    const s = data.suras[sura - 1];
    ctx.fillStyle = th.gold;
    ctx.font = `700 46px ${kufi}`;
    ctx.fillText(`سورة ${s.name}`, W / 2, 170);

    // نص الآيات
    const toks: Tok[] = [];
    for (let i = idx; i <= end; i++) {
      for (const w of data.ayas[i][4].split(' ')) toks.push({ w });
      toks.push({ n: data.ayas[i][1] });
    }
    const top = 230;
    const bottom = H - 230;
    const maxW = W - 220;
    let fs = 78;
    let lines: Tok[][] = [];
    let widths: number[] = [];
    for (; fs >= 30; fs -= 2) {
      ctx.font = `${fs}px 'KFGQPC Hafs', serif`;
      const sp = ctx.measureText(' ').width * 1.1;
      const mk = fs * 0.78;
      const tw = (t: Tok) => ('w' in t ? ctx.measureText(t.w).width : mk);
      lines = [];
      widths = [];
      let cur: Tok[] = [];
      let cw = 0;
      for (const t of toks) {
        const w = tw(t);
        if (cur.length && cw + sp + w > maxW) {
          lines.push(cur);
          widths.push(cw);
          cur = [];
          cw = 0;
        }
        cw += (cur.length ? sp : 0) + w;
        cur.push(t);
      }
      if (cur.length) {
        lines.push(cur);
        widths.push(cw);
      }
      if (lines.length * fs * 1.95 <= bottom - top) break;
    }
    ctx.font = `${fs}px 'KFGQPC Hafs', serif`;
    const sp = ctx.measureText(' ').width * 1.1;
    const mk = fs * 0.78;
    const lh = fs * 1.95;
    const total = lines.length * lh;
    let y = top + (bottom - top - total) / 2 + lh * 0.72;
    for (let li = 0; li < lines.length; li++) {
      let x = W / 2 + widths[li] / 2;
      for (const t of lines[li]) {
        if ('w' in t) {
          const w = ctx.measureText(t.w).width;
          ctx.fillStyle = th.text;
          ctx.font = `${fs}px 'KFGQPC Hafs', serif`;
          ctx.textAlign = 'right';
          ctx.fillText(t.w, x, y);
          x -= w + sp;
        } else {
          const cx = x - mk / 2;
          const cy = y - fs * 0.3;
          ctx.strokeStyle = th.gold;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, mk * 0.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, mk * 0.4, 0, Math.PI * 2);
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = th.gold;
          ctx.font = `700 ${Math.round(mk * 0.46)}px ${kufi}`;
          ctx.textAlign = 'center';
          ctx.fillText(toAr(t.n), cx, cy + mk * 0.16);
          x -= mk + sp;
        }
      }
      y += lh;
    }

    // التذييل
    ctx.textAlign = 'center';
    ctx.fillStyle = th.sub;
    ctx.font = `600 34px ${kufi}`;
    const ref = end === idx ? `${s.name} • آية ${toAr(data.ayas[idx][1])}` : `${s.name} • الآيات ${toAr(data.ayas[idx][1])}–${toAr(data.ayas[end][1])}`;
    ctx.fillText(ref, W / 2, H - 150);
    ctx.fillStyle = th.gold;
    ctx.font = `600 28px ${kufi}`;
    ctx.fillText('صلّي على النبي ﷺ', W / 2, H - 105);
  }, [data, idx, end, sura, theme, size]);

  useEffect(() => {
    draw();
  }, [draw]);

  async function share() {
    const c = cv.current;
    if (!c) return;
    setMsg('');
    const nat = nativeShare();
    if (nat?.shareImage) {
      try {
        await nat.shareImage({ data: c.toDataURL('image/png').split(',')[1], text: '' });
        return;
      } catch {}
    }
    const blob: Blob | null = await new Promise((r) => c.toBlob((b) => r(b), 'image/png'));
    if (!blob) return;
    const file = new File([blob], 'ayah.png', { type: 'image/png' });
    try {
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file] });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
    }
    setImg(c.toDataURL('image/png'));
  }

  async function save() {
    const c = cv.current;
    if (!c) return;
    const nat = nativeShare();
    if (nat?.saveImage) {
      try {
        await nat.saveImage({ data: c.toDataURL('image/png').split(',')[1] });
        setMsg('اتحفظت الصورة في المعرض');
        return;
      } catch {
        setMsg('تعذّر الحفظ، جرّب المشاركة');
        return;
      }
    }
    setImg(c.toDataURL('image/png'));
  }

  return (
    <div className="vs-back" role="dialog" aria-label="مشاركة آية">
      <div className="vs">
        <div className="vs-top">
          <b>مشاركة الآية</b>
          <button type="button" className="vs-x" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </div>
        <div className="vs-prev">
          <canvas ref={cv} className="vs-cv" />
        </div>
        <div className="vs-row">
          <span>عدد الآيات</span>
          <div className="vs-step">
            <button type="button" onClick={() => setCount((n) => Math.max(1, n - 1))}>
              −
            </button>
            <b>{toAr(end - idx + 1)}</b>
            <button type="button" onClick={() => setCount((n) => Math.min(8, n + 1))}>
              +
            </button>
          </div>
        </div>
        <div className="vs-chips">
          {THEMES.map((t, i) => (
            <button key={t.id} type="button" className={theme === i ? 'on' : ''} onClick={() => setTheme(i)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="vs-chips">
          {(
            [
              ['post', 'منشور'],
              ['square', 'مربع'],
              ['story', 'ستوري'],
            ] as [SizeKey, string][]
          ).map(([k, l]) => (
            <button key={k} type="button" className={size === k ? 'on' : ''} onClick={() => setSize(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="vs-act">
          <button type="button" className="vs-main" onClick={share}>
            مشاركة
          </button>
          <button type="button" onClick={save}>
            حفظ كصورة
          </button>
        </div>
        {msg && <p className="vs-msg">{msg}</p>}
        {img && (
          <div className="vs-fb">
            <p>اضغط مطولًا على الصورة لحفظها أو مشاركتها</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="بطاقة الآية" />
          </div>
        )}
      </div>
      <style>{`
        .vs-back { position: fixed; inset: 0; z-index: 80; background: rgba(0,0,0,.82); overflow-y: auto; padding: 14px; }
        .vs { max-width: 480px; margin: 0 auto; padding: 14px; border-radius: 22px; background: #14110a; border: 1px solid rgba(232,194,90,.45); }
        .vs-top { display: flex; justify-content: space-between; align-items: center; color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 17px; margin: 0 0 10px; }
        .vs-x { width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #f1d77a; }
        .vs-prev { border-radius: 12px; overflow: hidden; border: 1px solid rgba(232,194,90,.25); }
        .vs-cv { display: block; width: 100%; height: auto; }
        .vs-row { display: flex; justify-content: space-between; align-items: center; margin: 12px 0 8px; color: rgba(255,241,196,.8); font-family: var(--font-ruqaa), serif; font-size: 16px; }
        .vs-step { display: flex; align-items: center; gap: 12px; color: #f1d77a; font-family: var(--font-kufi), sans-serif; }
        .vs-step button { width: 38px; height: 38px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-size: 20px; }
        .vs-chips { display: flex; gap: 8px; margin: 8px 0; }
        .vs-chips button { flex: 1; padding: 9px 4px; border-radius: 12px; border: 1px solid rgba(232,194,90,.3); background: transparent; color: rgba(241,215,122,.8); font-family: var(--font-kufi), sans-serif; font-size: 14px; }
        .vs-chips button.on { background: rgba(232,194,90,.25); color: #fff1c4; border-color: rgba(232,194,90,.8); }
        .vs-act { display: flex; gap: 10px; margin-top: 12px; }
        .vs-act button { flex: 1; padding: 13px 6px; border-radius: 14px; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.12); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 15px; }
        .vs-act .vs-main { background: rgba(232,194,90,.3); }
        .vs-msg { text-align: center; color: #f1d77a; font-family: var(--font-ruqaa), serif; }
        .vs-fb { margin-top: 12px; text-align: center; color: rgba(255,241,196,.75); font-family: var(--font-ruqaa), serif; }
        .vs-fb img { width: 100%; border-radius: 12px; }
      `}</style>
    </div>
  );
}
