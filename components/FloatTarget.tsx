'use client';

import { useCallback, useEffect, useState } from 'react';

type D2 = { enabled: boolean; count: number; target: number; dhikr: string; total: number };
type FP = {
  float2Config?(o: { enabled?: boolean; target?: number; dhikr?: string; reset?: boolean }): Promise<void>;
  float2State?(): Promise<D2>;
  floatConfig(o: { target: number }): Promise<void>;
  floatReset(): Promise<void>;
  floatState(): Promise<{ count: number; target: number }>;
};

function plug(): FP | null {
  try {
    const c = (window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, unknown> };
    }).Capacitor;
    if (!c?.isNativePlatform?.()) return null;
    return (c.Plugins?.FloatingButton as FP | undefined) || null;
  } catch {
    return null;
  }
}

const PRESETS = [33, 100, 500, 1000, 0];
const DHIKR = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله', 'سبحان الله وبحمده', 'سبحان الله العظيم', 'لا حول ولا قوة إلا بالله'];
const ar = (n: number) => n.toLocaleString('ar-EG');

/** هدف الأيقونة العايمة: عدد مرات (١٠٠، ١٠٠٠ ...) أو ∞، والحلقة بتتصفّر لما توصله. */
export function FloatTarget() {
  const [st, setSt] = useState<{ count: number; target: number }>({ count: 0, target: 100 });
  const [custom, setCustom] = useState('');
  const [d2, setD2] = useState<D2 | null>(null);
  const [mine, setMine] = useState('');

  const refresh = useCallback(() => {
    plug()
      ?.floatState()
      .then((s) => setSt(s))
      .catch(() => {});
    plug()
      ?.float2State?.()
      .then((s) => setD2(s))
      .catch(() => {});
  }, []);

  function cfg2(o: { enabled?: boolean; target?: number; dhikr?: string; reset?: boolean }) {
    setD2((x) => (x ? { ...x, ...o, count: o.reset ? 0 : x.count } : x));
    plug()
      ?.float2Config?.(o)
      .then(refresh)
      .catch(() => {});
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [refresh]);

  function choose(target: number) {
    setSt((s) => ({ ...s, target }));
    plug()
      ?.floatConfig({ target })
      .then(refresh)
      .catch(() => {});
  }

  function reset() {
    plug()
      ?.floatReset()
      .then(refresh)
      .catch(() => {});
  }

  return (
    <div className="ft">
      <h3 className="ft-title">عدّاد الأيقونة العايمة</h3>
      <p className="ft-now">
        {ar(st.count)} {st.target > 0 ? `من ${ar(st.target)}` : 'من ∞'}
      </p>
      <p className="float-note">
        حدّد كام مرة تصلّي عليه ﷺ من الأيقونة. لما توصل للعدد الحلقة بتتصفّر وتبدأ من جديد.
      </p>
      <div className="goal-options">
        {PRESETS.map((v) => (
          <button
            key={v}
            type="button"
            className={`goal-chip${st.target === v ? ' goal-chip-on' : ''}`}
            onClick={() => choose(v)}
          >
            {v > 0 ? ar(v) : '∞'}
          </button>
        ))}
      </div>
      <form
        className="ft-custom"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(custom.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
          if (n > 0 && n <= 1000000) choose(Math.floor(n));
          setCustom('');
        }}
      >
        <input
          inputMode="numeric"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="عدد آخر"
          aria-label="عدد مخصص"
        />
        <button type="submit" className="goal-chip">
          تطبيق
        </button>
      </form>
      <button type="button" className="haptic-toggle" onClick={reset}>
        ↺ تصفير العدّاد
      </button>
      {d2 && (
        <div className="ft2">
          <h3 className="ft-title">الأيقونة الثانية: للذكر</h3>
          <p className="float-note">أيقونة ثانية خضراء تحت أيقونة الصلاة على النبي ﷺ، تعدّ أي ذكر تختاره (سبحان الله، الحمد لله…). اسحبها لـ ✕ لإخفائها.</p>
          <button type="button" className={`goal-chip${d2.enabled ? ' goal-chip-on' : ''}`} onClick={() => cfg2({ enabled: !d2.enabled })}>
            {d2.enabled ? '✓ ظاهرة' : 'إظهار الأيقونة الثانية'}
          </button>
          <p className="ft-now" style={{ fontSize: 18 }}>
            {d2.dhikr}: {ar(d2.count)} {d2.target > 0 ? `من ${ar(d2.target)}` : 'من ∞'}
          </p>
          <div className="goal-options">
            {DHIKR.map((v) => (
              <button key={v} type="button" className={`goal-chip${d2.dhikr === v ? ' goal-chip-on' : ''}`} onClick={() => cfg2({ dhikr: v, reset: true })}>
                {v}
              </button>
            ))}
          </div>
          <form
            className="ft-custom"
            onSubmit={(e) => {
              e.preventDefault();
              if (mine.trim()) cfg2({ dhikr: mine.trim().slice(0, 40), reset: true });
              setMine('');
            }}
          >
            <input value={mine} onChange={(e) => setMine(e.target.value)} placeholder="ذكر آخر تكتبه" aria-label="ذكر مخصص" />
            <button type="submit" className="goal-chip">تطبيق</button>
          </form>
          <div className="goal-options">
            {PRESETS.map((v) => (
              <button key={v} type="button" className={`goal-chip${d2.target === v ? ' goal-chip-on' : ''}`} onClick={() => cfg2({ target: v })}>
                {v > 0 ? ar(v) : '∞'}
              </button>
            ))}
          </div>
          <button type="button" className="haptic-toggle" onClick={() => cfg2({ reset: true })}>
            ↺ تصفير عدّاد الذكر
          </button>
        </div>
      )}
      <style>{`
        .ft2 { margin-top: 16px; padding-top: 12px; border-top: 1px dashed rgba(127,224,192,.3); }
        .ft { margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(232,194,90,.2); }
        .ft-title { margin: 0 0 6px; font-family: var(--font-kufi), sans-serif; font-size: 16px; color: #f1d77a; }
        .ft-now { margin: 0 0 8px; font-family: var(--font-kufi), sans-serif; font-size: 22px; color: #fff1c4; }
        .ft-custom { display: flex; gap: 8px; margin: 12px 0; }
        .ft-custom input {
          flex: 1; min-width: 0; padding: 10px 12px; border-radius: 12px; text-align: center;
          border: 1px solid rgba(232,194,90,.35); background: rgba(0,0,0,.4); color: #fff1c4;
          font-family: var(--font-kufi), sans-serif; font-size: 15px;
        }
      `}</style>
    </div>
  );
}
