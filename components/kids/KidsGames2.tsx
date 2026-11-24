'use client';

import { useEffect, useMemo, useState } from 'react';
import { toAr, useQuran } from '@/components/quran/data';
import { addStars, bump, DAILY_BREAK, useKids } from './store';

/** ألعاب إضافية للصغار: أي سورة؟ · ذاكرة السور · الحروف الهجائية · معنى الكلمة. النصوص من المصحف نفسه ومن غريب القرآن. */
const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const CHEER = ['أحسنت! 🌟', 'ما شاء الله! ⭐', 'بارك الله فيك! ✨', 'ممتاز! 🌙', 'رائع! 🌸'];
const TRY = ['حاول مرة أخرى 💛', 'قريب! جرّب ثانية 🌱'];
const LETTERS = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
type G = 'which' | 'memory' | 'letters' | 'meaning';

function useWin() {
  return (n = 1) => {
    addStars(n);
    bump('plays');
  };
}

export function KidsGames2() {
  const [g, setG] = useState<G | null>(null);
  const kid = useKids();
  const win = useWin();
  return (
    <div className="k2">
      <div className="k2-top">
        <span>⭐ {toAr(kid.stars)} نجمة</span>
      </div>
      {kid.plays >= DAILY_BREAK && (
        <p className="k2-break">ما شاء الله، لعبتَ كثيرًا اليوم 🌙 خذ قسطًا من الراحة.</p>
      )}
      {!g ? (
        <div className="k2-menu">
          <button type="button" onClick={() => setG('which')}><b>🔎</b>أي سورة؟</button>
          <button type="button" onClick={() => setG('memory')}><b>🃏</b>ذاكرة السور</button>
          <button type="button" onClick={() => setG('letters')}><b>🔤</b>الحروف الهجائية</button>
          <button type="button" onClick={() => setG('meaning')}><b>💡</b>معنى الكلمة</button>
        </div>
      ) : (
        <>
          <button type="button" className="k2-back" onClick={() => setG(null)}>‹ الألعاب</button>
          {g === 'which' && <Which onWin={win} />}
          {g === 'memory' && <Memory onWin={win} />}
          {g === 'letters' && <Letters onWin={win} />}
          {g === 'meaning' && <Meaning onWin={win} />}
        </>
      )}
      <style>{css}</style>
    </div>
  );
}

