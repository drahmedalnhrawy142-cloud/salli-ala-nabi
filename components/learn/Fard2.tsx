'use client';

import { useEffect, useState } from 'react';
import { Evidence, QEvidence, type Ev } from './Evidence';

/**
 * دروس مصوّرة: الوضوء، الزكاة، الصيام، الحج.
 * الرسوم أصلية للتوضيح فقط؛ وكل معلومة شرعية دليلها نص قرآني أو حديثي مقتبس من بيانات التطبيق.
 * لا أرقام ولا مقادير تُذكر إلا إن وردت في النص المقتبس نفسه.
 */
const B = (file: number, num: string, phrase: string, len = 60): Ev => ({ coll: 'bukhari', file, num, phrase, len });
const M = (file: number, num: string, phrase: string, len = 60): Ev => ({ coll: 'muslim', file, num, phrase, len });
const css = `
  .f2 { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 14px; }
  .f2-card { padding: 12px; border-radius: 18px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); }
  .f2-card h2, .f2-card h3 { margin: 0 0 8px; color: #f1d77a; font-family: var(--font-ruqaa), serif; font-size: 1.15rem; }
  .f2-stage { max-width: 320px; margin: 8px auto; }
  .f2-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin: 8px 0; }
  .f2-chip { padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; font-family: inherit; font-size: 13px; }
  .f2-chip.on { background: rgba(232,194,90,.25); color: #fff1c4; border-color: #e8c25a; }
  .f2-cap { text-align: center; min-height: 26px; color: #7fe0c0; font-size: 1.02rem; }
  .f2-p { line-height: 1.9; margin: 6px 0; font-size: 1rem; }
  .f2-play { padding: 10px 22px; border-radius: 14px; border: 1px solid #e8c25a; background: rgba(232,194,90,.22); color: #f1d77a; font-family: inherit; font-size: 15px; display: block; margin: 8px auto; }
`;

/* ———————— الوضوء ———————— */
const WSTEPS: { t: string; d: string; ev: Ev[] }[] = [
  { t: 'غسل الكفين ثلاثًا', d: 'ابدأ بغسل كفيك ثلاث مرات.', ev: [M(2, '444', 'فتوضأ فغسل كفيه ثلاث مرات', 40)] },
  { t: 'المضمضة والاستنشاق', d: 'تمضمض وتستنشق وتستنثر.', ev: [M(2, '444', 'ثم مضمض واستنثر', 40)] },
  { t: 'غسل الوجه ثلاثًا', d: 'اغسل وجهك ثلاث مرات.', ev: [M(2, '444', 'ثم غسل وجهه ثلاث مرات', 40)] },
  { t: 'اليدان إلى المرفقين', d: 'اغسل اليمنى إلى المرفق ثم اليسرى مثلها.', ev: [M(2, '444', 'ثم غسل يده اليمنى إلى المرفق ثلاث مرات ثم غسل يده اليسرى مثل ذلك', 20)] },
  { t: 'مسح الرأس', d: 'امسح رأسك.', ev: [M(2, '444', 'ثم مسح رأسه', 40)] },
  { t: 'الرجلان إلى الكعبين', d: 'اغسل رجلك اليمنى إلى الكعبين ثم اليسرى مثلها.', ev: [M(2, '444', 'ثم غسل رجله اليمنى إلى الكعبين ثلاث مرات ثم غسل اليسرى مثل ذلك', 20)] },
];

