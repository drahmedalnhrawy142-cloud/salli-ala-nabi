'use client';

import { useEffect, useMemo, useState } from 'react';
import { lsGet, lsSet, pageAyas, toAr, type QData } from './data';

type Mode = 'hide' | 'next' | 'start';
const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'hide', label: 'إخفاء كلمات', hint: 'تُخفى كلمات من الآية وتسمّعها بنفسك' },
  { id: 'next', label: 'الآية التالية', hint: 'تظهر آية وتسمّع التي بعدها' },
  { id: 'start', label: 'أكمل الآية', hint: 'تظهر بداية الآية وتكملها' },
];

/** التسميع الذاتي: اختر مقطعًا، وسمّع من حفظك، ثم اكشف الإجابة وقيّم نفسك. */
export function QuranTasmee({ data, currentPage }: { data: QData; currentPage: number }) {
  const [sura, setSura] = useState<number>(() => lsGet('qt_sura', 1));
  const [from, setFrom] = useState<number>(() => lsGet('qt_from', 1));
  const [to, setTo] = useState<number>(() => lsGet('qt_to', 7));
  const [mode, setMode] = useState<Mode>(() => lsGet<Mode>('qt_mode', 'hide'));
  const [level, setLevel] = useState<number>(() => lsGet('qt_level', 50));
  const [rand, setRand] = useState<boolean>(() => lsGet('qt_rand', false));
  const [queue, setQueue] = useState<number[] | null>(null);
  const [pos, setPos] = useState(0);
  const [shown, setShown] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [hits, setHits] = useState(0);
  const [miss, setMiss] = useState(0);

  const s = data.suras[sura - 1];

  useEffect(() => {
    lsSet('qt_sura', sura);
    lsSet('qt_from', from);
    lsSet('qt_to', to);
    lsSet('qt_mode', mode);
    lsSet('qt_level', level);
    lsSet('qt_rand', rand);
  }, [sura, from, to, mode, level, rand]);

  function pickSura(n: number) {
    setSura(n);
    setFrom(1);
    setTo(data.suras[n - 1].ayas);
  }

  function indicesFor(sn: number, a: number, b: number): number[] {
    const out: number[] = [];
    const st = data.suras[sn - 1];
    for (let i = data.pageIndex[st.page]; i < data.ayas.length; i++) {
      const x = data.ayas[i];
      if (x[0] > sn) break;
      if (x[0] === sn && x[1] >= a && x[1] <= b) out.push(i);
    }
    return out;
  }

  function begin(list: number[]) {
    let q = list.slice();
    if (rand) {
      for (let i = q.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j], q[i]];
      }
    }
    // وضع «الآية التالية» يحتاج آية تالية
    if (mode === 'next') q = q.filter((i) => i + 1 < data.ayas.length && (rand || list.includes(i + 1)));
    setQueue(q);
    setPos(0);
    setShown(false);
    setRevealed(new Set());
    setHits(0);
    setMiss(0);
  }

  const cur = queue && queue.length ? queue[pos] : null;
  const words = useMemo(() => (cur != null ? data.ayas[cur][4].split(' ') : []), [cur, data]);
  const hiddenIdx = useMemo(() => {
    if (cur == null || mode !== 'hide') return new Set<number>();
    const n = words.length;
    const k = Math.max(1, Math.round((n * level) / 100));
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return new Set(idx.slice(0, k));
  }, [cur, mode, level, words.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function next(correct: boolean | null) {
    if (correct === true) setHits((h) => h + 1);
    if (correct === false) setMiss((m) => m + 1);
    if (!queue) return;
    if (pos + 1 >= queue.length) {
      setPos(queue.length); // انتهى
    } else {
      setPos(pos + 1);
    }
    setShown(false);
    setRevealed(new Set());
  }

  if (queue && pos >= queue.length) {
    const total = hits + miss;
    return (
      <div className="qt">
        <div className="qt-card qt-center">
          <h3 className="qt-h">انتهى التسميع 🌟</h3>
          <p className="qt-big">
            {toAr(hits)} من {toAr(total)}
          </p>
          <p className="qt-sub">{miss === 0 && total > 0 ? 'ما شاء الله، بارك الله فيك' : 'راجع الآيات التي تعثّرت فيها ثم أعد المحاولة'}</p>
          <button type="button" className="qt-btn" onClick={() => setQueue(null)}>
            تسميع جديد
          </button>
        </div>
        <Style />
      </div>
    );
  }

  if (queue && cur != null) {
    const a = data.ayas[cur];
    const nextA = data.ayas[cur + 1];
    return (
      <div className="qt">
        <div className="qt-meta">
          <span>
            {data.suras[a[0] - 1].name} • {toAr(a[1])}
          </span>
          <span>
            {toAr(pos + 1)} / {toAr(queue.length)} • ✓ {toAr(hits)}
          </span>
        </div>

        <div className="qt-card">
          {mode === 'hide' && (
            <p className="qt-text">
              {words.map((w, i) => {
                const hid = hiddenIdx.has(i) && !shown && !revealed.has(i);
                return (
                  <span key={i}>
                    {hid ? (
                      <button type="button" className="qt-blank" onClick={() => setRevealed(new Set(revealed).add(i))} aria-label="كلمة مخفية">
                        {'٠'.repeat(Math.max(2, Math.min(5, w.length / 2)))}
                      </button>
                    ) : (
                      <span className="qt-word">{w}</span>
                    )}{' '}
                  </span>
                );
              })}
            </p>
          )}

          {mode === 'next' && (
            <>
              <p className="qt-label">الآية الحالية — سمّع التي بعدها:</p>
              <p className="qt-text">{a[4]}</p>
              <div className="qt-sep" />
              <p className="qt-text">{shown && nextA ? nextA[4] : '…………………'}</p>
            </>
          )}

          {mode === 'start' && (
            <>
              <p className="qt-label">أكمل الآية:</p>
              <p className="qt-text">
                {words.slice(0, Math.min(3, Math.max(1, words.length - 1))).join(' ')} {shown ? words.slice(Math.min(3, Math.max(1, words.length - 1))).join(' ') : '…………………'}
              </p>
            </>
          )}
        </div>

        {!shown ? (
          <button type="button" className="qt-btn qt-main" onClick={() => setShown(true)}>
            أظهر الإجابة
          </button>
        ) : (
          <div className="qt-row">
            <button type="button" className="qt-btn qt-miss" onClick={() => next(false)}>
              ✗ أخطأت
            </button>
            <button type="button" className="qt-btn qt-hit" onClick={() => next(true)}>
              ✓ أصبت
            </button>
          </div>
        )}
        <button type="button" className="qt-link" onClick={() => setQueue(null)}>
          إنهاء التسميع
        </button>
        <Style />
      </div>
    );
  }

  return (
    <div className="qt">
      <div className="qt-card">
        <h3 className="qt-h">اختر ما تسمّعه</h3>
        <label className="qt-field">
          <span>السورة</span>
          <select value={sura} onChange={(e) => pickSura(Number(e.target.value))}>
            {data.suras.map((x) => (
              <option key={x.n} value={x.n}>
                {toAr(x.n)} - {x.name}
              </option>
            ))}
          </select>
        </label>
        <div className="qt-two">
          <label className="qt-field">
            <span>من آية</span>
            <input type="number" min={1} max={s.ayas} value={from} onChange={(e) => setFrom(Math.max(1, Math.min(s.ayas, Number(e.target.value) || 1)))} />
          </label>
          <label className="qt-field">
            <span>إلى آية</span>
            <input type="number" min={1} max={s.ayas} value={to} onChange={(e) => setTo(Math.max(1, Math.min(s.ayas, Number(e.target.value) || 1)))} />
          </label>
        </div>

        <p className="qt-label">طريقة التسميع</p>
        <div className="qt-modes">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={`qt-mode${mode === m.id ? ' on' : ''}`} onClick={() => setMode(m.id)}>
              <b>{m.label}</b>
              <small>{m.hint}</small>
            </button>
          ))}
        </div>

        {mode === 'hide' && (
          <>
            <p className="qt-label">نسبة الكلمات المخفية</p>
            <div className="qt-chips">
              {[25, 50, 75, 100].map((l) => (
                <button key={l} type="button" className={`qt-chip${level === l ? ' on' : ''}`} onClick={() => setLevel(l)}>
                  {toAr(l)}٪
                </button>
              ))}
            </div>
          </>
        )}

        <label className="qt-check">
          <input type="checkbox" checked={rand} onChange={(e) => setRand(e.target.checked)} /> ترتيب عشوائي للآيات
        </label>

        <button type="button" className="qt-btn qt-main" onClick={() => begin(indicesFor(sura, Math.min(from, to), Math.max(from, to)))}>
          ابدأ التسميع
        </button>
        <button
          type="button"
          className="qt-btn"
          onClick={() => {
            setMode((m) => m);
            begin(pageAyas(data, currentPage));
          }}
        >
          سمّع صفحة المصحف الحالية ({toAr(currentPage)})
        </button>
      </div>
      <Style />
    </div>
  );
}

