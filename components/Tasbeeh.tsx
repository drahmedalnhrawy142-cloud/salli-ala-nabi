'use client';

import { useEffect, useState } from 'react';

const DHIKR = [
  'سبحان الله',
  'الحمد لله',
  'الله أكبر',
  'لا إله إلا الله',
  'أستغفر الله',
  'لا حول ولا قوة إلا بالله',
  'سبحان الله وبحمده',
  'اللهم صلِّ على محمد',
];
const TARGETS = [33, 100, 0];

export function Tasbeeh() {
  const [idx, setIdx] = useState(0);
  const [target, setTarget] = useState(33);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [rounds, setRounds] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      setCounts(JSON.parse(localStorage.getItem('tasbeeh_counts') || '{}') || {});
      setRounds(JSON.parse(localStorage.getItem('tasbeeh_rounds') || '{}') || {});
      const t = localStorage.getItem('tasbeeh_target');
      if (t !== null) setTarget(Number(t));
      const i = Number(localStorage.getItem('tasbeeh_idx') || 0);
      if (i >= 0 && i < DHIKR.length) setIdx(i);
    } catch {}
  }, []);

  const name = DHIKR[idx];
  const c = counts[name] || 0;
  const r = rounds[name] || 0;

  function save(nc: Record<string, number>, nr: Record<string, number>) {
    setCounts(nc);
    setRounds(nr);
    try {
      localStorage.setItem('tasbeeh_counts', JSON.stringify(nc));
      localStorage.setItem('tasbeeh_rounds', JSON.stringify(nr));
    } catch {}
  }

  function tap() {
    let next = c + 1;
    let nr = r;
    let done = false;
    if (target > 0 && next >= target) {
      next = 0;
      nr = r + 1;
      done = true;
    }
    try {
      if (navigator.vibrate) navigator.vibrate(done ? [40, 50, 80] : 15);
    } catch {}
    save({ ...counts, [name]: next }, { ...rounds, [name]: nr });
  }

  function reset() {
    save({ ...counts, [name]: 0 }, { ...rounds, [name]: 0 });
  }

  function pick(i: number) {
    setIdx(i);
    try {
      localStorage.setItem('tasbeeh_idx', String(i));
    } catch {}
  }

  function pickTarget(t: number) {
    setTarget(t);
    try {
      localStorage.setItem('tasbeeh_target', String(t));
    } catch {}
  }

  const n = (v: number) => v.toLocaleString('ar-EG');
  const pct = target > 0 ? Math.min(100, (c / target) * 100) : 100;
  const R = 112;
  const C = 2 * Math.PI * R;

  return (
    <section className="content-card tasbeeh">
      <h2 className="section-title">السبحة</h2>

      <div className="tb-chips">
        {DHIKR.map((d, i) => (
          <button
            key={d}
            type="button"
            className={i === idx ? 'tb-chip tb-on' : 'tb-chip'}
            onClick={() => pick(i)}
          >
            {d}
          </button>
        ))}
      </div>

      <button type="button" className="tb-btn" onClick={tap} aria-label={`${name}: ${c}`}>
        <svg viewBox="0 0 260 260" className="tb-ring" aria-hidden="true">
          <circle cx="130" cy="130" r={R} fill="none" stroke="rgba(232,194,90,.15)" strokeWidth="8" />
          <circle
            cx="130" cy="130" r={R} fill="none" stroke="#f1d77a" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100}
            transform="rotate(-90 130 130)"
            style={{ transition: 'stroke-dashoffset .2s ease' }}
          />
        </svg>
        <span className="tb-name">{name}</span>
        <span className="tb-num">{n(c)}</span>
        <span className="tb-of">{target > 0 ? `من ${n(target)}` : 'بلا حد ∞'}</span>
      </button>

      <p className="tb-rounds">
        {r > 0 ? `أتممت ${n(r)} ${r === 1 ? 'دورة' : 'دورات'}` : ' '}
      </p>

      <div className="tb-targets">
        {TARGETS.map((t) => (
          <button
            key={t}
            type="button"
            className={t === target ? 'tb-chip tb-on' : 'tb-chip'}
            onClick={() => pickTarget(t)}
          >
            {t > 0 ? n(t) : '∞'}
          </button>
        ))}
        <button type="button" className="tb-chip tb-reset" onClick={reset}>
          تصفير
        </button>
      </div>

      <style>{`
        .tb-chips, .tb-targets { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .tb-chip { font-family: var(--font-ruqaa), serif; font-size: 1rem; padding: 7px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; cursor: pointer; }
        .tb-targets .tb-chip { font-family: var(--font-kufi), sans-serif; font-weight: 700; }
        .tb-on { background: rgba(232,194,90,.2); color: #f6e49c; }
        .tb-reset { border-color: rgba(255,150,120,.45); color: #ffb19c; }
        .tb-btn { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 18px auto 6px; width: 260px; max-width: 100%; aspect-ratio: 1; border-radius: 50%; border: 0; background: radial-gradient(circle at 50% 35%, rgba(232,194,90,.18), rgba(232,194,90,.04) 70%); cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        .tb-btn:active { transform: scale(.97); }
        .tb-ring { position: absolute; inset: 0; width: 100%; height: 100%; }
        .tb-name { font-family: var(--font-ruqaa), serif; font-size: 1.2rem; color: #fff1c4; max-width: 70%; line-height: 1.6; }
        .tb-num { font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 3.4rem; color: #f1d77a; line-height: 1.2; }
        .tb-of { font-family: var(--font-kufi), sans-serif; opacity: .7; font-size: .95rem; }
        .tb-rounds { font-family: var(--font-kufi), sans-serif; color: #e8c25a; min-height: 1.6em; margin: 8px 0 12px; }
      `}</style>
    </section>
  );
}
