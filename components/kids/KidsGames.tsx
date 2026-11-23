'use client';

import { useEffect, useMemo, useState } from 'react';
import { toAr, useQuran, type Aya } from '@/components/quran/data';
import { addStars, bump, DAILY_BREAK, useKids } from './store';

/**
 * ألعاب الصغار: ترتيب كلمات الآية، وإكمال الآية، وإكمال الذكر. النصوص من مصحف المدينة (حفص) ومن أذكار التطبيق الموثّقة.
 * بلا منافسة ولا ترتيب بين المستخدمين ولا إعلانات: نجوم تتجمّع على الجهاز فقط، وتشجيع لطيف.
 */
const strip = (s: string) =>
  s.replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').trim();
const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const CHEER = ['أحسنت! 🌟', 'ما شاء الله! ⭐', 'بارك الله فيك! ✨', 'ممتاز! 🌙', 'رائع! 🌸'];
const TRY = ['حاول مرة أخرى 💛', 'قريب! جرّب ثانية 🌱'];

type Game = 'order' | 'complete' | 'dhikr';

export function KidsGames() {
  const { data } = useQuran();
  const [game, setGame] = useState<Game | null>(null);
  const kid = useKids();
  const stars = kid.stars;
  const [surah, setSurah] = useState(112);
  const [dhikr, setDhikr] = useState<string[]>([]);

  useEffect(() => {
    fetch('/adhkar/situations.json')
      .then((r) => r.json())
      .then((s: { cats: { a: { x: string }[] }[] }[]) => {
        const xs = s.flatMap((c) => c.cats.flatMap((k) => k.a.map((a) => a.x.replace(/ـ+/g, ''))));
        setDhikr(xs.filter((x) => x.split(/\s+/).length >= 4 && x.split(/\s+/).length <= 9 && !/[﴿(]/.test(x)));
      })
      .catch(() => {});
  }, []);

  function addStar() {
    addStars(1);
    bump('plays');
  }

  const surahs = useMemo(() => {
    if (!data) return [];
    return data.suras.filter((s) => s.n === 1 || s.n >= 78).map((s) => ({ n: s.n, name: s.name.replace(/^سورة\s*/, '') }));
  }, [data]);

  if (!data) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;

  const pool = data.ayas.filter((a) => a[0] === surah && a[4].trim().split(/\s+/).length >= 2);

  return (
    <div className="kg">
      <div className="kg-top">
        <span>⭐ {toAr(stars)} نجمة</span>
        <span className="kg-g">{'🌷'.repeat(Math.min(10, Math.floor(stars / 5)))}</span>
      </div>
      {kid.plays >= DAILY_BREAK && (
        <p className="kg-break">ما شاء الله، لعبتَ كثيرًا اليوم 🌙 خذ قسطًا من الراحة واقرأ في كتاب أو العب مع أهلك، وارجع غدًا لتكمل جمع النجوم.</p>
      )}
      {!game && (
        <>
          <p className="kg-p">اختر لعبة. كل إجابة صحيحة تعطيك نجمة، وكل خمس نجوم تُزهر وردة في بستانك 🌷</p>
          <div className="kg-menu">
            <button type="button" onClick={() => setGame('order')}><b>🧩</b>رتّب كلمات الآية</button>
            <button type="button" onClick={() => setGame('complete')}><b>✏️</b>أكمل الآية</button>
            <button type="button" onClick={() => setGame('dhikr')} disabled={!dhikr.length}><b>📿</b>أكمل الذكر</button>
          </div>
        </>
      )}
      {game && (
        <>
          <div className="kg-bar">
            <button type="button" onClick={() => setGame(null)}>‹ الألعاب</button>
            {game !== 'dhikr' && (
              <select value={surah} onChange={(e) => setSurah(Number(e.target.value))} aria-label="السورة">
                {surahs.map((s) => (
                  <option key={s.n} value={s.n}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
          {game === 'order' && <OrderGame key={surah} pool={pool} onWin={addStar} />}
          {game === 'complete' && <CompleteGame key={surah} pool={pool} onWin={addStar} />}
          {game === 'dhikr' && <DhikrGame pool={dhikr} onWin={addStar} />}
        </>
      )}
      <p className="kg-n">النصوص من مصحف المدينة (مجمع الملك فهد) ومن أذكار التطبيق. النجوم محفوظة على جهازك فقط.</p>
      <style>{css}</style>
    </div>
  );
}

function pick<T>(a: T[]) {
  return a[Math.floor(Math.random() * a.length)];
}

function OrderGame({ pool, onWin }: { pool: Aya[]; onWin: () => void }) {
  const [aya, setAya] = useState<Aya | null>(null);
  const [bank, setBank] = useState<{ w: string; i: number }[]>([]);
  const [got, setGot] = useState<{ w: string; i: number }[]>([]);
  const [msg, setMsg] = useState('');
  const words = (a: Aya) => a[4].trim().split(/\s+/);
  function next() {
    const short = pool.filter((a) => words(a).length <= 7);
    const a = pick(short.length ? short : pool);
    setAya(a);
    setGot([]);
    setMsg('');
    setBank(shuffle(words(a).map((w, i) => ({ w, i }))));
  }
  useEffect(next, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!aya) return null;
  const total = words(aya).length;
  function tap(x: { w: string; i: number }) {
    if (got.length === total) return;
    // الصحيح: الكلمة التالية في الترتيب (تساوي الكلمات المتكررة بلا تشكيل)
    const need = words(aya!)[got.length];
    if (strip(x.w) === strip(need)) {
      const ng = [...got, x];
      setGot(ng);
      setBank(bank.filter((b) => b !== x));
      if (ng.length === total) {
        setMsg(pick(CHEER));
        onWin();
      } else setMsg('');
    } else setMsg(pick(TRY));
  }
  const done = got.length === total;
  return (
    <div className="kg-box">
      <p className="kg-q">رتّب كلمات الآية بالترتيب:</p>
      <div className="kg-line">{got.length ? got.map((g) => g.w).join(' ') : '…'}</div>
      <div className="kg-words">
        {bank.map((b) => (
          <button key={b.i} type="button" onClick={() => tap(b)}>{b.w}</button>
        ))}
      </div>
      {msg && <div className="kg-msg">{msg}</div>}
      <div className="kg-act">
        <button type="button" onClick={next}>{done ? 'آية جديدة ›' : 'تخطّي'}</button>
        {done && <small>الآية {toAr(aya[1])}</small>}
      </div>
    </div>
  );
}

function CompleteGame({ pool, onWin }: { pool: Aya[]; onWin: () => void }) {
  const [q, setQ] = useState<{ head: string; ans: string; opts: string[]; n: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  function next() {
    const usable = pool.filter((a) => a[4].trim().split(/\s+/).length >= 3 && a[4].trim().split(/\s+/).length <= 9);
    const a = pick(usable.length ? usable : pool);
    const w = a[4].trim().split(/\s+/);
    const ans = w[w.length - 1];
    const others = Array.from(new Set(pool.flatMap((x) => x[4].trim().split(/\s+/)))).filter((x) => strip(x) !== strip(ans));
    const opts = shuffle([ans, ...shuffle(others).slice(0, 2)]);
    setQ({ head: w.slice(0, -1).join(' '), ans, opts, n: a[1] });
    setMsg('');
    setOk(false);
  }
  useEffect(next, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return null;
  return (
    <div className="kg-box">
      <p className="kg-q">أكمل الآية:</p>
      <div className="kg-line">{q.head} <u>؟</u></div>
      <div className="kg-words">
        {q.opts.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => {
              if (ok) return;
              if (strip(o) === strip(q.ans)) {
                setOk(true);
                setMsg(pick(CHEER));
                onWin();
              } else setMsg(pick(TRY));
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {msg && <div className="kg-msg">{msg}</div>}
      <div className="kg-act">
        <button type="button" onClick={next}>{ok ? 'التالي ›' : 'تخطّي'}</button>
        {ok && <small>الآية {toAr(q.n)}: {q.head} {q.ans}</small>}
      </div>
    </div>
  );
}

function DhikrGame({ pool, onWin }: { pool: string[]; onWin: () => void }) {
  const [q, setQ] = useState<{ parts: string[]; idx: number; ans: string; opts: string[]; full: string } | null>(null);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  function next() {
    const full = pick(pool);
    const parts = full.split(/\s+/);
    const cand = parts.map((w, i) => ({ w, i })).filter((x) => strip(x.w).length >= 3);
    const t = pick(cand.length ? cand : parts.map((w, i) => ({ w, i })));
    const all = Array.from(new Set(pool.flatMap((x) => x.split(/\s+/)))).filter((x) => strip(x) !== strip(t.w) && strip(x).length >= 3);
    setQ({ parts, idx: t.i, ans: t.w, opts: shuffle([t.w, ...shuffle(all).slice(0, 2)]), full });
    setMsg('');
    setOk(false);
  }
  useEffect(next, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return null;
  return (
    <div className="kg-box">
      <p className="kg-q">أكمل الذكر:</p>
      <div className="kg-line">{q.parts.map((w, i) => (i === q.idx && !ok ? '﹏﹏' : w)).join(' ')}</div>
      <div className="kg-words">
        {q.opts.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => {
              if (ok) return;
              if (strip(o) === strip(q.ans)) {
                setOk(true);
                setMsg(pick(CHEER));
                onWin();
              } else setMsg(pick(TRY));
            }}
          >
            {o.replace(/[،,.؛]/g, '')}
          </button>
        ))}
      </div>
      {msg && <div className="kg-msg">{msg}</div>}
      <div className="kg-act">
        <button type="button" onClick={next}>{ok ? 'التالي ›' : 'تخطّي'}</button>
      </div>
    </div>
  );
}

const css = `
  .kg { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 12px; }
  .kg-top { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.85); font-size: 16px; color: #f1d77a; }
  .kg-g { font-size: 16px; letter-spacing: 2px; }
  .kg-p { margin: 0; font-size: 14px; line-height: 2; text-align: center; }
  .kg-menu { display: grid; grid-template-columns: 1fr; gap: 12px; }
  .kg-menu button { display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 22px; border: 1px solid rgba(232,194,90,.45); background: radial-gradient(120% 90% at 50% 0%, rgba(232,194,90,.16), rgba(232,194,90,.04) 70%), rgba(18,15,8,.8); color: #f1d77a; font-family: inherit; font-size: 18px; font-weight: 700; text-align: start; }
  .kg-menu button:disabled { opacity: .4; }
  .kg-menu b { font-size: 34px; width: 56px; height: 56px; display: grid; place-items: center; border-radius: 50%; background: rgba(232,194,90,.14); }
  .kg-bar { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
  .kg-bar button, .kg-act button { padding: 9px 18px; border-radius: 999px; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.12); color: #f1d77a; font-family: inherit; font-size: 15px; }
  .kg-bar select { padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 15px; }
  .kg-box { padding: 16px; border-radius: 22px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.85); display: flex; flex-direction: column; gap: 14px; }
  .kg-q { margin: 0; font-size: 15px; color: #e8c25a; }
  .kg-line { min-height: 64px; padding: 14px; border-radius: 16px; background: rgba(232,194,90,.07); border: 1px dashed rgba(232,194,90,.35); font-family: var(--font-ruqaa), serif; font-size: 26px; line-height: 2.1; text-align: center; }
  .kg-line u { text-decoration: none; color: #e8c25a; }
  .kg-words { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
  .kg-words button { padding: 12px 20px; border-radius: 16px; border: 2px solid rgba(232,194,90,.5); background: rgba(232,194,90,.14); color: #fff1c4; font-family: var(--font-ruqaa), serif; font-size: 24px; }
  .kg-words button:active { transform: scale(.94); }
  .kg-msg { text-align: center; font-size: 20px; color: #7fe0c0; }
  .kg-act { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .kg-act small { color: rgba(255,241,196,.65); font-size: 12px; }
  .kg-break { margin: 0; padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(127,224,192,.4); background: rgba(127,224,192,.08); font-size: 14px; line-height: 2; text-align: center; }
  .kg-n { font-size: 11.5px; text-align: center; color: rgba(255,241,196,.5); margin: 0; }
`;
