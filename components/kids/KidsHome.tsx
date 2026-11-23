'use client';

import { useState } from 'react';
import { toAr } from '@/components/quran/data';
import { addStars, bump, claim, DAILY_BREAK, streakDays, useKids } from './store';

/** رحلتي: مهام اليوم، وبستان الورود، والأوسمة، وسبحة الصغار. كله على الجهاز بلا منافسة. */
const MISSIONS = [
  { id: 'm1', t: 'أجب ٥ إجابات صحيحة في الألعاب', key: 'plays' as const, goal: 5, reward: 3 },
  { id: 'm2', t: 'سبّح ٣٣ تسبيحة بالسبحة', key: 'tasbih' as const, goal: 33, reward: 3 },
  { id: 'm3', t: 'أجب ١٥ إجابة صحيحة', key: 'plays' as const, goal: 15, reward: 5 },
];
const BADGES = [
  [1, '🌱', 'أول نجمة'], [10, '⭐', 'نجم صغير'], [25, '📖', 'حافظ صغير'], [50, '🌙', 'محب القرآن'],
  [100, '🏅', 'نجم ساطع'], [250, '🏆', 'بطل الذكر'], [500, '👑', 'نور الإيمان'],
] as const;
const LEVELS = [[0, 'بذرة 🌱'], [10, 'برعم 🌿'], [30, 'زهرة 🌷'], [80, 'شجرة 🌳'], [200, 'بستان 🌴'], [500, 'جنة صغيرة ✨']] as const;

export function KidsHome() {
  const k = useKids();
  const lv = [...LEVELS].reverse().find((l) => k.stars >= l[0]) || LEVELS[0];
  const next = LEVELS.find((l) => l[0] > k.stars);
  const flowers = Math.min(48, Math.floor(k.stars / 5));
  const streak = streakDays(k.days);
  return (
    <div className="kh">
      <div className="kh-lv">
        <b>{lv[1]}</b>
        <span>{toAr(k.stars)} نجمة{streak > 0 ? ` • ${toAr(streak)} يوم متتابع 🔥` : ''}</span>
        {next && <small>باقي {toAr(next[0] - k.stars)} نجمة لتصبح «{next[1]}»</small>}
      </div>
      <h3>مهام اليوم</h3>
      {MISSIONS.map((m) => {
        const v = Math.min(k[m.key], m.goal);
        const done = v >= m.goal;
        const got = k.claimed.includes(m.id);
        return (
          <div key={m.id} className={`kh-m${done ? ' ok' : ''}`}>
            <div>
              <b>{m.t}</b>
              <div className="kh-bar"><i style={{ width: `${(v / m.goal) * 100}%` }} /></div>
              <small>{toAr(v)} / {toAr(m.goal)}</small>
            </div>
            <button type="button" disabled={!done || got} onClick={() => claim(m.id, m.reward)}>
              {got ? '✓ استلمتها' : `🎁 +${toAr(m.reward)} ⭐`}
            </button>
          </div>
        );
      })}
      <h3>بستانك</h3>
      <div className="kh-garden">
        {flowers ? Array.from({ length: flowers }, (_, i) => <span key={i}>{['🌷', '🌸', '🌻', '🌼', '🌹'][i % 5]}</span>) : <em>كل ٥ نجوم تُزهر وردة هنا</em>}
      </div>
      <h3>أوسمتك</h3>
      <div className="kh-b">
        {BADGES.map((b) => (
          <div key={b[2]} className={k.stars >= b[0] ? 'on' : ''}>
            <b>{k.stars >= b[0] ? b[1] : '🔒'}</b>
            <span>{b[2]}</span>
            <small>{toAr(b[0])} ⭐</small>
          </div>
        ))}
      </div>
      {k.plays >= DAILY_BREAK && <p className="kh-n">لعبتَ كثيرًا اليوم، خذ راحة وارجع غدًا بإذن الله 🌙</p>}
      <style>{`
        .kh { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 10px; }
        .kh h3 { margin: 8px 2px 0; font-size: 15px; color: #e8c25a; }
        .kh-lv { padding: 16px; border-radius: 20px; border: 1px solid rgba(232,194,90,.4); background: radial-gradient(120% 90% at 50% 0%, rgba(232,194,90,.16), rgba(18,15,8,.85) 70%); text-align: center; display: flex; flex-direction: column; gap: 4px; }
        .kh-lv b { font-size: 28px; color: #f1d77a; }
        .kh-lv span { font-size: 14px; }
        .kh-lv small { font-size: 12px; color: rgba(255,241,196,.6); }
        .kh-m { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.8); }
        .kh-m.ok { border-color: #7fe0c0; }
        .kh-m > div { flex: 1; display: flex; flex-direction: column; gap: 5px; font-size: 14px; }
        .kh-m small { font-size: 11.5px; color: rgba(255,241,196,.6); }
        .kh-bar { height: 8px; border-radius: 8px; background: rgba(232,194,90,.15); overflow: hidden; }
        .kh-bar i { display: block; height: 100%; background: linear-gradient(90deg, #e8c25a, #7fe0c0); }
        .kh-m button { padding: 9px 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.5); background: rgba(232,194,90,.2); color: #f1d77a; font-family: inherit; font-size: 13px; white-space: nowrap; }
        .kh-m button:disabled { opacity: .45; }
        .kh-garden { min-height: 70px; padding: 12px; border-radius: 18px; border: 1px solid rgba(127,224,192,.3); background: rgba(127,224,192,.06); display: flex; flex-wrap: wrap; gap: 4px; font-size: 26px; justify-content: center; }
        .kh-garden em { font-size: 13px; font-style: normal; color: rgba(255,241,196,.6); align-self: center; }
        .kh-b { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .kh-b div { padding: 10px 4px; border-radius: 14px; border: 1px solid rgba(232,194,90,.2); background: rgba(18,15,8,.7); text-align: center; display: flex; flex-direction: column; gap: 2px; opacity: .55; }
        .kh-b div.on { opacity: 1; border-color: rgba(232,194,90,.6); }
        .kh-b b { font-size: 28px; }
        .kh-b span { font-size: 12.5px; }
        .kh-b small { font-size: 10.5px; color: rgba(255,241,196,.55); }
        .kh-n { text-align: center; font-size: 13px; color: #7fe0c0; margin: 0; }
      `}</style>
    </div>
  );
}

