'use client';

import { useMemo, useState } from 'react';
import { norm, toAr, type QData } from './data';

export function QuranIndex({
  data,
  onGo,
}: {
  data: QData;
  onGo: (page: number, ayaIdx: number | null) => void;
}) {
  const [tab, setTab] = useState<'sura' | 'juz'>('sura');
  const [q, setQ] = useState('');

  const suras = useMemo(() => {
    const nq = norm(q);
    if (!nq) return data.suras;
    return data.suras.filter((s) => norm(s.name).includes(nq) || String(s.n) === nq);
  }, [data, q]);

  const juzs = useMemo(() => {
    const out: { juz: number; page: number; idx: number }[] = [];
    for (let i = 0; i < data.ayas.length; i++) {
      const j = data.ayas[i][3];
      if (out.length < j) out.push({ juz: j, page: data.ayas[i][2], idx: i });
    }
    return out;
  }, [data]);

  return (
    <div className="qi">
      <div className="qi-tabs">
        <button type="button" className={tab === 'sura' ? 'on' : ''} onClick={() => setTab('sura')}>
          السور
        </button>
        <button type="button" className={tab === 'juz' ? 'on' : ''} onClick={() => setTab('juz')}>
          الأجزاء
        </button>
      </div>

      {tab === 'sura' && (
        <>
          <input
            className="qi-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم السورة أو رقمها"
          />
          <div className="qi-list">
            {suras.map((s) => (
              <button key={s.n} type="button" className="qi-row" onClick={() => onGo(s.page, null)}>
                <span className="qi-n">{toAr(s.n)}</span>
                <span className="qi-name">سورة {s.name}</span>
                <span className="qi-meta">
                  {toAr(s.ayas)} آية • ص {toAr(s.page)}
                </span>
              </button>
            ))}
            {suras.length === 0 && <p className="qi-empty">لا توجد نتائج</p>}
          </div>
        </>
      )}

      {tab === 'juz' && (
        <div className="qi-list">
          {juzs.map((j) => {
            const a = data.ayas[j.idx];
            return (
              <button key={j.juz} type="button" className="qi-row" onClick={() => onGo(j.page, j.idx)}>
                <span className="qi-n">{toAr(j.juz)}</span>
                <span className="qi-name">الجزء {toAr(j.juz)}</span>
                <span className="qi-meta">
                  {data.suras[a[0] - 1].name} • ص {toAr(j.page)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        .qi-tabs { display: flex; gap: 8px; margin: 0 0 12px; }
        .qi-tabs button {
          flex: 1; padding: 11px; border-radius: 14px; border: 1px solid rgba(232,194,90,.3);
          background: rgba(18,15,8,.7); color: rgba(241,215,122,.7); font-family: var(--font-kufi), sans-serif; font-size: 15px;
        }
        .qi-tabs button.on { background: rgba(232,194,90,.2); color: #f1d77a; border-color: rgba(232,194,90,.7); }
        .qi-search {
          width: 100%; box-sizing: border-box; padding: 12px 14px; margin: 0 0 12px; border-radius: 14px;
          border: 1px solid rgba(232,194,90,.3); background: rgba(0,0,0,.45); color: #fff1c4;
          font-family: var(--font-ruqaa), serif; font-size: 17px;
        }
        .qi-list { display: flex; flex-direction: column; gap: 8px; }
        .qi-row {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 16px;
          border: 1px solid rgba(232,194,90,.22); background: rgba(18,15,8,.78); color: #f1d77a; text-align: right;
        }
        .qi-row:active { background: rgba(232,194,90,.16); }
        .qi-n {
          flex: none; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px;
          background: rgba(232,194,90,.14); border: 1px solid rgba(232,194,90,.35);
          font-family: var(--font-kufi), sans-serif; font-size: 15px;
        }
        .qi-name { flex: 1; font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 16px; }
        .qi-meta { font-family: var(--font-ruqaa), serif; font-size: 14px; color: rgba(255,241,196,.65); }
        .qi-empty { text-align: center; color: rgba(255,241,196,.6); font-family: var(--font-ruqaa), serif; }
      `}</style>
    </div>
  );
}
