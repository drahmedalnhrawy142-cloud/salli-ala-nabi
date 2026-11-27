'use client';

import { useRef, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { addStars, bump } from './store';

/**
 * «رتّب وتعلّم» و«لوّن»: معلومات متفق عليها بين المسلمين فقط، بلا أي رواية ولا فضل.
 * الترتيب: أركان الإسلام (حديث جبريل)، أركان الإيمان (حديث جبريل)، الصلوات الخمس بترتيب اليوم،
 * ركعات الفرائض، خطوات الوضوء، الأشهر الهجرية.
 * لا صور ولا تجسيد لأي نبي أو صحابي: التلوين لمسجد وهلال وفانوس ونجمة فقط.
 */
const SETS: { id: string; icon: string; t: string; hint: string; items: string[] }[] = [
  { id: 'arkan', icon: '🕋', t: 'أركان الإسلام', hint: 'رتّبها كما في حديث جبريل', items: ['الشهادتان', 'إقام الصلاة', 'إيتاء الزكاة', 'صوم رمضان', 'حج البيت'] },
  { id: 'iman', icon: '💫', t: 'أركان الإيمان', hint: 'الإيمان بالله وما بعده', items: ['الإيمان بالله', 'وملائكته', 'وكتبه', 'ورسله', 'واليوم الآخر', 'والقدر خيره وشره'] },
  { id: 'salat', icon: '🕌', t: 'الصلوات الخمس', hint: 'من الفجر إلى العشاء', items: ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'] },
  { id: 'rak', icon: '🔢', t: 'ركعات الفرائض', hint: 'رتّب الصلوات من الأقل ركعاتٍ للأكثر', items: ['المغرب · ٣', 'الفجر · ٢', 'الظهر · ٤', 'العصر · ٤', 'العشاء · ٤'] },
  { id: 'wudu', icon: '💧', t: 'خطوات الوضوء', hint: 'من البداية إلى النهاية', items: ['النية والتسمية', 'غسل الكفين', 'المضمضة والاستنشاق', 'غسل الوجه', 'غسل اليدين إلى المرفقين', 'مسح الرأس والأذنين', 'غسل الرجلين إلى الكعبين'] },
  { id: 'months', icon: '🌙', t: 'الأشهر الهجرية', hint: 'من محرم إلى ذي الحجة', items: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'] },
];

/* في «ركعات الفرائض» الترتيب الصحيح تصاعدي بعدد الركعات: ٢ ثم ٣ ثم ٤ ٤ ٤ ، فنُعرِّفه صراحةً */
const ANSWER: Record<string, string[]> = {
  rak: ['الفجر · ٢', 'المغرب · ٣', 'الظهر · ٤', 'العصر · ٤', 'العشاء · ٤'],
};

function Order({ set, onBack }: { set: (typeof SETS)[number]; onBack: () => void }) {
  const ans = ANSWER[set.id] || set.items;
  const shuffle = () => {
    let a = [...set.items].sort(() => Math.random() - 0.5);
    if (a.join() === ans.join()) a = [...a].reverse();
    return a;
  };
  const [pool, setPool] = useState<string[]>(shuffle);
  const [got, setGot] = useState<string[]>([]);
  const [bad, setBad] = useState('');
  const [tries, setTries] = useState(0);
  const won = got.length === ans.length;
  function pick(t: string) {
    if (won) return;
    /* في ركعات الفرائض تتساوى بعض العناصر في العدد، فنقبل أي عنصر له نفس عدد الركعات في هذا الموضع */
    const want = ans[got.length];
    const ok = t === want || (set.id === 'rak' && t.split('·')[1] === want.split('·')[1]);
    if (ok) {
      const g = [...got, t];
      setGot(g);
      setPool(pool.filter((x) => x !== t));
      if (g.length === ans.length) { bump('plays'); addStars(tries === 0 ? 3 : 2); }
    } else {
      setBad(t);
      setTries((x) => x + 1);
      setTimeout(() => setBad(''), 400);
    }
  }
  function again() { setPool(shuffle()); setGot([]); setTries(0); }
  return (
    <div className="kl-box">
      <button type="button" className="kl-back" onClick={onBack}>→ رجوع</button>
      <h3 className="kl-h">{set.icon} {set.t}</h3>
      <p className="kl-p">{won ? (tries === 0 ? 'أحسنت! رتّبتها من أول مرة ✨' : `أحسنت! أخطأت ${toAr(tries)} مرة ثم أصبت`) : 'المس العناصر بالترتيب الصحيح'}</p>
      <ol className="kl-got">
        {ans.map((_, i) => <li key={i} className={got[i] ? 'on' : ''}>{got[i] || toAr(i + 1)}</li>)}
      </ol>
      {!won && (
        <div className="kl-pool">
          {pool.map((t) => <button key={t} type="button" className={bad === t ? 'bad' : ''} onClick={() => pick(t)}>{t}</button>)}
        </div>
      )}
      {won && <button type="button" className="kl-go" onClick={again}>مرة أخرى</button>}
    </div>
  );
}

/* ———————— التلوين ———————— */
const PAL = ['#ffd24a', '#7fe0c0', '#ff9a7a', '#9ab8ff', '#e6a8ff', '#ffb3c7', '#ffffff', '#3a3a3a'];
const PICS: { id: string; t: string; parts: { d: string }[] }[] = [
  {
    id: 'mosque', t: 'المسجد',
    parts: [
      { d: 'M70 300 V150 L85 110 L100 150 V300 Z' },
      { d: 'M200 300 V150 L215 110 L230 150 V300 Z' },
      { d: 'M100 300 V230 Q150 120 200 230 V300 Z' },
      { d: 'M135 300 V260 Q150 235 165 260 V300 Z' },
      { d: 'M40 300 H260 V325 H40 Z' },
    ],
  },
  {
    id: 'moon', t: 'الهلال والنجمة',
    parts: [
      { d: 'M180 60 A100 100 0 1 0 180 290 A80 80 0 1 1 180 60 Z' },
      { d: 'M225 130 L237 165 L275 165 L245 187 L256 223 L225 201 L194 223 L205 187 L175 165 L213 165 Z' },
    ],
  },
  {
    id: 'lamp', t: 'الفانوس',
    parts: [
      { d: 'M120 70 H180 L190 95 H110 Z' },
      { d: 'M110 95 H190 L205 180 Q150 215 95 180 Z' },
      { d: 'M95 180 Q150 215 205 180 L190 265 H110 Z' },
      { d: 'M105 265 H195 L205 290 H95 Z' },
      { d: 'M150 40 V70' },
    ],
  },
];

function Color({ onBack }: { onBack: () => void }) {
  const [pi, setPi] = useState(0);
  const [col, setCol] = useState(PAL[0]);
  const [fills, setFills] = useState<Record<string, string>>({});
  const doneStar = useRef(false);
  const pic = PICS[pi];
  function paint(i: number) {
    const k = pic.id + i;
    const nf = { ...fills, [k]: col };
    setFills(nf);
    if (!doneStar.current && pic.parts.every((_, j) => nf[pic.id + j])) { doneStar.current = true; bump('plays'); addStars(1); }
  }
  return (
    <div className="kl-box">
      <button type="button" className="kl-back" onClick={onBack}>→ رجوع</button>
      <h3 className="kl-h">🎨 لوّن: {pic.t}</h3>
      <div className="kl-tabs">
        {PICS.map((p, i) => <button key={p.id} type="button" className={i === pi ? 'on' : ''} onClick={() => { setPi(i); doneStar.current = false; }}>{p.t}</button>)}
      </div>
      <svg viewBox="0 0 300 340" width="300" style={{ maxWidth: '100%', background: 'rgba(18,15,8,.7)', border: '1px solid rgba(232,194,90,.35)', borderRadius: 16 }}>
        {pic.parts.map((p, i) => (
          <path key={i} d={p.d} fill={fills[pic.id + i] || 'transparent'} stroke="#e8c25a" strokeWidth="3" strokeLinejoin="round" onClick={() => paint(i)} style={{ cursor: 'pointer' }} />
        ))}
      </svg>
      <div className="kl-pal">
        {PAL.map((c) => <button key={c} type="button" aria-label={c} className={c === col ? 'on' : ''} style={{ background: c }} onClick={() => setCol(c)} />)}
      </div>
      <button type="button" className="kl-go" onClick={() => { setFills({}); doneStar.current = false; }}>مسح التلوين</button>
    </div>
  );
}

export function KidsLearn() {
  const [m, setM] = useState<string>('menu');
  const set = SETS.find((s) => s.id === m);
  return (
    <div className="kl">
      {m === 'menu' && (
        <div className="kl-menu">
          {SETS.map((s) => (
            <button key={s.id} type="button" onClick={() => setM(s.id)}><b>{s.icon}</b><span>{s.t}</span><small>{s.hint}</small></button>
          ))}
          <button type="button" onClick={() => setM('color')}><b>🎨</b><span>لوّن</span><small>مسجد وهلال وفانوس</small></button>
        </div>
      )}
      {set && <Order key={set.id} set={set} onBack={() => setM('menu')} />}
      {m === 'color' && <Color onBack={() => setM('menu')} />}
      <style>{`
        .kl { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
        .kl-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .kl-menu button { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 8px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); color: #fff1c4; font-family: inherit; font-size: 14px; }
        .kl-menu b { font-size: 32px; } .kl-menu small { color: #7fe0c0; font-size: 11.5px; text-align: center; }
        .kl-box { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .kl-back { align-self: flex-start; background: none; border: 0; color: #e8c25a; font-family: inherit; font-size: 14px; }
        .kl-h { margin: 0; color: #f1d77a; font-size: 18px; } .kl-p { margin: 0; font-size: 14px; text-align: center; min-height: 22px; }
        .kl-got { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; width: 290px; max-width: 100%; }
        .kl-got li { padding: 9px 12px; border-radius: 12px; border: 1px dashed rgba(232,194,90,.35); color: rgba(255,241,196,.45); text-align: center; font-size: 14px; }
        .kl-got li.on { border: 1px solid #7fe0c0; background: rgba(127,224,192,.14); color: #fff1c4; }
        .kl-pool { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 320px; }
        .kl-pool button { padding: 9px 14px; border-radius: 999px; border: 1px solid #e8c25a; background: rgba(232,194,90,.16); color: #f1d77a; font-family: inherit; font-size: 14px; }
        .kl-pool button.bad { border-color: #ff9a7a; color: #ff9a7a; transform: translateX(4px); }
        .kl-go { padding: 10px 22px; border-radius: 14px; border: 1px solid #e8c25a; background: rgba(232,194,90,.22); color: #f1d77a; font-family: inherit; font-size: 15px; }
        .kl-tabs { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
        .kl-tabs button { padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; font-family: inherit; font-size: 13px; }
        .kl-tabs button.on { background: rgba(232,194,90,.22); }
        .kl-pal { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .kl-pal button { width: 32px; height: 32px; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); } .kl-pal button.on { border-color: #fff; transform: scale(1.18); }
      `}</style>
    </div>
  );
}
