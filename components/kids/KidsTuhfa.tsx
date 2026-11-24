'use client';

import { useEffect, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { bump, claim, useKids } from './store';

type Sec = { t: string; v: [string, string][] };

/** «تحفة الأطفال والغلمان في تجويد القرآن» — منظومة للصغار: قراءة، ثم وضع الحفظ (يُخفى صدر أو عجز البيت). */
export function KidsTuhfa() {
  const [secs, setSecs] = useState<Sec[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [mode, setMode] = useState<'read' | 'learn'>('read');
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState('');
  const kids = useKids();

  useEffect(() => {
    fetch('/tuhfa.json').then((r) => r.json()).then(setSecs).catch(() => setSecs([]));
  }, []);

  if (!secs) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;

  if (open === null)
    return (
      <div className="tf">
        <p className="tf-n">منظومة قصيرة للصغار في أحكام التجويد، للشيخ سليمان الجمزوري. اختر بابًا، اقرأه ثم جرّب حفظه.</p>
        {secs.map((s, i) => (
          <button key={i} type="button" className="tf-sec" onClick={() => { setOpen(i); setShown({}); setDone(''); }}>
            <span>{s.t}</span>
            <span className="tf-c">{kids.claimed.includes(`tf.${i}`) ? '⭐ ' : ''}{toAr(s.v.length)} أبيات</span>
          </button>
        ))}
        <Style />
      </div>
    );

  const s = secs[open];
  const finish = () => {
    claim(`tf.${open}`, 3);
    bump('plays');
    setDone('أحسنت! نلت ٣ نجوم ⭐⭐⭐');
  };
  return (
    <div className="tf">
      <button type="button" className="tf-back" onClick={() => setOpen(null)}>← الأبواب</button>
      <h3 className="tf-h">{s.t}</h3>
      <div className="tf-modes">
        <button type="button" className={mode === 'read' ? 'on' : ''} onClick={() => setMode('read')}>📖 قراءة</button>
        <button type="button" className={mode === 'learn' ? 'on' : ''} onClick={() => { setMode('learn'); setShown({}); }}>🧠 احفظ</button>
      </div>
      {s.v.map(([a, b], k) => {
        const key = `${open}.${k}`;
        const hide = mode === 'learn' && !shown[key];
        return (
          <button key={k} type="button" className="tf-v" onClick={() => mode === 'learn' && setShown((x) => ({ ...x, [key]: !x[key] }))}>
            <span>{a}</span>
            <span className={hide ? 'tf-hid' : ''}>{hide ? 'اضغط لإظهار الشطر الثاني' : b}</span>
          </button>
        );
      })}
      {mode === 'learn' && !done && (
        <button type="button" className="tf-ok" onClick={finish}>✔ أتممت حفظ هذا الباب</button>
      )}
      {done && <p className="tf-done">{done}</p>}
      <Style />
    </div>
  );
}

function Style() {
  return (
    <style>{`
      .tf { display: flex; flex-direction: column; gap: 10px; }
      .tf-n { margin: 0; text-align: center; font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 1.9; color: rgba(255,241,196,.75); }
      .tf-sec { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); color: #fff1c4; font-family: var(--font-kufi), sans-serif; font-size: 15px; text-align: right; }
      .tf-c { font-size: 12px; color: #e8c25a; }
      .tf-back { align-self: flex-start; background: none; border: 0; color: #e8c25a; font-family: var(--font-kufi), sans-serif; font-size: 14px; }
      .tf-h { margin: 0; text-align: center; font-family: var(--font-kufi), sans-serif; color: #f1d77a; }
      .tf-modes { display: flex; gap: 8px; justify-content: center; }
      .tf-modes button { padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(232,194,90,.3); background: transparent; color: #fff1c4; font-family: var(--font-kufi), sans-serif; }
      .tf-modes .on { background: rgba(232,194,90,.2); border-color: #e8c25a; }
      .tf-v { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.22); background: rgba(232,194,90,.06); text-align: center; color: #fff1c4; font-family: var(--font-ruqaa), serif; font-size: 20px; line-height: 1.9; }
      .tf-hid { opacity: .45; font-size: 14px; font-family: var(--font-kufi), sans-serif; }
      .tf-ok { padding: 12px; border-radius: 16px; border: 0; background: #e8c25a; color: #1a1409; font-family: var(--font-kufi), sans-serif; font-size: 15px; }
      .tf-done { text-align: center; color: #f1d77a; font-family: var(--font-kufi), sans-serif; margin: 0; }
    `}</style>
  );
}
