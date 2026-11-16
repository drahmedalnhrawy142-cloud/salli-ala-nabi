'use client';

import { useEffect, useMemo, useState } from 'react';
import { QUIZ_BANK } from '@/components/ProphetQuiz';

function dayNum() {
  const d = new Date();
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
}

/** سؤال واحد كل يوم من أسئلة السيرة، مع سلسلة إجابات صحيحة. */
export function DailyQuestion() {
  const day = dayNum();
  const q = QUIZ_BANK[day % QUIZ_BANK.length];
  const order = useMemo(() => {
    const idx = [0, 1, 2, 3];
    let s = day * 9301 + 49297;
    for (let i = 3; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = s % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [day]);

  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('prayer_dq') || '{}');
      if (saved.day === day) setPicked(saved.picked);
      setStreak(saved.streak || 0);
    } catch {}
  }, [day]);

  function pick(i: number) {
    if (picked !== null) return;
    const ok = i === 0;
    let st = streak;
    try {
      const saved = JSON.parse(localStorage.getItem('prayer_dq') || '{}');
      st = ok ? (saved.lastOk === day - 1 ? (saved.streak || 0) + 1 : 1) : 0;
      localStorage.setItem(
        'prayer_dq',
        JSON.stringify({ day, picked: i, streak: st, lastOk: ok ? day : saved.lastOk })
      );
    } catch {}
    setPicked(i);
    setStreak(st);
  }

  return (
    <section className="content-card dq" id="s-dq">
      <h2 className="section-title">سؤال اليوم</h2>
      <p className="dq-q">{q.q}</p>
      <div className="dq-opts">
        {order.map((o) => {
          const done = picked !== null;
          const cls = !done ? 'dq-opt' : o === 0 ? 'dq-opt dq-ok' : o === picked ? 'dq-opt dq-bad' : 'dq-opt dq-dim';
          return (
            <button key={o} type="button" className={cls} onClick={() => pick(o)}>
              {q.options[o]}
            </button>
          );
        })}
      </div>
      {picked !== null && <p className="dq-note">{q.note}</p>}
      <p className="dq-streak">
        إجابات صحيحة متتالية: {streak.toLocaleString('ar-EG')}
      </p>
      <style>{`
        .dq-q { font-family: var(--font-ruqaa), serif; font-size: 1.3rem; line-height: 2; text-align: center; color: #fff1c4; margin: 4px 0 12px; }
        .dq-opts { display: grid; gap: 8px; }
        .dq-opt { padding: 12px; border-radius: 14px; cursor: pointer; border: 1px solid rgba(232,194,90,.35); background: rgba(232,194,90,.05); color: #f6e49c; font-family: var(--font-ruqaa), serif; font-size: 1.1rem; }
        .dq-ok { background: rgba(80,200,120,.2); border-color: rgba(80,200,120,.8); }
        .dq-bad { background: rgba(230,90,90,.2); border-color: rgba(230,90,90,.8); }
        .dq-dim { opacity: .45; }
        .dq-note { font-family: var(--font-ruqaa), serif; line-height: 1.9; text-align: center; color: #c9a24a; margin: 12px 0 0; }
        .dq-streak { font-family: var(--font-kufi), sans-serif; text-align: center; color: #e8c25a; margin: 10px 0 0; font-size: .95rem; }
      `}</style>
    </section>
  );
}
