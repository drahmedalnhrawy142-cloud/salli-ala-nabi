'use client';

import { useEffect, useRef, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { addStars, bump } from './store';

/**
 * ثلاث ألعاب أخرى للذكر والصلاة على النبي ﷺ:
 * «بيانو الذكر»: مفاتيح عليها أذكار تنزل، المسها قبل أن تصل للأسفل (إيقاع).
 * «قافلة الذكر»: حرّك القافلة بين ثلاثة مسارات والتقط الذكر المطلوب (حركة وتركيز).
 * «ارسم بنجوم الصلاة»: وصّل النجوم بالترتيب فيظهر رسم مسجد وهلال ونجمة (هدوء وترتيب).
 * الألفاظ هنا أذكار معروفة متفق عليها فقط، بلا فضائل ولا روايات.
 */
const W = 300;
const H = 400;
const DH = [
  { t: 'سبحان الله', c: '#7fe0c0' },
  { t: 'الحمد لله', c: '#ffd24a' },
  { t: 'لا إله إلا الله', c: '#ff9a7a' },
  { t: 'الله أكبر', c: '#9ab8ff' },
];
type Item = { id: number; lane: number; y: number; v: number; k: number };

function Piano({ onBack }: { onBack: () => void }) {
  const [run, setRun] = useState<'idle' | 'run' | 'over'>('idle');
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(40);
  const [tiles, setTiles] = useState<Item[]>([]);
  const [flash, setFlash] = useState('');
  const g = useRef({ id: 0, next: 0, t0: 0, last: 0, raf: 0, t: [] as Item[], score: 0 });
  function start() {
    bump('plays');
    cancelAnimationFrame(g.current.raf);
    const n = performance.now();
    g.current = { id: 0, next: 0, t0: n, last: n, raf: 0, t: [], score: 0 };
    setScore(0); setLeft(40); setTiles([]); setFlash(''); setRun('run');
    const loop = (now: number) => {
      const s = g.current;
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      const el = (now - s.t0) / 1000;
      if (el >= 40) {
        setRun('over');
        if (s.score > 0) addStars(Math.min(6, Math.ceil(s.score / 5)));
        return;
      }
      if (now > s.next) {
        s.next = now + Math.max(420, 760 - el * 8);
        s.t.push({ id: ++s.id, lane: Math.floor(Math.random() * 4), y: -60, v: 120 + el * 3, k: Math.floor(Math.random() * 4) });
      }
      s.t = s.t.map((x) => ({ ...x, y: x.y + x.v * dt })).filter((x) => x.y < H + 10);
      setTiles(s.t.slice());
      setLeft(Math.max(0, Math.ceil(40 - el)));
      s.raf = requestAnimationFrame(loop);
    };
    g.current.raf = requestAnimationFrame(loop);
  }
  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);
  function hit(x: Item) {
    const s = g.current;
    s.t = s.t.filter((y) => y.id !== x.id);
    s.score += 1;
    setScore(s.score);
    setFlash(DH[x.k].t);
  }
  return (
    <div className="kn-box">
      <button type="button" className="kn-back" onClick={() => { cancelAnimationFrame(g.current.raf); onBack(); }}>→ رجوع</button>
      <div className="kn-hud"><span>النقاط: {toAr(score)}</span><span>⏱ {toAr(left)}</span></div>
      <div className="kn-say">{flash || 'المس المفاتيح قبل أن تسقط'}</div>
      <div className="kn-sky" style={{ width: W, height: H }}>
        {[1, 2, 3].map((i) => <i key={i} className="kn-gl" style={{ left: (W / 4) * i }} />)}
        {tiles.map((x) => (
          <button key={x.id} type="button" className="kn-tile" style={{ left: x.lane * (W / 4) + 3, top: x.y, background: DH[x.k].c }} onPointerDown={() => hit(x)}>
            {DH[x.k].t}
          </button>
        ))}
        {run !== 'run' && (
          <div className="kn-ov">
            <h3>{run === 'over' ? `لمست ${toAr(score)} مفتاحًا` : 'بيانو الذكر'}</h3>
            <p>كل مفتاح عليه ذكر. المسه وهو ينزل، ويزداد السرعة شيئًا فشيئًا.</p>
            <button type="button" onClick={start}>{run === 'over' ? 'مرة أخرى' : 'ابدأ'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Caravan({ onBack }: { onBack: () => void }) {
  const [run, setRun] = useState<'idle' | 'run' | 'over'>('idle');
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(40);
  const [lane, setLane] = useState(1);
  const [target, setTarget] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const g = useRef({ id: 0, next: 0, t0: 0, last: 0, raf: 0, it: [] as Item[], score: 0, lane: 1, target: 0, tchg: 0 });
  function start() {
    bump('plays');
    cancelAnimationFrame(g.current.raf);
    const n = performance.now();
    const tg = Math.floor(Math.random() * 4);
    g.current = { id: 0, next: 0, t0: n, last: n, raf: 0, it: [], score: 0, lane: 1, target: tg, tchg: n };
    setScore(0); setLeft(40); setLane(1); setTarget(tg); setItems([]); setRun('run');
    const loop = (now: number) => {
      const s = g.current;
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      const el = (now - s.t0) / 1000;
      if (el >= 40) {
        setRun('over');
        if (s.score > 0) addStars(Math.min(6, Math.ceil(s.score / 3)));
        return;
      }
      if (now - s.tchg > 10000) {
        s.tchg = now;
        s.target = (s.target + 1 + Math.floor(Math.random() * 3)) % 4;
        setTarget(s.target);
      }
      if (now > s.next) {
        s.next = now + 800;
        s.it.push({ id: ++s.id, lane: Math.floor(Math.random() * 3), y: -30, v: 95 + el * 2, k: Math.random() < 0.45 ? s.target : Math.floor(Math.random() * 4) });
      }
      s.it = s.it.map((x) => ({ ...x, y: x.y + x.v * dt })).filter((x) => {
        if (x.y > H - 80 && x.y < H - 20 && x.lane === s.lane) {
          s.score = x.k === s.target ? s.score + 1 : Math.max(0, s.score - 1);
          setScore(s.score);
          return false;
        }
        return x.y < H + 10;
      });
      setItems(s.it.slice());
      setLeft(Math.max(0, Math.ceil(40 - el)));
      s.raf = requestAnimationFrame(loop);
    };
    g.current.raf = requestAnimationFrame(loop);
  }
  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);
  function move(d: number) {
    const l = Math.max(0, Math.min(2, g.current.lane + d));
    g.current.lane = l;
    setLane(l);
  }
  const LW = W / 3;
  return (
    <div className="kn-box">
      <button type="button" className="kn-back" onClick={() => { cancelAnimationFrame(g.current.raf); onBack(); }}>→ رجوع</button>
      <div className="kn-hud"><span>النقاط: {toAr(score)}</span><span>⏱ {toAr(left)}</span></div>
      <div className="kn-say">التقط: <b style={{ color: '#ffd24a' }}>{DH[target].t}</b></div>
      <div className="kn-sky" style={{ width: W, height: H }}>
        {[1, 2].map((i) => <i key={i} className="kn-gl" style={{ left: LW * i }} />)}
        {items.map((x) => (
          <span key={x.id} className="kn-it" style={{ left: x.lane * LW + 6, top: x.y, width: LW - 12, borderColor: DH[x.k].c, color: DH[x.k].c }}>{DH[x.k].t}</span>
        ))}
        <span className="kn-cam" style={{ left: lane * LW + LW / 2 - 24, top: H - 70 }}>🐪</span>
        {run === 'run' && (
          <>
            <button type="button" className="kn-half" style={{ left: 0 }} onPointerDown={() => move(-1)} aria-label="يسار" />
            <button type="button" className="kn-half" style={{ right: 0 }} onPointerDown={() => move(1)} aria-label="يمين" />
          </>
        )}
        {run !== 'run' && (
          <div className="kn-ov">
            <h3>{run === 'over' ? `التقطت ${toAr(score)}` : 'قافلة الذكر'}</h3>
            <p>المس يمين الشاشة أو يسارها لتنقل القافلة بين المسارات. التقط الذكر المطلوب فقط.</p>
            <button type="button" onClick={start}>{run === 'over' ? 'مرة أخرى' : 'ابدأ'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* رسوم النجوم: نقاط بالترتيب على لوحة 300×400 */
const SHAPES: { n: string; p: [number, number][] }[] = [
  { n: 'مسجد', p: [[30, 330], [30, 170], [50, 110], [70, 170], [70, 252], [108, 252], [108, 212], [150, 150], [192, 212], [192, 252], [230, 252], [230, 170], [250, 110], [270, 170], [270, 330]] },
  { n: 'هلال', p: [[190, 80], [130, 100], [95, 155], [90, 220], [120, 280], [170, 315], [225, 320], [180, 285], [150, 235], [148, 180], [165, 125], [210, 95]] },
  { n: 'نجمة', p: [[150, 60], [178, 140], [262, 140], [194, 192], [220, 272], [150, 224], [80, 272], [106, 192], [38, 140], [122, 140]] },
];
const SAL = ['صلى الله عليه وسلم', 'اللهم صلِّ على محمد', 'عليه الصلاة والسلام', 'اللهم صلِّ وسلّم على نبينا محمد'];

function Dots({ onBack }: { onBack: () => void }) {
  const [si, setSi] = useState(0);
  const [nx, setNx] = useState(0);
  const [say, setSay] = useState('');
  const [bad, setBad] = useState(-1);
  const [total, setTotal] = useState(0);
  const sh = SHAPES[si];
  const done = nx >= sh.p.length;
  function tap(i: number) {
    if (done) return;
    if (i !== nx) { setBad(i); setTimeout(() => setBad(-1), 350); return; }
    setNx(nx + 1);
    setTotal((t) => t + 1);
    setSay(SAL[i % SAL.length]);
    if (i === sh.p.length - 1) { bump('plays'); addStars(2); }
  }
  const pts = sh.p.slice(0, nx).map((q) => q.join(',')).join(' ');
  return (
    <div className="kn-box">
      <button type="button" className="kn-back" onClick={onBack}>→ رجوع</button>
      <div className="kn-hud"><span>الرسم: {sh.n}</span><span>{toAr(Math.min(nx, sh.p.length))} / {toAr(sh.p.length)}</span></div>
      <div className="kn-say">{done ? `تم رسم الـ${sh.n}! صلى الله عليه وسلم` : say || 'وصّل النجوم بالترتيب وصلِّ على النبي ﷺ'}</div>
      <div className="kn-sky" style={{ width: W, height: H }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <polyline points={pts} fill="none" stroke="#ffd24a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {done && <polygon points={sh.p.map((q) => q.join(',')).join(' ')} fill="rgba(255,210,74,.28)" stroke="#ffd24a" strokeWidth="3" />}
        </svg>
        {sh.p.map((q, i) => (
          <button key={i} type="button" className={i < nx ? 'kn-dot on' : i === bad ? 'kn-dot bad' : 'kn-dot'} style={{ left: q[0] - 17, top: q[1] - 17 }} onClick={() => tap(i)}>
            {toAr(i + 1)}
          </button>
        ))}
      </div>
      {done && (
        <button type="button" className="kn-go" onClick={() => { setSi((si + 1) % SHAPES.length); setNx(0); setSay(''); }}>
          الرسم التالي
        </button>
      )}
      <small style={{ color: '#7fe0c0' }}>صلوات هذه الجلسة: {toAr(total)}</small>
    </div>
  );
}

export function KidsNoor2() {
  const [m, setM] = useState<'menu' | 'piano' | 'car' | 'dots'>('menu');
  return (
    <div className="kn">
      {m === 'menu' && (
        <div className="kn-menu">
          <button type="button" onClick={() => setM('piano')}><b>🎹</b><span>بيانو الذكر</span><small>المس المفاتيح الساقطة</small></button>
          <button type="button" onClick={() => setM('car')}><b>🐪</b><span>قافلة الذكر</span><small>انقل القافلة والتقط الذكر</small></button>
          <button type="button" onClick={() => setM('dots')}><b>✨</b><span>ارسم بنجوم الصلاة</span><small>وصّل النجوم فيظهر الرسم</small></button>
        </div>
      )}
      {m === 'piano' && <Piano onBack={() => setM('menu')} />}
      {m === 'car' && <Caravan onBack={() => setM('menu')} />}
      {m === 'dots' && <Dots onBack={() => setM('menu')} />}
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
        .kn-gl { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(232,194,90,.18); }
        .kn-tile { position: absolute; width: ${W / 4 - 6}px; height: 58px; border: 0; border-radius: 12px; color: #1a1408; font-family: inherit; font-size: 12px; font-weight: 700; line-height: 1.3; padding: 4px; box-shadow: 0 3px 8px rgba(0,0,0,.4); }
        .kn-it { position: absolute; height: 40px; display: flex; align-items: center; justify-content: center; border: 2px solid; border-radius: 12px; background: rgba(18,15,8,.9); font-size: 12.5px; font-weight: 700; text-align: center; line-height: 1.2; pointer-events: none; }
        .kn-cam { position: absolute; font-size: 44px; line-height: 1; transition: left .12s; pointer-events: none; }
        .kn-half { position: absolute; top: 0; bottom: 0; width: 50%; background: transparent; border: 0; z-index: 3; }
        .kn-dot { position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 2px solid #e8c25a; background: rgba(18,15,8,.9); color: #f1d77a; font-family: inherit; font-size: 13px; padding: 0; }
        .kn-dot.on { background: #ffd24a; color: #1a1408; box-shadow: 0 0 14px #ffd24a; }
        .kn-dot.bad { border-color: #ff9a7a; transform: scale(1.15); }
      `}</style>
    </div>
  );
}
