'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { norm, toAr } from '@/components/quran/data';
import { setLast, toggleFav, useFavs } from '@/components/ilm/ilmStore';
import { FIQH_BOOKS } from '@/components/ilm/books';

/**
 * الفقه المقارن بين المذاهب الأربعة: «اختلاف الأئمة العلماء» لابن هبيرة الوزير (ت ٥٦٠هـ).
 * النص من المكتبة الشاملة (تحقيق السيد يوسف أحمد، دار الكتب العلمية) عبر مشروع OpenITI (CC BY-NC-SA 4.0)،
 * مقسّم بـ tools/build_fiqh.py إلى كتب وأبواب وفقرات دون تعديل ألفاظ المؤلف. يعمل بلا نت داخل التطبيق.
 */
export type K = { t: string; b: number; n: number };
export type Bab = { t: string; e: string[] };
export type Kit = { t: string; b: Bab[] };

const cache = new Map<string, Promise<Kit>>();
export function loadK(dir: string, n: number): Promise<Kit> {
  const key = `${dir}/${n}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`${dir}k${n}.json`).then((r) => {
      if (!r.ok) throw new Error('fiqh');
      return r.json() as Promise<Kit>;
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

const NAMES: [RegExp, string][] = [
  [/(أبو حنيفة|أبي حنيفة|الحنفية)/g, 'h'],
  [/(مالك|المالكية)/g, 'm'],
  [/(الشافعي|الشافعية)/g, 's'],
  [/(أحمد|الحنابلة)/g, 'b'],
];
const COL: Record<string, string> = { h: '#7fe0c0', m: '#ffb36b', s: '#8ec5ff', b: '#e8a0ff' };

function Para({ t, fiqh }: { t: string; fiqh: boolean }) {
  if (!fiqh) return <p>{t}</p>;
  const re = /(أبو حنيفة|أبي حنيفة|الحنفية|مالك|المالكية|الشافعي|الشافعية|أحمد|الحنابلة)/g;
  const parts = t.split(re);
  return (
    <p>
      {parts.map((s, i) => {
        const hit = NAMES.find(([r]) => ((r.lastIndex = 0), r.test(s)));
        return hit ? (
          <b key={i} style={{ color: COL[hit[1]] }}>{s}</b>
        ) : (
          <Fragment key={i}>{s}</Fragment>
        );
      })}
    </p>
  );
}

const isKhilaf = (t: string) => /اختلف|وقال|وعن |رواية|روايتان|خالف|وقالت/.test(t);

export function FiqhBook({ dir, title, credit, onBack, fiqh = true, backLabel = '← الكتب الفقهية', start }: { dir: string; title: string; credit: string; onBack: () => void; fiqh?: boolean; backLabel?: string; start?: { ki: number; bi: number | null } }) {
  const [idx, setIdx] = useState<K[] | null>(null);
  const [err, setErr] = useState(false);
  const [ki, setKi] = useState<number | null>(start ? start.ki : null);
  const [kit, setKit] = useState<Kit | null>(null);
  const [bi, setBi] = useState<number | null>(start ? start.bi : null);
  const [only, setOnly] = useState(false);
  const [show, setShow] = useState(30);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<{ k: string; b: string; p: string }[] | null>(null);
  const [prog, setProg] = useState<number | null>(null);
  const stop = useRef(0);

  useEffect(() => {
    fetch(`${dir}index.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: K[]) => (setIdx(d), d.length === 1 && setKi(0)))
      .catch(() => setErr(true));
  }, [dir]);
  useEffect(() => {
    setKit(null);
    if (ki == null) return;
    let live = true;
    loadK(dir, ki).then((d) => live && setKit(d)).catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, [ki]);

  useEffect(() => {
    if (kit && ki != null && bi != null && kit.b[bi]) setLast({ dir, ki, bi, label: `${title} ‹ ${kit.t === title ? '' : kit.t + ' ‹ '}${kit.b[bi].t}` });
  }, [kit, ki, bi, dir, title]);
  const favs = useFavs();

  async function search() {
    if (!idx) return;
    const w = norm(q).split(' ').filter(Boolean);
    if (!w.length) return;
    const my = ++stop.current;
    const out: { k: string; b: string; p: string }[] = [];
    setRes([]);
    setProg(0);
    for (let i = 0; i < idx.length; i++) {
      let d: Kit;
      try {
        d = await loadK(dir, i);
      } catch {
        break;
      }
      if (stop.current !== my) return;
      for (const b of d.b)
        for (const p of b.e)
          if (out.length < 60 && w.every((x) => norm(p).includes(x))) out.push({ k: d.t, b: b.t, p });
      setProg(Math.round(((i + 1) / idx.length) * 100));
      setRes([...out]);
    }
    setProg(null);
  }

  const style = (
    <style>{`
      .fq { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
      .fq button.fq-b { width: 100%; display: block; text-align: right; padding: 14px; margin-bottom: 10px; border-radius: 16px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.82); color: #fff1c4; font-family: inherit; font-size: 15px; }
      .fq button.fq-b small { display: block; color: #7fe0c0; font-size: 12px; margin-top: 2px; }
      .fq-back { background: none; border: 0; color: #f1d77a; font-family: inherit; font-size: 14px; padding: 6px 0 10px; }
      .fq-s { display: flex; gap: 6px; margin-bottom: 10px; }
      .fq-s input { flex: 1; min-width: 0; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 14px; }
      .fq-s button { padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.15); color: #f1d77a; font-family: inherit; }
      .fq-c { padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); margin-bottom: 10px; }
      .fq-c p { margin: 0; font-family: var(--font-ruqaa), serif; font-size: 18.5px; line-height: 2.1; text-align: justify; }
      .fq-n { font-size: 12px; color: #e8c25a; margin-bottom: 2px; }
      .fq-c { position: relative; padding-left: 34px; }
      .fq-star { position: absolute; top: 4px; left: 8px; background: none; border: 0; color: #e8c25a; font-size: 20px; padding: 4px 6px; }
      .fq-more { width: 100%; padding: 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #f1d77a; font-family: inherit; }
      .fq-src { text-align: center; font-size: 11.5px; color: rgba(255,241,196,.5); margin-top: 14px; line-height: 1.8; }
      .fq-p { font-size: 12px; text-align: center; color: #7fe0c0; margin: 6px 0; }
      .fq-key { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; font-size: 12.5px; margin: 4px 0 12px; }
      .fq-tg { display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 0 0 10px; }
    `}</style>
  );
  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل الكتاب.</p>;
  if (!idx) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;

  const creditEl = null;
  const key = !fiqh ? null : (
    <div className="fq-key">
      <span style={{ color: COL.h }}>● أبو حنيفة</span>
      <span style={{ color: COL.m }}>● مالك</span>
      <span style={{ color: COL.s }}>● الشافعي</span>
      <span style={{ color: COL.b }}>● أحمد</span>
    </div>
  );

  if (ki == null) {
    return (
      <div className="fq">
        {style}
        <button type="button" className="fq-back" onClick={onBack}>{backLabel}</button>
        {key}
        <div className="fq-s">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder={fiqh ? 'ابحث في المسائل (مثال: الوتر، المسح على الخفين)' : 'ابحث في الكتاب'} />
          <button type="button" onClick={search}>بحث</button>
        </div>
        {prog != null && <div className="fq-p">جارٍ البحث… {toAr(prog)}٪</div>}
        {res ? (
          <>
            <div className="fq-p">{res.length === 0 && prog == null ? 'لا نتائج.' : `${toAr(res.length)} نتيجة${res.length >= 60 ? ' (أول ٦٠)' : ''}`}</div>
            {res.map((r, i) => (
              <div key={i} className="fq-c">
                <div className="fq-n">{r.k} ‹ {r.b}</div>
                <Para t={r.p} fiqh={fiqh} />
              </div>
            ))}
            <button type="button" className="fq-more" onClick={() => (stop.current++, setRes(null), setProg(null))}>إغلاق النتائج</button>
          </>
        ) : (
          idx.map((k, i) => (
            <button key={i} type="button" className="fq-b" onClick={() => (setKi(i), setBi(null))}>
              {k.t}
              <small>{toAr(k.b)} باب · {toAr(k.n)} فقرة</small>
            </button>
          ))
        )}
        {creditEl}
      </div>
    );
  }

  if (!kit) return <div className="fq">{style}<button type="button" className="fq-back" onClick={() => (idx.length === 1 ? onBack() : setKi(null))}>← الكتب</button><p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p></div>;

  if (bi == null) {
    return (
      <div className="fq">
        {style}
        <button type="button" className="fq-back" onClick={() => (idx.length === 1 ? onBack() : setKi(null))}>{idx.length === 1 ? backLabel : '← الكتب'}</button>
        <h3 style={{ margin: '0 0 10px', color: '#e8c25a', fontSize: 16 }}>{kit.t}</h3>
        {kit.b.map((b, i) => (
          <button key={i} type="button" className="fq-b" onClick={() => (setBi(i), setShow(30))}>
            {b.t}
            <small>{toAr(b.e.length)} فقرة</small>
          </button>
        ))}
        {creditEl}
      </div>
    );
  }

  const b = kit.b[bi];
  const list = b.e.map((p, i) => [p, i] as const).filter(([p]) => !(fiqh && only) || isKhilaf(p));
  return (
    <div className="fq">
      {style}
      <button type="button" className="fq-back" onClick={() => setBi(null)}>← {kit.t}</button>
      <h3 style={{ margin: '0 0 6px', color: '#e8c25a', fontSize: 16 }}>{b.t}</h3>
      {key}
      {fiqh && (
        <label className="fq-tg">
          <input type="checkbox" checked={only} onChange={(e) => (setOnly(e.target.checked), setShow(30))} />
          إظهار مواضع الخلاف وأقوال الأئمة فقط
        </label>
      )}
      {list.slice(0, show).map(([p, oi]) => {
        const id = `${dir}|${ki}|${bi}|${oi}`;
        const on = favs.some((x) => x.id === id);
        return (
          <div key={oi} className="fq-c">
            <button type="button" className="fq-star" aria-label={on ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'} onClick={() => toggleFav({ id, dir, ki: ki as number, bi: bi as number, book: title, where: `${kit.t === title ? '' : kit.t + ' ‹ '}${b.t}`, t: p })}>
              {on ? '★' : '☆'}
            </button>
            <Para t={p} fiqh={fiqh} />
          </div>
        );
      })}
      {list.length > show && (
        <button type="button" className="fq-more" onClick={() => setShow((s) => s + 30)}>
          عرض المزيد ({toAr(list.length - show)})
        </button>
      )}
      {creditEl}
    </div>
  );
}

export function FiqhMadhahib() {
  const [bk, setBk] = useState<(typeof FIQH_BOOKS)[number] | null>(null);
  if (bk) return <FiqhBook key={bk.id} dir={bk.dir} title={bk.title} credit={bk.credit} onBack={() => setBk(null)} />;
  return (
    <div style={{ fontFamily: 'var(--font-kufi), sans-serif', color: '#fff1c4' }}>
      {FIQH_BOOKS.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => setBk(b)}
          style={{ width: '100%', display: 'block', textAlign: 'right', padding: 14, marginBottom: 10, borderRadius: 16, border: '1px solid rgba(232,194,90,.35)', background: 'rgba(18,15,8,.82)', color: '#fff1c4', fontFamily: 'inherit', fontSize: 15 }}
        >
          {b.title}
          <small style={{ display: 'block', color: '#7fe0c0', fontSize: 12, marginTop: 2 }}>{b.sub}</small>
        </button>
      ))}
    </div>
  );
}