function Which({ onWin }: { onWin: (n?: number) => void }) {
  const { data } = useQuran();
  const [q, setQ] = useState<{ t: string; ans: string; opts: string[] } | null>(null);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const next = () => {
    if (!data) return;
    const names = data.suras.map((s) => s.name.replace(/^سورة\s*/, ''));
    const pool = data.ayas.filter((a) => a[4].trim().split(/\s+/).length <= 8 && a[0] > 1 && a[0] !== 9);
    const a = pick(pool);
    const ans = names[a[0] - 1];
    const o = shuffle([ans, ...shuffle(names.filter((n) => n !== ans)).slice(0, 2)]);
    setQ({ t: a[4], ans, opts: o });
    setMsg('');
    setOk(false);
  };
  useEffect(next, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return <p className="k2-p">جارٍ التحميل…</p>;
  return (
    <div className="k2-box">
      <p className="k2-q">من أي سورة هذه الآية؟</p>
      <div className="k2-aya">{q.t}</div>
      <div className="k2-opts">
        {q.opts.map((o) => (
          <button key={o} type="button" disabled={ok} onClick={() => {
            if (o === q.ans) { setOk(true); setMsg(pick(CHEER)); onWin(1); } else setMsg(pick(TRY));
          }}>{o}</button>
        ))}
      </div>
      {msg && <p className="k2-msg">{msg}</p>}
      {ok && <button type="button" className="k2-next" onClick={next}>التالي ›</button>}
    </div>
  );
}

type Card = { id: number; pair: number; label: string };
function Memory({ onWin }: { onWin: (n?: number) => void }) {
  const { data } = useQuran();
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const deal = () => {
    if (!data) return;
    const idx = shuffle(Array.from({ length: 114 }, (_, i) => i)).slice(0, 6);
    const cs: Card[] = [];
    idx.forEach((i, p) => {
      cs.push({ id: p * 2, pair: p, label: data.suras[i].name.replace(/^سورة\s*/, '') });
      cs.push({ id: p * 2 + 1, pair: p, label: toAr(i + 1) });
    });
    setCards(shuffle(cs));
    setOpen([]);
    setDone([]);
    setMoves(0);
  };
  useEffect(deal, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const flip = (c: Card) => {
    if (open.length === 2 || open.includes(c.id) || done.includes(c.pair)) return;
    const no = [...open, c.id];
    setOpen(no);
    if (no.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = no.map((id) => cards.find((x) => x.id === id)!);
      setTimeout(() => {
        if (a.pair === b.pair) {
          setDone((d) => {
            const nd = [...d, a.pair];
            if (nd.length === 6) onWin(3);
            return nd;
          });
        }
        setOpen([]);
      }, 700);
    }
  };
  const won = done.length === 6;
  return (
    <div className="k2-box">
      <p className="k2-q">طابق اسم السورة مع رقمها في المصحف</p>
      <div className="k2-grid">
        {cards.map((c) => {
          const up = open.includes(c.id) || done.includes(c.pair);
          return (
            <button key={c.id} type="button" className={`k2-card${up ? ' up' : ''}${done.includes(c.pair) ? ' ok' : ''}`} onClick={() => flip(c)}>
              {up ? c.label : '❔'}
            </button>
          );
        })}
      </div>
      <p className="k2-msg">{won ? `${pick(CHEER)} أتممتها في ${toAr(moves)} محاولة · ٣ نجوم` : `المحاولات: ${toAr(moves)}`}</p>
      {won && <button type="button" className="k2-next" onClick={deal}>لعبة جديدة ›</button>}
    </div>
  );
}

function Letters({ onWin }: { onWin: (n?: number) => void }) {
  const mk = () => {
    const s = Math.floor(Math.random() * (LETTERS.length - 5));
    return LETTERS.slice(s, s + 5);
  };
  const [seq, setSeq] = useState<string[]>(mk);
  const [bank, setBank] = useState<string[]>(() => shuffle(seq));
  const [got, setGot] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const next = () => {
    const s = mk();
    setSeq(s);
    setBank(shuffle(s));
    setGot([]);
    setMsg('');
  };
  const done = got.length === seq.length;
  return (
    <div className="k2-box">
      <p className="k2-q">رتّب الحروف الهجائية كما تعلّمتها:</p>
      <div className="k2-aya" style={{ letterSpacing: '.25em' }}>{got.length ? got.join(' ') : '…'}</div>
      <div className="k2-opts k2-letters">
        {bank.map((l, i) => (
          <button key={l + i} type="button" onClick={() => {
            if (done) return;
            if (l === seq[got.length]) {
              const ng = [...got, l];
              setGot(ng);
              setBank(bank.filter((_, j) => j !== i));
              if (ng.length === seq.length) { setMsg(pick(CHEER)); onWin(1); } else setMsg('');
            } else setMsg(pick(TRY));
          }}>{l}</button>
        ))}
      </div>
      {msg && <p className="k2-msg">{msg}</p>}
      {done && <button type="button" className="k2-next" onClick={next}>التالي ›</button>}
    </div>
  );
}

type Item = { w: string; m: string };
function Meaning({ onWin }: { onWin: (n?: number) => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [q, setQ] = useState<{ w: string; ans: string; opts: string[] } | null>(null);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  useEffect(() => {
    fetch('/lugha/nuzha.json')
      .then((r) => r.json())
      .then((d: [string, string, string][]) => {
        const xs: Item[] = [];
        for (const [w, t] of d) {
          const i = t.indexOf(':');
          if (i < 0) continue;
          const m = t.slice(i + 1).trim().replace(/\.$/, '');
          if (m.length >= 3 && m.length <= 28 && !/[{}()«»"\d]/.test(m) && !m.includes('.') && !/^(أي|إن|إنني|يقول|يعني|هو|هي|ما|من|كل|يريد|مثل)(\s|$)/.test(m) && !m.includes('  ') && !m.includes('،') && w.length <= 10 && !/\s/.test(w)) xs.push({ w, m });
        }
        setItems(xs);
      })
      .catch(() => setItems([]));
  }, []);
  const next = (xs: Item[]) => {
    const a = pick(xs);
    const others = shuffle(xs.filter((x) => x.m !== a.m)).slice(0, 2).map((x) => x.m);
    setQ({ w: a.w, ans: a.m, opts: shuffle([a.m, ...others]) });
    setMsg('');
    setOk(false);
  };
  useEffect(() => { if (items && items.length > 3) next(items); }, [items]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!items) return <p className="k2-p">جارٍ التحميل…</p>;
  if (!q) return <p className="k2-p">لا توجد أسئلة متاحة الآن.</p>;
  return (
    <div className="k2-box">
      <p className="k2-q">ما معنى هذه الكلمة من القرآن؟</p>
      <div className="k2-aya">{q.w}</div>
      <div className="k2-opts">
        {q.opts.map((o) => (
          <button key={o} type="button" disabled={ok} onClick={() => {
            if (o === q.ans) { setOk(true); setMsg(pick(CHEER)); onWin(1); } else setMsg(pick(TRY));
          }}>{o}</button>
        ))}
      </div>
      {msg && <p className="k2-msg">{msg}</p>}
      {ok && <button type="button" className="k2-next" onClick={() => next(items)}>التالي ›</button>}
    </div>
  );
}

const css = `
.k2 { display:flex; flex-direction:column; gap:12px; font-family: var(--font-kufi), sans-serif; color:#fff1c4; }
.k2-top { display:flex; justify-content:center; color:#f1d77a; font-size:15px; }
.k2-break { margin:0; text-align:center; font-size:13px; color:#e8c25a; }
.k2-menu { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.k2-menu button { display:flex; flex-direction:column; align-items:center; gap:6px; padding:16px 8px; border-radius:18px; border:1px solid rgba(232,194,90,.3); background:rgba(18,15,8,.82); color:#fff1c4; font-family:inherit; font-size:14px; }
.k2-menu b { font-size:28px; }
.k2-back { align-self:flex-start; background:none; border:0; color:#e8c25a; font-family:inherit; font-size:14px; }
.k2-box { display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.k2-q { margin:0; text-align:center; color:#f1d77a; font-size:15px; }
.k2-p { text-align:center; opacity:.7; }
.k2-aya { text-align:center; padding:14px; border-radius:16px; border:1px solid rgba(232,194,90,.25); background:rgba(232,194,90,.06); font-family: var(--font-ruqaa), serif; font-size:22px; line-height:2; }
.k2-opts { display:flex; flex-direction:column; gap:8px; }
.k2-letters { flex-direction:row; flex-wrap:wrap; justify-content:center; }
.k2-letters button { min-width:52px; font-size:24px !important; font-family: var(--font-ruqaa), serif !important; }
.k2-opts button { padding:12px; border-radius:14px; border:1px solid rgba(232,194,90,.35); background:transparent; color:#fff1c4; font-family:inherit; font-size:16px; }
.k2-opts button:disabled { opacity:.5; }
.k2-msg { margin:0; text-align:center; color:#f1d77a; }
.k2-next { padding:11px; border-radius:14px; border:0; background:#e8c25a; color:#1a1409; font-family:inherit; font-size:15px; }
.k2-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.k2-card { height:72px; border-radius:14px; border:1px solid rgba(232,194,90,.35); background:rgba(18,15,8,.9); color:#fff1c4; font-family:inherit; font-size:16px; }
.k2-card.up { background:rgba(232,194,90,.2); }
.k2-card.ok { background:rgba(127,224,192,.2); border-color:#7fe0c0; }
`;
