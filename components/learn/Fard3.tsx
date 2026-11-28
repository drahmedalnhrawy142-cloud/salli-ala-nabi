'use client';

import { useState } from 'react';
import { Evidence, type Ev } from './Evidence';

/**
 * «أركان الدين» (حديث جبريل وحديث بُني الإسلام) و«الغسل» (حديث ميمونة).
 * الرسوم أصلية، والأدلة مقتبسة من نصوص الصحيحين في التطبيق.
 */
const B = (file: number, num: string, phrase: string, len = 60): Ev => ({ coll: 'bukhari', file, num, phrase, len });
const M = (file: number, num: string, phrase: string, len = 60): Ev => ({ coll: 'muslim', file, num, phrase, len });
const css = `
  .f3 { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 14px; }
  .f3-card { padding: 12px; border-radius: 18px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); }
  .f3-card h2, .f3-card h3 { margin: 0 0 8px; color: #f1d77a; font-family: var(--font-ruqaa), serif; font-size: 1.15rem; }
  .f3-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin: 8px 0; }
  .f3-chip { padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; font-family: inherit; font-size: 13px; }
  .f3-chip.on { background: rgba(232,194,90,.25); color: #fff1c4; border-color: #e8c25a; }
  .f3-cap { text-align: center; min-height: 26px; color: #7fe0c0; font-size: 1.02rem; margin: 4px 0; }
`;

const PILLARS = [
  { i: '☝️', t: 'الشهادتان' }, { i: '🕌', t: 'الصلاة' }, { i: '💰', t: 'الزكاة' }, { i: '🌙', t: 'الصوم' }, { i: '🕋', t: 'الحج' },
];
const IMAN = [
  { i: '✨', t: 'الإيمان بالله' }, { i: '👼', t: 'الملائكة' }, { i: '📖', t: 'الكتب' }, { i: '📜', t: 'الرسل' }, { i: '⏳', t: 'اليوم الآخر' }, { i: '⚖️', t: 'القدر خيره وشره' },
];

export function DinGuide() {
  const [lv, setLv] = useState<'islam' | 'iman' | 'ihsan'>('islam');
  const [p, setP] = useState(0);
  return (
    <div className="f3">
      <section className="f3-card">
        <h2>أركان الدين: الإسلام والإيمان والإحسان</h2>
        <div className="f3-row">
          <button type="button" className={lv === 'islam' ? 'f3-chip on' : 'f3-chip'} onClick={() => setLv('islam')}>🏠 الإسلام</button>
          <button type="button" className={lv === 'iman' ? 'f3-chip on' : 'f3-chip'} onClick={() => setLv('iman')}>💫 الإيمان</button>
          <button type="button" className={lv === 'ihsan' ? 'f3-chip on' : 'f3-chip'} onClick={() => setLv('ihsan')}>🌟 الإحسان</button>
        </div>

        {lv === 'islam' && (
          <>
            <svg viewBox="0 0 300 200" width="100%" aria-label="بيت الإسلام على خمسة أركان">
              <rect width="300" height="200" rx="14" fill="#13110a" />
              <path d="M30 70 L150 20 L270 70 Z" fill="rgba(232,194,90,.25)" stroke="#e8c25a" strokeWidth="3" />
              <text x="150" y="58" textAnchor="middle" fontSize="16" fill="#f1d77a" style={{ fontFamily: 'var(--font-ruqaa)' }}>الإسلام</text>
              {PILLARS.map((x, i) => (
                <g key={i} onClick={() => setP(i)} style={{ cursor: 'pointer' }}>
                  <rect x={40 + i * 46} y="78" width="34" height="90" rx="6" fill={i === p ? 'rgba(127,224,192,.35)' : 'rgba(255,241,196,.1)'} stroke={i === p ? '#7fe0c0' : '#e8c25a'} strokeWidth="2" />
                  <text x={57 + i * 46} y="110" textAnchor="middle" fontSize="22">{x.i}</text>
                  <text x={57 + i * 46} y="150" textAnchor="middle" fontSize="9.5" fill="#fff1c4" style={{ fontFamily: 'var(--font-kufi)' }}>{x.t}</text>
                </g>
              ))}
              <rect x="30" y="168" width="240" height="12" rx="3" fill="#6d2330" />
            </svg>
            <div className="f3-cap">{PILLARS[p].i} {PILLARS[p].t}</div>
            <Evidence ev={B(2, '8', 'بني الإسلام على خمس شهادة أن لا إله إلا الله وأن محمدا رسول الله وإقام الصلاة وإيتاء الزكاة والحج وصوم رمضان', 10)} />
            <Evidence ev={B(2, '50', 'قال ما الإسلام قال الإسلام أن تعبد الله ولا تشرك به', 120)} />
          </>
        )}

        {lv === 'iman' && (
          <>
            <svg viewBox="0 0 300 230" width="100%" aria-label="أركان الإيمان الستة">
              <rect width="300" height="230" rx="14" fill="#10131c" />
              <circle cx="150" cy="115" r="30" fill="rgba(232,194,90,.18)" stroke="#e8c25a" strokeWidth="2" />
              <text x="150" y="121" textAnchor="middle" fontSize="15" fill="#f1d77a" style={{ fontFamily: 'var(--font-ruqaa)' }}>الإيمان</text>
              {IMAN.map((x, i) => {
                const a = (-90 + i * 60) * (Math.PI / 180);
                const cx = 150 + 80 * Math.cos(a), cy = 115 + 80 * Math.sin(a);
                return (
                  <g key={i}>
                    <line x1="150" y1="115" x2={cx} y2={cy} stroke="#e8c25a" strokeOpacity=".3" />
                    <circle cx={cx} cy={cy} r="27" fill="rgba(127,224,192,.14)" stroke="#7fe0c0" strokeWidth="1.6" />
                    <text x={cx} y={cy - 2} textAnchor="middle" fontSize="18">{x.i}</text>
                    <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="#fff1c4" style={{ fontFamily: 'var(--font-kufi)' }}>{x.t}</text>
                  </g>
                );
              })}
            </svg>
            <Evidence ev={M(1, '1', 'أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر وتؤمن بالقدر خيره وشره', 20)} />
          </>
        )}

        {lv === 'ihsan' && (
          <>
            <svg viewBox="0 0 300 150" width="100%" aria-label="الإحسان">
              <defs><radialGradient id="ih-g"><stop offset="0" stopColor="#ffd24a" stopOpacity=".6" /><stop offset="1" stopColor="#ffd24a" stopOpacity="0" /></radialGradient></defs>
              <rect width="300" height="150" rx="14" fill="#0c0e18" />
              <circle cx="150" cy="75" r="62" fill="url(#ih-g)"><animate attributeName="r" values="52;66;52" dur="4s" repeatCount="indefinite" /></circle>
              <text x="150" y="86" textAnchor="middle" fontSize="40">🌟</text>
            </svg>
            <Evidence ev={B(2, '50', 'قال ما الإحسان قال أن تعبد الله كأنك تراه فإن لم تكن تراه فإنه يراك', 10)} />
          </>
        )}
        <Evidence ev={B(2, '50', 'هذا جبريل جاء يعلم الناس دينهم', 10)} />
      </section>
      <style>{css}</style>
    </div>
  );
}

