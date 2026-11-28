'use client';

import { useEffect, useRef, useState } from 'react';
import { BookReader } from '@/components/BookReader';
import { IlmTools } from '@/components/ilm/IlmTools';
import { EXTRA_SHELF } from '@/components/ilm/books';
import { getLast } from '@/components/ilm/ilmStore';
import { lsGet, lsSet } from '@/components/quran/data';
import { HadithQudsi } from '@/components/HadithQudsi';
import { GhazawatMap } from '@/components/GhazawatMap';
import { SurahInfo } from '@/components/quran/SurahInfo';
import { WordDictionary } from '@/components/lugha/WordDictionary';
import { QuranSciencesHub } from '@/components/QuranSciencesHub';
import { AsmaAllah } from '@/components/AsmaAllah';

/**
 * المكتبة العلمية لطالب العلم: كتب متفق عليها عند أهل السنة (عقيدة، حديث ومصطلح، أصول فقه، علم وآداب، لغة).
 * النصوص من المكتبة الشاملة عبر مشروع OpenITI (CC BY-NC-SA 4.0)، مقسّمة بـ tools/build_library.py دون تعديل ألفاظ المؤلفين.
 * لإضافة كتاب: أضفه إلى BOOKS في tools/build_library.py وأعد التوليد. تعمل بلا نت داخل التطبيق.
 */
type B = { id: string; cat: string; title: string; author: string; sub: string; via: string; dir?: string; fiqh?: boolean };
const TOOLS: { id: string; icon: string; t: string; h: string; r: () => React.ReactNode }[] = [
  { id: 'asma', icon: '🌙', t: 'أسماء الله الحسنى', h: 'معانيها وأدلتها', r: () => <AsmaAllah /> },
  { id: 'tour', icon: '🎥', t: 'جولة داخل بيت النبي ﷺ', h: 'مقاطع مرئية كأنك هناك', r: () => <Tour /> },
  { id: 'qudsi', icon: '📜', t: 'الأحاديث القدسية', h: 'من الصحيحين', r: () => <HadithQudsi /> },
  { id: 'sinfo', icon: '📑', t: 'بطاقة السورة', h: 'مكية/مدنية وفضلها وأسباب نزولها', r: () => <SurahInfo /> },
  { id: 'wdict', icon: '📖', t: 'معجم غريب القرآن', h: 'ابحث عن معنى كلمة', r: () => <WordDictionary /> },
  { id: 'uloom', icon: '🔬', t: 'علوم القرآن', h: 'مكي ومدني وأسباب النزول', r: () => <QuranSciencesHub /> },
  { id: 'gmap', icon: '🗺️', t: 'الغزوات على الخريطة', h: 'بسنواتها من سير الذهبي', r: () => <GhazawatMap /> },
];
const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
function Tour() {
  const L: [string, string, string][] = [
    ['🏠', 'داخل بيت النبي ﷺ في المدينة', 'محاكاة ثلاثية الأبعاد لحجرات بيت النبي صلى الله عليه وسلم'],
    ['🕌', 'المسجد النبوي في عهد النبي ﷺ', 'مجسّم المسجد النبوي الأول وما كان فيه'],
    ['🏛️', 'متحف «السلام عليك أيها النبي»', 'جولة في المتحف: مدينة النبي ﷺ ومكة والمدينة في زمنه'],
    ['🗺️', 'رحلة الهجرة من مكة إلى المدينة', 'مسار الهجرة النبوية وتجسيده للزوار'],
  ];
  const Q = ['بيت النبي صلى الله عليه وسلم محاكاة ثلاثية الأبعاد المدينة', 'المسجد النبوي القديم في عهد النبي مجسم محاكاة', 'متحف السلام عليك أيها النبي جولة', 'مشروع في خطى النبي الهجرة من مكة إلى المدينة'];
  return (
    <div>
      <p style={{ fontSize: 12.5, lineHeight: 1.9, opacity: 0.8, margin: '0 0 10px' }}>مقاطع مرئية لمشاريع سعودية تعيد تصوير بيت النبي ﷺ ومسجده كما كانا. تفتح في المتصفح أو تطبيق يوتيوب، وتحتاج اتصالًا بالإنترنت.</p>
      {L.map(([i, t, h], k) => (
        <a key={t} href={yt(Q[k])} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, marginBottom: 10, borderRadius: 16, border: '1px solid rgba(232,194,90,.35)', background: 'rgba(18,15,8,.82)', color: '#fff1c4', textDecoration: 'none', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 30 }}>{i}</span>
          <span>
            <b style={{ display: 'block', fontSize: 15, fontWeight: 500 }}>{t}</b>
            <small style={{ color: '#7fe0c0', fontSize: 12 }}>{h}</small>
          </span>
          <span style={{ marginInlineStart: 'auto', color: '#e8c25a' }}>▶</span>
        </a>
      ))}
    </div>
  );
}
const TABS: [string, string][] = [['shelves', '🏛️ الرفوف'], ['search', '🔎 بحث شامل'], ['last', '🔖 أكمل القراءة'], ['fav', '⭐ المفضلة'], ['tools', '🧰 مراجع']];
const CATS = ['العقيدة', 'علوم القرآن', 'الحديث وعلومه', 'السيرة والتراجم', 'الفقه والعبادات', 'الفقه المقارن', 'أصول الفقه', 'القواعد الفقهية', 'العلم وآدابه', 'اللغة العربية'];

