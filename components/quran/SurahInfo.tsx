'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadAsbab, toAr, useQuran, type AsbabData } from './data';
import { SURAH_META } from './surahMeta';

/**
 * بطاقة السورة: مكية/مدنية وأعدادها وموضعها في المصحف، وما صحّ في فضلها من الصحيحين، وما ورد عن أسباب نزول آياتها.
 * اختيار أحاديث الفضل بالأرقام فقط (من صحيحي البخاري ومسلم)، ونصوصها تُقرأ حرفيّةً من بيانات الكتابين في التطبيق.
 * ليس لكل سورة حديث صحيح في فضلها، فنذكر ما ثبت ولا نكمل من عندنا.
 */
type Ref = [b: 'bukhari' | 'muslim', ch: number, n: string, what: string];
const VIRTUE: Record<number, Ref[]> = {
  1: [
    ['bukhari', 66, '4799', 'أعظم سورة في القرآن'],
    ['muslim', 6, '1769', 'نور أوتيه النبي ﷺ'],
  ],
  2: [
    ['muslim', 6, '1716', 'الشيطان ينفر من البيت الذي تُقرأ فيه'],
    ['muslim', 6, '1766', 'تأتي يوم القيامة تحاجّ عن صاحبها'],
    ['bukhari', 66, '4802', 'الآيتان من آخرها'],
    ['bukhari', 66, '4803', 'آية الكرسي'],
    ['muslim', 6, '1769', 'خواتيم سورة البقرة'],
  ],
  3: [
    ['muslim', 6, '1766', 'الزهراوان: البقرة وآل عمران'],
    ['muslim', 6, '1768', 'تُقدِّمان أهلهما يوم القيامة'],
  ],
  18: [
    ['muslim', 6, '1775', 'عشر آيات من أولها'],
    ['bukhari', 66, '4804', 'السكينة تنزلت للقرآن'],
  ],
  48: [['bukhari', 66, '4805', 'أحبّ إليه مما طلعت عليه الشمس']],
  109: [['muslim', 6, '1584', 'قراءتها في سنة الفجر']],
  112: [
    ['bukhari', 66, '4806', 'تعدل ثلث القرآن'],
    ['muslim', 6, '1778', 'تعدل ثلث القرآن'],
    ['bukhari', 66, '4810', 'من أذكار النوم'],
  ],
  113: [
    ['muslim', 6, '1783', 'آيات لم يُرَ مثلهنّ'],
    ['bukhari', 66, '4809', 'الرقية بالمعوذات'],
    ['bukhari', 66, '4810', 'من أذكار النوم'],
  ],
  114: [
    ['muslim', 6, '1783', 'آيات لم يُرَ مثلهنّ'],
    ['bukhari', 66, '4809', 'الرقية بالمعوذات'],
    ['bukhari', 66, '4810', 'من أذكار النوم'],
  ],
};

const hc = new Map<string, Promise<[string, string][]>>();
function loadH(b: string, ch: number) {
  const k = `${b}/${ch}`;
  let p = hc.get(k);
  if (!p) {
    p = fetch(`/hadith/${k}.json`).then((r) => {
      if (!r.ok) throw new Error('h');
      return r.json();
    });
    p.catch(() => hc.delete(k));
    hc.set(k, p);
  }
  return p;
}

