'use client';

import { useEffect, useRef, useState } from 'react';
import { FiqhBook } from '@/components/FiqhMadhahib';
import { allBooks, type BookMeta } from '@/components/ilm/books';
import { PillarIcon } from '@/components/Doodles';
import { norm, toAr } from '@/components/quran/data';

/**
 * أركان الإسلام الخمسة: لكل ركن (١) تجميعة أحاديث من الصحيحين بفهرس، (٢) كتب من المكتبة تتناوله
 * تُفتح على بابه مباشرة، (٣) بحث في الركن كله. لا نصوص من عندنا؛ كل شيء من الكتب المنسوبة.
 */
type Src = { book: string; ki: number; label: string };
type Pillar = { id: string; n: string; sub: string; srcs: Src[] };

const PILLARS: Pillar[] = [
  { id: 'shahada', n: 'الشهادتان', sub: 'شهادة أن لا إله إلا الله وأن محمدًا رسول الله', srcs: [
    { book: 'iman', ki: 1, label: 'كتاب الإيمان لأبي عبيد — نعت الإيمان' },
    { book: 'iman', ki: 2, label: 'كتاب الإيمان — الاستثناء في الإيمان' },
    { book: 'iman', ki: 3, label: 'كتاب الإيمان — الزيادة والنقصان' },
    { book: 'iman', ki: 4, label: 'كتاب الإيمان — حقيقة الإيمان' },
    { book: 'iman', ki: 5, label: 'كتاب الإيمان — الخروج من الإيمان بالمعاصي' },
    { book: 'tahawiyya', ki: 0, label: 'متن العقيدة الطحاوية' },
  ] },
  { id: 'salah', n: 'الصلاة', sub: 'إقام الصلاة', srcs: [
    { book: 'umdat', ki: 2, label: 'عمدة الأحكام — كتاب الصلاة' },
    { book: 'ikhtilaf', ki: 1, label: 'اختلاف الأئمة العلماء — كتاب الصلاة' },
    { book: 'bidaya', ki: 5, label: 'بداية المجتهد — كتاب الصلاة' },
    { book: 'bidaya', ki: 6, label: 'بداية المجتهد — كتاب الصلاة الثاني' },
  ] },
  { id: 'zakat', n: 'الزكاة', sub: 'إيتاء الزكاة', srcs: [
    { book: 'umdat', ki: 4, label: 'عمدة الأحكام — كتاب الزكاة' },
    { book: 'ikhtilaf', ki: 3, label: 'اختلاف الأئمة العلماء — كتاب الزكاة' },
    { book: 'bidaya', ki: 8, label: 'بداية المجتهد — كتاب الزكاة' },
    { book: 'bidaya', ki: 9, label: 'بداية المجتهد — زكاة الفطر' },
  ] },
  { id: 'siyam', n: 'الصيام', sub: 'صوم رمضان', srcs: [
    { book: 'umdat', ki: 5, label: 'عمدة الأحكام — كتاب الصيام' },
    { book: 'ikhtilaf', ki: 4, label: 'اختلاف الأئمة العلماء — كتاب الصوم' },
    { book: 'bidaya', ki: 10, label: 'بداية المجتهد — كتاب الصيام' },
    { book: 'bidaya', ki: 11, label: 'بداية المجتهد — كتاب الصيام الثاني' },
    { book: 'bidaya', ki: 12, label: 'بداية المجتهد — الاعتكاف' },
  ] },
  { id: 'hajj', n: 'الحج', sub: 'حج البيت لمن استطاع إليه سبيلًا', srcs: [
    { book: 'umdat', ki: 6, label: 'عمدة الأحكام — كتاب الحج' },
    { book: 'ikhtilaf', ki: 5, label: 'اختلاف الأئمة العلماء — الحج والمناسك' },
    { book: 'bidaya', ki: 13, label: 'بداية المجتهد — كتاب الحج' },
    { book: 'manasik', ki: 0, label: 'الإيضاح في مناسك الحج للنووي — المقدمة' },
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({ book: 'manasik', ki: k, label: `الإيضاح في مناسك الحج — الباب ${['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'][k]}` })),
  ] },
];

const ARKAN_META: BookMeta = {
  id: 'arkan',
  dir: '/arkan/',
  title: 'أحاديث أركان الإسلام من الصحيحين',
  fiqh: false,
  credit:
    'تجميعة أحاديث كل ركن من صحيح البخاري وصحيح مسلم والأربعين النووية، مصنّفة بحسب كتبهما. النص من موقع sunnah.com عبر مشروع hadith-json دون تعديل في ألفاظه.',
};

type Kit = { t: string; b: { t: string; e: string[] }[] };
const kc = new Map<string, Promise<Kit>>();
function loadK(dir: string, i: number) {
  const k = `${dir}${i}`;
  let p = kc.get(k);
  if (!p) {
    p = fetch(`${dir}k${i}.json`).then((r) => (r.ok ? r.json() : Promise.reject()));
    p.catch(() => kc.delete(k));
    kc.set(k, p);
  }
  return p;
}

