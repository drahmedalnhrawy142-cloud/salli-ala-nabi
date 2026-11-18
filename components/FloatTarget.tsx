'use client';

import { useCallback, useEffect, useState } from 'react';

type FP = {
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
const ar = (n: number) => n.toLocaleString('ar-EG');

/** هدف الأيقونة العايمة: عدد مرات (١٠٠، ١٠٠٠ ...) أو ∞، والحلقة بتتصفّر لما توصله. */
export function FloatTarget() {
  const [st, setSt] = useState<{ count: number; target: number }>({ count: 0, target: 100 });
  const [custom, setCustom] = useState('');

  const refresh = useCallback(() => {
    plug()
      ?.floatState()
      .then((s) => setSt(s))
      .catch(() => {});
  }, []);

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
      <style>{`
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
