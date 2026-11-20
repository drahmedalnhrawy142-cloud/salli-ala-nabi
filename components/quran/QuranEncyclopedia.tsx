'use client';

import { useEffect, useRef, useState } from 'react';
import { norm, toAr } from './data';

/**
 * موسوعة علوم القرآن: «الإتقان في علوم القرآن» للسيوطي (ت ٩١١هـ) مقسّمًا على أنواعه.
 * النص: المكتبة الشاملة (طبعة الهيئة المصرية العامة للكتاب، تحقيق محمد أبو الفضل إبراهيم) عبر مشروع OpenITI (CC BY-NC-SA 4.0).
 * استُبعدت الأنواع التي يغلب عليها جمع مرويات متفاوتة الدرجة. تعمل بلا نت داخل التطبيق.
 */
type T = { n: number; l: string | null; t: string; k: number; c: number };
const cache = new Map<number, Promise<string[]>>();
function loadT(n: number): Promise<string[]> {
  let p = cache.get(n);
  if (!p) {
    p = fetch(`/ulum/${n}.json`).then((r) => {
      if (!r.ok) throw new Error('ulum');
      return r.json() as Promise<string[]>;
    });
    p.catch(() => cache.delete(n));
    cache.set(n, p);
  }
  return p;
}

export function QuranEncyclopedia() {
  const [idx, setIdx] = useState<T[] | null>(null);
  const [err, setErr] = useState(false);
  const [cur, setCur] = useState<T | null>(null);
  const [paras, setParas] = useState<string[] | null>(null);
  const [show, setShow] = useState(30);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<{ t: T; p: string }[] | null>(null);
  const [prog, setProg] = useState<number | null>(null);
  const stop = useRef(0);

  useEffect(() => {
    fetch('/ulum/index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setIdx)
      .catch(() => setErr(true));
  }, []);
  useEffect(() => {
    setParas(null);
    setShow(30);
    if (!cur) return;
    let live = true;
    loadT(cur.n).then((d) => live && setParas(d)).catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, [cur]);

  async function search() {
    if (!idx) return;
    const w = norm(q).split(' ').filter(Boolean);
    if (!w.length) return;
    const my = ++stop.current;
    setRes([]);
    setProg(0);
    const out: { t: T; p: string }[] = [];
    for (let i = 0; i < idx.length && out.length < 60; i += 6) {
      if (my !== stop.current) return;
      const part = idx.slice(i, i + 6);
      const data = await Promise.all(part.map((t) => loadT(t.n).catch(() => [] as string[])));
      data.forEach((arr, k) => {
        for (const p of arr) if (out.length < 60 && w.every((x) => norm(p).includes(x))) out.push({ t: part[k], p });
      });
      setProg(Math.min(100, Math.round(((i + 6) / idx.length) * 100)));
      setRes([...out]);
    }
    setProg(null);
  }

  const css = (
    <style>{`
      .qe { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
      .qe-note { font-size: 12px; line-height: 1.8; color: rgba(255,241,196,.6); margin: 0 0 10px; }
      .qe-s { display: flex; gap: 6px; margin-bottom: 10px; }
      .qe-s input { flex: 1; min-width: 0; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 14px; }
      .qe-s button { padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.15); color: #f1d77a; font-family: inherit; }
      button.qe-t { width: 100%; display: flex; gap: 10px; align-items: baseline; text-align: right; padding: 12px; margin-bottom: 8px; border-radius: 14px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); color: #fff1c4; font-family: inherit; font-size: 14.5px; line-height: 1.6; }
      button.qe-t i { font-style: normal; flex: none; min-width: 26px; text-align: center; color: #e8c25a; font-size: 13px; }
      .qe-back { background: none; border: 0; color: #f1d77a; font-family: inherit; font-size: 14px; padding: 6px 0 10px; }
      .qe-h { margin: 0 0 10px; color: #e8c25a; font-size: 16px; line-height: 1.7; }
      .qe-p { font-family: var(--font-ruqaa), serif; font-size: 18.5px; line-height: 2.15; text-align: justify; margin: 0 0 12px; }
      .qe-more { width: 100%; padding: 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #f1d77a; font-family: inherit; }
      .qe-g { margin: 14px 0 6px; font-size: 13px; color: #7fe0c0; }
      .qe-r { padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.22); background: rgba(18,15,8,.82); margin-bottom: 8px; }
      .qe-r small { display: block; color: #e8c25a; font-size: 12px; margin-bottom: 2px; }
      .qe-r p { margin: 0; font-family: var(--font-ruqaa), serif; font-size: 17px; line-height: 2; text-align: justify; }
    `}</style>
  );
  const credit = (
    <p className="qe-note" style={{ marginTop: 14 }}>
      «الإتقان في علوم القرآن» لجلال الدين السيوطي (ت ٩١١هـ)، طبعة الهيئة المصرية العامة للكتاب بتحقيق محمد أبو الفضل إبراهيم، نصّها من المكتبة الشاملة عبر مشروع OpenITI (CC BY-NC-SA 4.0). الكتاب يجمع أقوال العلماء والمرويات على اختلاف درجاتها، فلا يُحتج بما فيه دون تحقق. حذفنا منه الأنواع التي أغلبها روايات غير مُحقَّقة (سبب النزول، المبهمات، فضائل القرآن وخواصه…).
    </p>
  );

  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل الموسوعة.</p>;
  if (!idx) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;

  if (!cur)
    return (
      <div className="qe">
        <p className="qe-note">{toAr(idx.length)} نوعًا من علوم القرآن. اضغط نوعًا لقراءته، أو ابحث في نصوص الموسوعة كلها.</p>
        <div className="qe-s">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="بحث في الموسوعة" />
          <button type="button" onClick={search}>بحث</button>
        </div>
        {prog != null && <div className="qe-g">جارٍ البحث… {toAr(prog)}٪</div>}
        {res ? (
          <>
            <div className="qe-g">{res.length === 0 && prog == null ? 'لا نتائج.' : `${toAr(res.length)} نتيجة${res.length >= 60 ? ' (أول ٦٠)' : ''}`}</div>
            {res.map((r, i) => (
              <div key={i} className="qe-r">
                <small>{r.t.t}</small>
                <p>{r.p}</p>
              </div>
            ))}
            <button type="button" className="qe-more" onClick={() => (stop.current++, setRes(null), setProg(null))}>إغلاق النتائج</button>
          </>
        ) : (
          idx.map((t) => (
            <button key={t.n} type="button" className="qe-t" onClick={() => setCur(t)}>
              <i>{t.l ?? toAr(t.n)}</i>
              <span>{t.t}</span>
            </button>
          ))
        )}
        {credit}
        {css}
      </div>
    );

  return (
    <div className="qe">
      <button type="button" className="qe-back" onClick={() => setCur(null)}>← الأنواع</button>
      <h3 className="qe-h">النوع {cur.l ?? toAr(cur.n)}: {cur.t}</h3>
      {!paras ? <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p> : paras.slice(0, show).map((p, i) => <p key={i} className="qe-p">{p}</p>)}
      {paras && show < paras.length && (
        <button type="button" className="qe-more" onClick={() => setShow((s) => s + 40)}>
          عرض المزيد ({toAr(paras.length - show)} فقرة)
        </button>
      )}
      {credit}
      {css}
    </div>
  );
}
