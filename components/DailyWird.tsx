'use client';

import { useEffect, useState } from 'react';

type Wird = { text: string; target: number; note?: string };

// صيغ صلاة على النبي ﷺ ثابتة الورود (الصلاة الإبراهيمية في الصحيحين + صيغ مختصرة معروفة)
const WIRDS: Wird[] = [
  { text: 'اللهم صلِّ على محمد', target: 100 },
  {
    text: 'اللهم صلِّ على محمد وعلى آل محمد، كما صلّيت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد، اللهم بارك على محمد وعلى آل محمد، كما باركت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد',
    target: 10,
    note: 'الصلاة الإبراهيمية — رواها البخاري ومسلم',
  },
  { text: 'اللهم صلِّ وسلِّم وبارك على سيدنا محمد', target: 100 },
  { text: 'صلّى الله عليه وسلّم', target: 100 },
  {
    text: 'اللهم صلِّ على محمد وعلى أزواجه وذريته، كما صلّيت على آل إبراهيم، وبارك على محمد وعلى أزواجه وذريته، كما باركت على آل إبراهيم، إنك حميد مجيد',
    target: 10,
    note: 'من صيغ الصلاة الإبراهيمية — رواها البخاري ومسلم',
  },
  { text: 'اللهم صلِّ على محمد وعلى آل محمد', target: 100 },
  { text: 'اللهم صلِّ وسلِّم على نبينا محمد', target: 100 },
];

function today() {
  return new Date().toLocaleDateString('en-CA');
}

function dayIndex() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function DailyWird({ onPray }: { onPray: () => void }) {
  const [done, setDone] = useState(0);
  const wird = WIRDS[dayIndex() % WIRDS.length];

  useEffect(() => {
    try {
      if (localStorage.getItem('wird_date') === today()) {
        setDone(Number(localStorage.getItem('wird_count') || 0));
      }
    } catch {}
  }, []);

  function tap() {
    const next = done + 1;
    setDone(next);
    try {
      localStorage.setItem('wird_date', today());
      localStorage.setItem('wird_count', String(next));
    } catch {}
    onPray();
  }

  const finished = done >= wird.target;
  const pct = Math.min(100, (done / wird.target) * 100);

  return (
    <section className="content-card wird-card">
      <h2 className="section-title">وردك اليومي</h2>
      <p className="wird-text">{wird.text}</p>
      {wird.note && <p className="wird-note">{wird.note}</p>}

      <div className="wird-meta">
        <span className="wird-count">
          {Math.min(done, wird.target).toLocaleString('ar-EG')} من{' '}
          {wird.target.toLocaleString('ar-EG')}
        </span>
      </div>
      <div className="wird-bar">
        <div className="wird-fill" style={{ width: `${pct}%` }} />
      </div>

      {finished ? (
        <p className="wird-done">
          أتممت وردك اليوم، تقبّل الله منك ﷺ — وغدًا ورد جديد بإذن الله
        </p>
      ) : null}

      <button type="button" className="wird-btn" onClick={tap}>
        {finished ? 'زيادة' : 'صلّيت'}
      </button>

      <style>{`
        .wird-text {
          font-family: var(--font-ruqaa), serif;
          font-size: 1.35rem;
          line-height: 2.1;
          text-align: center;
          margin: 6px 0 4px;
          color: #f3e4b0;
        }
        .wird-note {
          font-family: var(--font-ruqaa), serif;
          text-align: center;
          opacity: 0.7;
          font-size: 0.95rem;
          margin: 0 0 6px;
        }
        .wird-meta { text-align: center; margin-top: 10px; }
        .wird-count {
          font-family: var(--font-kufi), sans-serif;
          font-weight: 700;
          color: #e8c25a;
        }
        .wird-bar {
          height: 8px;
          border-radius: 8px;
          background: rgba(232, 194, 90, 0.15);
          overflow: hidden;
          margin: 8px 0 12px;
        }
        .wird-fill {
          height: 100%;
          background: linear-gradient(90deg, #b8902f, #f1d77a);
          border-radius: 8px;
          transition: width 0.25s ease;
        }
        .wird-done {
          font-family: var(--font-ruqaa), serif;
          text-align: center;
          color: #f1d77a;
          margin: 0 0 10px;
          line-height: 1.9;
        }
        .wird-btn {
          display: block;
          width: 100%;
          padding: 14px;
          border: 1px solid rgba(232, 194, 90, 0.6);
          border-radius: 14px;
          background: rgba(232, 194, 90, 0.12);
          color: #f1d77a;
          font-family: var(--font-kufi), sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
        }
        .wird-btn:active { transform: scale(0.98); }
      `}</style>
    </section>
  );
}
