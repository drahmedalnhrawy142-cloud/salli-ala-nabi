'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadSimple, lsGet, lsSet, toAr, type QData } from './data';
import { ensureMic, speechKind, startSpeech, type SpeechSession } from './speech';
import { align, emptyRes, unitsForAyah, type Res, type Unit } from './tasmeeMatch';

/**
 * التسميع الصوتي «كأنك أمام شيخ»: تقرأ من حفظك، فيكتب التطبيق الآية بعد أن تُتمّها،
 * وينتظر الآية التالية، ويعلّم الكلمة الخاطئة (حمراء) والكلمة التي فاتتك (برتقالية).
 */
export function TasmeeSheikh({ data }: { data: QData }) {
  const [simple, setSimple] = useState<string[] | null>(null);
  const [sura, setSura] = useState<number>(() => lsGet('ts_sura', 1));
  const [from, setFrom] = useState<number>(() => lsGet('ts_from', 1));
  const [run, setRun] = useState<'idle' | 'on' | 'done'>('idle');
  const [res, setRes] = useState<Res | null>(null);
  const [msg, setMsg] = useState('');
  const [live, setLive] = useState('');
  const [hint, setHint] = useState<number | null>(null);
  const [hints, setHints] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const kind = useMemo(() => speechKind(), []);

  const active = useRef(false);
  const sess = useRef<SpeechSession | null>(null);
  const base = useRef<Res | null>(null);
  const unitsRef = useRef<Unit[]>([]);
  const skipBas = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadSimple().then(setSimple).catch(() => setMsg('تعذّر تحميل نص المقارنة. أعد المحاولة.'));
    return () => {
      active.current = false;
      sess.current?.stop();
    };
  }, []);

  // آيات المقطع: من الآية المحددة إلى آخر السورة
  const range = useMemo(() => {
    const st = data.suras[sura - 1];
    const out: number[] = [];
    for (let i = data.pageIndex[st.page]; i < data.ayas.length; i++) {
      const a = data.ayas[i];
      if (a[0] > sura) break;
      if (a[0] === sura && a[1] >= from) out.push(i);
    }
    return out;
  }, [data, sura, from]);

  const units = useMemo(() => {
    if (!simple) return [] as Unit[];
    return range.flatMap((i) => unitsForAyah(i, data.ayas[i][4], simple[i]));
  }, [range, simple, data]);
  unitsRef.current = units;

  const listen = useCallback(async () => {
    if (!active.current) return;
    try {
      sess.current = await startSpeech({
        onText: (text, final) => {
          const b = base.current;
          if (!b || !active.current) return;
          const r = align(unitsRef.current, b, text.split(/\s+/).filter(Boolean), skipBas.current);
          setRes(r);
          setLive(text.split(/\s+/).slice(-4).join(' '));
          if (final) base.current = r;
          if (r.p >= unitsRef.current.length) finish();
        },
        onEnd: (err) => {
          if (!active.current) return;
          if (err === 'not-allowed' || err === 'permission' || err === 'service-not-allowed') {
            setMsg('لم يُسمح باستخدام الميكروفون. فعّله من إعدادات التطبيق ثم أعد المحاولة.');
            finish();
            return;
          }
          setTimeout(listen, 250);
        },
      });
    } catch {
      setMsg('تعذّر تشغيل التعرّف على الصوت على هذا الجهاز.');
      finish();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function finish() {
    active.current = false;
    sess.current?.stop();
    setRun('done');
  }

  async function begin() {
    if (!units.length) return;
    setMsg('');
    if (!(await ensureMic())) {
      setMsg('لم يُسمح باستخدام الميكروفون.');
      return;
    }
    lsSet('ts_sura', sura);
    lsSet('ts_from', from);
    const r = emptyRes(units.length);
    base.current = r;
    skipBas.current = sura !== 1 && sura !== 9 && from === 1;
    setRes(r);
    setHints(0);
    setHint(null);
    setPick(null);
    setLive('');
    active.current = true;
    setRun('on');
    listen();
  }

  function giveHint() {
    const r = res;
    if (!r || r.p >= units.length) return;
    setHint(r.p);
    setHints((h) => h + 1);
    setTimeout(() => setHint(null), 3000);
  }

  useEffect(() => {
    if (run === 'on') endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [res?.p, run]);

  const words = (i: number) => data.ayas[i][4].split(' ');
  // مواضع كل آية داخل مصفوفة الوحدات
  const offs = useMemo(() => {
    const m = new Map<number, number>();
    units.forEach((u, idx) => {
      if (!m.has(u.ai)) m.set(u.ai, idx);
    });
    return m;
  }, [units]);

  const stats = useMemo(() => {
    if (!res) return null;
    let ok = 0;
    let bad = 0;
    let miss = 0;
    res.st.forEach((s) => {
      if (s === 1) ok++;
      else if (s === 2) bad++;
      else if (s === 3) miss++;
    });
    const said = ok + bad + miss;
    return { ok, bad, miss, said, pct: said ? Math.round((ok / said) * 100) : 0 };
  }, [res]);

  if (!kind) {
    return (
      <p className="ts-msg">
        التعرّف على الصوت غير متاح في هذا المتصفح. افتح التطبيق على أندرويد، أو استخدم متصفح كروم.
      </p>
    );
  }

  const done = run === 'done';
  return (
    <div className="ts">
      {run === 'idle' && (
        <div className="ts-set">
          <p className="ts-lead">اجلس أمام الشيخ: اضغط «ابدأ» وسمّع من حفظك. سأكتب كل آية بعد أن تُتمّها، وأعلّم لك الخطأ.</p>
          <label>
            السورة
            <select
              value={sura}
              onChange={(e) => {
                setSura(Number(e.target.value));
                setFrom(1);
              }}
            >
              {data.suras.map((s) => (
                <option key={s.n} value={s.n}>
                  {toAr(s.n)}. {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            ابدأ من الآية
            <input
              type="number"
              min={1}
              max={data.suras[sura - 1].ayas}
              value={from}
              onChange={(e) => setFrom(Math.min(data.suras[sura - 1].ayas, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>
          <button type="button" className="ts-go" onClick={begin} disabled={!simple || !units.length}>
            🎙️ ابدأ التسميع
          </button>
          <p className="ts-n">
            ملاحظة: التعرّف على الكلام يحتاج اتصالًا بالإنترنت غالبًا، وقد يخطئ أحيانًا في سماع بعض الكلمات، فاعتبره معينًا ولا تعتمد عليه وحده.
          </p>
        </div>
      )}

      {run !== 'idle' && (
        <>
          <div className="ts-bar">
            <b>سورة {data.suras[sura - 1].name}</b>
            {run === 'on' ? (
              <span className="ts-mic">
                <i /> أسمعك… {live && <em>{live}</em>}
              </span>
            ) : (
              <span>انتهى التسميع</span>
            )}
          </div>

          <div className="ts-page">
            {range.map((i) => {
              const o = offs.get(i) ?? 0;
              const ws = words(i);
              const started = res ? res.p > o || res.st.slice(o, o + ws.length).some((s) => s) : false;
              if (!started && !(res && res.p === o)) return null;
              const complete = res ? res.p >= o + ws.length : false;
              return (
                <span key={i} className="ts-ayah">
                  {ws.map((w, k) => {
                    const idx = o + k;
                    const st = res?.st[idx] ?? 0;
                    if (st === 0 && hint !== idx) return null;
                    return (
                      <span
                        key={k}
                        className={`ts-w ts-w${hint === idx && st === 0 ? 'h' : st}`}
                        onClick={() => st === 2 && setPick(pick === idx ? null : idx)}
                      >
                        {w}{' '}
                      </span>
                    );
                  })}
                  {complete ? <span className="ts-no">{toAr(data.ayas[i][1])}</span> : run === 'on' ? <span className="ts-cur">…</span> : null}{' '}
                </span>
              );
            })}
            {run === 'on' && res && res.p === 0 && <p className="ts-wait">ابدأ من الآية {toAr(from)}…</p>}
            <div ref={endRef} />
          </div>

          {pick != null && res && (
            <div className="ts-tip">
              المطلوب: <b>{data.ayas[units[pick].ai][4].split(' ')[units[pick].k]}</b>
              <br />
              ما سمعتُه: <b>{res.heard[pick] || '—'}</b>
            </div>
          )}

          {run === 'on' && (
            <div className="ts-ctl">
              <button type="button" onClick={giveHint}>
                💡 تلميح
              </button>
              <button type="button" onClick={finish}>
                ⏹ إنهاء
              </button>
            </div>
          )}

          {done && stats && (
            <div className="ts-sum">
              <h3>نتيجة التسميع</h3>
              <div className="ts-sum-g">
                <span>
                  <b className="g">{toAr(stats.ok)}</b>صحيحة
                </span>
                <span>
                  <b className="r">{toAr(stats.bad)}</b>خاطئة
                </span>
                <span>
                  <b className="o">{toAr(stats.miss)}</b>فاتتك
                </span>
                <span>
                  <b>{toAr(hints)}</b>تلميحات
                </span>
              </div>
              <p>{stats.said ? `نسبة الإتقان ${toAr(stats.pct)}٪` : 'لم أسمع شيئًا. تأكد من الميكروفون وأعد المحاولة.'}</p>
              <button type="button" className="ts-go" onClick={() => setRun('idle')}>
                تسميع جديد
              </button>
            </div>
          )}
        </>
      )}
      {msg && <p className="ts-msg">{msg}</p>}
      <style>{`
        .ts { font-family: var(--font-kufi), sans-serif; color: #f7ebc1; }
        .ts-lead { text-align: center; font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 1.9; color: rgba(255,241,196,.8); margin: 0 0 12px; }
        .ts-set { display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 20px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.8); }
        .ts-set label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #f1d77a; }
        .ts-set select, .ts-set input { padding: 11px; border-radius: 12px; border: 1px solid rgba(232,194,90,.35); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 15px; }
        .ts-go { padding: 14px; border-radius: 16px; border: 1px solid #f1d77a; background: linear-gradient(180deg, rgba(232,194,90,.4), rgba(232,194,90,.15)); color: #fff1c4; font-family: inherit; font-size: 17px; }
        .ts-go:disabled { opacity: .4; }
        .ts-n, .ts-msg { margin: 0; text-align: center; font-size: 12.5px; line-height: 1.8; color: rgba(255,241,196,.55); font-family: var(--font-ruqaa), serif; }
        .ts-msg { color: #ffd9a0; font-size: 14px; margin-top: 10px; }
        .ts-bar { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 0 0 10px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.9); font-size: 13.5px; color: #f1d77a; }
        .ts-mic { display: inline-flex; align-items: center; gap: 6px; color: #7fe0c0; min-width: 0; }
        .ts-mic em { font-style: normal; color: rgba(255,241,196,.55); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
        .ts-mic i { width: 10px; height: 10px; border-radius: 50%; background: #3fe0a8; animation: tsp 1.1s infinite; }
        @keyframes tsp { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.7); opacity: .4; } }
        .ts-page { min-height: 220px; padding: 16px 14px; border-radius: 22px; border: 2px solid rgba(232,194,90,.45); background: linear-gradient(180deg, rgba(20,17,8,.96), rgba(10,8,3,.98)); font-family: 'KFGQPC Hafs', serif; font-size: 25px; line-height: 2.3; text-align: justify; direction: rtl; }
        .ts-w1 { color: #fff1c4; }
        .ts-w2 { color: #ff6b6b; text-decoration: underline wavy #ff6b6b; text-underline-offset: 8px; cursor: pointer; }
        .ts-w3 { color: #ffb347; text-decoration: underline dashed #ffb347; text-underline-offset: 8px; }
        .ts-wh { color: #7fe0c0; opacity: .85; }
        .ts-no { display: inline-grid; place-items: center; width: 1.4em; height: 1.4em; border: 1.5px solid #c9a24a; border-radius: 50%; font-family: var(--font-kufi), sans-serif; font-size: .5em; vertical-align: .35em; color: #f1d77a; }
        .ts-cur { color: #7fe0c0; animation: tsb 1s infinite; }
        @keyframes tsb { 50% { opacity: .2; } }
        .ts-wait { text-align: center; color: rgba(255,241,196,.5); font-family: var(--font-ruqaa), serif; font-size: 16px; }
        .ts-tip { margin: 10px 0 0; padding: 10px; border-radius: 12px; background: rgba(255,107,107,.1); border: 1px solid rgba(255,107,107,.4); text-align: center; font-size: 13.5px; line-height: 1.9; }
        .ts-tip b { font-family: 'KFGQPC Hafs', serif; font-size: 20px; color: #fff1c4; font-weight: 400; }
        .ts-ctl { display: flex; gap: 8px; margin-top: 12px; }
        .ts-ctl button { flex: 1; padding: 13px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.12); color: #f1d77a; font-family: inherit; font-size: 15px; }
        .ts-sum { margin-top: 12px; padding: 14px; border-radius: 20px; border: 1px solid rgba(232,194,90,.5); background: rgba(18,15,8,.92); text-align: center; }
        .ts-sum h3 { margin: 0 0 10px; color: #f1d77a; font-size: 16px; }
        .ts-sum p { margin: 10px 0; font-family: var(--font-ruqaa), serif; font-size: 17px; }
        .ts-sum-g { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 11.5px; color: rgba(255,241,196,.7); }
        .ts-sum-g b { display: block; font-size: 22px; color: #fff1c4; }
        .ts-sum-g b.g { color: #7fe0c0; } .ts-sum-g b.r { color: #ff6b6b; } .ts-sum-g b.o { color: #ffb347; }
      `}</style>
    </div>
  );
}
