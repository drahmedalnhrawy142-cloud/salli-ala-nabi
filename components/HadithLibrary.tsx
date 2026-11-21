'use client';

import { useEffect, useRef, useState } from 'react';
import { norm, toAr } from '@/components/quran/data';

/**
 * مكتبة الحديث: صحيح البخاري وصحيح مسلم والأربعون النووية، بنصوصها كاملة بالسند.
 * البيانات مولّدة بـ tools/build_hadith.py من hadith-json (sunnah.com) بلا تعديل في الألفاظ. تعمل بلا نت داخل التطبيق.
 */
type Ch = { id: number; t: string; n: number };
type Book = { id: string; title: string; total: number; chapters: Ch[] };
type Item = [string, string];

const cache = new Map<string, Promise<Item[]>>();
function loadCh(book: string, id: number): Promise<Item[]> {
  const k = `${book}/${id}`;
  let p = cache.get(k);
  if (!p) {
    p = fetch(`/hadith/${k}.json`).then((r) => {
      if (!r.ok) throw new Error('hadith');
      return r.json() as Promise<Item[]>;
    });
    p.catch(() => cache.delete(k));
    cache.set(k, p);
  }
  return p;
}

function HCard({ n, t, src }: { n: string; t: string; src: string }) {
  const [m, setM] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${t}\n— ${src} (رقم ${n} بترقيم sunnah.com)`);
      setM('تم النسخ');
    } catch {
      setM('تعذّر النسخ');
    }
    setTimeout(() => setM(''), 1300);
  }
  return (
    <article className="hl-c">
      <div className="hl-n">حديث رقم {toAr(Number(n) || 0)}</div>
      <p>{t}</p>
      <div className="hl-f">
        <span>{src}</span>
        <button type="button" onClick={copy}>{m || 'نسخ'}</button>
      </div>
    </article>
  );
}

export function HadithLibrary() {
  const [idx, setIdx] = useState<Book[] | null>(null);
  const [err, setErr] = useState(false);
  const [bk, setBk] = useState<Book | null>(null);
  const [ch, setCh] = useState<Ch | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [show, setShow] = useState(20);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<{ ch: Ch; n: string; t: string }[] | null>(null);
  const [prog, setProg] = useState<number | null>(null);
  const stop = useRef(0);

  useEffect(() => {
    fetch('/hadith/index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setIdx)
      .catch(() => setErr(true));
  }, []);
  useEffect(() => {
    setItems(null);
    setShow(20);
    if (!bk || !ch) return;
    let live = true;
    loadCh(bk.id, ch.id).then((d) => live && setItems(d)).catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, [bk, ch]);

  async function search() {
    if (!bk) return;
    const w = norm(q).split(' ').filter(Boolean);
    if (!w.length) return;
    const my = ++stop.current;
    setRes([]);
    setProg(0);
    const out: { ch: Ch; n: string; t: string }[] = [];
    let done = 0;
    for (let i = 0; i < bk.chapters.length && out.length < 60; i += 6) {
      if (my !== stop.current) return;
      const part = bk.chapters.slice(i, i + 6);
      const data = await Promise.all(part.map((c) => loadCh(bk.id, c.id).catch(() => [] as Item[])));
      data.forEach((arr, k) => {
        for (const [n, t] of arr) {
          const nt = norm(t);
          if (w.every((x) => nt.includes(x)) && out.length < 60) out.push({ ch: part[k], n, t });
        }
      });
      done += part.length;
      setProg(Math.round((done / bk.chapters.length) * 100));
      setRes([...out]);
    }
    setProg(null);
  }

  const style = (
    <style>{`
      .hl { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
      .hl button.hl-b { width: 100%; display: block; text-align: right; padding: 14px; margin-bottom: 10px; border-radius: 16px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.82); color: #fff1c4; font-family: inherit; font-size: 15px; }
      .hl button.hl-b small { display: block; color: #7fe0c0; font-size: 12px; margin-top: 2px; }
      .hl-back { background: none; border: 0; color: #f1d77a; font-family: inherit; font-size: 14px; padding: 6px 0 10px; }
      .hl-s { display: flex; gap: 6px; margin-bottom: 10px; }
      .hl-s input { flex: 1; min-width: 0; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 14px; }
      .hl-s button { padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.15); color: #f1d77a; font-family: inherit; }
      .hl-c { padding: 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); margin-bottom: 10px; }
      .hl-c p { margin: 6px 0; font-family: var(--font-ruqaa), serif; font-size: 19px; line-height: 2.1; text-align: justify; }
      .hl-n { font-size: 12px; color: #e8c25a; }
      .hl-f { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; color: #f1d77a; }
      .hl-f button { padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: inherit; }
      .hl-more { width: 100%; padding: 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #f1d77a; font-family: inherit; }
      .hl-src { text-align: center; font-size: 11.5px; color: rgba(255,241,196,.45); margin-top: 14px; }
      .hl-p { font-size: 12px; text-align: center; color: #7fe0c0; margin: 6px 0; }
    `}</style>
  );

  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل المكتبة.</p>;
  if (!idx) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;

  const credit = <p className="hl-src">النصوص من موقع sunnah.com عبر مشروع hadith-json. أرقام الأحاديث بترقيم الموقع وقد تختلف عن ترقيم المطبوعات. اقرأ الحديث بسنده من مصدره عند الاستدلال.</p>;

  if (!bk)
    return (
      <div className="hl">
        {idx.map((b) => (
          <button key={b.id} type="button" className="hl-b" onClick={() => (setBk(b), setCh(null), setRes(null), setQ(''))}>
            {b.title}
            <small>{toAr(b.total)} حديثًا في {toAr(b.chapters.length)} {b.chapters.length === 1 ? 'باب' : 'كتابًا'}</small>
          </button>
        ))}
        {credit}
        {style}
      </div>
    );

  if (!ch)
    return (
      <div className="hl">
        <button type="button" className="hl-back" onClick={() => (stop.current++, setBk(null))}>← الكتب</button>
        <div className="hl-s">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder={`بحث في ${bk.title}`} />
          <button type="button" onClick={search}>بحث</button>
        </div>
        {prog != null && <div className="hl-p">جارٍ البحث… {toAr(prog)}٪</div>}
        {res ? (
          <>
            <div className="hl-p">{res.length === 0 && prog == null ? 'لا نتائج.' : `${toAr(res.length)} نتيجة${res.length >= 60 ? ' (أول ٦٠)' : ''}`}</div>
            {res.map((r, i) => (
              <div key={i}>
                <div className="hl-n" style={{ marginBottom: 2 }}>{r.ch.t}</div>
                <HCard n={r.n} t={r.t} src={bk.title} />
              </div>
            ))}
            <button type="button" className="hl-more" onClick={() => (stop.current++, setRes(null), setProg(null))}>إغلاق النتائج</button>
          </>
        ) : (
          bk.chapters.map((c) => (
            <button key={c.id} type="button" className="hl-b" onClick={() => setCh(c)}>
              {c.t}
              <small>{toAr(c.n)} حديثًا</small>
            </button>
          ))
        )}
        {credit}
        {style}
      </div>
    );

  return (
    <div className="hl">
      <button type="button" className="hl-back" onClick={() => setCh(null)}>← {bk.title}</button>
      <h3 style={{ margin: '0 0 10px', color: '#e8c25a', fontSize: 16 }}>{ch.t}</h3>
      {!items ? <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p> : items.slice(0, show).map(([n, t]) => <HCard key={n} n={n} t={t} src={bk.title} />)}
      {items && show < items.length && (
        <button type="button" className="hl-more" onClick={() => setShow((s) => s + 30)}>
          عرض المزيد ({toAr(items.length - show)})
        </button>
      )}
      {credit}
      {style}
    </div>
  );
}
