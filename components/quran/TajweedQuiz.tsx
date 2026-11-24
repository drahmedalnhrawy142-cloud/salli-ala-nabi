'use client';

import { useMemo, useState } from 'react';
import { ayaIndex, toAr, type QData } from './data';
import { TAJWEED3 } from './tajweed3Data';

/** اختبار التجويد: موضع حقيقي من المصحف (مظلَّل) ويُسأل عن حكمه، والأمثلة مأخوذة من «أحكام التجويد» نفسها. */
type Q = { aya: number; f: number; t: number; ans: string; opts: string[]; why: string };
const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [b[i], b[k]] = [b[k], b[i]];
  }
  return b;
};
const SECS: { id: string; label: string; take: number }[] = [
  { id: 'noon', label: 'النون الساكنة والتنوين', take: 4 },
  { id: 'meem', label: 'الميم الساكنة', take: 3 },
  { id: 'lam', label: 'لام «أل»', take: 2 },
];
const CHEER = ['أحسنت! 🌟', 'ما شاء الله! ⭐', 'ممتاز! ✨'];
const BEST = 'tjq.best';

function build(data: QData, sec: string): Q[] {
  const g = TAJWEED3.find((x) => x.id === sec)!;
  const items = sec === 'lam' ? g.items.slice(0, 2) : g.items;
  const names = items.map((i) => i.name);
  const take = SECS.find((s) => s.id === sec)!.take;
  const pool: Q[] = [];
  for (const it of items)
    for (const e of it.ex) {
      if (/إظهار\b|قبل ما بعدها|كلمة واحدة|ميم ساكنة قبل|اللام ثم/.test(e.n) && !/الإظهار/.test(it.name)) continue;
      const i = ayaIndex(data, e.s, e.a);
      if (i < 0) continue;
      const others = shuffle(names.filter((n) => n !== it.name)).slice(0, take - 1);
      pool.push({ aya: i, f: e.f, t: e.t, ans: it.name, opts: shuffle([it.name, ...others]), why: it.f });
    }
  return shuffle(pool).slice(0, 10);
}

export function TajweedQuiz({ data }: { data: QData }) {
  const [sec, setSec] = useState<string | null>(null);
  const [qs, setQs] = useState<Q[]>([]);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [best, setBest] = useState(() => {
    try { return Number(localStorage.getItem(BEST) || 0); } catch { return 0; }
  });

  const start = (id: string) => {
    setSec(id); setQs(build(data, id)); setN(0); setScore(0); setPick(null);
  };
  const q = qs[n];
  const done = sec && n >= qs.length;
  useMemo(() => {
    if (done && score > best) {
      setBest(score);
      try { localStorage.setItem(BEST, String(score)); } catch {}
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tq">
      {!sec && (
        <>
          <p className="tq-p">اختر بابًا، وسيظهر لك موضع من المصحف مظلَّل، واختر حكمه. أفضل نتيجة لك: {toAr(best)} من ١٠.</p>
          {SECS.map((s) => (
            <button key={s.id} type="button" className="tq-sec" onClick={() => start(s.id)}>🎯 {s.label}</button>
          ))}
        </>
      )}
      {sec && done && (
        <div className="tq-box">
          <p className="tq-big">{toAr(score)} / {toAr(qs.length)}</p>
          <p className="tq-p">{score >= qs.length * 0.8 ? 'ما شاء الله! متقن بإذن الله 🌟' : 'جيد، راجع أحكام هذا الباب ثم أعد المحاولة 💛'}</p>
          <button type="button" className="tq-next" onClick={() => start(sec)}>↻ جولة جديدة</button>
          <button type="button" className="tq-back" onClick={() => setSec(null)}>‹ الأبواب</button>
        </div>
      )}
      {sec && q && (
        <div className="tq-box">
          <div className="tq-top"><button type="button" className="tq-back" onClick={() => setSec(null)}>‹ الأبواب</button><span>{toAr(n + 1)} / {toAr(qs.length)}</span></div>
          <p className="tq-q">ما حكم الموضع المظلَّل؟</p>
          <div className="tq-aya">
            {data.ayas[q.aya][4].split(' ').map((w, k) => (
              <span key={k} className={k >= q.f && k < q.t ? 'hl' : ''}>{w} </span>
            ))}
            <span className="tq-ref">{data.suras[data.ayas[q.aya][0] - 1].name} • {toAr(data.ayas[q.aya][1])}</span>
          </div>
          <div className="tq-opts">
            {q.opts.map((o) => (
              <button key={o} type="button" disabled={pick !== null}
                className={pick ? (o === q.ans ? 'ok' : o === pick ? 'no' : '') : ''}
                onClick={() => { setPick(o); if (o === q.ans) setScore((s) => s + 1); }}>{o}</button>
            ))}
          </div>
          {pick && (
            <>
              <p className="tq-why">{pick === q.ans ? CHEER[n % 3] : `الصواب: ${q.ans}`}<br />{q.why}</p>
              <button type="button" className="tq-next" onClick={() => { setN(n + 1); setPick(null); }}>التالي ›</button>
            </>
          )}
        </div>
      )}
      <style>{`
        .tq { display:flex; flex-direction:column; gap:10px; font-family: var(--font-kufi), sans-serif; color:#fff1c4; }
        .tq-p { margin:0; text-align:center; font-family: var(--font-ruqaa), serif; font-size:17px; line-height:1.9; color:rgba(255,241,196,.8); }
        .tq-sec { padding:14px; border-radius:18px; border:1px solid rgba(232,194,90,.3); background:rgba(18,15,8,.82); color:#fff1c4; font-family:inherit; font-size:15px; }
        .tq-box { display:flex; flex-direction:column; gap:10px; }
        .tq-top { display:flex; justify-content:space-between; align-items:center; color:#e8c25a; font-size:13px; }
        .tq-back { background:none; border:0; color:#e8c25a; font-family:inherit; font-size:14px; align-self:flex-start; }
        .tq-q { margin:0; text-align:center; color:#f1d77a; font-size:15px; }
        .tq-big { margin:0; text-align:center; font-size:36px; color:#f1d77a; }
        .tq-aya { padding:14px; border-radius:16px; border:1px solid rgba(232,194,90,.25); background:rgba(232,194,90,.06); font-family:'KFGQPC Hafs', serif; font-size:24px; line-height:2.2; direction:rtl; text-align:center; }
        .tq-aya .hl { background:rgba(232,194,90,.35); border-radius:6px; color:#fff; }
        .tq-ref { display:block; font-family:var(--font-kufi), sans-serif; font-size:12px; color:#e8c25a; }
        .tq-opts { display:flex; flex-direction:column; gap:8px; }
        .tq-opts button { padding:12px; border-radius:14px; border:1px solid rgba(232,194,90,.35); background:transparent; color:#fff1c4; font-family:inherit; font-size:15px; }
        .tq-opts .ok { background:rgba(127,224,192,.25); border-color:#7fe0c0; }
        .tq-opts .no { background:rgba(255,120,120,.2); border-color:#ff8a8a; }
        .tq-why { margin:0; padding:12px; border-radius:14px; background:rgba(232,194,90,.08); font-family:var(--font-ruqaa), serif; font-size:16px; line-height:1.9; }
        .tq-next { padding:12px; border-radius:14px; border:0; background:#e8c25a; color:#1a1409; font-family:inherit; font-size:15px; }
      `}</style>
    </div>
  );
}
