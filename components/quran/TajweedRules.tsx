'use client';

import { SectionGrid } from '@/components/SectionGrid';
import { ayaIndex, toAr, type QData } from './data';
import { useState } from 'react';
import { TAJWEED3 } from './tajweed3Data';

type Mode = 'f' | 'e' | 'g';
const MODES: { id: Mode; label: string }[] = [
  { id: 'f', label: 'فصحى' },
  { id: 'e', label: 'بالمصري' },
  { id: 'g', label: 'بالخليجي' },
];
const KEY = 'tj.mode';

/** أحكام التجويد مع أمثلة حقيقية من المصحف (بخط المصحف). */
export function TajweedRules({
  data,
  onOpenAt,
}: {
  data: QData;
  onOpenAt: (page: number, ayaIdx: number | null) => void;
}) {
  const [mode, setModeS] = useState<Mode>(() => {
    try {
      const v = localStorage.getItem(KEY);
      return v === 'e' || v === 'g' ? v : 'f';
    } catch {
      return 'f';
    }
  });
  const setMode = (m: Mode) => {
    setModeS(m);
    try { localStorage.setItem(KEY, m); } catch {}
  };
  return (
    <div className="tj">
      <div className="tj-modes">
        {MODES.map((m) => (
          <button key={m.id} type="button" className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <SectionGrid
        secs={TAJWEED3.map((g) => ({
          id: g.id,
          label: g.title,
          icon: g.icon,
          render: () => (
            <div className="tj-list">
              <p className="tj-intro">{g.intro[mode]}</p>
              {g.items.map((it) => (
                <article key={it.name} className="tj-card">
                  <h4 className="tj-name">{it.name}</h4>
                  <p className="tj-rule">{it[mode]}</p>
                  {it.ex.map((e, k) => {
                    const i = ayaIndex(data, e.s, e.a);
                    if (i < 0) return null;
                    const a = data.ayas[i];
                    const words = a[4].split(' ');
                    return (
                      <button key={k} type="button" className="tj-ex" onClick={() => onOpenAt(a[2], i)}>
                        <span className="tj-w">{words.slice(e.f, e.t).join(' ')}</span>
                        <span className="tj-ref">
                          {data.suras[e.s - 1].name} • {toAr(e.a)}
                          {e.n ? ` — ${e.n}` : ''}
                        </span>
                      </button>
                    );
                  })}
                </article>
              ))}
            </div>
          ),
        }))}
      />
      <style>{`
        .tj-modes { display: flex; gap: 8px; justify-content: center; margin: 0 0 12px; }
        .tj-modes button { padding: 8px 18px; border-radius: 999px; border: 1px solid rgba(232,194,90,.3); background: transparent; color: #fff1c4; font-family: var(--font-kufi), sans-serif; font-size: 14px; }
        .tj-modes .on { background: rgba(232,194,90,.22); border-color: #e8c25a; color: #f1d77a; }
        .tj-list { display: flex; flex-direction: column; gap: 12px; }
        .tj-intro { margin: 0; font-family: var(--font-ruqaa), serif; font-size: 17px; line-height: 1.9; color: rgba(255,241,196,.8); }
        .tj-card { padding: 14px; border-radius: 20px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); }
        .tj-name { margin: 0 0 6px; font-family: var(--font-kufi), sans-serif; font-size: 16px; color: #f1d77a; }
        .tj-rule { margin: 0 0 10px; font-family: var(--font-ruqaa), serif; font-size: 17px; line-height: 1.9; color: #fff1c4; }
        .tj-ex { display: flex; flex-direction: column; gap: 3px; width: 100%; padding: 10px 12px; margin-top: 6px; text-align: right; border-radius: 14px; border: 1px solid rgba(232,194,90,.22); background: rgba(232,194,90,.06); }
        .tj-w { font-family: 'KFGQPC Hafs', serif; font-size: 27px; line-height: 2; color: #fff1c4; direction: rtl; }
        .tj-ref { font-family: var(--font-kufi), sans-serif; font-size: 12px; color: #e8c25a; }
      `}</style>
    </div>
  );
}
