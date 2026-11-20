'use client';

import { useEffect, useState } from 'react';
import { loadAsbab, toAr, type AsbabData, type QData } from './data';
import { SURAH_META } from './surahMeta';
import { QuranEncyclopedia } from './QuranEncyclopedia';

/** علوم القرآن: فهرس السور (مكي/مدني وأعداد) وفهرس ما ورد في الصحيحين عن نزول الآيات. */
export function QuranSciences({ data }: { data: QData }) {
  const [tab, setTab] = useState<'idx' | 'asb' | 'enc'>('enc');
  const [f, setF] = useState<'all' | 0 | 1>('all');
  const [asb, setAsb] = useState<AsbabData | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (tab !== 'asb' || asb) return;
    loadAsbab().then(setAsb).catch(() => setErr(true));
  }, [tab, asb]);
  const nM = SURAH_META.filter((m) => m[0] === 0).length;
  const sura = (n: number) => data.suras[n - 1];
  const keys = asb
    ? Object.keys(asb.a).sort((a, b) => {
        const [s1, a1] = a.split(':').map(Number);
        const [s2, a2] = b.split(':').map(Number);
        return s1 - s2 || a1 - a2;
      })
    : [];
  const ayaText = (k: string) => {
    const [s, a] = k.split(':').map(Number);
    return data.ayas.find((x) => x[0] === s && x[1] === a)?.[4] ?? '';
  };
  return (
    <div className="qs">
      <div className="qs-tabs">
        <button type="button" className={tab === 'enc' ? 'on' : ''} onClick={() => setTab('enc')}>الموسوعة</button>
        <button type="button" className={tab === 'idx' ? 'on' : ''} onClick={() => setTab('idx')}>فهرس السور</button>
        <button type="button" className={tab === 'asb' ? 'on' : ''} onClick={() => setTab('asb')}>أسباب النزول</button>
      </div>
      {tab === 'enc' && <QuranEncyclopedia />}
      {tab === 'idx' && (
        <>
          <div className="qs-sum">
            {toAr(nM)} سورة مكية • {toAr(114 - nM)} سورة مدنية
            <small>بحسب تصنيف Tanzil لمصحف المدينة؛ وللعلماء خلاف في بعض السور.</small>
          </div>
          <div className="qs-chips">
            {([['all', 'الكل'], [0, 'مكية'], [1, 'مدنية']] as const).map(([v, l]) => (
              <button key={String(v)} type="button" className={f === v ? 'on' : ''} onClick={() => setF(v)}>{l}</button>
            ))}
          </div>
          {SURAH_META.map((m, i) =>
            f === 'all' || f === m[0] ? (
              <div key={i} className="qs-r">
                <b>{toAr(i + 1)}. {sura(i + 1).name.replace(/^سورة\s*/, '')}</b>
                <span className={m[0] ? 'md' : 'mk'}>{m[0] ? 'مدنية' : 'مكية'}</span>
                <small>
                  {toAr(sura(i + 1).ayas)} آية • {toAr(m[1])} كلمة • {toAr(m[2])} حرفًا
                </small>
              </div>
            ) : null,
          )}
          <p className="qs-n">أعداد الكلمات والحروف محسوبة من رسم المصحف الإملائي (بدون البسملة في أوائل السور).</p>
        </>
      )}
      {tab === 'asb' && (
        <>
          <p className="qs-n" style={{ marginTop: 0 }}>
            أحاديث من صحيحَي البخاري ومسلم ذُكر فيها نزول الآية، رُبطت بالآية بمطابقة نصها. قد يكون المذكور سببًا أو وقتَ نزول؛ فاقرأ الحديث كاملًا.
          </p>
          {err && <p style={{ color: '#ffd9a0' }}>تعذّر التحميل.</p>}
          {!asb && !err && <p style={{ opacity: 0.7 }}>جارٍ التحميل…</p>}
          {asb &&
            keys.map((k) => {
              const [s, a] = k.split(':').map(Number);
              const o = open === k;
              return (
                <div key={k} className="qs-a">
                  <button type="button" onClick={() => setOpen(o ? null : k)}>
                    <b>{sura(s).name.replace(/^سورة\s*/, '')} • آية {toAr(a)}</b>
                    <span>{toAr(asb.a[k].length)} {asb.a[k].length > 1 ? 'أحاديث' : 'حديث'}</span>
                  </button>
                  {o && (
                    <div className="qs-b">
                      <p className="qs-v">{ayaText(k)}</p>
                      {asb.a[k].map((i) => (
                        <div key={i} className="qs-h">
                          <div className="qs-s">{asb.h[i].b} — {asb.h[i].c} (حديث {toAr(Number(asb.h[i].n) || 0)})</div>
                          <div>{asb.h[i].t}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </>
      )}
      <style>{`
        .qs { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
        .qs-tabs, .qs-chips { display: flex; gap: 8px; margin-bottom: 10px; }
        .qs-tabs button, .qs-chips button { flex: 1; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #f7ebc1; font-family: inherit; font-size: 14px; }
        .qs-tabs .on, .qs-chips .on { background: rgba(232,194,90,.25); color: #f1d77a; }
        .qs-sum { text-align: center; color: #f1d77a; margin-bottom: 10px; font-size: 15px; }
        .qs-sum small { display: block; font-size: 11.5px; opacity: .6; margin-top: 2px; }
        .qs-r { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(232,194,90,.22); background: rgba(18,15,8,.82); margin-bottom: 6px; }
        .qs-r small { grid-column: 1 / -1; font-size: 12px; color: rgba(255,241,196,.65); }
        .qs-r span { font-size: 12px; padding: 1px 10px; border-radius: 999px; }
        .qs-r .mk { background: rgba(232,194,90,.2); color: #f1d77a; }
        .qs-r .md { background: rgba(127,224,192,.18); color: #7fe0c0; }
        .qs-n { font-size: 12px; color: rgba(255,241,196,.55); line-height: 1.8; }
        .qs-a { border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); border-radius: 14px; margin-bottom: 8px; overflow: hidden; }
        .qs-a > button { width: 100%; display: flex; justify-content: space-between; padding: 12px; background: none; border: 0; color: #fff1c4; font-family: inherit; font-size: 14px; }
        .qs-a > button span { color: #7fe0c0; font-size: 12px; }
        .qs-b { padding: 0 12px 12px; }
        .qs-v { font-family: var(--f-amiriq), 'Amiri Quran', 'KFGQPC Hafs', serif; font-size: 22px; line-height: 2.2; text-align: center; color: #fff1c4; margin: 0 0 8px; }
        .qs-h { font-family: var(--font-ruqaa), serif; font-size: 17px; line-height: 2; text-align: justify; padding-top: 8px; border-top: 1px dashed rgba(232,194,90,.25); }
        .qs-s { font-family: var(--font-kufi), sans-serif; font-size: 12.5px; color: #e8c25a; }
      `}</style>
    </div>
  );
}