function WuduBody({ hot }: { hot: number }) {
  const g = (on: boolean) => (on ? { fill: 'rgba(127,224,192,.5)', stroke: '#7fe0c0' } : { fill: 'transparent', stroke: 'transparent' });
  const cloth = '#f3ead2';
  const skin = '#c99a6b';
  return (
    <svg viewBox="0 0 200 300" width="100%" aria-label="مواضع الوضوء" style={{ display: 'block' }}>
      <defs><linearGradient id="wd-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10202e" /><stop offset="1" stopColor="#1a1408" /></linearGradient></defs>
      <rect width="200" height="300" rx="16" fill="url(#wd-bg)" />
      {/* الجسم */}
      <path d="M58 100 Q100 88 142 100 L148 205 H52 Z" fill={cloth} />
      <path d="M62 110 L36 190" stroke={cloth} strokeWidth="18" strokeLinecap="round" />
      <path d="M138 110 L164 190" stroke={cloth} strokeWidth="18" strokeLinecap="round" />
      <rect x="66" y="200" width="30" height="78" rx="12" fill={cloth} />
      <rect x="104" y="200" width="30" height="78" rx="12" fill={cloth} />
      <ellipse cx="82" cy="282" rx="16" ry="7" fill={skin} />
      <ellipse cx="118" cy="282" rx="16" ry="7" fill={skin} />
      <circle cx="36" cy="196" r="9" fill={skin} /><circle cx="164" cy="196" r="9" fill={skin} />
      <rect x="92" y="76" width="16" height="22" fill={skin} />
      <circle cx="100" cy="52" r="30" fill={skin} />
      <path d="M70 48 A30 30 0 0 1 130 48 Z" fill="#fff8e1" />
      {/* المواضع */}
      <g strokeWidth="3">
        <circle cx="36" cy="196" r="14" {...g(hot === 0)} /><circle cx="164" cy="196" r="14" {...g(hot === 0)} />
        <ellipse cx="100" cy="68" rx="12" ry="8" {...g(hot === 1)} />
        <circle cx="100" cy="58" r="27" {...g(hot === 2)} />
        <path d="M62 110 L36 190" strokeLinecap="round" strokeWidth="24" fill="none" stroke={hot === 3 ? 'rgba(127,224,192,.55)' : 'transparent'} />
        <path d="M138 110 L164 190" strokeLinecap="round" strokeWidth="24" fill="none" stroke={hot === 3 ? 'rgba(127,224,192,.55)' : 'transparent'} />
        <path d="M72 30 Q100 12 128 30" strokeLinecap="round" strokeWidth="9" fill="none" stroke={hot === 4 ? '#7fe0c0' : 'transparent'} />
        <ellipse cx="82" cy="282" rx="22" ry="12" {...g(hot === 5)} /><ellipse cx="118" cy="282" rx="22" ry="12" {...g(hot === 5)} />
      </g>
      {hot >= 0 && <text x="100" y="20" textAnchor="middle" fontSize="12" fill="#7fe0c0" style={{ fontFamily: 'var(--font-kufi)' }}>💧</text>}
    </svg>
  );
}

export function WuduGuide() {
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setI((x) => (x + 1) % WSTEPS.length), 1600);
    return () => clearInterval(t);
  }, [play]);
  const s = WSTEPS[i];
  return (
    <div className="f2">
      <section className="f2-card">
        <h2>الوضوء كما توضّأ النبي ﷺ</h2>
        <div className="f2-stage"><WuduBody hot={i} /></div>
        <div className="f2-cap">{(i + 1).toLocaleString('ar-EG')}. {s.t}</div>
        <button type="button" className="f2-play" onClick={() => setPlay((p) => !p)}>{play ? '⏸ إيقاف' : '▶ شغّل الخطوات'}</button>
        <p className="f2-p">{s.d}</p>
        {s.ev.map((e, k) => <Evidence key={k} ev={e} />)}
      </section>
      <div className="f2-row">
        {WSTEPS.map((x, k) => (
          <button key={k} type="button" className={k === i ? 'f2-chip on' : 'f2-chip'} onClick={() => { setPlay(false); setI(k); }}>{(k + 1).toLocaleString('ar-EG')}. {x.t}</button>
        ))}
      </div>
      <section className="f2-card">
        <h3>بعد الوضوء</h3>
        <Evidence ev={B(4, '159', 'من توضأ نحو وضوئي هذا ثم صلى ركعتين لا يحدث فيهما نفسه', 70)} />
      </section>
      <style>{css}</style>
    </div>
  );
}

/* ———————— الزكاة ———————— */
const NISAB = [
  { i: '🪙', t: 'الفضّة', q: 'خمس أواق' },
  { i: '🐪', t: 'الإبل', q: 'خمس ذود' },
  { i: '🌾', t: 'الزروع والثمار', q: 'خمسة أوسق' },
];
const SPEND = [
  { i: '🤲', t: 'الفقراء' }, { i: '🍞', t: 'المساكين' }, { i: '📒', t: 'العاملين عليها' }, { i: '💞', t: 'المؤلفة قلوبهم' },
  { i: '⛓️', t: 'في الرقاب' }, { i: '⚖️', t: 'الغارمين' }, { i: '🛡️', t: 'في سبيل الله' }, { i: '🧳', t: 'ابن السبيل' },
];