export function IslamicLibrary() {
  const [list, setList] = useState<B[] | null>(null);
  const [err, setErr] = useState(false);
  const [bk, setBk] = useState<B | null>(null);
  const [op, setOp] = useState<{ b: B; c: string } | null>(null);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('shelves');
  const [tool, setTool] = useState<string | null>(null);
  const [cf, setCf] = useState('');
  const [view, setView] = useState<string>(() => lsGet<string>('lib.view', 'shelves'));
  const [sheet, setSheet] = useState<B | null>(null);
  const tm = useRef<number[]>([]);
  useEffect(() => () => tm.current.forEach(clearTimeout), []);
  useEffect(() => {
    fetch('/library/index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((l: B[]) => setList([...EXTRA_SHELF, ...l.map((x) => ({ ...x, dir: `/library/${x.id}/` }))]))
      .catch(() => setErr(true));
  }, []);
  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل المكتبة.</p>;
  if (!list) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;
  if (bk)
    return (
      <BookReader
        key={bk.id}
        dir={bk.dir || `/library/${bk.id}/`}
        title={bk.title}
        author={bk.author}
        sub={bk.sub}
        fiqh={bk.fiqh}
        backLabel="← المكتبة"
        onBack={() => setBk(null)}
      />
    );
  const cats = [...CATS, ...Array.from(new Set(list.map((b) => b.cat))).filter((c) => !CATS.includes(c))];
  const PAL = [
    ['#5a1620', '#8a2433'], ['#0f4a3a', '#17705a'], ['#13294b', '#1f4478'], ['#4a2c12', '#744520'],
    ['#2b1a42', '#472a6b'], ['#1c1c1c', '#383838'], ['#5b4210', '#8a6618'], ['#0f3d47', '#1a6475'],
  ];
  const hash = (t: string) => [...t].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const qq = q.trim();
  const shown = list.filter((b) => (!cf || b.cat === cf) && (!qq || (b.title + b.author + b.sub).includes(qq)));
  const bdir = (b: B) => b.dir || `/library/${b.id}/`;
  const lastRec = getLast();
  const lastBook = lastRec ? list.find((b) => bdir(b) === lastRec.dir) : undefined;
  const dayN = Math.floor(Date.now() / 86400000);
  const pick = list[(dayN * 7919) % list.length];
  const nAuth = new Set(list.map((b) => b.author)).size;
  const catCount = (c: string) => list.filter((b) => b.cat === c).length;
  const grad = (b: B) => { const [c1, c2] = PAL[hash(b.id) % PAL.length]; return `linear-gradient(135deg,${c1},${c2})`; };
  const setV = (v: string) => { setView(v); lsSet('lib.view', v); };
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
      <div className="lib-tabs">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => (setTab(k), setTool(null))}>{l}</button>
        ))}
      </div>
      {tab === 'search' && <IlmTools mode="search" />}
      {tab === 'last' && <IlmTools mode="last" />}
      {tab === 'fav' && <IlmTools mode="fav" />}
      {tab === 'tools' &&
        (tool ? (
          <div>
            <button type="button" className="lib-bkb" onClick={() => setTool(null)}>← المراجع</button>
            {TOOLS.find((t) => t.id === tool)?.r()}
          </div>
        ) : (
          <div className="lib-tl">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTool(t.id)}>
                <i>{t.icon}</i>
                <b>{t.t}</b>
                <small>{t.h}</small>
              </button>
            ))}
          </div>
        ))}
      {tab === 'shelves' && (<>
      <div className="lib-hall">
        <div className="lib-arch"><span className="lib-chand">🕯️</span></div>
        <b>المكتبة العامة</b>
        <small>{list.length} كتابًا · {nAuth} مؤلفًا · {cats.filter((c) => catCount(c)).length} فنًّا</small>
      </div>
      <input className="lib-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن كتاب أو مؤلف…" aria-label="بحث في المكتبة" />
      {!qq && !cf && (
        <div className="lib-feat">
          {lastBook && (
            <button type="button" className="lib-fc" onClick={() => open(lastBook)}>
              <span className="lib-mini" style={{ background: grad(lastBook) }}>🔖</span>
              <span><small>تابع القراءة</small><b>{lastBook.title}</b><em>{lastRec?.label}</em></span>
            </button>
          )}
          {pick && (
            <button type="button" className="lib-fc" onClick={() => setSheet(pick)}>
              <span className="lib-mini" style={{ background: grad(pick) }}>✨</span>
              <span><small>كتاب اليوم</small><b>{pick.title}</b><em>{pick.author}</em></span>
            </button>
          )}
        </div>
      )}
      <div className="lib-chips">
        <button type="button" className={!cf ? 'on' : ''} onClick={() => setCf('')}>الكل <i>{list.length}</i></button>
        {cats.filter((c) => catCount(c)).map((c) => (
          <button key={c} type="button" className={cf === c ? 'on' : ''} onClick={() => setCf(c)}>{c} <i>{catCount(c)}</i></button>
        ))}
      </div>
      <div className="lib-vt">
        <button type="button" className={view === 'shelves' ? 'on' : ''} onClick={() => setV('shelves')}>🏛️ رفوف</button>
        <button type="button" className={view === 'cards' ? 'on' : ''} onClick={() => setV('cards')}>🗂️ بطاقات</button>
      </div>
      {view === 'cards' && (
        <div className="lib-cards">
          {shown.map((b) => (
            <button key={b.id} type="button" className="lib-card" onClick={() => setSheet(b)}>
              <span className="lib-mini" style={{ background: grad(b) }}>{b.title.slice(0, 1)}</span>
              <span className="lib-ct"><b>{b.title}</b><em>{b.author}</em><small>{b.sub}</small><i>{b.cat}</i></span>
            </button>
          ))}
          {!shown.length && <p style={{ textAlign: 'center', opacity: 0.7, padding: 20, gridColumn: '1/-1' }}>لا يوجد كتاب بهذا الاسم.</p>}
        </div>
      )}
      {view !== 'cards' && <div className="lib-room">
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
                            onClick={() => setSheet(b)}
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
      </div>}
      <p className="lib-note">اضغط على أي كتاب ليُفتح لك وتتصفّح أبوابه وفصوله. تُضاف كتب أخرى تباعًا.</p>
      </>)}
      {tab === 'shelves' && sheet && !op && (
        <div className="lib-sh" onClick={() => setSheet(null)}>
          <div className="lib-sc" onClick={(e) => e.stopPropagation()}>
            <span className="lib-mini big" style={{ background: grad(sheet) }}>{sheet.title.slice(0, 1)}</span>
            <h3>{sheet.title}</h3>
            <em>{sheet.author}</em>
            <p>{sheet.sub}</p>
            <i className="lib-cat">{sheet.cat}</i>
            <div className="lib-sb">
              <button type="button" className="go" onClick={() => { const b = sheet; setSheet(null); open(b); }}>📖 افتح الكتاب</button>
              <button type="button" onClick={() => setSheet(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
      {tab === 'shelves' && op && (
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
        .lib-tabs { display: flex; gap: 6px; overflow-x: auto; margin: 0 0 10px; padding-bottom: 4px; scrollbar-width: none; }
        .lib-tabs button { flex: none; padding: 8px 13px; border-radius: 999px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.85); color: #f1d77a; font-family: inherit; font-size: 13px; white-space: nowrap; }
        .lib-tabs button.on { background: rgba(232,194,90,.25); border-color: #e8c25a; }
        .lib-tl { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .lib-tl button { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px 8px; border-radius: 16px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); color: #fff1c4; font-family: inherit; }
        .lib-tl i { font-style: normal; font-size: 28px; } .lib-tl b { font-size: 14px; font-weight: 500; } .lib-tl small { color: #7fe0c0; font-size: 11px; text-align: center; }
        .lib-bkb { background: none; border: 0; color: #f1d77a; font-family: inherit; font-size: 14px; padding: 6px 0 10px; }
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
        .lib-feat { display: grid; gap: 8px; margin-bottom: 10px; }
        .lib-fc, .lib-card { display: flex; gap: 12px; align-items: center; text-align: start; padding: 10px 12px; border-radius: 16px; border: 1px solid rgba(232,194,90,.3); background: linear-gradient(135deg, rgba(40,28,10,.9), rgba(18,15,8,.9)); color: #fff1c4; font-family: inherit; }
        .lib-fc small { display: block; color: #7fe0c0; font-size: 11px; } .lib-fc b { display: block; font-size: 15px; color: #f1d77a; font-weight: 600; } .lib-fc em { font-style: normal; font-size: 12px; opacity: .75; }
        .lib-mini { flex: none; width: 46px; height: 62px; border-radius: 4px 8px 8px 4px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: #f7e7a6; border: 1px solid rgba(241,215,122,.55); box-shadow: inset -3px 0 5px rgba(0,0,0,.45), 2px 3px 8px rgba(0,0,0,.6); }
        .lib-mini.big { width: 84px; height: 116px; font-size: 40px; margin: 0 auto 10px; }
        .lib-chips { display: flex; gap: 6px; overflow-x: auto; padding: 2px 0 8px; scrollbar-width: none; }
        .lib-chips button { flex: none; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(232,194,90,.3); background: transparent; color: #e8c25a; font-family: inherit; font-size: 12.5px; white-space: nowrap; }
        .lib-chips button.on { background: rgba(232,194,90,.25); border-color: #e8c25a; color: #fff1c4; } .lib-chips i { font-style: normal; opacity: .6; font-size: 11px; margin-inline-start: 3px; }
        .lib-vt { display: flex; gap: 6px; margin-bottom: 10px; }
        .lib-vt button { flex: 1; padding: 7px; border-radius: 12px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.8); color: #f1d77a; font-family: inherit; font-size: 13px; } .lib-vt button.on { background: rgba(232,194,90,.22); border-color: #e8c25a; }
        .lib-cards { display: grid; gap: 8px; }
        .lib-ct { display: flex; flex-direction: column; gap: 2px; min-width: 0; } .lib-ct b { font-size: 14.5px; color: #f1d77a; font-weight: 600; } .lib-ct em { font-style: normal; font-size: 12px; opacity: .8; } .lib-ct small { font-size: 11.5px; opacity: .6; line-height: 1.6; }
        .lib-ct i, .lib-cat { font-style: normal; align-self: flex-start; font-size: 11px; padding: 2px 9px; border-radius: 999px; background: rgba(127,224,192,.14); color: #7fe0c0; }
        .lib-sh { position: fixed; inset: 0; z-index: 55; background: rgba(0,0,0,.7); display: flex; align-items: flex-end; justify-content: center; animation: lib-fd .2s both; }
        .lib-sc { width: 100%; max-width: 480px; box-sizing: border-box; padding: 20px 18px 24px; border-radius: 22px 22px 0 0; background: linear-gradient(180deg,#1c1409,#0d0905); border: 1px solid rgba(232,194,90,.4); border-bottom: 0; text-align: center; }
        .lib-sc h3 { margin: 0 0 4px; font-size: 19px; color: #f1d77a; } .lib-sc em { font-style: normal; font-size: 13px; color: #ffe9a8; } .lib-sc p { font-size: 13px; line-height: 1.8; opacity: .8; margin: 8px 0; }
        .lib-sb { display: flex; gap: 8px; margin-top: 14px; } .lib-sb button { flex: 1; padding: 11px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #f1d77a; font-family: inherit; font-size: 14px; } .lib-sb .go { flex: 2; background: rgba(232,194,90,.25); border-color: #e8c25a; color: #fff1c4; }
      `}</style>
    </div>
  );
}
