'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent as RMouseEvent, type ReactNode, type TouchEvent as RTouchEvent } from 'react';
import { BASMALA, loadQiraat, lsGet, lsSet, pageAyas, toAr, type QData, type QV } from './data';
import { VerseShare } from './VerseShare';

type Theme = 'night' | 'paper';

export function MushafReader({
  data,
  page,
  setPage,
  focus,
  marks,
  toggleMark,
}: {
  data: QData;
  page: number;
  setPage: (p: number) => void;
  focus: number | null;
  marks: number[];
  toggleMark: (i: number) => void;
}) {
  const [fs, setFs] = useState<number>(() => lsGet('quran_fs', 25));
  const [theme, setTheme] = useState<Theme>(() => lsGet<Theme>('quran_theme', 'night'));
  const [sel, setSel] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [shareIdx, setShareIdx] = useState<number | null>(null);
  const [showQ, setShowQ] = useState<boolean>(() => lsGet('quran_showq', true));
  const [qv, setQv] = useState<QV[]>([]);
  const [qSel, setQSel] = useState<number | null>(null);
  const [jump, setJump] = useState('');
  const touch = useRef<{ x: number; y: number } | null>(null);
  const focusRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!showQ || qv.length) return;
    let live = true;
    loadQiraat()
      .then((d) => live && setQv(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [showQ, qv.length]);

  // آية -> مواضع الاختلاف
  const qmap = useMemo(() => {
    const m = new Map<number, number[]>();
    qv.forEach((e, k) => {
      const l = m.get(e.a);
      if (l) l.push(k);
      else m.set(e.a, [k]);
    });
    return m;
  }, [qv]);

  const idxs = useMemo(() => pageAyas(data, page), [data, page]);
  const juz = idxs.length ? data.ayas[idxs[0]][3] : 1;

  useEffect(() => {
    setSel(null);
    if (focus != null) {
      const t = setTimeout(() => {
        focusRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 120);
      return () => clearTimeout(t);
    }
    try {
      window.scrollTo({ top: 0 });
    } catch {}
  }, [page, focus]);

  function changeFs(d: number) {
    const n = Math.max(18, Math.min(42, fs + d));
    setFs(n);
    lsSet('quran_fs', n);
  }
  function changeTheme() {
    const n: Theme = theme === 'night' ? 'paper' : 'night';
    setTheme(n);
    lsSet('quran_theme', n);
  }
  function go(p: number) {
    if (p < 1 || p > 604) return;
    setPage(p);
  }
  function say(m: string) {
    setToast(m);
    setTimeout(() => setToast(''), 1600);
  }

  function onTap(e: RMouseEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest('[data-i]') as HTMLElement | null;
    if (!el) {
      setSel(null);
      return;
    }
    const i = Number(el.dataset.i);
    const qe = (e.target as HTMLElement).closest('[data-q]') as HTMLElement | null;
    setQSel(qe ? Number(qe.dataset.q) : null);
    setSel((cur) => (cur === i && !qe ? null : i));
  }

  function onTouchStart(e: RTouchEvent) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: RTouchEvent) {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) {
      // المصحف يُقلّب من اليسار لليمين: السحب لليمين = الصفحة التالية
      go(dx > 0 ? page + 1 : page - 1);
    }
  }

  async function copyAya(i: number) {
    const a = data.ayas[i];
    const s = data.suras[a[0] - 1];
    const txt = `﴿${a[4]}﴾ [${s.name}: ${toAr(a[1])}]`;
    try {
      await navigator.clipboard.writeText(txt);
      say('تم نسخ الآية');
    } catch {
      say('تعذّر النسخ');
    }
  }

  const rows: ReactNode[] = [];
  for (const i of idxs) {
    const a = data.ayas[i];
    if (a[1] === 1) {
      const s = data.suras[a[0] - 1];
      rows.push(
        <div className="q-sura" key={`h${i}`}>
          <span>سورة {s.name}</span>
        </div>
      );
      if (a[0] !== 1 && a[0] !== 9) {
        rows.push(
          <div className="q-basmala" key={`b${i}`}>
            {BASMALA}
          </div>
        );
      }
    }
    const words = a[4].split(' ');
    const qs = showQ ? qmap.get(i) : undefined;
    rows.push(
      <span
        key={i}
        data-i={i}
        ref={focus === i ? focusRef : undefined}
        className={`qa${sel === i ? ' qa-sel' : ''}${focus === i ? ' qa-focus' : ''}${marks.includes(i) ? ' qa-mark' : ''}`}
      >
        {words.map((w, k) => (
          <Fragment key={k}>
            {(() => {
              const k2 = qs?.find((q) => k >= qv[q].f && k < qv[q].t);
              return k2 != null ? (
                <span className="qw qw-q" data-q={k2}>
                  {w}
                </span>
              ) : (
                <span className="qw">{w}</span>
              );
            })()}{' '}
          </Fragment>
        ))}
        <span className="qa-n">{toAr(a[1])}</span>{' '}
      </span>
    );
  }

  const suraNames = Array.from(new Set(idxs.map((i) => data.ayas[i][0])))
    .map((n) => data.suras[n - 1].name)
    .join(' • ');

  return (
    <div className={`mr mr-${theme}`}>
      <div className="mr-tools">
        <button type="button" className="mr-btn" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="الصفحة السابقة">
          ›
        </button>
        <form
          className="mr-jump"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(jump.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
            if (n >= 1 && n <= 604) go(n);
            setJump('');
          }}
        >
          <input
            inputMode="numeric"
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            placeholder={`صفحة ${toAr(page)}`}
            aria-label="اذهب إلى صفحة"
          />
        </form>
        <button type="button" className="mr-btn" onClick={() => go(page + 1)} disabled={page >= 604} aria-label="الصفحة التالية">
          ‹
        </button>
        <span className="mr-gap" />
        <button type="button" className="mr-btn mr-sm" onClick={() => changeFs(-1)} aria-label="تصغير الخط">
          أ-
        </button>
        <button type="button" className="mr-btn mr-sm" onClick={() => changeFs(1)} aria-label="تكبير الخط">
          أ+
        </button>
        <button
          type="button"
          className={`mr-btn mr-sm${showQ ? ' mr-on' : ''}`}
          onClick={() => {
            const n = !showQ;
            setShowQ(n);
            lsSet('quran_showq', n);
          }}
          aria-label="علامات اختلاف القراءات"
        >
          ق
        </button>
        <button type="button" className="mr-btn mr-sm" onClick={changeTheme} aria-label="تغيير الخلفية">
          {theme === 'night' ? '☀' : '☾'}
        </button>
      </div>

      <div className="mr-page" onClick={onTap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="mr-head">
          <span>{suraNames}</span>
          <span>الجزء {toAr(juz)}</span>
        </div>
        <div className="mr-text" style={{ fontSize: `${fs}px` }}>
          {rows}
        </div>
        <div className="mr-foot">
          <span className="mr-pn">{toAr(page)}</span>
        </div>
      </div>

      {sel != null && (
        <div className="mr-sheet" role="dialog" aria-label="خيارات الآية">
          <div className="mr-sheet-ref">
            {data.suras[data.ayas[sel][0] - 1].name} • آية {toAr(data.ayas[sel][1])}
          </div>
          {qSel != null && qv[qSel] && (
            <div className="mr-q">
              <div className="mr-q-t">اختلاف في قراءة هذه الكلمة</div>
              <div className="mr-q-r">
                <span>حفص عن عاصم</span>
                <b className="mr-q-h">{data.ayas[qv[qSel].a][4].split(' ').slice(qv[qSel].f, qv[qSel].t).join(' ')}</b>
              </div>
              <div className="mr-q-r">
                <span>شعبة عن عاصم</span>
                <b className="mr-q-s">{qv[qSel].v}</b>
              </div>
              <div className="mr-q-n">من نصوص مجمع الملك فهد الرسمية للروايتين.</div>
            </div>
          )}
          <div className="mr-sheet-btns">
            <button type="button" onClick={() => copyAya(sel)}>
              نسخ
            </button>
            <button
              type="button"
              onClick={() => {
                toggleMark(sel);
                say(marks.includes(sel) ? 'أُزيلت العلامة' : 'تمت إضافة علامة');
              }}
            >
              {marks.includes(sel) ? 'إزالة العلامة' : 'علامة 🔖'}
            </button>
            <button type="button" onClick={() => setShareIdx(sel)}>
              مشاركة 🎴
            </button>
            <button type="button" onClick={() => setSel(null)}>
              إغلاق
            </button>
          </div>
        </div>
      )}
      {toast && <div className="mr-toast">{toast}</div>}
      {shareIdx != null && <VerseShare data={data} idx={shareIdx} onClose={() => setShareIdx(null)} />}

      <style>{`
        .mr { position: relative; }
        .mr-tools {
          display: flex; align-items: center; gap: 8px; margin: 0 0 12px;
          position: sticky; top: 64px; z-index: 5; padding: 6px;
          border-radius: 16px; background: rgba(14,12,6,.92); border: 1px solid rgba(232,194,90,.25);
        }
        .mr-btn {
          min-width: 40px; height: 40px; padding: 0 10px; border-radius: 12px;
          border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a;
          font-family: var(--font-kufi), sans-serif; font-size: 22px; cursor: pointer;
        }
        .mr-btn:disabled { opacity: .35; }
        .mr-on { background: rgba(232,194,90,.32); border-color: #e8c25a; }
        .qw-q { text-decoration: underline dotted #4fc3a1; text-decoration-thickness: 2px; text-underline-offset: 8px; cursor: pointer; }
        .mr-q { margin: 0 0 10px; padding: 10px; border-radius: 14px; border: 1px solid rgba(79,195,161,.5); background: rgba(79,195,161,.08); }
        .mr-q-t { text-align: center; color: #7fe0c0; font-family: var(--font-kufi), sans-serif; font-size: 13px; margin: 0 0 6px; }
        .mr-q-r { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 4px 0; color: rgba(255,241,196,.75); font-family: var(--font-kufi), sans-serif; font-size: 12.5px; }
        .mr-q-h { font-family: 'KFGQPC Hafs', serif; font-size: 24px; color: #fff1c4; font-weight: 400; direction: rtl; }
        .mr-q-s { font-family: 'KFGQPC Shouba', serif; font-size: 24px; color: #fff1c4; font-weight: 400; direction: rtl; }
        .mr-q-n { text-align: center; font-size: 11.5px; color: rgba(255,241,196,.5); font-family: var(--font-ruqaa), serif; margin-top: 4px; }
        .mr-sm { font-size: 15px; min-width: 36px; }
        .mr-gap { flex: 1; }
        .mr-jump { flex: 1.2; min-width: 0; }
        .mr-jump input {
          width: 100%; height: 40px; text-align: center; border-radius: 12px; border: 1px solid rgba(232,194,90,.3);
          background: rgba(0,0,0,.4); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 14px;
        }
        .mr-page {
          border-radius: 22px; padding: 14px 14px 18px; border: 2px solid rgba(232,194,90,.5);
          box-shadow: 0 0 0 5px rgba(232,194,90,.08) inset; user-select: none; -webkit-user-select: none;
        }
        .mr-night .mr-page { background: linear-gradient(180deg, rgba(20,17,8,.96), rgba(10,8,3,.98)); color: #f7ebc1; }
        .mr-paper .mr-page { background: #fbf3dc; color: #1c1405; border-color: #b8923a; }
        .mr-head, .mr-foot {
          display: flex; justify-content: space-between; align-items: center;
          font-family: var(--font-kufi), sans-serif; font-size: 13px; opacity: .75; padding: 0 4px 8px;
        }
        .mr-night .mr-head { color: #e8c25a; }
        .mr-paper .mr-head { color: #7a5a14; }
        .mr-foot { justify-content: center; padding: 10px 0 0; }
        .mr-pn {
          display: inline-grid; place-items: center; min-width: 38px; height: 28px; padding: 0 10px;
          border: 1px solid currentColor; border-radius: 999px; font-size: 14px;
        }
        .mr-text {
          font-family: 'KFGQPC Hafs', 'Aref Ruqaa', serif;
          direction: rtl; text-align: justify; text-align-last: center; line-height: 2.05; word-spacing: .04em;
        }
        .q-sura {
          display: block; margin: 12px 0 6px; padding: 7px 0; text-align: center;
          font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 18px;
          border-radius: 12px; border: 1.5px solid rgba(232,194,90,.7);
          background: linear-gradient(90deg, rgba(232,194,90,.05), rgba(232,194,90,.22), rgba(232,194,90,.05));
          text-align-last: center;
        }
        .mr-night .q-sura { color: #f1d77a; }
        .mr-paper .q-sura { color: #5b4208; }
        .q-basmala { display: block; text-align: center; text-align-last: center; margin: 4px 0 8px; }
        .qa { border-radius: 8px; transition: background .2s; }
        .qa-sel { background: rgba(232,194,90,.25); }
        .qa-focus { background: rgba(120,200,160,.25); }
        .qa-mark .qa-n { background: #e8c25a; color: #1c1405; }
        .qa-n {
          display: inline-grid; place-items: center; width: 1.35em; height: 1.35em; margin: 0 .15em;
          border: 1.5px solid #c9a24a; border-radius: 50%; font-family: var(--font-kufi), sans-serif;
          font-size: .5em; line-height: 1; vertical-align: .35em; color: inherit;
        }
        .mr-sheet {
          position: fixed; left: 12px; right: 12px; bottom: calc(92px + env(safe-area-inset-bottom, 0px)); z-index: 30;
          padding: 12px; border-radius: 20px; background: rgba(18,15,8,.97);
          border: 1px solid rgba(232,194,90,.5); box-shadow: 0 8px 30px rgba(0,0,0,.6);
        }
        .mr-sheet-ref { text-align: center; font-family: var(--font-kufi), sans-serif; color: #f1d77a; margin: 0 0 10px; font-size: 14px; }
        .mr-sheet-btns { display: flex; gap: 8px; }
        .mr-sheet-btns button {
          flex: 1; padding: 11px 6px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4);
          background: rgba(232,194,90,.12); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 14px;
        }
        .mr-toast {
          position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(170px + env(safe-area-inset-bottom, 0px)); z-index: 40;
          background: #f1d77a; color: #1c1405; padding: 8px 16px; border-radius: 999px; font-family: var(--font-kufi), sans-serif; font-size: 13px;
        }
      `}</style>
    </div>
  );
}
