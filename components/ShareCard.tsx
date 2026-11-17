'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const FORMULAS = [
  'اللهم صلِّ على محمد',
  'اللهم صلِّ وسلِّم وبارك على سيدنا محمد',
  'صلّى الله عليه وسلّم',
];
const HADITH = 'قال ﷺ: «مَن صلّى عليَّ صلاةً صلّى الله عليه بها عشرًا» — رواه مسلم';

const W = 1080;
const H = 1350;

function fam(name: string, fallback: string) {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v ? `${v}, ${fallback}` : fallback;
  } catch {
    return fallback;
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

type NativeShare = {
  shareImage?(o: { data: string; text: string }): Promise<void>;
  saveImage?(o: { data: string }): Promise<void>;
};

function nativeShare(): NativeShare | null {
  try {
    const w = window as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        Plugins?: Record<string, unknown>;
      };
    };
    if (!w.Capacitor?.isNativePlatform?.()) return null;
    return (w.Capacitor.Plugins?.FloatingButton as NativeShare) ?? null;
  } catch {
    return null;
  }
}

export function ShareCard({ count }: { count: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [name, setName] = useState('');
  const [formula, setFormula] = useState(0);
  const [showCount, setShowCount] = useState(true);
  const [fallbackImg, setFallbackImg] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      setName(localStorage.getItem('share_name') || '');
    } catch {}
  }, []);

  const draw = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const kufi = fam('--font-kufi', 'sans-serif');
    const ruqaa = fam('--font-ruqaa', 'serif');
    try {
      await Promise.all([
        document.fonts.load(`700 40px ${kufi}`, 'صلّي على النبي'),
        document.fonts.load(`400 40px ${ruqaa}`, 'اللهم صلِّ على محمد'),
      ]);
    } catch {}

    c.width = W;
    c.height = H;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // خلفية
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05070d');
    bg.addColorStop(0.55, '#0b0a08');
    bg.addColorStop(1, '#17110a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W / 2, 560, 40, W / 2, 560, 620);
    glow.addColorStop(0, 'rgba(232,194,90,0.22)');
    glow.addColorStop(1, 'rgba(232,194,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // نجوم ثابتة
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 140; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const r = rnd() * 2 + 0.4;
      ctx.fillStyle = `rgba(255,240,200,${0.25 + rnd() * 0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // إطار ذهبي مزدوج
    const gold = ctx.createLinearGradient(0, 0, W, H);
    gold.addColorStop(0, '#f6e49c');
    gold.addColorStop(0.5, '#b8902f');
    gold.addColorStop(1, '#f1d77a');
    ctx.strokeStyle = gold;
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.lineWidth = 2;
    ctx.strokeRect(62, 62, W - 124, H - 124);

    // العنوان
    ctx.fillStyle = '#f1d77a';
    ctx.shadowColor = 'rgba(232,194,90,0.7)';
    ctx.shadowBlur = 24;
    ctx.font = `700 78px ${kufi}`;
    ctx.fillText('صلّي على النبي ﷺ', W / 2, 200);
    ctx.shadowBlur = 0;

    // فاصل
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 200, 270);
    ctx.lineTo(W / 2 + 200, 270);
    ctx.stroke();

    // الصيغة
    ctx.fillStyle = '#fff1c4';
    ctx.shadowColor = 'rgba(255,216,120,0.65)';
    ctx.shadowBlur = 22;
    ctx.font = `400 92px ${ruqaa}`;
    const lines = wrap(ctx, FORMULAS[formula], W - 260);
    const lh = 150;
    const startY = 560 - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lh));
    ctx.shadowBlur = 0;

    // العدّاد
    let y = 800;
    if (showCount && count > 0) {
      ctx.fillStyle = '#e8c25a';
      ctx.font = `700 52px ${kufi}`;
      ctx.fillText(
        `صلّيت ${count.toLocaleString('ar-EG')} صلاة على النبي ﷺ`,
        W / 2,
        y
      );
      y += 100;
    }

    // التكريم
    const clean = name.trim();
    if (clean) {
      ctx.strokeStyle = 'rgba(232,194,90,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(190, y - 20, W - 380, 150);
      ctx.fillStyle = '#c9a24a';
      ctx.font = `400 40px ${ruqaa}`;
      ctx.fillText('تكريمًا لـ', W / 2, y + 22);
      ctx.fillStyle = '#ffe9a8';
      ctx.font = `700 60px ${kufi}`;
      ctx.fillText(clean, W / 2, y + 86, W - 440);
    }

    // الحديث
    ctx.fillStyle = 'rgba(255,241,196,0.85)';
    ctx.font = `400 38px ${ruqaa}`;
    const hl = wrap(ctx, HADITH, W - 280);
    hl.forEach((l, i) => ctx.fillText(l, W / 2, 1130 + i * 60));

    ctx.fillStyle = 'rgba(232,194,90,0.7)';
    ctx.font = `700 30px ${kufi}`;
    ctx.fillText('salli-ala-nabi.vercel.app', W / 2, 1262);
  }, [name, formula, showCount, count]);

  // نرسم البطاقة بعد ما العدّاد يهدى (مش مع كل ضغطة): ده بيخفّف الضغط على المعالج
  useEffect(() => {
    const t = window.setTimeout(() => {
      draw();
    }, 600);
    return () => window.clearTimeout(t);
  }, [draw]);

  function saveName(v: string) {
    const clean = v.slice(0, 40);
    setName(clean);
    try {
      localStorage.setItem('share_name', clean);
    } catch {}
  }

  async function saveToGallery() {
    const c = canvasRef.current;
    if (!c) return;
    const native = nativeShare();
    if (native?.saveImage) {
      try {
        await native.saveImage({ data: c.toDataURL('image/png').split(',')[1] });
        setMsg('اتحفظت البطاقة في معرض الصور');
        return;
      } catch {
        setMsg('تعذر الحفظ، جرّب المشاركة ثم حفظ الصورة');
        return;
      }
    }
    setFallbackImg(c.toDataURL('image/png'));
  }

  async function share() {
    const c = canvasRef.current;
    if (!c) return;
    setMsg('');
    const native = nativeShare();
    if (native?.shareImage) {
      try {
        await native.shareImage({
          data: c.toDataURL('image/png').split(',')[1],
          text: 'اللهم صلِّ وسلِّم وبارك على سيدنا محمد ﷺ',
        });
        return;
      } catch {
        // نكمل بالطريقة الاحتياطية
      }
    }
    const blob: Blob | null = await new Promise((r) =>
      c.toBlob((b) => r(b), 'image/png')
    );
    if (!blob) return;
    const file = new File([blob], 'salli-ala-nabi.png', { type: 'image/png' });
    try {
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
      };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          text: 'اللهم صلِّ وسلِّم وبارك على سيدنا محمد ﷺ',
        });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
    }
    setFallbackImg(c.toDataURL('image/png'));
  }

  return (
    <section className="content-card sharecard">
      <h2 className="section-title">بطاقة تشاركها</h2>

      <canvas ref={canvasRef} className="sc-canvas" />

      <label className="sc-label" htmlFor="sc-name">
        اسم يظهر على البطاقة كتكريم (اختياري)
      </label>
      <input
        id="sc-name"
        className="sc-input"
        value={name}
        maxLength={40}
        placeholder="اكتب الاسم هنا"
        onChange={(e) => saveName(e.target.value)}
      />

      <div className="sc-chips">
        {FORMULAS.map((f, i) => (
          <button
            key={f}
            type="button"
            className={i === formula ? 'sc-chip sc-on' : 'sc-chip'}
            onClick={() => setFormula(i)}
          >
            {f}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="sc-toggle"
        onClick={() => setShowCount((v) => !v)}
      >
        {showCount ? 'عدد صلواتي: ظاهر على البطاقة' : 'عدد صلواتي: مخفي'}
      </button>

      <button type="button" className="sc-share" onClick={share}>
        مشاركة البطاقة
      </button>
      <button type="button" className="sc-save" onClick={saveToGallery}>
        حفظ في معرض الصور
      </button>
      {msg && <p className="sc-msg">{msg}</p>}

      {fallbackImg && (
        <div className="sc-modal" onClick={() => setFallbackImg('')}>
          <div className="sc-modal-in" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fallbackImg} alt="بطاقة الصلاة على النبي" />
            <p>اضغط مطولًا على الصورة لحفظها أو مشاركتها</p>
            <button type="button" onClick={() => setFallbackImg('')}>
              إغلاق
            </button>
          </div>
        </div>
      )}

      <style>{`
        .sc-canvas { width: 100%; height: auto; aspect-ratio: ${W} / ${H}; border-radius: 16px; display: block; margin: 8px 0 14px; border: 1px solid rgba(232,194,90,.3); }
        .sc-label { display: block; font-family: var(--font-ruqaa), serif; margin-bottom: 6px; opacity: .9; }
        .sc-input { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(232,194,90,.45); background: rgba(255,255,255,.04); color: #fff1c4; font-family: var(--font-ruqaa), serif; font-size: 1.15rem; }
        .sc-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
        .sc-chip { font-family: var(--font-ruqaa), serif; padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; cursor: pointer; }
        .sc-on { background: rgba(232,194,90,.2); color: #f6e49c; }
        .sc-toggle { font-family: var(--font-kufi), sans-serif; font-weight: 700; padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(232,194,90,.3); background: transparent; color: #e8c25a; cursor: pointer; margin-bottom: 12px; }
        .sc-share { display: block; width: 100%; padding: 14px; border-radius: 14px; border: 1px solid rgba(232,194,90,.6); background: linear-gradient(135deg,#f1d77a,#b8902f); color: #1a1205; font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 1.1rem; cursor: pointer; }
        .sc-save { display: block; width: 100%; margin-top: 10px; padding: 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.5); background: transparent; color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-weight: 700; cursor: pointer; }
        .sc-msg { font-family: var(--font-ruqaa), serif; text-align: center; }
        .sc-modal { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.85); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .sc-modal-in { max-width: 420px; width: 100%; text-align: center; }
        .sc-modal-in img { width: 100%; border-radius: 12px; }
        .sc-modal-in p { font-family: var(--font-ruqaa), serif; color: #f1d77a; }
        .sc-modal-in button { font-family: var(--font-kufi), sans-serif; padding: 10px 28px; border-radius: 999px; border: 1px solid #e8c25a; background: transparent; color: #e8c25a; }
      `}</style>
    </section>
  );
}
