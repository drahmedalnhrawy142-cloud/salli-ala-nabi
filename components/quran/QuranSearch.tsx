'use client';

import { useEffect, useState } from 'react';
import { loadSimple, norm, toAr, type QData } from './data';

export function QuranSearch({
  data,
  onGo,
}: {
  data: QData;
  onGo: (page: number, ayaIdx: number) => void;
}) {
  const [q, setQ] = useState('');
  const [simple, setSimple] = useState<string[] | null>(null);
  const [res, setRes] = useState<number[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let live = true;
    loadSimple()
      .then((s) => live && setSimple(s.map((x) => norm(x))))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!simple) return;
    const t = setTimeout(() => {
      const words = norm(q).split(' ').filter((w) => w.length > 0);
      if (!words.length || norm(q).length < 2) {
        setRes([]);
        setTotal(0);
        return;
      }
      const out: number[] = [];
      let n = 0;
      for (let i = 0; i < simple.length; i++) {
        const t = simple[i];
        let ok = true;
        for (const w of words) {
          if (!t.includes(w)) {
            ok = false;
            break;
          }
        }
        if (ok) {
          n++;
          if (out.length < 60) out.push(i);
        }
      }
      setRes(out);
      setTotal(n);
    }, 250);
    return () => clearTimeout(t);
  }, [q, simple]);

  return (
    <div className="qs">
      <input
        className="qs-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="اكتب كلمة أو أكثر من الآية…"
        autoFocus
      />
      {!simple && <p className="qs-note">جارٍ تجهيز البحث…</p>}
      {simple && norm(q).length >= 2 && (
        <p className="qs-note">
          {total === 0 ? 'لا توجد نتائج' : `${toAr(total)} آية${total > 60 ? ' (أول ٦٠ نتيجة)' : ''}`}
        </p>
      )}
      <div className="qs-list">
        {res.map((i) => {
          const a = data.ayas[i];
          return (
            <button key={i} type="button" className="qs-row" onClick={() => onGo(a[2], i)}>
              <span className="qs-text">{a[4]}</span>
              <span className="qs-ref">
                {data.suras[a[0] - 1].name} • {toAr(a[1])} • ص {toAr(a[2])}
              </span>
            </button>
          );
        })}
      </div>
      <style>{`
        .qs-input {
          width: 100%; box-sizing: border-box; padding: 13px 14px; margin: 0 0 10px; border-radius: 14px;
          border: 1px solid rgba(232,194,90,.4); background: rgba(0,0,0,.45); color: #fff1c4;
          font-family: var(--font-ruqaa), serif; font-size: 18px;
        }
        .qs-note { text-align: center; margin: 4px 0 10px; color: rgba(255,241,196,.65); font-family: var(--font-ruqaa), serif; }
        .qs-list { display: flex; flex-direction: column; gap: 8px; }
        .qs-row {
          display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 16px; text-align: right;
          border: 1px solid rgba(232,194,90,.22); background: rgba(18,15,8,.78);
        }
        .qs-text { font-family: 'KFGQPC Hafs', serif; font-size: 21px; line-height: 2; color: #f7ebc1; direction: rtl; }
        .qs-ref { font-family: var(--font-kufi), sans-serif; font-size: 12.5px; color: #e8c25a; }
      `}</style>
    </div>
  );
}
