'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toAr } from '../quran/data';
import { GARDEN_HADITH } from './ahadith';

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
function fam(name: string, fb: string) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v ? `${v}, ${fb}` : fb;
  } catch {
    return fb;
  }
}
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

const W = 1080;
const H = 1350;

/** بطاقة مشاركة البستان: «هذا بستاني» أو «أُهديك نخلة» مع اسم المُهدى إليه */
export function GardenShare({ scene, total, palms, onClose }: { scene: HTMLCanvasElement | null; total: number; palms: number; onClose: () => void }) {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'mine' | 'gift'>('mine');
  const [to, setTo] = useState('');
  const [msg, setMsg] = useState('');
  const [img, setImg] = useState('');
  const palm = GARDEN_HADITH.find((h) => h.id === 'palm')!;

  const draw = useCallback(() => {
    const c = cv.current;
    if (!c) return;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    const kufi = fam('--font-kufi', 'sans-serif');
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0905');
    g.addColorStop(1, '#1c1507');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#e8c25a';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.fillStyle = '#e8c25a';
    ctx.font = `700 50px ${kufi}`;
    ctx.fillText(mode === 'mine' ? 'بستاني في صلّي على النبي ﷺ' : 'أُهديك نخلة من بستاني', W / 2, 120);
    if (mode === 'gift' && to.trim()) {
      ctx.fillStyle = '#f7ebc1';
      ctx.font = `600 40px ${kufi}`;
      ctx.fillText(`إلى: ${to.trim().slice(0, 40)}`, W / 2, 180);
    }
    // مشهد البستان
    const top = mode === 'gift' && to.trim() ? 210 : 160;
    const bw = 900;
    const bh = 700;
    if (scene && scene.width > 0) {
      const r = Math.max(bw / scene.width, bh / scene.height);
      const sw = bw / r;
      const sh = bh / r;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect((W - bw) / 2, top, bw, bh, 28);
      ctx.clip();
      ctx.drawImage(scene, (scene.width - sw) / 2, scene.height - sh - (scene.height - sh) * 0.15, sw, sh, (W - bw) / 2, top, bw, bh);
      ctx.restore();
      ctx.strokeStyle = 'rgba(232,194,90,.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect((W - bw) / 2, top, bw, bh, 28);
      ctx.stroke();
    }
    let y = top + bh + 70;
    if (mode === 'mine') {
      ctx.fillStyle = '#f7ebc1';
      ctx.font = `700 46px ${kufi}`;
      ctx.fillText(`${toAr(total)} ذكرًا • ${toAr(palms)} نخلة`, W / 2, y);
      y += 60;
      ctx.fillStyle = 'rgba(247,235,193,.75)';
      ctx.font = `400 32px ${kufi}`;
      ctx.fillText('كل ذكرٍ غِراسٌ في بستاني', W / 2, y);
    } else {
      ctx.fillStyle = '#f7ebc1';
      ctx.font = `600 38px "Amiri Quran", ${fam('--f-amiriq', 'serif')}`;
      const lines = wrap(ctx, palm.text, 880);
      for (const l of lines) {
        ctx.fillText(l, W / 2, y);
        y += 62;
      }
      ctx.fillStyle = 'rgba(247,235,193,.7)';
      ctx.font = `400 28px ${kufi}`;
      ctx.fillText(`${palm.narrator} — ${palm.source} — ${palm.grade}`, W / 2, y + 6);
      y += 56;
      ctx.fillStyle = '#e8c25a';
      ctx.font = `500 32px ${kufi}`;
      ctx.fillText('أسأل الله أن يجعل لك في الجنة نخلةً وأكثر', W / 2, y);
    }
    ctx.fillStyle = 'rgba(232,194,90,.6)';
    ctx.font = `400 26px ${kufi}`;
    ctx.fillText('صلّي على النبي ﷺ', W / 2, H - 70);
  }, [mode, to, scene, total, palms, palm]);

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
    const file = new File([blob], 'garden.png', { type: 'image/png' });
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
      } catch {
        setMsg('تعذّر الحفظ، جرّب المشاركة');
      }
      return;
    }
    setImg(c.toDataURL('image/png'));
  }

  return (
    <div className="gs-back" role="dialog" aria-label="مشاركة البستان">
      <div className="gs">
        <div className="gs-top">
          <b>مشاركة البستان</b>
          <button type="button" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div className="gs-tabs">
          <button type="button" className={mode === 'mine' ? 'on' : ''} onClick={() => setMode('mine')}>هذا بستاني</button>
          <button type="button" className={mode === 'gift' ? 'on' : ''} onClick={() => setMode('gift')}>أُهديك نخلة</button>
        </div>
        {mode === 'gift' && (
          <input className="gs-in" value={to} maxLength={40} placeholder="اسم من تُهديه (اختياري)" onChange={(e) => setTo(e.target.value)} />
        )}
        <canvas ref={cv} className="gs-cv" />
        {img && (
          <div className="gs-img">
            <img src={img} alt="بطاقة البستان" />
            <span>اضغط على الصورة مطوّلًا لحفظها</span>
          </div>
        )}
        {msg && <div className="gs-msg">{msg}</div>}
        <div className="gs-btns">
          <button type="button" onClick={share}>مشاركة 📤</button>
          <button type="button" onClick={save}>حفظ كصورة</button>
        </div>
      </div>
      <style>{`
        .gs-back { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.8); display: flex; align-items: center; justify-content: center; padding: 10px; }
        .gs { width: min(440px, 100%); max-height: 96vh; overflow: auto; background: #120f08; border: 1px solid rgba(232,194,90,.5); border-radius: 18px; padding: 12px; color: #f7ebc1; font-family: var(--font-kufi), sans-serif; }
        .gs-top { display: flex; justify-content: space-between; align-items: center; color: #f1d77a; }
        .gs-top button { background: none; border: 0; color: #f1d77a; font-size: 18px; padding: 4px 8px; }
        .gs-tabs { display: flex; gap: 8px; margin: 8px 0; }
        .gs-tabs button, .gs-btns button { flex: 1; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #f7ebc1; font-family: inherit; font-size: 14px; }
        .gs-tabs .on { background: rgba(232,194,90,.25); color: #f1d77a; }
        .gs-in { width: 100%; box-sizing: border-box; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #f7ebc1; font-family: inherit; font-size: 14px; margin-bottom: 8px; }
        .gs-cv { width: 100%; height: auto; border-radius: 12px; display: block; }
        .gs-btns { display: flex; gap: 8px; margin-top: 10px; }
        .gs-msg { margin-top: 8px; text-align: center; font-size: 13px; color: #ffd9a0; }
        .gs-img img { width: 100%; margin-top: 8px; border-radius: 12px; }
        .gs-img span { display: block; text-align: center; font-size: 12px; opacity: .7; margin-top: 4px; }
      `}</style>
    </div>
  );
}
