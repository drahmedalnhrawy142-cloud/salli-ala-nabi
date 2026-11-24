'use client';

import { useEffect, useRef, useState } from 'react';
import { toAr, useQuran } from '@/components/quran/data';
import { ayahUrl, RECITERS } from '@/components/quran/audio';
import { addStars, bump } from './store';

/**
 * سباق السيارة: السيارة تسير والتلاوة تعمل، وإذا اصطدمت أو أوقفتَها تتوقف التلاوة وتكمل من حيث وقفت.
 * اضغط يمين/يسار الشاشة لتغيير المسار، واجمع النجوم وتجنّب العوائق.
 */
const W = 300, H = 460, LANES = 3, LW = W / LANES;
const KID_RECITERS = ['husary', 'minshawy', 'maher', 'fares', 'husary-muallim'];
const SURAHS = [112, 113, 114, 108, 110, 103, 109, 105, 106, 107, 111, 97, 99, 93, 94, 87, 78].filter((x, i, a) => a.indexOf(x) === i);

type Obj = { lane: number; y: number; kind: 'rock' | 'cone' | 'star' };

export function KidsRace() {
  const { data } = useQuran();
  const cv = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const st = useRef({ lane: 1, tx: LW * 1.5, x: LW * 1.5, objs: [] as Obj[], off: 0, speed: 3, t: 0, score: 0, run: false, over: false, raf: 0 });
  const ay = useRef(1);
  const [sura, setSura] = useState(112);
  const [rec, setRec] = useState('husary');
  const [ui, setUi] = useState<'idle' | 'run' | 'over'>('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [stats, setStats] = useState('');
  const cnt = useRef(3);
  const cfg = useRef({ sura, rec });
  cfg.current = { sura, rec };

  const count = data?.suras[sura - 1]?.ayas ?? 3;
  cnt.current = count;

  function playAyah() {
    const r = RECITERS.find((x) => x.id === cfg.current.rec) ?? RECITERS[0];
    if (!audio.current) {
      audio.current = new Audio();
      audio.current.onended = () => {
        const n = cnt.current;
        ay.current = ay.current >= n ? 1 : ay.current + 1;
        setStats(`الآية ${toAr(ay.current)}`);
        if (st.current.run) playAyah();
      };
    }
    const a = audio.current;
    const src = ayahUrl(r, cfg.current.sura, ay.current);
    if (a.src !== src) a.src = src;
    a.play().catch(() => {});
  }
  const pauseAudio = () => audio.current?.pause();

  function start() {
    const s = st.current;
    s.lane = 1; s.tx = s.x = LW * 1.5; s.objs = []; s.off = 0; s.speed = 3; s.t = 0; s.score = 0; s.run = true; s.over = false;
    ay.current = 1;
    if (audio.current) audio.current.src = '';
    setScore(0);
    setStats('الآية ١');
    setUi('run');
    playAyah();
    loop();
  }
  function toggle() {
    const s = st.current;
    if (s.over) return;
    s.run = !s.run;
    if (s.run) { playAyah(); loop(); setUi('run'); } else { pauseAudio(); setUi('idle'); }
  }
  function end() {
    const s = st.current;
    s.run = false; s.over = true;
    pauseAudio();
    setUi('over');
    setBest((b) => Math.max(b, s.score));
    const stars = Math.min(5, Math.ceil(s.score / 3));
    if (stars) addStars(stars);
    bump('plays');
  }
  function steer(dir: -1 | 1) {
    const s = st.current;
    if (!s.run) return;
    s.lane = Math.max(0, Math.min(LANES - 1, s.lane + dir));
    s.tx = LW * (s.lane + 0.5);
  }

  function loop() {
    cancelAnimationFrame(st.current.raf);
    const c = cv.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const tick = () => {
      const s = st.current;
      if (!s.run) { draw(ctx); return; }
      s.t++;
      s.speed = 3 + Math.min(4, s.t / 900);
      s.off = (s.off + s.speed) % 40;
      s.x += (s.tx - s.x) * 0.25;
      if (s.t % Math.max(28, 60 - Math.floor(s.t / 120)) === 0) {
        const kind = Math.random() < 0.4 ? 'star' : Math.random() < 0.5 ? 'rock' : 'cone';
        s.objs.push({ lane: Math.floor(Math.random() * LANES), y: -40, kind });
      }
      for (const o of s.objs) o.y += s.speed;
      const cy = H - 90;
      for (const o of s.objs) {
        if (o.y > cy - 34 && o.y < cy + 34 && Math.abs(LW * (o.lane + 0.5) - s.x) < 34) {
          if (o.kind === 'star') { s.score++; setScore(s.score); o.y = H + 100; }
          else { end(); draw(ctx); return; }
        }
      }
      s.objs = s.objs.filter((o) => o.y < H + 60);
      draw(ctx);
      s.raf = requestAnimationFrame(tick);
    };
    st.current.raf = requestAnimationFrame(tick);
  }

  function draw(ctx: CanvasRenderingContext2D) {
    const s = st.current;
    ctx.fillStyle = '#1b3a22'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2a2a2e'; ctx.fillRect(14, 0, W - 28, H);
    ctx.strokeStyle = '#e8c25a'; ctx.lineWidth = 3; ctx.setLineDash([20, 20]); ctx.lineDashOffset = -s.off;
    for (let i = 1; i < LANES; i++) { ctx.beginPath(); ctx.moveTo(LW * i, 0); ctx.lineTo(LW * i, H); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '34px serif';
    for (const o of s.objs) ctx.fillText(o.kind === 'star' ? '⭐' : o.kind === 'rock' ? '🪨' : '🚧', LW * (o.lane + 0.5), o.y);
    ctx.font = '48px serif';
    ctx.save(); ctx.translate(s.x, H - 90); ctx.rotate(Math.PI / 2); ctx.fillText(s.over ? '💥' : '🚗', 0, 0); ctx.restore();
  }

  useEffect(() => {
    const c = cv.current?.getContext('2d');
    if (c) draw(c);
    return () => { cancelAnimationFrame(st.current.raf); st.current.run = false; audio.current?.pause(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recs = RECITERS.filter((r) => KID_RECITERS.includes(r.id));
  return (
    <div className="kr">
      {ui !== 'run' && (
        <div className="kr-set">
          <label>السورة
            <select value={sura} onChange={(e) => setSura(Number(e.target.value))} disabled={ui === 'idle' && st.current.t > 0 && !st.current.over}>
              {SURAHS.map((n) => <option key={n} value={n}>{data ? data.suras[n - 1].name : n}</option>)}
            </select>
          </label>
          <label>القارئ
            <select value={rec} onChange={(e) => setRec(e.target.value)}>
              {recs.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
        </div>
      )}
      <div className="kr-hud">
        <span>⭐ {toAr(score)}</span>
        <span>{ui === 'run' ? `🔊 ${stats}` : `${toAr(count)} آية`}</span>
        <span>الأفضل {toAr(best)}</span>
      </div>
      <div className="kr-wrap">
        <canvas ref={cv} width={W} height={H} className="kr-cv" onClick={(e) => {
          const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
          steer(e.clientX - r.left > r.width / 2 ? 1 : -1);
        }} />
        {ui === 'over' && <div className="kr-ov"><p>اصطدمت! توقفت السيارة والتلاوة 🛑</p><p>جمعتَ {toAr(score)} نجمة</p></div>}
      </div>
      <div className="kr-btns">
        {ui === 'run' ? (
          <>
            <button type="button" onClick={() => steer(-1)}>◀</button>
            <button type="button" onClick={toggle}>⏸ قف</button>
            <button type="button" onClick={() => steer(1)}>▶</button>
          </>
        ) : (
          <button type="button" className="go" onClick={() => (st.current.over || st.current.t === 0 ? start() : toggle())}>
            {st.current.over ? '↻ سباق جديد' : st.current.t > 0 ? '▶ أكمل' : '🚗 ابدأ السباق'}
          </button>
        )}
      </div>
      <p className="kr-n">تعمل التلاوة وأنت تقود، وتتوقف إذا وقفتَ أو اصطدمت. تحتاج اتصالًا بالإنترنت للصوت.</p>
      <style>{`
        .kr { display:flex; flex-direction:column; gap:10px; font-family: var(--font-kufi), sans-serif; color:#fff1c4; align-items:center; }
        .kr-set { display:flex; gap:10px; width:100%; }
        .kr-set label { flex:1; display:flex; flex-direction:column; gap:4px; font-size:12px; color:#e8c25a; }
        .kr-set select { padding:8px; border-radius:12px; background:#120f08; color:#fff1c4; border:1px solid rgba(232,194,90,.4); font-family:inherit; }
        .kr-hud { display:flex; justify-content:space-between; width:100%; max-width:300px; font-size:14px; color:#f1d77a; }
        .kr-wrap { position:relative; width:100%; max-width:300px; }
        .kr-cv { width:100%; border-radius:16px; border:1px solid rgba(232,194,90,.4); touch-action:manipulation; display:block; }
        .kr-ov { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,.55); border-radius:16px; text-align:center; font-size:16px; }
        .kr-btns { direction:ltr; display:flex; gap:10px; width:100%; max-width:300px; }
        .kr-btns button { flex:1; padding:14px; border-radius:16px; border:1px solid rgba(232,194,90,.4); background:rgba(18,15,8,.9); color:#fff1c4; font-family:inherit; font-size:16px; }
        .kr-btns .go { background:#e8c25a; color:#1a1409; border:0; }
        .kr-n { margin:0; font-size:12px; opacity:.65; text-align:center; }
      `}</style>
    </div>
  );
}