export function ZakatGuide() {
  const [on, setOn] = useState(-1);
  return (
    <div className="f2">
      <section className="f2-card">
        <h2>الزكاة: حقٌّ في المال</h2>
        <svg viewBox="0 0 300 120" width="100%" aria-label="تؤخذ من الأغنياء وتردّ على الفقراء">
          <rect width="300" height="120" rx="14" fill="#14180f" />
          <text x="48" y="58" fontSize="40" textAnchor="middle">🏠</text><text x="48" y="96" fontSize="12" textAnchor="middle" fill="#e8c25a" style={{ fontFamily: 'var(--font-kufi)' }}>الأغنياء</text>
          <text x="252" y="58" fontSize="40" textAnchor="middle">🏡</text><text x="252" y="96" fontSize="12" textAnchor="middle" fill="#e8c25a" style={{ fontFamily: 'var(--font-kufi)' }}>الفقراء</text>
          <path d="M92 52 H208" stroke="#7fe0c0" strokeWidth="3" strokeDasharray="6 6"><animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.4s" repeatCount="indefinite" /></path>
          <path d="M200 44 l10 8 l-10 8" fill="none" stroke="#7fe0c0" strokeWidth="3" />
          <text x="150" y="40" fontSize="22" textAnchor="middle">💰</text>
        </svg>
        <Evidence ev={B(24, '1349', 'افترض عليهم صدقة في أموالهم تؤخذ من أغنيائهم وترد على فقرائهم', 10)} />
      </section>

      <section className="f2-card">
        <h3>النصاب: لا زكاة فيما دون هذا القدر</h3>
        <div className="f2-row">
          {NISAB.map((n) => (
            <div key={n.t} style={{ flex: '1 1 90px', textAlign: 'center', padding: 10, borderRadius: 14, border: '1px solid rgba(232,194,90,.3)', background: 'rgba(232,194,90,.07)' }}>
              <div style={{ fontSize: 32 }}>{n.i}</div>
              <div style={{ color: '#f1d77a', margin: '4px 0' }}>{n.t}</div>
              <div style={{ fontSize: '.85rem', color: '#bff3e1' }}>{n.q}</div>
            </div>
          ))}
        </div>
        <Evidence ev={B(24, '1358', 'ليس فيما دون خمس أواق صدقة وليس فيما دون خمس ذود صدقة وليس فيما دون خمس أوسق صدقة', 10)} />
      </section>

      <section className="f2-card">
        <h3>لمن تُصرف الزكاة؟ ثمانية أصناف</h3>
        <div className="f2-row">
          {SPEND.map((s, k) => (
            <button key={s.t} type="button" className={on === k ? 'f2-chip on' : 'f2-chip'} onClick={() => setOn(on === k ? -1 : k)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 76 }}>
              <span style={{ fontSize: 26 }}>{s.i}</span><span style={{ fontSize: 11.5 }}>{s.t}</span>
            </button>
          ))}
        </div>
        <QEvidence sura={9} from={60} name="التوبة" />
      </section>
      <style>{css}</style>
    </div>
  );
}

/* ———————— الصيام ———————— */
export function SiyamGuide() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setP((x) => (x + 0.01) % 1), 60);
    return () => clearInterval(t);
  }, []);
  const ang = Math.PI * (1 - p);
  const sx = 150 + 120 * Math.cos(ang);
  const sy = 140 - 100 * Math.sin(ang);
  return (
    <div className="f2">
      <section className="f2-card">
        <h2>الصيام: من الفجر إلى الليل</h2>
        <svg viewBox="0 0 300 170" width="100%" aria-label="يوم الصائم من الفجر إلى غروب الشمس">
          <defs><linearGradient id="sy-sky" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2b2f5a" /><stop offset=".3" stopColor="#3a6ea5" /><stop offset=".7" stopColor="#3a6ea5" /><stop offset="1" stopColor="#5a2b3a" /></linearGradient></defs>
          <rect width="300" height="170" rx="14" fill="url(#sy-sky)" />
          <path d="M30 140 A120 100 0 0 1 270 140" fill="none" stroke="rgba(255,241,196,.35)" strokeDasharray="4 6" />
          <circle cx={sx} cy={sy} r="14" fill="#ffd24a" /><circle cx={sx} cy={sy} r="24" fill="#ffd24a" opacity=".25" />
          <rect x="0" y="140" width="300" height="30" fill="#0e0b05" />
          <text x="30" y="160" fontSize="12" fill="#e8c25a" textAnchor="middle" style={{ fontFamily: 'var(--font-kufi)' }}>الفجر</text>
          <text x="270" y="160" fontSize="12" fill="#e8c25a" textAnchor="middle" style={{ fontFamily: 'var(--font-kufi)' }}>الغروب</text>
          <text x="150" y="160" fontSize="12" fill="#7fe0c0" textAnchor="middle" style={{ fontFamily: 'var(--font-kufi)' }}>إمساك عن الطعام والشراب</text>
        </svg>
        <QEvidence sura={2} from={183} name="البقرة" />
        <QEvidence sura={2} from={185} name="البقرة" />
      </section>
      <section className="f2-card">
        <h3>حدّ الصيام في اليوم</h3>
        <QEvidence sura={2} from={187} name="البقرة" />
        <h3 style={{ marginTop: 12 }}>أجر الصائم المحتسب</h3>
        <Evidence ev={B(2, '38', 'من صام رمضان إيمانا واحتسابا غفر له ما تقدم من ذنبه', 10)} />
      </section>
      <style>{css}</style>
    </div>
  );
}