export function SurahInfo() {
  const { data } = useQuran();
  const [n, setN] = useState(0);
  const [q, setQ] = useState('');
  const [asb, setAsb] = useState<AsbabData | null>(null);
  const [vt, setVt] = useState<{ what: string; src: string; t: string }[]>([]);
  const [showAsb, setShowAsb] = useState(false);

  useEffect(() => {
    loadAsbab().then(setAsb).catch(() => {});
  }, []);

  useEffect(() => {
    let live = true;
    setVt([]);
    setShowAsb(false);
    const refs = VIRTUE[n] || [];
    Promise.all(
      refs.map(async ([b, ch, num, what]) => {
        try {
          const l = await loadH(b, ch);
          const h = l.find((x) => x[0] === num);
          return h ? { what, src: `${b === 'bukhari' ? 'صحيح البخاري' : 'صحيح مسلم'} (${toAr(Number(num))})`, t: h[1] } : null;
        } catch {
          return null;
        }
      }),
    ).then((r) => live && setVt(r.filter(Boolean) as { what: string; src: string; t: string }[]));
    return () => { live = false; };
  }, [n]);

  const list = useMemo(() => {
    if (!data) return [];
    const nq = q.trim();
    return data.suras.filter((s) => !nq || s.name.includes(nq) || String(s.n) === nq);
  }, [data, q]);

  if (!data) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;

  if (!n) {
    return (
      <div className="si">
        <input className="si-q" placeholder="ابحث باسم السورة أو رقمها" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="si-g">
          {list.map((s) => (
            <button key={s.n} type="button" onClick={() => setN(s.n)}>
              <span>{toAr(s.n)}</span>
              {s.name.replace(/^سورة\s*/, '')}
              <small>{SURAH_META[s.n - 1][0] ? 'مدنية' : 'مكية'}</small>
            </button>
          ))}
        </div>
        <style>{css}</style>
      </div>
    );
  }

  const s = data.suras[n - 1];
  const m = SURAH_META[n - 1];
  const asbIdx = asb ? Object.keys(asb.a).filter((k) => k.startsWith(`${n}:`)).sort((a, b) => Number(a.split(':')[1]) - Number(b.split(':')[1])) : [];

  return (
    <div className="si">
      <button type="button" className="si-b" onClick={() => setN(0)}>‹ كل السور</button>
      <div className="si-t">
        <h2>{s.name}</h2>
        <span className={m[0] ? 'md' : 'mk'}>{m[0] ? 'مدنية' : 'مكية'}</span>
      </div>
      <div className="si-s">
        <div><b>{toAr(s.n)}</b><span>ترتيبها في المصحف</span></div>
        <div><b>{toAr(s.ayas)}</b><span>آية</span></div>
        <div><b>{toAr(m[1])}</b><span>كلمة</span></div>
        <div><b>{toAr(m[2])}</b><span>حرفًا</span></div>
        <div><b>{toAr(s.page)}</b><span>صفحة البداية</span></div>
        <div><b>{toAr(s.juz)}</b><span>الجزء</span></div>
      </div>
      <h3>ما صحّ في فضلها</h3>
      {VIRTUE[n] ? (
        vt.length ? (
          vt.map((v, i) => (
            <article key={i} className="si-h">
              <div className="si-w">{v.what} — {v.src}</div>
              <p>{v.t}</p>
            </article>
          ))
        ) : (
          <p className="si-n">جارٍ التحميل…</p>
        )
      ) : (
        <p className="si-n">لم نُدرج لهذه السورة حديثًا خاصًّا في فضلها من الصحيحين. وكل القرآن فضله عظيم.</p>
      )}
      <h3>ما ورد في أسباب نزول آياتها</h3>
      {asbIdx.length ? (
        <>
          <button type="button" className="si-b" onClick={() => setShowAsb(!showAsb)}>
            {showAsb ? 'إخفاء' : `عرض (${toAr(asbIdx.length)} آية)`}
          </button>
          {showAsb && asb &&
            asbIdx.map((k) => (
              <article key={k} className="si-h">
                <div className="si-w">الآية {toAr(Number(k.split(':')[1]))}</div>
                {asb.a[k].slice(0, 3).map((hi) => (
                  <p key={hi}>{asb.h[hi].t} <small>— {asb.h[hi].b} {asb.h[hi].n}</small></p>
                ))}
              </article>
            ))}
        </>
      ) : (
        <p className="si-n">لا يوجد في الصحيحين ما يخصّ آياتها في فهرسنا.</p>
      )}
      <style>{css}</style>
    </div>
  );
}

const css = `
  .si { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 10px; }
  .si-q { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(232,194,90,.45); background: rgba(18,15,8,.9); color: #fff1c4; font-family: inherit; font-size: 15px; }
  .si-g { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
  .si-g button { position: relative; padding: 14px 6px 10px; border-radius: 14px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.8); color: #fff1c4; font-family: inherit; font-size: 14px; display: flex; flex-direction: column; gap: 3px; align-items: center; }
  .si-g button span { position: absolute; top: 4px; inset-inline-start: 7px; font-size: 10.5px; color: #e8c25a; }
  .si-g small { font-size: 10.5px; color: rgba(255,241,196,.5); }
  .si-b { align-self: flex-start; padding: 7px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: inherit; font-size: 13px; }
  .si-t { display: flex; align-items: center; justify-content: space-between; }
  .si-t h2 { margin: 0; color: #e8c25a; font-size: 24px; }
  .si-t span { padding: 4px 12px; border-radius: 999px; font-size: 12.5px; border: 1px solid rgba(232,194,90,.4); }
  .si-s { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .si-s div { padding: 10px 4px; border-radius: 14px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.8); text-align: center; display: flex; flex-direction: column; gap: 2px; }
  .si-s b { font-size: 19px; color: #f1d77a; }
  .si-s span { font-size: 11px; color: rgba(255,241,196,.6); }
  .si h3 { margin: 6px 0 0; font-size: 15px; color: #e8c25a; }
  .si-h { padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.8); }
  .si-w { font-size: 12px; color: #e8c25a; }
  .si-h p { margin: 6px 0 0; font-size: 16px; line-height: 2; }
  .si-h small { color: rgba(255,241,196,.5); font-size: 11px; }
  .si-n { font-size: 12px; text-align: center; color: rgba(255,241,196,.55); margin: 4px 0; }
`;