function Style() {
  return (
    <style>{`
      .qt { display: flex; flex-direction: column; gap: 12px; }
      .qt-card { padding: 16px; border-radius: 22px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.82); }
      .qt-center { text-align: center; }
      .qt-h { margin: 0 0 10px; font-family: var(--font-kufi), sans-serif; font-size: 18px; color: #f1d77a; text-align: center; }
      .qt-big { margin: 8px 0; font-family: var(--font-kufi), sans-serif; font-size: 30px; color: #fff1c4; }
      .qt-sub { color: rgba(255,241,196,.7); font-family: var(--font-ruqaa), serif; }
      .qt-meta { display: flex; justify-content: space-between; font-family: var(--font-kufi), sans-serif; font-size: 13px; color: #e8c25a; padding: 0 4px; }
      .qt-label { margin: 12px 0 6px; font-family: var(--font-ruqaa), serif; font-size: 15px; color: rgba(255,241,196,.7); }
      .qt-text { font-family: 'KFGQPC Hafs', serif; font-size: 26px; line-height: 2.2; color: #f7ebc1; direction: rtl; text-align: center; margin: 6px 0; }
      .qt-sep { height: 1px; background: rgba(232,194,90,.25); margin: 8px 0; }
      .qt-blank { display: inline-block; min-width: 2.2em; padding: 0 .3em; border-radius: 10px; border: 1.5px dashed rgba(232,194,90,.7); background: rgba(232,194,90,.1); color: rgba(232,194,90,.7); font-family: var(--font-kufi), sans-serif; font-size: .7em; }
      .qt-btn { width: 100%; padding: 13px 8px; border-radius: 14px; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.12); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 15px; margin-top: 10px; }
      .qt-main { background: rgba(232,194,90,.28); }
      .qt-row { display: flex; gap: 10px; }
      .qt-hit { background: rgba(120,200,140,.22); border-color: rgba(120,200,140,.6); color: #cdeed6; }
      .qt-miss { background: rgba(220,110,100,.18); border-color: rgba(220,110,100,.55); color: #f5c9c3; }
      .qt-link { background: none; border: none; color: rgba(241,215,122,.6); font-family: var(--font-ruqaa), serif; font-size: 15px; padding: 6px; }
      .qt-field { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; flex: 1; }
      .qt-field span { font-family: var(--font-ruqaa), serif; font-size: 15px; color: rgba(255,241,196,.7); }
      .qt-field { min-width: 0; }
      .qt-field select, .qt-field input { width: 100%; min-width: 0; box-sizing: border-box; padding: 11px 12px; border-radius: 12px; border: 1px solid rgba(232,194,90,.35); background: rgba(0,0,0,.45); color: #fff1c4; font-family: var(--font-kufi), sans-serif; font-size: 15px; }
      .qt-two { display: flex; gap: 10px; width: 100%; }
      .qt-two > * { min-width: 0; }
      .qt-modes { display: flex; flex-direction: column; gap: 8px; }
      .qt-mode { display: flex; flex-direction: column; gap: 2px; text-align: right; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.25); background: transparent; color: rgba(241,215,122,.85); font-family: var(--font-kufi), sans-serif; }
      .qt-mode small { font-family: var(--font-ruqaa), serif; font-size: 13px; color: rgba(255,241,196,.55); }
      .qt-mode.on { background: rgba(232,194,90,.2); border-color: rgba(232,194,90,.8); }
      .qt-chips { display: flex; gap: 8px; }
      .qt-chip { flex: 1; padding: 9px; border-radius: 12px; border: 1px solid rgba(232,194,90,.3); background: transparent; color: rgba(241,215,122,.8); font-family: var(--font-kufi), sans-serif; }
      .qt-chip.on { background: rgba(232,194,90,.25); color: #fff1c4; border-color: rgba(232,194,90,.8); }
      .qt-check { display: flex; gap: 8px; align-items: center; margin: 12px 0 0; color: rgba(255,241,196,.8); font-family: var(--font-ruqaa), serif; font-size: 16px; }
    `}</style>
  );
}
