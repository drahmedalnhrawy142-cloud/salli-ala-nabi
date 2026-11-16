'use client';

import { useEffect, useState } from 'react';

const STEPS = [90, 100, 115, 130];

function apply(pct: number) {
  const el = document.querySelector('.content-area') as HTMLElement | null;
  if (el) (el.style as CSSStyleDeclaration & { zoom: string }).zoom = String(pct / 100);
}

/** حجم الخط: تكبير أو تصغير محتوى الصفحات. */
export function FontSize() {
  const [pct, setPct] = useState(100);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem('ui_zoom') || 100);
      if (STEPS.includes(v)) {
        setPct(v);
        apply(v);
      }
    } catch {}
  }, []);

  function pick(v: number) {
    setPct(v);
    apply(v);
    try {
      localStorage.setItem('ui_zoom', String(v));
    } catch {}
  }

  return (
    <section className="content-card" id="s-font">
      <h2 className="section-title">حجم الخط</h2>
      <div className="fs-row">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            className={s === pct ? 'fs-btn fs-on' : 'fs-btn'}
            onClick={() => pick(s)}
            style={{ fontSize: `${0.9 + i * 0.2}rem` }}
          >
            {['صغير', 'عادي', 'كبير', 'أكبر'][i]}
          </button>
        ))}
      </div>
      <style>{`
        .fs-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .fs-btn { padding: 8px 18px; border-radius: 999px; cursor: pointer; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; font-family: var(--font-kufi), sans-serif; font-weight: 700; }
        .fs-on { background: rgba(232,194,90,.2); color: #f6e49c; }
      `}</style>
    </section>
  );
}
