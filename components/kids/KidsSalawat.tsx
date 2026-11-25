'use client';

import { useEffect, useRef, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { addStars, bump } from './store';

/**
 * لعبتان للذكر والصلاة على النبي ﷺ:
 * «نجوم الصلاة على النبي» نجوم تتساقط، وكل نجمة تلمسها صلاة على النبي ﷺ.
 * «دائرة النور» حلقة تضيق، المسها لحظة تلتقي بالدائرة الذهبية فيُنطق الذكر وتتوالى الأذكار.
 * لا خسارة في أيٍّ منهما: الهدف تعويد اللسان على الذكر بلعب هادئ.
 */
const SAL = ['صلى الله عليه وسلم', 'اللهم صلِّ وسلّم على نبينا محمد', 'عليه الصلاة والسلام', 'اللهم صلِّ على محمد'];
const RING = ['سبحان الله', 'الحمد لله', 'لا إله إلا الله', 'الله أكبر', 'صلى الله عليه وسلم', 'أستغفر الله', 'لا حول ولا قوة إلا بالله'];
const W = 300;
const H = 400;

type Star = { id: number; x: number; y: number; v: number; gold: boolean; s: number };
type Pop = { id: number; x: number; y: number; t: string };

function Stars({ onBack }: { onBack: () => void }) {
  const [run, setRun] = useState<'idle' | 'run' | 'over'>('idle');
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(60);
  const [stars, setStars] = useState<Star[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const g = useRef({ id: 0, next: 0, t0: 0, last: 0, raf: 0, stars: [] as Star[], score: 0 });

  function start() {
    cancelAnimationFrame(g.current.raf);
    g.current = { id: 0, next: 0, t0: performance.now(), last: performance.now(), raf: 0, stars: [], score: 0 };
    setScore(0);
    setLeft(60);
    setStars([]);
    setPops([]);
    setRun('run');
    bump('plays');
    const tick = (now: number) => {
      const s = g.current;
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      const el = (now - s.t0) / 1000;
      if (el >= 60) {
        const reward = Math.min(5, Math.floor(s.score / 8));
        if (reward) addStars(reward);
        setLeft(0);
        setRun('over');
        return;
      }
      setLeft(Math.ceil(60 - el));
      s.next -= dt;
      if (s.next <= 0) {
        s.next = Math.max(0.5, 1.0 - el / 140);
        const gold = Math.random() < 0.12;
        s.stars.push({ id: ++s.id, x: 20 + Math.random() * (W - 56), y: -34, v: 42 + Math.random() * 38 + el * 0.5, gold, s: gold ? 40 : 30 + Math.random() * 8 });
      }
      s.stars.forEach((q) => (q.y += q.v * dt));
      s.stars = s.stars.filter((q) => q.y < H + 10);
      setStars([...s.stars]);
      s.raf = requestAnimationFrame(tick);
    };
    g.current.raf = requestAnimationFrame(tick);
  }
  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);

  function tap(q: Star) {
    const s = g.current;
    if (!s.stars.find((x) => x.id === q.id)) return;
    s.stars = s.stars.filter((x) => x.id !== q.id);
    s.score += q.gold ? 3 : 1;
    setScore(s.score);
    const id = ++s.id;
    setPops((p) => [...p.slice(-5), { id, x: q.x, y: q.y, t: q.gold ? 'اللهم صلِّ وسلّم على نبينا محمد ✨' : SAL[id % SAL.length] }]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1100);
  }

  return (
    <div className="ks-box">
      <button type="button" className="ks-back" onClick={onBack}>← الألعاب</button>
      <div className="ks-hud"><span>⭐ {toAr(score)}</span><span>⏱ {toAr(left)}</span></div>
      <div className="ks-sky" style={{ width: W, height: H }}>
        {stars.map((q) => (
          <button key={q.id} type="button" className={`ks-star${q.gold ? ' gold' : ''}`} style={{ left: q.x, top: q.y, width: q.s, height: q.s, fontSize: q.s }} onPointerDown={() => tap(q)} aria-label="نجمة">
            {q.gold ? 'ﷺ' : '★'}
          </button>
        ))}
        {pops.map((p) => (
          <span key={p.id} className="ks-pop" style={{ left: Math.max(4, Math.min(W - 150, p.x - 40)), top: p.y }}>{p.t}</span>
        ))}
        {run !== 'run' && (
          <div className="ks-ov">
            {run === 'idle' ? (
              <>
                <h3>نجوم الصلاة على النبي ﷺ</h3>
                <p>المس كل نجمة تسقط وقل: صلى الله عليه وسلم.<br />النجمة الذهبية بثلاث نجوم!</p>
              </>
            ) : (
              <>
                <h3>بارك الله فيك 🌟</h3>
                <p>صلّيتَ على النبي ﷺ {toAr(score)} نجمة{score >= 8 ? ` وربحتَ ${toAr(Math.min(5, Math.floor(score / 8)))} نجوم` : ''}</p>
              </>
            )}
            <button type="button" onClick={start}>{run === 'idle' ? 'ابدأ' : 'العب مرة أخرى'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Ring({ onBack }: { onBack: () => void }) {
  const [run, setRun] = useState<'idle' | 'run' | 'over'>('idle');
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [r, setR] = useState(150);
  const [say, setSay] = useState('');
  const [bad, setBad] = useState(false);
  const g = useRef({ t0: 0, raf: 0, hits: 0, tries: 0, cool: 0 });
  const GOAL = 12;
  const TARGET = 56;
  const DUR = 1.9;

  function start() {
    cancelAnimationFrame(g.current.raf);
    g.current = { t0: performance.now(), raf: 0, hits: 0, tries: 0, cool: 0 };
    setHits(0);
    setTries(0);
    setSay('');
    setRun('run');
    bump('plays');
    const tick = (now: number) => {
      const ph = ((now - g.current.t0) / 1000 / DUR) % 1;
      setR(150 - (150 - TARGET + 16) * ph);
      g.current.raf = requestAnimationFrame(tick);
    };
    g.current.raf = requestAnimationFrame(tick);
  }
  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);

  function tap() {
    if (run !== 'run') return;
    const s = g.current;
    const now = performance.now();
    if (now - s.cool < 250) return;
    s.cool = now;
    const ph = ((now - s.t0) / 1000 / DUR) % 1;
    const rr = 150 - (150 - TARGET + 16) * ph;
    s.tries++;
    setTries(s.tries);
    if (Math.abs(rr - TARGET) <= 15) {
      setBad(false);
      setSay(RING[s.hits % RING.length]);
      s.hits++;
      setHits(s.hits);
      if (s.hits >= GOAL) {
        cancelAnimationFrame(s.raf);
        const acc = s.hits / s.tries;
        addStars(acc > 0.8 ? 5 : acc > 0.6 ? 4 : acc > 0.4 ? 3 : 2);
        setRun('over');
      }
    } else {
      setBad(true);
      setSay(rr > TARGET ? 'بدري شوية… انتظر' : 'فاتتك… الحقها في الدورة القادمة');
    }
  }

  return (
    <div className="ks-box">
      <button type="button" className="ks-back" onClick={onBack}>← الألعاب</button>
      <div className="ks-hud"><span>🕯️ {toAr(hits)} / {toAr(GOAL)}</span><span>محاولات {toAr(tries)}</span></div>
      <div className="ks-ringbox" style={{ width: W, height: 320 }} onPointerDown={tap}>
        <div className="ks-tg" style={{ width: TARGET * 2, height: TARGET * 2 }} />
        {run === 'run' && <div className={`ks-rg${bad ? ' bad' : ''}`} style={{ width: r * 2, height: r * 2 }} />}
        <div className="ks-say">{run === 'run' ? say || 'المس الشاشة عندما تلتقي الحلقة بالدائرة' : ''}</div>
        {run !== 'run' && (
          <div className="ks-ov">
            {run === 'idle' ? (
              <>
                <h3>دائرة النور</h3>
                <p>حلقة نورانية تضيق، المس الشاشة لحظة تلتقي بالدائرة الذهبية فتنطق ذكرًا. أتمم {toAr(GOAL)} ذكرًا.</p>
              </>
            ) : (
              <>
                <h3>ما شاء الله ✨</h3>
                <p>أتممتَ {toAr(GOAL)} ذكرًا في {toAr(tries)} محاولة</p>
              </>
            )}
            <button type="button" onClick={start}>{run === 'idle' ? 'ابدأ' : 'مرة أخرى'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function KidsSalawat() {
  const [m, setM] = useState<'menu' | 'stars' | 'ring'>('menu');
  return (
    <div className="ks">
      {m === 'menu' && (
        <div className="ks-menu">
          <button type="button" onClick={() => setM('stars')}>
            <b>🌟</b>
            <span>نجوم الصلاة على النبي ﷺ</span>
            <small>المس النجوم وصلِّ عليه</small>
          </button>
          <button type="button" onClick={() => setM('ring')}>
            <b>🕯️</b>
            <span>دائرة النور</span>
            <small>اضغط في اللحظة المناسبة</small>
          </button>
        </div>
      )}
      {m === 'stars' && <Stars onBack={() => setM('menu')} />}
      {m === 'ring' && <Ring onBack={() => setM('menu')} />}
      <style>{`
        .ks { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; align-items: center; }
        .ks-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
        .ks-menu button { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 18px 8px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); color: #fff1c4; font-family: inherit; font-size: 14.5px; }
        .ks-menu b { font-size: 34px; } .ks-menu small { color: #7fe0c0; font-size: 11.5px; }
        .ks-box { display: flex; flex-direction: column; gap: 10px; align-items: center; width: 100%; }
        .ks-back { align-self: flex-start; background: none; border: 0; color: #e8c25a; font-family: inherit; font-size: 14px; }
        .ks-hud { display: flex; justify-content: space-between; width: 300px; font-size: 15px; color: #f1d77a; }
        .ks-sky { position: relative; overflow: hidden; border-radius: 18px; border: 1px solid rgba(232,194,90,.4); background: radial-gradient(ellipse at 50% 100%, #1b2748, #070b18 75%); touch-action: manipulation; user-select: none; }
        .ks-star { position: absolute; border: 0; background: none; padding: 0; color: #ffe27a; line-height: 1; text-shadow: 0 0 10px rgba(255,226,122,.9); transform: translateY(-50%); }
        .ks-star.gold { color: #fff; text-shadow: 0 0 14px #ffd24a, 0 0 28px #ffb300; background: radial-gradient(circle, rgba(255,210,74,.55), transparent 70%); border-radius: 50%; }
        .ks-pop { position: absolute; width: 150px; text-align: center; font-size: 13px; color: #fff1c4; text-shadow: 0 1px 6px #000; animation: ks-up 1.1s ease-out forwards; pointer-events: none; }
        @keyframes ks-up { from { opacity: 1; transform: translateY(0) } to { opacity: 0; transform: translateY(-46px) } }
        .ks-ov { position: absolute; inset: 0; background: rgba(5,8,20,.82); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center; z-index: 5; }
        .ks-ov h3 { margin: 0; color: #f1d77a; font-size: 19px; } .ks-ov p { margin: 0; font-size: 14px; line-height: 1.9; }
        .ks-ov button { padding: 11px 28px; border-radius: 14px; border: 1px solid #e8c25a; background: rgba(232,194,90,.25); color: #f1d77a; font-family: inherit; font-size: 16px; }
        .ks-ringbox { position: relative; overflow: hidden; border-radius: 18px; border: 1px solid rgba(232,194,90,.4); background: radial-gradient(circle at 50% 46%, #1d2a18, #070b08 75%); touch-action: manipulation; user-select: none; }
        .ks-tg { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%); border-radius: 50%; border: 3px solid #e8c25a; box-shadow: 0 0 18px rgba(232,194,90,.6), inset 0 0 18px rgba(232,194,90,.25); }
        .ks-rg { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%); border-radius: 50%; border: 4px solid #7fe0c0; box-shadow: 0 0 14px rgba(127,224,192,.7); }
        .ks-rg.bad { border-color: #ff9a7a; box-shadow: 0 0 14px rgba(255,154,122,.7); }
        .ks-say { position: absolute; left: 0; right: 0; bottom: 18px; text-align: center; font-size: 20px; color: #fff1c4; text-shadow: 0 1px 8px #000; padding: 0 12px; min-height: 30px; }
      `}</style>
    </div>
  );
}