/* ———————— الحج ———————— */
const HAJJ: { i: string; t: string; ev: Ev }[] = [
  { i: '👕', t: 'الإحرام والتلبية', ev: M(15, '2833', 'اغتسلي واستثفري بثوب وأحرمي', 10) },
  { i: '🕋', t: 'طواف القدوم', ev: M(15, '2833', 'استلم الركن فرمل ثلاثا ومشى أربعا', 60) },
  { i: '⛰️', t: 'السعي بين الصفا والمروة', ev: M(15, '2833', 'أبدأ بما بدأ الله به فبدأ بالصفا', 120) },
  { i: '⛺', t: 'يوم التروية: منى', ev: M(15, '2833', 'فلما كان يوم التروية توجهوا إلى منى فأهلوا بالحج', 90) },
  { i: '🏔️', t: 'عرفة', ev: M(15, '2833', 'فلم يزل واقفا حتى غربت الشمس', 90) },
  { i: '🌙', t: 'مزدلفة', ev: M(15, '2833', 'حتى أتى المزدلفة فصلى بها المغرب والعشاء', 90) },
  { i: '🪨', t: 'رمي الجمرة', ev: M(15, '2833', 'فرماها بسبع حصيات يكبر مع كل حصاة', 60) },
  { i: '🐑', t: 'النحر', ev: M(15, '2833', 'ثم انصرف إلى المنحر فنحر', 80) },
  { i: '🕌', t: 'طواف الإفاضة', ev: M(15, '2833', 'ثم ركب رسول الله صلى الله عليه وسلم فأفاض إلى البيت', 60) },
];

export function HajjGuide() {
  const [k, setK] = useState(0);
  const W = 300;
  const pts = HAJJ.map((_, i) => [30 + (i % 3) * 120 * (Math.floor(i / 3) % 2 ? -1 : 1) + (Math.floor(i / 3) % 2 ? 240 : 0), 40 + Math.floor(i / 3) * 70] as [number, number]);
  return (
    <div className="f2">
      <section className="f2-card">
        <h2>مناسك الحج كما حجّ النبي ﷺ</h2>
        <p className="f2-p" style={{ fontSize: '.9rem', opacity: 0.85 }}>المس أي محطة لترى دليلها من حديث جابر في صحيح مسلم.</p>
        <svg viewBox={`0 0 ${W} 230`} width="100%" aria-label="خريطة مناسك الحج">
          <rect width={W} height="230" rx="14" fill="#14120a" />
          <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#e8c25a" strokeOpacity=".4" strokeWidth="3" strokeDasharray="5 6" />
          {pts.map((p, i) => (
            <g key={i} onClick={() => setK(i)} style={{ cursor: 'pointer' }}>
              <circle cx={p[0]} cy={p[1]} r={i === k ? 26 : 22} fill={i === k ? 'rgba(127,224,192,.3)' : 'rgba(232,194,90,.12)'} stroke={i === k ? '#7fe0c0' : '#e8c25a'} strokeWidth="2" />
              <text x={p[0]} y={p[1] + 8} textAnchor="middle" fontSize="22">{HAJJ[i].i}</text>
              <text x={p[0]} y={p[1] - 28} textAnchor="middle" fontSize="10" fill="#e8c25a" style={{ fontFamily: 'var(--font-kufi)' }}>{(i + 1).toLocaleString('ar-EG')}</text>
            </g>
          ))}
        </svg>
        <div className="f2-cap">{(k + 1).toLocaleString('ar-EG')}. {HAJJ[k].t}</div>
        <Evidence ev={HAJJ[k].ev} />
        <div className="f2-row">
          <button type="button" className="f2-chip" onClick={() => setK(Math.max(0, k - 1))}>→ السابقة</button>
          <button type="button" className="f2-chip" onClick={() => setK(Math.min(HAJJ.length - 1, k + 1))}>التالية ←</button>
        </div>
      </section>
      <style>{css}</style>
    </div>
  );
}
