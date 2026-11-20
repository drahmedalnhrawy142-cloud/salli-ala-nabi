'use client';

import { useEffect, useRef, useState } from 'react';
import { RECITERS, ayahUrl, audioSrc, deleteSurah, downloadSurah, surahDownloaded } from './audio';
import { toAr, type QData } from './data';

const REPEATS = [1, 3, 5, 10, 0]; // 0 = بلا حد

function lsGet(k: string, d: string) {
  try {
    return localStorage.getItem(k) || d;
  } catch {
    return d;
  }
}
function lsSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}

/** مشغّل التلاوة: آية بآية مع التكرار للحفظ والانتقال التلقائي، وتحميل السورة للاستماع بلا نت */
export function AyahPlayer({
  data,
  idx,
  setIdx,
  goPage,
  onClose,
}: {
  data: QData;
  idx: number;
  setIdx: (i: number | null) => void;
  goPage: (p: number) => void;
  onClose: () => void;
}) {
  const au = useRef<HTMLAudioElement | null>(null);
  const [rid, setRid] = useState(() => lsGet('quran_reciter', 'husary'));
  const [rep, setRep] = useState(() => Number(lsGet('quran_repeat', '1')));
  const [cont, setCont] = useState(() => lsGet('quran_cont', '1') === '1');
  const [playing, setPlaying] = useState(false);
  const [round, setRound] = useState(1);
  const [msg, setMsg] = useState('');
  const [dl, setDl] = useState<{ done: number; total: number } | null>(null);
  const [have, setHave] = useState(false);
  const stop = useRef({ v: false });
  const rec = RECITERS.find((r) => r.id === rid) || RECITERS[0];
  const a = data.ayas[idx];
  const sura = data.suras[a[0] - 1];
  const st = useRef({ rep, cont, round, idx });
  st.current = { rep, cont, round, idx };

  // تشغيل الآية الحالية
  useEffect(() => {
    let live = true;
    const el = au.current!;
    setMsg('');
    (async () => {
      const { src, local } = await audioSrc(ayahUrl(rec, a[0], a[1]));
      if (!live) return;
      el.src = src;
      try {
        await el.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
        if (!local) setMsg('تعذّر التشغيل. تأكد من الاتصال، أو حمّل السورة للاستماع بلا نت.');
      }
    })();
    return () => {
      live = false;
      el.pause();
      if (el.src.startsWith('blob:')) URL.revokeObjectURL(el.src);
    };
  }, [idx, rid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    surahDownloaded(rec, a[0], sura.ayas).then(setHave);
  }, [rec, a, sura.ayas, dl]);

  useEffect(
    () => () => {
      stop.current.v = true;
    },
    []
  );

  function ended() {
    const s = st.current;
    if (s.rep === 0 || s.round < s.rep) {
      setRound(s.round + 1);
      const el = au.current!;
      el.currentTime = 0;
      el.play().catch(() => {});
      return;
    }
    setRound(1);
    const next = s.idx + 1;
    if (s.cont && next < data.ayas.length) {
      setIdx(next);
      if (data.ayas[next][2] !== data.ayas[s.idx][2]) goPage(data.ayas[next][2]);
    } else setPlaying(false);
  }

  function toggle() {
    const el = au.current!;
    if (el.paused) el.play().then(() => setPlaying(true)).catch(() => {});
    else {
      el.pause();
      setPlaying(false);
    }
  }
  function step(d: number) {
    const n = idx + d;
    if (n < 0 || n >= data.ayas.length) return;
    setRound(1);
    setIdx(n);
    if (data.ayas[n][2] !== a[2]) goPage(data.ayas[n][2]);
  }

  async function download() {
    stop.current = { v: false };
    setDl({ done: 0, total: sura.ayas });
    const r = await downloadSurah(rec, a[0], sura.ayas, (d) => setDl({ done: d, total: sura.ayas }), stop.current);
    setDl(null);
    setMsg(r === 'ok' ? 'تم تحميل السورة، تعمل الآن بلا نت' : r === 'stopped' ? 'أُوقف التحميل' : 'تعذّر التحميل. تأكد من الاتصال وحاول مرة أخرى.');
  }
  async function remove() {
    await deleteSurah(rec, a[0], sura.ayas);
    setHave(false);
    setMsg('حُذفت السورة من جهازك');
  }

  return (
    <div className="ap" role="region" aria-label="التلاوة">
      <audio ref={au} onEnded={ended} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} preload="auto" />
      <div className="ap-top">
        <b>
          {sura.name} • آية {toAr(a[1])}
          {rep !== 1 && <em> ({rep === 0 ? '∞' : `${toAr(round)}/${toAr(rep)}`})</em>}
        </b>
        <button type="button" className="ap-x" onClick={onClose} aria-label="إغلاق المشغّل">
          ✕
        </button>
      </div>
      <div className="ap-ctl">
        <button type="button" onClick={() => step(-1)} aria-label="الآية السابقة">⏭</button>
        <button type="button" className="ap-play" onClick={toggle} aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'}>
          {playing ? '⏸' : '▶'}
        </button>
        <button type="button" onClick={() => step(1)} aria-label="الآية التالية">⏮</button>
      </div>
      <div className="ap-row">
        <select value={rid} onChange={(e) => (setRid(e.target.value), lsSet('quran_reciter', e.target.value))} aria-label="القارئ">
          <optgroup label="رواية حفص عن عاصم">
            {RECITERS.filter((r) => r.riwaya === 'hafs').map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="رواية ورش عن نافع">
            {RECITERS.filter((r) => r.riwaya === 'warsh').map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </optgroup>
        </select>
        <select
          value={rep}
          onChange={(e) => (setRep(Number(e.target.value)), setRound(1), lsSet('quran_repeat', e.target.value))}
          aria-label="تكرار الآية للحفظ"
        >
          {REPEATS.map((n) => (
            <option key={n} value={n}>
              {n === 1 ? 'بلا تكرار' : n === 0 ? 'تكرار مستمر' : `كرّر ${toAr(n)} مرات`}
            </option>
          ))}
        </select>
      </div>
      <div className="ap-row">
        <label className="ap-ck">
          <input type="checkbox" checked={cont} onChange={(e) => (setCont(e.target.checked), lsSet('quran_cont', e.target.checked ? '1' : '0'))} />
          أكمل للآية التالية
        </label>
        {dl ? (
          <button type="button" onClick={() => (stop.current.v = true)}>
            إيقاف التحميل ({toAr(dl.done)}/{toAr(dl.total)})
          </button>
        ) : have ? (
          <button type="button" onClick={remove}>✓ محمّلة — حذف</button>
        ) : (
          <button type="button" onClick={download}>⬇ حمّل السورة للاستماع بلا نت</button>
        )}
      </div>
      {rec.riwaya === 'warsh' && (
        <div className="ap-msg">رواية ورش: النص المعروض بحفص، فقد تختلف بعض الكلمات عمّا تسمعه.</div>
      )}
      {msg && <div className="ap-msg">{msg}</div>}
      <div className="ap-n">التلاوات من everyayah.com — حقوقها لأصحابها.</div>
      <style>{`
        .ap { position: fixed; left: 8px; right: 8px; bottom: 76px; z-index: 28; padding: 10px 12px; border-radius: 18px; border: 1px solid rgba(232,194,90,.5); background: rgba(18,15,8,.97); box-shadow: 0 8px 30px rgba(0,0,0,.6); font-family: var(--font-kufi), sans-serif; color: #f7ebc1; }
        .ap-top { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #f1d77a; }
        .ap-top em { font-style: normal; color: #7fe0c0; }
        .ap-x { background: none; border: 0; color: #f1d77a; font-size: 16px; padding: 4px 8px; }
        .ap-ctl { display: flex; justify-content: center; gap: 18px; margin: 6px 0; }
        .ap-ctl button { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.08); color: #f1d77a; font-size: 18px; }
        .ap-ctl .ap-play { width: 54px; height: 54px; background: rgba(232,194,90,.25); font-size: 22px; }
        .ap-row { display: flex; gap: 8px; align-items: center; margin-top: 6px; }
        .ap-row select, .ap-row button { flex: 1; min-width: 0; padding: 8px; border-radius: 12px; border: 1px solid rgba(232,194,90,.35); background: #1a1409; color: #f7ebc1; font-family: inherit; font-size: 12.5px; }
        .ap-ck { flex: 1; display: flex; gap: 6px; align-items: center; font-size: 12.5px; }
        .ap-msg { margin-top: 6px; font-size: 12.5px; color: #ffd9a0; text-align: center; }
        .ap-n { margin-top: 4px; text-align: center; font-size: 10.5px; color: rgba(255,241,196,.4); }
      `}</style>
    </div>
  );
}
