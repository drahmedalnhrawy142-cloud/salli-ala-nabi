'use client';

import { useEffect, useRef, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { addStars, bump } from './store';

/**
 * ثلاث ألعاب للذكر، لا خسارة قاسية فيها:
 * «فوانيس الذكر»: فوانيس تضيء بالترتيب ويُنطق ذكرها، كرّر الترتيب (ذاكرة).
 * «بالونات النور»: بالونات عليها أذكار تطير، اصطد الذكر المطلوب فقط (تركيز).
 * «بطاقات الأذكار»: اقلب البطاقات وطابق الذكر مع مثله (مطابقة).
 * نصوص الأذكار هنا ألفاظ الأذكار المعروفة المتفق عليها فقط، بلا أي فضائل أو روايات.
 */
const DH = ['سبحان الله', 'الحمد لله', 'لا إله إلا الله', 'الله أكبر', 'أستغفر الله', 'صلى الله عليه وسلم'];
const LAMP = [
  { t: 'سبحان الله', c: '#7fe0c0' },
  { t: 'الحمد لله', c: '#ffd24a' },
  { t: 'لا إله إلا الله', c: '#ff9a7a' },
  { t: 'الله أكبر', c: '#9ab8ff' },
];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Lamps({ onBack }: { onBack: () => void }) {
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'show' | 'you' | 'over'>('idle');
  const [say, setSay] = useState('');
  const [best, setBest] = useState(0);
  const pos = useRef(0);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  async function play(s: number[]) {
    setPhase('show');
    await sleep(600);
    for (const k of s) {
      if (!alive.current) return;
      setLit(k);
      setSay(LAMP[k].t);
      await sleep(650);
      setLit(null);
      await sleep(220);
    }
    pos.current = 0;
    setSay('دورك!');
    setPhase('you');
  }
  function start() {
    bump('plays');
    const s = [Math.floor(Math.random() * 4)];
    setSeq(s);
    play(s);
  }
  async function tap(k: number) {
    if (phase !== 'you') return;
    setLit(k);
    setSay(LAMP[k].t);
    setTimeout(() => setLit(null), 250);
    if (seq[pos.current] !== k) {
      setPhase('over');
      setBest((b) => Math.max(b, seq.length - 1));
      const got = Math.max(0, seq.length - 1);
      if (got > 0) addStars(Math.min(5, Math.ceil(got / 2)));
      return;
    }
    pos.current += 1;
    if (pos.current === seq.length) {
      const s = [...seq, Math.floor(Math.random() * 4)];
      setSeq(s);
      setPhase('show');
      await sleep(500);
      play(s);
    }
  }
  return (
    <div className="kn-box">
      <button type="button" className="kn-back" onClick={onBack}>→ رجوع</button>
      <div className="kn-hud"><span>الطول: {toAr(Math.max(0, seq.length - (phase === 'over' ? 1 : 0)))}</span><span>أفضل: {toAr(best)}</span></div>
      <div className="kn-say">{say || 'احفظ ترتيب الفوانيس'}</div>
      <div className="kn-lamps">
        {LAMP.map((l, k) => (
          <button
            key={k}
            type="button"
            className={lit === k ? 'kn-lamp on' : 'kn-lamp'}
            style={{ ['--c' as string]: l.c }}
            onClick={() => tap(k)}
            disabled={phase !== 'you'}
            aria-label={l.t}
          >
            <i>🏮</i>
            <span>{l.t}</span>
          </button>
        ))}
      </div>
      {(phase === 'idle' || phase === 'over') && (
        <button type="button" className="kn-go" onClick={start}>
          {phase === 'over' ? `انتهت — ${toAr(Math.max(0, seq.length - 1))} · العب مرة أخرى` : 'ابدأ'}
        </button>
      )}
    </div>
  );
}

type Bal = { id: number; x: number; y: number; v: number; k: number; c: string };
const BC = ['#7fe0c0', '#ffd24a', '#ff9a7a', '#9ab8ff', '#e6a8ff', '#ffb3c7'];

function Balloons({ onBack }: { onBack: () => void }) {
  const [run, setRun] = useState<'idle' | 'run' | 'over'>('idle');
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(45);
  const [bals, setBals] = useState<Bal[]>([]);
  const g = useRef({ id: 0, next: 0, t0: 0, last: 0, raf: 0, b: [] as Bal[], score: 0, target: 0, tchg: 0 });

  function start() {
    bump('plays');
    cancelAnimationFrame(g.current.raf);
    const t = Math.floor(Math.random() * 4);
    g.current = { id: 0, next: 0, t0: performance.now(), last: performance.now(), raf: 0, b: [], score: 0, target: t, tchg: performance.now() };
    setTarget(t); setScore(0); setLeft(45); setBals([]); setRun('run');
    const loop = (now: number) => {
      const s = g.current;
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      const el = (now - s.t0) / 1000;
      if (el >= 45) {
        setRun('over');
        if (s.score > 0) addStars(Math.min(6, Math.ceil(s.score / 4)));
        return;
      }
      if (now - s.tchg > 9000) {
        s.tchg = now;
        s.target = (s.target + 1 + Math.floor(Math.random() * 3)) % 4;
        setTarget(s.target);
      }
      if (now > s.next) {
        s.next = now + 650;
        const k = Math.random() < 0.4 ? s.target : Math.floor(Math.random() * 4);
        s.b.push({ id: ++s.id, x: 30 + Math.random() * 240, y: 430, v: 55 + Math.random() * 45, k, c: BC[Math.floor(Math.random() * BC.length)] });
      }
      s.b = s.b.map((b) => ({ ...b, y: b.y - b.v * dt })).filter((b) => b.y > -50);
      setBals(s.b.slice());
      setLeft(Math.max(0, Math.ceil(45 - el)));
      s.raf = requestAnimationFrame(loop);
    };
    g.current.raf = requestAnimationFrame(loop);
  }
  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);
  function pop(b: Bal) {
    const s = g.current;
    s.b = s.b.filter((x) => x.id !== b.id);
    if (b.k === s.target) { s.score += 1; setScore(s.score); }
    else { s.score = Math.max(0, s.score - 1); setScore(s.score); }
  }
  return (
    <div className="kn-box">
      <button type="button" className="kn-back" onClick={() => { cancelAnimationFrame(g.current.raf); onBack(); }}>→ رجوع</button>
      <div className="kn-hud"><span>النقاط: {toAr(score)}</span><span>⏱ {toAr(left)}</span></div>
      <div className="kn-say">اصطد: <b style={{ color: '#ffd24a' }}>{LAMP[target].t}</b></div>
      <div className="kn-sky">
        {bals.map((b) => (
          <button key={b.id} type="button" className="kn-bal" style={{ left: b.x - 36, top: b.y, background: b.c }} onPointerDown={() => pop(b)}>
            {LAMP[b.k].t}
          </button>
        ))}
        {run !== 'run' && (
          <div className="kn-ov">
            <h3>{run === 'over' ? `جمعت ${toAr(score)} بالونة` : 'بالونات النور'}</h3>
            <p>اللمس على الذكر المطلوب فقط، وبالون غيره ينقص نقطة. المطلوب يتغير كل قليل.</p>
            <button type="button" onClick={start}>{run === 'over' ? 'مرة أخرى' : 'ابدأ'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Cards({ onBack }: { onBack: () => void }) {
  const mk = () => {
    const a = [...DH].sort(() => Math.random() - 0.5).slice(0, 6);
    return [...a, ...a].sort(() => Math.random() - 0.5);
  };
  const [deck, setDeck] = useState<string[]>(mk);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const lock = useRef(false);
  const won = done.length === deck.length;
  function flip(i: number) {
    if (lock.current || open.includes(i) || done.includes(i)) return;
    const o = [...open, i];
    setOpen(o);
    if (o.length === 2) {
      lock.current = true;
      setMoves((m) => m + 1);
      setTimeout(() => {
        if (deck[o[0]] === deck[o[1]]) {
          const d = [...done, ...o];
          setDone(d);
          if (d.length === deck.length) { bump('plays'); addStars(3); }
        }
        setOpen([]);
        lock.current = false;
      }, 750);
    }
  }
  function again() { setDeck(mk()); setOpen([]); setDone([]); setMoves(0); }
  return (
    <div className="kn-box">
      <button type="button" className="kn-back" onClick={onBack}>→ رجوع</button>
      <div className="kn-hud"><span>المحاولات: {toAr(moves)}</span><span>{toAr(done.length / 2)} / {toAr(deck.length / 2)}</span></div>
      <div className="kn-cards">
        {deck.map((t, i) => {
          const f = open.includes(i) || done.includes(i);
          return (
            <button key={i} type="button" className={f ? (done.includes(i) ? 'kn-c up ok' : 'kn-c up') : 'kn-c'} onClick={() => flip(i)}>
              {f ? t : '✦'}
            </button>
          );
        })}
      </div>
      {won && <button type="button" className="kn-go" onClick={again}>أحسنت! في {toAr(moves)} محاولة · العب مرة أخرى</button>}
    </div>
  );
}

export function KidsNoor() {
  const [m, setM] = useState<'menu' | 'lamps' | 'bal' | 'cards'>('menu');
  return (
    <div className="kn">
      {m === 'menu' && (
        <div className="kn-menu">
          <button type="button" onClick={() => setM('lamps')}><b>🏮</b><span>فوانيس الذكر</span><small>كرّر ترتيب الفوانيس</small></button>
          <button type="button" onClick={() => setM('bal')}><b>🎈</b><span>بالونات النور</span><small>اصطد الذكر المطلوب</small></button>
          <button type="button" onClick={() => setM('cards')}><b>🃏</b><span>بطاقات الأذكار</span><small>طابق كل ذكر مع مثله</small></button>
        </div>
      )}
      {m === 'lamps' && <Lamps onBack={() => setM('menu')} />}
      {m === 'bal' && <Balloons onBack={() => setM('menu')} />}
      {m === 'cards' && <Cards onBack={() => setM('menu')} />}
      <style>{`
        .kn { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; align-items: center; }
        .kn-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
        .kn-menu button { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 18px 8px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); color: #fff1c4; font-family: inherit; font-size: 14px; }
        .kn-menu b { font-size: 34px; } .kn-menu small { color: #7fe0c0; font-size: 11.5px; }
        .kn-box { display: flex; flex-direction: column; gap: 10px; align-items: center; width: 100%; }
        .kn-back { align-self: flex-start; background: none; border: 0; color: #e8c25a; font-family: inherit; font-size: 14px; }
        .kn-hud { display: flex; justify-content: space-between; width: 300px; max-width: 100%; font-size: 15px; color: #f1d77a; }
        .kn-say { min-height: 30px; font-size: 20px; color: #fff1c4; text-align: center; }
        .kn-lamps { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 300px; max-width: 100%; }
        .kn-lamp { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 6px; border-radius: 18px; border: 2px solid var(--c); background: rgba(18,15,8,.85); color: #fff1c4; font-family: inherit; font-size: 14px; opacity: .55; transition: .15s; }
        .kn-lamp i { font-style: normal; font-size: 44px; filter: grayscale(.8); }
        .kn-lamp.on { opacity: 1; background: color-mix(in srgb, var(--c) 35%, #120f08); box-shadow: 0 0 26px var(--c); transform: scale(1.06); }
        .kn-lamp.on i { filter: none; }
        .kn-lamp:not(:disabled) { opacity: .9; }
        .kn-go, .kn-ov button { padding: 11px 24px; border-radius: 14px; border: 1px solid #e8c25a; background: rgba(232,194,90,.25); color: #f1d77a; font-family: inherit; font-size: 16px; }
        .kn-sky { position: relative; overflow: hidden; width: 300px; height: 400px; border-radius: 18px; border: 1px solid rgba(232,194,90,.4); background: radial-gradient(ellipse at 50% 100%, #1b2748, #070b18 75%); touch-action: manipulation; user-select: none; }
        .kn-bal { position: absolute; width: 72px; height: 84px; border-radius: 50% 50% 48% 48%; border: 0; color: #1a1408; font-family: inherit; font-size: 12.5px; font-weight: 700; line-height: 1.3; padding: 6px; box-shadow: inset -6px -8px 14px rgba(0,0,0,.18); }
        .kn-ov { position: absolute; inset: 0; background: rgba(5,8,20,.82); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center; z-index: 5; }
        .kn-ov h3 { margin: 0; color: #f1d77a; font-size: 19px; } .kn-ov p { margin: 0; font-size: 14px; line-height: 1.9; }
        .kn-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 320px; max-width: 100%; }
        .kn-c { height: 74px; border-radius: 14px; border: 1px solid rgba(232,194,90,.35); background: linear-gradient(145deg, #2a2210, #120f08); color: #e8c25a; font-family: inherit; font-size: 24px; padding: 4px; }
        .kn-c.up { background: #1e2a22; color: #fff1c4; font-size: 14px; line-height: 1.4; border-color: #7fe0c0; }
        .kn-c.ok { background: #23361f; border-color: #ffd24a; }
      `}</style>
    </div>
  );
}
