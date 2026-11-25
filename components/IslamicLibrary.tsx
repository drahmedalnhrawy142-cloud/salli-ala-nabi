'use client';

import { useEffect, useRef, useState } from 'react';
import { BookReader } from '@/components/BookReader';

/**
 * المكتبة العلمية لطالب العلم: كتب متفق عليها عند أهل السنة (عقيدة، حديث ومصطلح، أصول فقه، علم وآداب، لغة).
 * النصوص من المكتبة الشاملة عبر مشروع OpenITI (CC BY-NC-SA 4.0)، مقسّمة بـ tools/build_library.py دون تعديل ألفاظ المؤلفين.
 * لإضافة كتاب: أضفه إلى BOOKS في tools/build_library.py وأعد التوليد. تعمل بلا نت داخل التطبيق.
 */
type B = { id: string; cat: string; title: string; author: string; sub: string; via: string };
const CATS = ['العقيدة', 'علوم القرآن', 'الحديث وعلومه', 'أصول الفقه', 'العلم وآدابه', 'اللغة العربية'];

export function IslamicLibrary() {
  const [list, setList] = useState<B[] | null>(null);
  const [err, setErr] = useState(false);
  const [bk, setBk] = useState<B | null>(null);
  const [op, setOp] = useState<{ b: B; c: string } | null>(null);
  const [q, setQ] = useState('');
  const tm = useRef<number[]>([]);
  useEffect(() => () => tm.current.forEach(clearTimeout), []);
  useEffect(() => {
    fetch('/library/index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setList)
      .catch(() => setErr(true));
  }, []);
  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل المكتبة.</p>;
  if (!list) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;
  if (bk)
    return (
      <BookReader
        key={bk.id}
        dir={`/library/${bk.id}/`}
        title={bk.title}
        author={bk.author}
        sub={bk.sub}
        backLabel="← المكتبة"
        onBack={() => setBk(null)}
      />
    );
  const cats = [...CATS, ...Array.from(new Set(list.map((b) => b.cat))).filter((c) => !CATS.includes(c))];
  const qq = q.trim();
  const shown = qq ? list.filter((b) => (b.title + b.author + b.sub).includes(qq)) : list;
  const PAL = [
    ['#5a1620', '#8a2433'], ['#0f4a3a', '#17705a'], ['#13294b', '#1f4478'], ['#4a2c12', '#744520'],
    ['#2b1a42', '#472a6b'], ['#1c1c1c', '#383838'], ['#5b4210', '#8a6618'], ['#0f3d47', '#1a6475'],
  ];
  const hash = (t: string) => [...t].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  function open(b: B) {
    const [c1, c2] = PAL[hash(b.id) % PAL.length];
    setOp({ b, c: `linear-gradient(135deg,${c1},${c2})` });
    tm.current.push(window.setTimeout(() => { setBk(b); setOp(null); }, 950));
  }
  const rows = (bs: B[]) => {
    const r: B[][] = [];
    for (let i = 0; i < bs.length; i += 5) r.push(bs.slice(i, i + 5));
    return r;
  };
  return (
    <div className="lib">
      <div className="lib-hall">
        <div className="lib-arch"><span className="lib-chand">🕯️</span></div>
        <b>المكتبة العامة</b>
        <small>{list.length} كتابًا على الرفوف</small>
      </div>
      <input className="lib-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن كتاب أو مؤلف…" aria-label="بحث في المكتبة" />
      <div className="lib-room">
        {cats.map((c, ci) => {
          const bs = shown.filter((b) => b.cat === c);
          if (!bs.length) return null;
          return (
            <section key={c} className="lib-cab">
              <div className="lib-crown"><h3 className="lib-plq">{c}</h3></div>
              <div className="lib-inner">
                <i className="lib-pil l" />
                <i className="lib-pil r" />
                {rows(bs).map((r, ri) => (
                  <div key={ri} className="lib-shelf">
                    <div className="lib-books">
                      {r.map((b, bi) => {
                        const h = hash(b.id);
                        const [c1, c2] = PAL[h % PAL.length];
                        const ht = 104 + (h % 6) * 8;
                        const w = 38 + ((h >> 3) % 4) * 5;
                        const lean = r.length < 5 && bi === r.length - 1 && h % 2 === 0;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            className={`lib-bk${op?.b.id === b.id ? ' out' : ''}${lean ? ' lean' : ''}`}
                            style={{ height: ht, width: w, background: `linear-gradient(90deg,${c1},${c2} 40%,${c1} 85%,rgba(0,0,0,.5))` }}
                            onClick={() => open(b)}
                            aria-label={`${b.title} — ${b.author}`}
                          >
                            <span className="lib-band" style={{ top: 7 }} />
                            <span className="lib-band" style={{ top: 11, height: 2 }} />
                            <span className="lib-band" style={{ bottom: 11, height: 2 }} />
                            <span className="lib-band" style={{ bottom: 7 }} />
                            <span className="lib-lbl"><span className="lib-ti">{b.title.length > 22 ? b.title.slice(0, 21) + '…' : b.title}</span></span>
                          </button>
                        );
                      })}
                      {r.length < 4 && <span className="lib-deco">{['🏺', '🕯️', '📜', '🪔'][(ci + ri) % 4]}</span>}
                    </div>
                    <div className="lib-board" />
                  </div>
                ))}
              </div>
              <div className="lib-base" />
            </section>
          );
        })}
        {!shown.length && <p style={{ textAlign: 'center', opacity: 0.7, padding: 20 }}>لا يوجد كتاب بهذا الاسم.</p>}
        <div className="lib-floor"><span className="lib-ladder">🪜</span><span className="lib-rug" /></div>
      </div>
      <p className="lib-note">اضغط على أي كتاب ليُفتح لك وتتصفّح أبوابه وفصوله. تُضاف كتب أخرى تباعًا.</p>
      {op && (
        <div className="lib-ov" aria-hidden="true">
          <div className="lib-3d">
            <div className="lib-pages" />
            <div className="lib-cover" style={{ background: op.c }}>
              <div className="lib-frame">
                <small>❖</small>
                <b>{op.b.title}</b>
                <em>{op.b.author}</em>
                <small>❖</small>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .lib { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
        .lib-hall { position: relative; text-align: center; padding: 56px 0 10px; margin: 0 0 8px; border-radius: 16px 16px 0 0; background: linear-gradient(180deg,#0a0603,#1c1209); border: 1px solid rgba(232,194,90,.25); overflow: hidden; }
        .lib-arch { position: absolute; top: 14px; left: 50%; width: 150px; height: 70px; transform: translateX(-50%); border: 5px solid #6a4620; border-bottom: 0; border-radius: 75px 75px 0 0; background: radial-gradient(ellipse at 50% 100%, rgba(255,214,110,.55), rgba(255,170,60,.12) 60%, transparent 75%); }
        .lib-chand { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); font-size: 22px; filter: drop-shadow(0 0 8px #ffc860); }
        .lib-hall b { display: block; font-size: 20px; color: #f1d77a; text-shadow: 0 2px 8px #000; position: relative; }
        .lib-hall small { color: #7fe0c0; font-size: 11.5px; position: relative; }
        .lib-q { width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.85); color: #fff1c4; font-family: inherit; font-size: 14px; margin-bottom: 10px; }
        .lib-room { padding: 14px 8px 0; border-radius: 6px; background: repeating-linear-gradient(90deg,#1a0f07 0 28px,#150c06 28px 30px); box-shadow: inset 0 0 40px rgba(0,0,0,.85); }
        .lib-cab { margin-bottom: 22px; filter: drop-shadow(0 8px 10px rgba(0,0,0,.7)); }
        .lib-crown { position: relative; padding: 8px 0 6px; border-radius: 6px 6px 0 0; background: linear-gradient(180deg,#8a5a28,#5a3818 55%,#3a2210); border-bottom: 3px solid #25150a; box-shadow: 0 -3px 0 #a87438 inset; }
        .lib-plq { margin: 0 auto; width: fit-content; max-width: 86%; padding: 3px 18px; font-size: 13.5px; font-weight: 600; color: #2a1809; background: linear-gradient(180deg,#f6e08a,#c99a2e 60%,#a67a1c); border-radius: 5px; border: 1px solid #6a4a10; box-shadow: 0 2px 5px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.5); text-align: center; }
        .lib-inner { position: relative; padding: 10px 16px 0; background: linear-gradient(90deg,#120a04,#241609 50%,#120a04); box-shadow: inset 0 12px 18px rgba(0,0,0,.8), inset 0 0 22px rgba(0,0,0,.7); border-left: 10px solid #4a2c12; border-right: 10px solid #4a2c12; }
        .lib-pil { position: absolute; top: 0; bottom: 0; width: 4px; background: linear-gradient(180deg,#a87438,#5a3818); }
        .lib-pil.l { left: -2px; } .lib-pil.r { right: -2px; }
        .lib-shelf { margin-bottom: 0; }
        .lib-books { display: flex; gap: 2px; align-items: flex-end; justify-content: flex-start; padding: 0 2px; min-height: 126px; direction: rtl; }
        .lib-bk { position: relative; flex: none; border: 0; padding: 0; border-radius: 3px 3px 1px 1px; box-shadow: inset -3px 0 5px rgba(0,0,0,.5), inset 2px 0 3px rgba(255,255,255,.14), 2px 0 5px rgba(0,0,0,.55); cursor: pointer; transition: transform .25s; overflow: hidden; transform-origin: bottom center; }
        .lib-bk.lean { transform: rotate(-9deg); margin-inline-start: 4px; }
        .lib-bk:active, .lib-bk.out { transform: translateY(-12px); }
        .lib-bk.lean:active, .lib-bk.lean.out { transform: rotate(-9deg) translateY(-12px); }
        .lib-band { position: absolute; left: 0; right: 0; height: 4px; background: linear-gradient(180deg,#f1d77a,#a97c1c); opacity: .92; }
        .lib-lbl { position: absolute; left: 4px; right: 4px; top: 20px; bottom: 20px; border: 1px solid rgba(241,215,122,.55); background: rgba(0,0,0,.28); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .lib-ti { writing-mode: vertical-rl; text-orientation: mixed; font-size: 10.5px; line-height: 1.15; color: #f7e7a6; text-shadow: 0 1px 2px #000; font-family: inherit; max-height: 100%; overflow: hidden; }
        .lib-deco { font-size: 30px; align-self: flex-end; margin: 0 8px 2px; filter: drop-shadow(0 3px 3px rgba(0,0,0,.7)); }
        .lib-board { height: 14px; margin: 0 -16px; background: linear-gradient(180deg,#9a6830,#5a3818 40%,#2e1a0b); box-shadow: 0 6px 8px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,220,150,.35); }
        .lib-base { height: 16px; background: linear-gradient(180deg,#5a3818,#2a170a); border-radius: 0 0 4px 4px; box-shadow: 0 3px 0 #120a04; }
        .lib-floor { position: relative; height: 54px; margin: 0 -8px; background: repeating-linear-gradient(90deg,#4a2c12 0 36px,#3e2410 36px 38px); border-top: 4px solid #25150a; display: flex; align-items: center; justify-content: space-around; }
        .lib-ladder { font-size: 34px; filter: drop-shadow(0 3px 3px #000); }
        .lib-rug { width: 55%; height: 26px; border-radius: 4px; background: repeating-linear-gradient(90deg,#6a1622 0 10px,#8a2433 10px 14px,#c99a2e 14px 16px); border: 2px solid #c99a2e; opacity: .9; }
        .lib-note { text-align: center; font-size: 11.5px; color: rgba(255,241,196,.5); line-height: 1.8; margin-top: 12px; }
        .lib-ov { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.82); display: flex; align-items: center; justify-content: center; perspective: 1100px; animation: lib-fd .3s both; }
        @keyframes lib-fd { from { opacity: 0 } to { opacity: 1 } }
        .lib-3d { position: relative; width: 210px; height: 290px; transform-style: preserve-3d; animation: lib-zoom .95s ease-in-out both; }
        .lib-pages { position: absolute; inset: 4px 0 4px 6px; background: repeating-linear-gradient(180deg,#f3e9c6 0 3px,#d9c98f 3px 4px); border-radius: 3px; box-shadow: 0 10px 30px rgba(0,0,0,.8); }
        .lib-cover { position: absolute; inset: 0; border-radius: 4px 8px 8px 4px; transform-origin: right center; backface-visibility: hidden; box-shadow: 0 8px 28px rgba(0,0,0,.8); border: 2px solid rgba(232,194,90,.6); animation: lib-open .95s ease-in-out both; display: flex; align-items: center; justify-content: center; }
        .lib-frame { width: 82%; height: 84%; border: 2px double rgba(241,215,122,.8); border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: space-around; text-align: center; padding: 8px; color: #f1d77a; }
        .lib-frame b { font-size: 19px; line-height: 1.5; } .lib-frame em { font-style: normal; font-size: 12px; color: #ffe9a8; }
        @keyframes lib-zoom { 0% { transform: scale(.35) rotateY(0) } 45% { transform: scale(1) rotateY(-12deg) } 100% { transform: scale(1.35) rotateY(-12deg) } }
        @keyframes lib-open { 0%, 45% { transform: rotateY(0) } 100% { transform: rotateY(160deg) } }
      `}</style>
    </div>
  );
}
