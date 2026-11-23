'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * معجم غريب القرآن: «نزهة القلوب» لأبي بكر محمد بن عزيز السجستاني (ت ٣٣٠هـ)، مرتّب على حروف المعجم.
 * النص حرفيّ من الكتاب (المكتبة الشاملة عبر OpenITI)؛ تقطيع المواد آليّ، فربما التبست حدود مادة بأخرى في مواضع قليلة.
 */
type E = [string, string, string];
const norm = (s: string) =>
  s.replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();

let cache: Promise<E[]> | null = null;
function load() {
  cache ||= fetch('/lugha/nuzha.json').then((r) => {
    if (!r.ok) throw new Error('nuzha');
    return r.json();
  });
  return cache;
}

export function WordDictionary() {
  const [all, setAll] = useState<E[] | null>(null);
  const [err, setErr] = useState(false);
  const [q, setQ] = useState('');
  const [lt, setLt] = useState('');
  const [max, setMax] = useState(40);

  useEffect(() => {
    load().then(setAll).catch(() => setErr(true));
  }, []);

  const letters = useMemo(() => {
    const s: string[] = [];
    (all || []).forEach((e) => { if (!s.includes(e[2])) s.push(e[2]); });
    return s;
  }, [all]);

  const res = useMemo(() => {
    if (!all) return [];
    const nq = norm(q);
    let base = lt ? all.filter((e) => e[2] === lt) : all;
    if (!nq) return base;
    const head: { e: E; r: number }[] = [];
    const body: E[] = [];
    for (const e of base) {
      const h = norm(e[0]);
      if (h === nq) head.push({ e, r: 0 });
      else if (h.startsWith(nq)) head.push({ e, r: 1 });
      else if (h.includes(nq)) head.push({ e, r: 2 });
      else if (norm(e[1]).includes(nq)) body.push(e);
    }
    head.sort((a, b) => a.r - b.r);
    return [...head.map((x) => x.e), ...body];
  }, [all, q, lt]);

  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل المعجم.</p>;
  if (!all) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;

  return (
    <div className="wd">
      <input
        className="wd-q"
        placeholder="اكتب كلمة قرآنية… مثل: أنداد، سجّيل، الصمد"
        value={q}
        onChange={(e) => { setQ(e.target.value); setMax(40); }}
      />
      <div className="wd-l">
        <button type="button" className={!lt ? 'on' : ''} onClick={() => { setLt(''); setMax(40); }}>الكل</button>
        {letters.map((l) => (
          <button key={l} type="button" className={lt === l ? 'on' : ''} onClick={() => { setLt(l); setMax(40); }}>
            {l.replace(/^ال/, '')}
          </button>
        ))}
      </div>
      <div className="wd-c">{res.length ? `${res.length} مادة` : 'لا نتائج. جرّب كتابة الكلمة بلا تشكيل أو جزءًا منها.'}</div>
      {res.slice(0, max).map((e, i) => (
        <article className="wd-e" key={i}>
          <div className="wd-h">{e[0]}<span>حرف {e[2].replace(/^ال/, '')}</span></div>
          <p>{e[1].slice(e[1].indexOf(':') + 1).trim()}</p>
        </article>
      ))}
      {res.length > max && (
        <button type="button" className="wd-m" onClick={() => setMax(max + 60)}>عرض المزيد</button>
      )}
      <style>{`
        .wd { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 10px; }
        .wd-q { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(232,194,90,.45); background: rgba(18,15,8,.9); color: #fff1c4; font-family: inherit; font-size: 15px; }
        .wd-l { display: flex; flex-wrap: wrap; gap: 6px; }
        .wd-l button { min-width: 34px; padding: 5px 9px; border-radius: 999px; border: 1px solid rgba(232,194,90,.3); background: rgba(232,194,90,.06); color: #f1d77a; font-family: inherit; font-size: 13px; }
        .wd-l button.on { background: #e8c25a; color: #1a1409; }
        .wd-c { font-size: 12px; color: rgba(255,241,196,.6); }
        .wd-e { padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.8); }
        .wd-h { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; color: #e8c25a; font-size: 17px; font-weight: 700; }
        .wd-h span { font-size: 11px; font-weight: 400; color: rgba(255,241,196,.45); }
        .wd-e p { margin: 6px 0 0; font-size: 16px; line-height: 2; }
        .wd-m { padding: 9px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: inherit; }
        .wd-n { font-size: 11.5px; text-align: center; color: rgba(255,241,196,.5); margin: 6px 0 0; }
      `}</style>
    </div>
  );
}