const GHUSL = [
  { i: '🤲', t: 'غسل اليدين', ev: B(5, '257', 'فغسل يديه مرتين أو ثلاثا', 30) },
  { i: '💧', t: 'غسل الفرج وما أصابه', ev: B(5, '280', 'فغسل فرجه وما أصابه', 20) },
  { i: '🧱', t: 'مسح اليد بالأرض أو الحائط', ev: B(5, '280', 'ثم مسح بيده على الحائط أو الأرض', 20) },
  { i: '🚿', t: 'الوضوء للصلاة', ev: B(5, '280', 'ثم توضأ وضوءه للصلاة غير رجليه', 20) },
  { i: '🌊', t: 'إفاضة الماء على الجسد', ev: B(5, '280', 'ثم أفاض على جسده الماء', 20) },
  { i: '🦶', t: 'التنحي وغسل القدمين', ev: B(5, '280', 'ثم تنحى فغسل قدميه', 20) },
];

export function GhuslGuide() {
  const [k, setK] = useState(0);
  return (
    <div className="f3">
      <section className="f3-card">
        <h2>الغسل من الجنابة</h2>
        <svg viewBox="0 0 300 90" width="100%" aria-label="مراحل الغسل">
          <rect width="300" height="90" rx="14" fill="#0e1822" />
          <line x1="30" y1="45" x2="270" y2="45" stroke="#e8c25a" strokeOpacity=".4" strokeWidth="3" strokeDasharray="5 6" />
          {GHUSL.map((g, i) => (
            <g key={i} onClick={() => setK(i)} style={{ cursor: 'pointer' }}>
              <circle cx={30 + i * 48} cy="45" r={i === k ? 20 : 16} fill={i === k ? 'rgba(127,224,192,.3)' : 'rgba(232,194,90,.12)'} stroke={i === k ? '#7fe0c0' : '#e8c25a'} strokeWidth="2" />
              <text x={30 + i * 48} y="52" textAnchor="middle" fontSize="18">{g.i}</text>
            </g>
          ))}
        </svg>
        <div className="f3-cap">{(k + 1).toLocaleString('ar-EG')}. {GHUSL[k].t}</div>
        <Evidence ev={GHUSL[k].ev} />
        <div className="f3-row">
          <button type="button" className="f3-chip" onClick={() => setK(Math.max(0, k - 1))}>→ السابقة</button>
          <button type="button" className="f3-chip" onClick={() => setK(Math.min(GHUSL.length - 1, k + 1))}>التالية ←</button>
        </div>
        <h3 style={{ marginTop: 10 }}>الغسل كاملًا في حديث ميمونة</h3>
        <Evidence ev={B(5, '257', 'وضعت للنبي صلى الله عليه وسلم ماء للغسل فغسل يديه مرتين أو ثلاثا', 330)} />
      </section>
      <style>{css}</style>
    </div>
  );
}