type Hit = { meta: BookMeta; ki: number; bi: number; src: string; p: string };

export function ArkanIslam() {
  const [books, setBooks] = useState<BookMeta[] | null>(null);
  const [pi, setPi] = useState<number | null>(null);
  const [tab, setTab] = useState<'idx' | 'books' | 'search'>('idx');
  const [read, setRead] = useState<{ meta: BookMeta; ki: number; bi: number | null } | null>(null);
  const [h3, setH3] = useState('');
  const [babs, setBabs] = useState<string[] | null>(null);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [prog, setProg] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const stop = useRef(0);

  useEffect(() => {
    allBooks().then(setBooks).catch(() => setBooks([]));
    fetch('/hadith/nawawi/0.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: [string, string][]) => setH3(d.find((x) => String(x[0]) === '3')?.[1] || ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setBabs(null);
    setHits(null);
    setQ('');
    stop.current++;
    if (pi == null) return;
    loadK('/arkan/', pi).then((k) => setBabs(k.b.map((b) => b.t))).catch(() => setBabs([]));
  }, [pi]);

  const metaOf = (id: string) => books?.find((b) => b.id === id);

  if (read)
    return (
      <FiqhBook
        key={`${read.meta.id}-${read.ki}-${read.bi}`}
        dir={read.meta.dir}
        title={read.meta.title}
        credit={read.meta.credit}
        fiqh={read.meta.fiqh}
        start={{ ki: read.ki, bi: read.bi }}
        backLabel="← رجوع للركن"
        onBack={() => setRead(null)}
      />
    );

  async function search(p: Pillar, pidx: number) {
    const w = norm(q).split(' ').filter(Boolean);
    if (!w.length) return;
    const my = ++stop.current;
    const out: Hit[] = [];
    setHits([]);
    setProg(0);
    const jobs: { meta: BookMeta; ki: number }[] = [{ meta: ARKAN_META, ki: pidx }];
    p.srcs.forEach((s) => {
      const m = metaOf(s.book);
      if (m) jobs.push({ meta: m, ki: s.ki });
    });
    for (let j = 0; j < jobs.length; j++) {
      let d: Kit;
      try {
        d = await loadK(jobs[j].meta.dir, jobs[j].ki);
      } catch {
        continue;
      }
      if (stop.current !== my) return;
      d.b.forEach((b, bi) =>
        b.e.forEach((t) => {
          if (out.length < 80 && w.every((x) => norm(t).includes(x)))
            out.push({ meta: jobs[j].meta, ki: jobs[j].ki, bi, src: `${jobs[j].meta.title} ‹ ${d.t === jobs[j].meta.title ? '' : d.t + ' ‹ '}${b.t}`, p: t });
        }),
      );
      setProg(Math.round(((j + 1) / jobs.length) * 100));
      setHits([...out]);
    }
    setProg(null);
  }

  async function copy(t: string, src: string) {
    try {
      await navigator.clipboard.writeText(`${t}\n— ${src}`);
      setMsg('تم النسخ');
    } catch {
      setMsg('تعذّر النسخ');
    }
    setTimeout(() => setMsg(''), 1200);
  }

  const css = (
    <style>{`
      .ar { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
      .ar-top { padding: 14px; border-radius: 18px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.85); margin-bottom: 12px; }
      .ar-top small { color: #e8c25a; font-size: 12px; }
      .ar-top p { margin: 6px 0 0; font-family: var(--font-ruqaa), serif; font-size: 17px; line-height: 2.1; text-align: justify; }
      .ar-g { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .ar-c { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 8px 12px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.75); color: #fff1c4; font-family: inherit; text-align: center; }
      .ar-c:last-child:nth-child(odd) { grid-column: 1 / -1; }
      .ar-c b { font-size: 17px; color: #f1d77a; }
      .ar-c small { font-size: 11.5px; opacity: .75; line-height: 1.7; }
      .ar-back { background: none; border: 0; color: #f1d77a; font-family: inherit; font-size: 14px; padding: 4px 0 10px; }
      .ar-h { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
      .ar-h b { font-size: 20px; color: #f1d77a; display: block; }
      .ar-h small { font-size: 12px; opacity: .75; }
      .ar-t { display: flex; gap: 6px; margin-bottom: 12px; }
      .ar-t button { flex: 1; padding: 9px 4px; border-radius: 12px; border: 1px solid rgba(232,194,90,.3); background: transparent; color: #e8c25a; font-family: inherit; font-size: 14px; }
      .ar-t button.on { background: rgba(232,194,90,.18); color: #f6e49c; border-color: rgba(232,194,90,.7); }
      .ar-l { display: flex; flex-direction: column; gap: 6px; }
      .ar-l button { display: flex; justify-content: space-between; gap: 8px; padding: 11px 12px; border-radius: 12px; border: 1px solid rgba(232,194,90,.22); background: rgba(18,15,8,.7); color: #fff1c4; font-family: var(--font-ruqaa), serif; font-size: 15px; text-align: right; line-height: 1.7; }
      .ar-l button span { color: #e8c25a; font-size: 12px; font-family: var(--font-kufi), sans-serif; white-space: nowrap; }
      .ar-all { width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 14px; border: 1px solid rgba(127,224,192,.5); background: rgba(127,224,192,.1); color: #7fe0c0; font-family: inherit; font-size: 15px; }
      .ar-s { display: flex; gap: 6px; margin-bottom: 10px; }
      .ar-s input { flex: 1; min-width: 0; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 15px; }
      .ar-s button { padding: 10px 16px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.15); color: #f1d77a; font-family: inherit; }
      .ar-r { padding: 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.8); margin-bottom: 8px; }
      .ar-r small { color: #e8c25a; font-size: 11.5px; display: block; }
      .ar-r p { margin: 6px 0; font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 2; text-align: justify; max-height: 11em; overflow: hidden; }
      .ar-r div { display: flex; gap: 8px; }
      .ar-r button { padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #f1d77a; font-family: inherit; font-size: 12.5px; }
      .ar-n { font-size: 11.5px; text-align: center; color: rgba(255,241,196,.5); line-height: 1.8; margin-top: 12px; }
    `}</style>
  );

  if (pi == null)
    return (
      <div className="ar">
        <div className="ar-top">
          <small>الأربعون النووية — الحديث الثالث</small>
          <p>{h3 || 'بُنِيَ الإسلام على خمس…'}</p>
        </div>
        <div className="ar-g">
          {PILLARS.map((p, i) => (
            <button key={p.id} type="button" className="ar-c" onClick={() => (setTab('idx'), setPi(i))}>
              <PillarIcon id={p.id} />
              <b>{p.n}</b>
              <small>{p.sub}</small>
            </button>
          ))}
        </div>
        <p className="ar-n">لكل ركن: فهرس أحاديث الصحيحين، وكتب تتناوله تُفتح على بابه، وبحث في الركن كله. النصوص كما هي بلا تعديل.</p>
        {css}
      </div>
    );

  const p = PILLARS[pi];
  return (
    <div className="ar">
      <button type="button" className="ar-back" onClick={() => setPi(null)}>← أركان الإسلام</button>
      <div className="ar-h">
        <PillarIcon id={p.id} size={72} />
        <div>
          <b>{p.n}</b>
          <small>{p.sub}</small>
        </div>
      </div>
      <div className="ar-t" role="tablist">
        {([['idx', 'فهرس الأحاديث'], ['books', 'الكتب'], ['search', 'بحث']] as const).map(([id, l]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}</button>
        ))}
      </div>

      {tab === 'idx' && (
        <>
          <button type="button" className="ar-all" onClick={() => setRead({ meta: ARKAN_META, ki: pi, bi: null })}>
            افتح تجميعة {p.n} كاملة
          </button>
          {!babs ? (
            <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>
          ) : (
            <div className="ar-l">
              {babs.map((b, i) => (
                <button key={b} type="button" onClick={() => setRead({ meta: ARKAN_META, ki: pi, bi: i })}>
                  {b}
                  <span>{toAr(i + 1)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'books' && (
        <div className="ar-l">
          {!books ? (
            <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>
          ) : (
            p.srcs.map((s) => {
              const m = metaOf(s.book);
              if (!m) return null;
              return (
                <button key={`${s.book}${s.ki}`} type="button" onClick={() => setRead({ meta: m, ki: s.ki, bi: null })}>
                  {s.label}
                  <span>فتح</span>
                </button>
              );
            })
          )}
        </div>
      )}

      {tab === 'search' && (
        <>
          <div className="ar-s">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search(p, pi)} placeholder={`ابحث في ${p.n}…`} />
            <button type="button" onClick={() => search(p, pi)}>بحث</button>
          </div>
          {prog != null && <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 13 }}>جارٍ البحث… {toAr(prog)}٪</p>}
          {hits && prog == null && <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 13 }}>{hits.length ? `${toAr(hits.length)} نتيجة` : 'لا نتائج'}</p>}
          {hits?.map((h, i) => (
            <div key={i} className="ar-r">
              <small>{h.src}</small>
              <p>{h.p}</p>
              <div>
                <button type="button" onClick={() => setRead({ meta: h.meta, ki: h.ki, bi: h.bi })}>فتح في الكتاب</button>
                <button type="button" onClick={() => copy(h.p, h.src)}>{msg || 'نسخ'}</button>
              </div>
            </div>
          ))}
        </>
      )}
      {css}
    </div>
  );
}
