'use client';

import { SectionGrid } from '@/components/SectionGrid';
import { ayaIndex, toAr, type QData } from './data';
import { TAJWEED } from './tajweedData';

/** أحكام التجويد مع أمثلة حقيقية من المصحف (بخط المصحف). */
export function TajweedRules({
  data,
  onOpenAt,
}: {
  data: QData;
  onOpenAt: (page: number, ayaIdx: number | null) => void;
}) {
  return (
    <div className="tj">
      <SectionGrid
        secs={TAJWEED.map((g) => ({
          id: g.id,
          label: g.title,
          icon: g.icon,
          render: () => (
            <div className="tj-list">
              {g.intro && <p className="tj-intro">{g.intro}</p>}
              {g.items.map((it) => (
                <article key={it.name} className="tj-card">
                  <h4 className="tj-name">{it.name}</h4>
                  <p className="tj-rule">{it.rule}</p>
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
