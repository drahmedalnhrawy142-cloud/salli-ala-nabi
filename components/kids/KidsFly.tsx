'use client';

import { useEffect, useRef, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { addStars, bump } from './store';

/** لعبتان بالتسبيح: «الطير المسبّح» يطير ما دمتَ تسبّح ويقع إن توقّفتَ، و«نطّ وسبّح» يقفز الجمل فوق الصخور وكل قفزة تسبيحة. */
const DHIKR = ['سبحان الله', 'الحمد لله', 'لا إله إلا الله', 'الله أكبر', 'صلى الله عليه وسلم'];
const W = 300, H = 420;

function Chooser({ v, set }: { v: number; set: (n: number) => void }) {
  return (
    <div className="kf-ch">
      {DHIKR.map((d, i) => (
        <button key={d} type="button" className={v === i ? 'on' : ''} onClick={() => set(i)}>{d}</button>
      ))}
    </div>
  );
}

type Mode = 'bird' | 'jump';

function Game({ mode, dhikr }: { mode: Mode; dhikr: number }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const g = useRef({ y: 160, vy: 0, run: false, over: false, n: 0, t: 0, raf: 0, last: 0, pops: [] as { x: number; y: number; a: number }[], obs: [] as number[], passed: 0, clouds: [60, 170, 250] });
  const [ui, setUi] = useState<'idle' | 'run' | 'over'>('idle');
  const [n, setN] = useState(0);
  const text = DHIKR[dhikr];
  const ground = H - 50;

  function draw(ctx: CanvasRenderingContext2D) {
    const s = g.current;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mode === 'bird' ? '#1c3b63' : '#2b2146');
    sky.addColorStop(1, mode === 'bird' ? '#6fa8d8' : '#d89b6f');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '38px serif';
    s.clouds.forEach((x, i) => ctx.fillText('☁️', x, 60 + i * 55));
    ctx.fillStyle = '#2f6b3a'; ctx.fillRect(0, ground, W, H - ground);
    ctx.fillStyle = '#244f2c'; ctx.fillRect(0, ground, W, 6);
    if (mode === 'bird') {
      ctx.font = '46px serif';
      ctx.save(); ctx.translate(W / 2, s.y); ctx.rotate(Math.max(-0.5, Math.min(1.2, s.vy * 0.08)));
      ctx.scale(-1, 1); ctx.fillText(s.over ? '🪽' : '🐦', 0, 0); ctx.restore();
    } else {
      ctx.font = '40px serif';
      for (const x of s.obs) ctx.fillText('🪨', x, ground - 14);
      ctx.font = '46px serif';
      ctx.save(); ctx.translate(70, s.y); ctx.scale(-1, 1); ctx.fillText(s.over ? '😵' : '🐫', 0, 0); ctx.restore();
    }
    ctx.font = '700 17px sans-serif'; ctx.fillStyle = '#fff6c2';
    for (const p of s.pops) { ctx.globalAlpha = p.a; ctx.fillText(text, p.x, p.y); }
    ctx.globalAlpha = 1;
  }

  function loop() {
    cancelAnimationFrame(g.current.raf);
    const ctx = cv.current?.getContext('2d');
    if (!ctx) return;
    const tick = () => {
      const s = g.current;
      if (!s.run) { draw(ctx); return; }
      s.t++;
      s.clouds = s.clouds.map((x) => (x < -30 ? W + 30 : x - 0.6));
      s.pops = s.pops.map((p) => ({ ...p, y: p.y - 1.4, a: p.a - 0.02 })).filter((p) => p.a > 0);
      if (mode === 'bird') {
        s.vy = Math.min(7, s.vy + 0.28);
        s.y += s.vy;
        if (s.y < 30) { s.y = 30; s.vy = 0; }
        if (s.y > ground - 20) { s.y = ground - 20; finish(ctx); return; }
      } else {
        s.vy += 0.55;
        s.y = Math.min(ground - 22, s.y + s.vy);
        if (s.y >= ground - 22) s.vy = 0;
        const sp = 3.2 + Math.min(3, s.t / 700);
        if (s.t % Math.max(55, 95 - Math.floor(s.t / 90)) === 0) s.obs.push(W + 20);
        s.obs = s.obs.map((x) => x - sp);
        for (const x of s.obs) {
          if (Math.abs(x - 70) < 26 && s.y > ground - 22 - 26) { finish(ctx); return; }
        }
        const before = s.obs.length;
        s.obs = s.obs.filter((x) => x > -30);
        s.passed += before - s.obs.length;
      }
      draw(ctx);
      s.raf = requestAnimationFrame(tick);
    };
    g.current.raf = requestAnimationFrame(tick);
  }

  function finish(ctx: CanvasRenderingContext2D) {
    const s = g.current;
    s.run = false; s.over = true;
    draw(ctx);
    setUi('over');
    const stars = Math.min(5, mode === 'bird' ? Math.floor(s.n / 10) : Math.ceil(s.passed / 3));
    if (stars) addStars(stars);
    bump('plays');
  }

  function start() {
    const s = g.current;
    s.y = mode === 'bird' ? 160 : H - 72; s.vy = 0; s.run = true; s.over = false; s.n = 0; s.t = 0; s.pops = []; s.obs = []; s.passed = 0;
    setN(0); setUi('run');
    loop();
  }

  function tap() {
    const s = g.current;
    if (!s.run) return;
    if (mode === 'bird') {
      s.vy = -5.2;
      s.n++; setN(s.n);
      s.pops.push({ x: W / 2 + (Math.random() * 60 - 30), y: s.y - 30, a: 1 });
    } else if (s.y >= ground - 22 - 1) {
      s.vy = -9.5;
      s.n++; setN(s.n);
      s.pops.push({ x: 70, y: s.y - 40, a: 1 });
    }
  }

  useEffect(() => {
    const ctx = cv.current?.getContext('2d');
    if (ctx) draw(ctx);
    return () => { cancelAnimationFrame(g.current.raf); g.current.run = false; };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="kf-box">
      <div className="kf-hud"><span>{text}</span><span>📿 {toAr(n)}</span></div>
      <div className="kf-wrap">
        <canvas ref={cv} width={W} height={H} className="kf-cv" onPointerDown={tap} />
        {ui === 'over' && (
          <div className="kf-ov">
            <p>{mode === 'bird' ? 'توقّفتَ عن التسبيح فوقع الطير على الأرض 🪶' : 'اصطدم الجمل بالصخرة!'}</p>
            <p>سبّحتَ {toAr(g.current.n)} مرة</p>
          </div>
        )}
      </div>
      {ui !== 'run' ? (
        <button type="button" className="kf-go" onClick={start}>{ui === 'over' ? '↻ العب مرة أخرى' : mode === 'bird' ? '🐦 ابدأ التسبيح' : '🐫 ابدأ'}</button>
      ) : (
        <button type="button" className="kf-tap" onPointerDown={tap}>{mode === 'bird' ? `${text} — اضغط ليطير` : `${text} — اضغط لتقفز`}</button>
      )}
      <p className="kf-n">{mode === 'bird' ? 'اضغط وسبّح بلسانك كل مرة: الطير يطير ما دمتَ تسبّح، وإن توقّفتَ هبط.' : 'اضغط لتقفز فوق الصخور، وسبّح بلسانك مع كل قفزة.'}</p>
    </div>
  );
}

export function KidsFly() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [d, setD] = useState(0);
  return (
    <div className="kf">
      {!mode ? (
        <div className="kf-menu">
          <button type="button" onClick={() => setMode('bird')}><b>🐦</b>الطير المسبّح</button>
          <button type="button" onClick={() => setMode('jump')}><b>🐫</b>نطّ وسبّح</button>
        </div>
      ) : (
        <>
          <button type="button" className="kf-back" onClick={() => setMode(null)}>‹ الألعاب</button>
          <Chooser v={d} set={setD} />
          <Game key={mode + d} mode={mode} dhikr={d} />
        </>
      )}
      <style>{`
        .kf { display:flex; flex-direction:column; gap:10px; font-family: var(--font-kufi), sans-serif; color:#fff1c4; align-items:center; }
        .kf-menu { display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%; }
        .kf-menu button { display:flex; flex-direction:column; align-items:center; gap:6px; padding:18px 8px; border-radius:18px; border:1px solid rgba(232,194,90,.3); background:rgba(18,15,8,.82); color:#fff1c4; font-family:inherit; font-size:15px; }
        .kf-menu b { font-size:34px; }
        .kf-back { align-self:flex-start; background:none; border:0; color:#e8c25a; font-family:inherit; font-size:14px; }
        .kf-ch { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; width:100%; }
        .kf-ch button { padding:7px 12px; border-radius:999px; border:1px solid rgba(232,194,90,.3); background:transparent; color:#fff1c4; font-family:inherit; font-size:13px; }
        .kf-ch .on { background:rgba(232,194,90,.25); border-color:#e8c25a; color:#f1d77a; }
        .kf-box { display:flex; flex-direction:column; gap:10px; width:100%; max-width:300px; }
        .kf-hud { display:flex; justify-content:space-between; font-size:15px; color:#f1d77a; }
        .kf-wrap { position:relative; }
        .kf-cv { width:100%; border-radius:16px; border:1px solid rgba(232,194,90,.4); touch-action:none; display:block; }
        .kf-ov { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; background:rgba(0,0,0,.55); border-radius:16px; text-align:center; padding:12px; }
        .kf-ov p { margin:0; }
        .kf-go { padding:14px; border-radius:16px; border:0; background:#e8c25a; color:#1a1409; font-family:inherit; font-size:16px; }
        .kf-tap { padding:22px; border-radius:18px; border:1px solid #e8c25a; background:rgba(232,194,90,.2); color:#fff1c4; font-family:inherit; font-size:18px; touch-action:manipulation; }
        .kf-n { margin:0; font-size:12px; opacity:.65; text-align:center; }
      `}</style>
    </div>
  );
}