/** سبحة الصغار: زر كبير يتدرّج بين التسبيح والتحميد والتكبير، ونجمة عند إتمام كل ذكر. */
const PHASES = [
  { t: 'سُبْحَانَ اللَّهِ', n: 33 },
  { t: 'الْحَمْدُ لِلَّهِ', n: 33 },
  { t: 'اللَّهُ أَكْبَرُ', n: 34 },
];
export function KidsTasbih() {
  const [ph, setPh] = useState(0);
  const [c, setC] = useState(0);
  const [msg, setMsg] = useState('');
  const k = useKids();
  const p = PHASES[ph];
  function tap() {
    try {
      navigator.vibrate?.(15);
    } catch {}
    bump('tasbih');
    const n = c + 1;
    if (n >= p.n) {
      addStars(1);
      setMsg('ما شاء الله! نجمة جديدة ⭐');
      setPh((ph + 1) % PHASES.length);
      setC(0);
      setTimeout(() => setMsg(''), 1800);
    } else setC(n);
  }
  return (
    <div className="kt">
      <div className="kt-s">⭐ {toAr(k.stars)} • سبّحت اليوم {toAr(k.tasbih)}</div>
      <button type="button" className="kt-b" onClick={tap} aria-label="سبّح">
        <span>{p.t}</span>
        <b>{toAr(c)} / {toAr(p.n)}</b>
      </button>
      <div className="kt-m">{msg || 'اضغط الدائرة مع كل تسبيحة 🤍'}</div>
      <style>{`
        .kt { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .kt-s { padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.85); font-size: 14px; color: #f1d77a; }
        .kt-b { width: 230px; height: 230px; border-radius: 50%; border: 4px solid rgba(232,194,90,.6); background: radial-gradient(circle at 50% 30%, rgba(241,215,122,.35), rgba(18,15,8,.9) 70%); color: #fff1c4; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 0 40px rgba(232,194,90,.25); }
        .kt-b:active { transform: scale(.96); }
        .kt-b span { font-family: var(--font-ruqaa), serif; font-size: 34px; }
        .kt-b b { font-size: 22px; color: #f1d77a; }
        .kt-m { min-height: 24px; font-size: 16px; color: #7fe0c0; }
        .kt-n { margin: 0; font-size: 11.5px; color: rgba(255,241,196,.5); text-align: center; }
      `}</style>
    </div>
  );
}
