'use client';

import { useMemo, useState } from 'react';

const TOTAL_BADGES = [
  { at: 100, name: 'مائة صلاة' },
  { at: 1000, name: 'ألف صلاة' },
  { at: 10000, name: 'عشرة آلاف' },
  { at: 100000, name: 'مائة ألف' },
];
const STREAK_BADGES = [
  { at: 3, name: 'ثلاثة أيام' },
  { at: 7, name: 'أسبوع' },
  { at: 30, name: 'شهر' },
  { at: 100, name: 'مائة يوم' },
];

function key(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA');
}

export function readHistory(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('prayer_history') || '{}') || {};
  } catch {
    return {};
  }
}

export function bumpHistory(day: string, n: number) {
  try {
    const h = readHistory();
    h[day] = (h[day] || 0) + n;
    const keys = Object.keys(h).sort();
    while (keys.length > 400) delete h[keys.shift() as string];
    localStorage.setItem('prayer_history', JSON.stringify(h));
  } catch {}
}

export function ProphetStats({
  count,
  todayCount,
  streak,
}: {
  count: number;
  todayCount: number;
  streak: number;
}) {
  const [range, setRange] = useState<7 | 30>(7);

  const days = useMemo(() => {
    const h = readHistory();
    const t = key(0);
    h[t] = Math.max(h[t] || 0, todayCount);
    const out: { k: string; v: number; label: string }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const k = key(-i);
      const label =
        range === 7
          ? new Date(k + 'T12:00:00').toLocaleDateString('ar-EG', {
              weekday: 'short',
            })
          : String(Number(k.slice(8)));
      out.push({ k, v: h[k] || 0, label });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, todayCount, count]);

  const sum = days.reduce((a, d) => a + d.v, 0);
  const best = Math.max(0, ...days.map((d) => d.v));
  const max = Math.max(1, best);
  const n = (v: number) => v.toLocaleString('ar-EG');

  const nextTotal = TOTAL_BADGES.find((b) => count < b.at);
  const nextPct = nextTotal
    ? Math.min(100, (count / nextTotal.at) * 100)
    : 100;

  return (
    <section className="content-card pstats">
      <h2 className="section-title">إحصائياتك وأوسمتك</h2>

      <div className="ps-tabs">
        <button
          type="button"
          className={range === 7 ? 'ps-tab ps-on' : 'ps-tab'}
          onClick={() => setRange(7)}
        >
          الأسبوع
        </button>
        <button
          type="button"
          className={range === 30 ? 'ps-tab ps-on' : 'ps-tab'}
          onClick={() => setRange(30)}
        >
          الشهر
        </button>
      </div>

      <div className={range === 30 ? 'ps-chart ps-thin' : 'ps-chart'}>
        {days.map((d) => (
          <div className="ps-col" key={d.k}>
            <div className="ps-barwrap">
              <div
                className="ps-bar"
                style={{ height: `${Math.max(d.v ? 6 : 2, (d.v / max) * 100)}%` }}
                title={n(d.v)}
              />
            </div>
            <span className="ps-lbl">{d.label}</span>
          </div>
        ))}
      </div>

      <div className="ps-sums">
        <div>
          <b>{n(sum)}</b>
          <span>{range === 7 ? 'صلاتك هذا الأسبوع' : 'صلاتك هذا الشهر'}</span>
        </div>
        <div>
          <b>{n(best)}</b>
          <span>أفضل يوم</span>
        </div>
        <div>
          <b>{n(streak)}</b>
          <span>أيام متتالية</span>
        </div>
      </div>
      <p className="ps-note">الرسم البياني يبدأ من يوم تحديث التطبيق.</p>

      <h3 className="ps-sub">الأوسمة</h3>
      <div className="ps-badges">
        {TOTAL_BADGES.map((b) => (
          <div
            key={'t' + b.at}
            className={count >= b.at ? 'ps-badge ps-got' : 'ps-badge'}
          >
            <span className="ps-medal">{count >= b.at ? '🏅' : '🔒'}</span>
            <b>{n(b.at)}</b>
            <span>{b.name}</span>
          </div>
        ))}
        {STREAK_BADGES.map((b) => (
          <div
            key={'s' + b.at}
            className={streak >= b.at ? 'ps-badge ps-got' : 'ps-badge'}
          >
            <span className="ps-medal">{streak >= b.at ? '🔥' : '🔒'}</span>
            <b>{n(b.at)} يوم</b>
            <span>{b.name} متتالية</span>
          </div>
        ))}
      </div>

      {nextTotal && (
        <>
          <p className="ps-next">
            الوسام القادم: {n(nextTotal.at)} صلاة — باقي{' '}
            {n(nextTotal.at - count)}
          </p>
          <div className="ps-nbar">
            <div className="ps-nfill" style={{ width: `${nextPct}%` }} />
          </div>
        </>
      )}

      <style>{`
        .ps-tabs { display: flex; gap: 8px; justify-content: center; margin-bottom: 12px; }
        .ps-tab {
          font-family: var(--font-kufi), sans-serif; font-weight: 700;
          padding: 8px 22px; border-radius: 999px; cursor: pointer;
          border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a;
        }
        .ps-on { background: rgba(232,194,90,.2); color: #f6e49c; }
        .ps-chart { display: flex; align-items: stretch; gap: 6px; height: 140px; direction: ltr; }
        .ps-thin { gap: 2px; }
        .ps-col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; }
        .ps-barwrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
        .ps-bar { width: 100%; border-radius: 5px 5px 2px 2px; background: linear-gradient(180deg,#f1d77a,#b8902f); }
        .ps-lbl { font-family: var(--font-kufi), sans-serif; font-size: .7rem; margin-top: 4px; opacity: .8; }
        .ps-thin .ps-lbl { font-size: .5rem; }
        .ps-sums { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 14px; text-align: center; }
        .ps-sums b { display: block; font-family: var(--font-kufi), sans-serif; font-size: 1.3rem; color: #f1d77a; }
        .ps-sums span { font-family: var(--font-ruqaa), serif; font-size: .95rem; opacity: .85; }
        .ps-note { font-family: var(--font-ruqaa), serif; text-align: center; opacity: .6; font-size: .9rem; margin: 8px 0 0; }
        .ps-sub { font-family: var(--font-kufi), sans-serif; color: #e8c25a; margin: 18px 0 10px; }
        .ps-badges { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
        @media (max-width: 480px) { .ps-badges { grid-template-columns: repeat(2,1fr); } }
        .ps-badge {
          display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px;
          border-radius: 14px; border: 1px solid rgba(232,194,90,.18); opacity: .45; text-align: center;
        }
        .ps-badge b { font-family: var(--font-kufi), sans-serif; color: #f1d77a; }
        .ps-badge span:last-child { font-family: var(--font-ruqaa), serif; font-size: .85rem; }
        .ps-got { opacity: 1; border-color: rgba(232,194,90,.7); background: rgba(232,194,90,.1); }
        .ps-medal { font-size: 1.6rem; }
        .ps-next { font-family: var(--font-ruqaa), serif; text-align: center; margin: 14px 0 6px; }
        .ps-nbar { height: 8px; border-radius: 8px; background: rgba(232,194,90,.15); overflow: hidden; }
        .ps-nfill { height: 100%; background: linear-gradient(90deg,#b8902f,#f1d77a); }
      `}</style>
    </section>
  );
}
