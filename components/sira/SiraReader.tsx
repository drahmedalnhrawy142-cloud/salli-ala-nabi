'use client';

import { useEffect, useRef, useState } from 'react';
import { lsGet, lsSet, toAr } from '@/components/quran/data';
import { blockText, loadChapter, type Chapter, type SiraIndex } from './data';

const SIZES = [17, 19, 21, 24];

export function SiraReader({
  ix,
  ch,
  at,
  hl,
  go,
  onPos,
  onMark,
}: {
  ix: SiraIndex;
  ch: number;
  /** الكتلة المطلوب الوصول إليها (أو null للبداية) */
  at: number | null;
  /** كتلة تُبرَز لحظيًا (نتيجة بحث) */
  hl: number | null;
  go: (c: number, k: number | null) => void;
  onPos: (c: number, k: number) => void;
  onMark: (c: number, k: number, text: string) => void;
}) {
  const [data, setData] = useState<Chapter | null>(null);
  const [err, setErr] = useState(false);
  const [size, setSize] = useState<number>(() => lsGet('sira_size', 1));
  const [subs, setSubs] = useState(false);
  const [toast, setToast] = useState('');
  const body = useRef<HTMLDivElement>(null);
  const top = useRef(0);
  const meta = ix.chapters[ch];

  useEffect(() => {
    let live = true;
    setData(null);
    setErr(false);
    setSubs(false);
    loadChapter(ix, ch)
      .then((d) => live && setData(d))
      .catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, [ix, ch]);

  // الوصول إلى الموضع المطلوب بعد تحميل الباب
  useEffect(() => {
    if (!data) return;
    top.current = at ?? 0;
    requestAnimationFrame(() => {
      const el = at != null ? body.current?.querySelector<HTMLElement>(`[data-k="${at}"]`) : null;
      if (el) el.scrollIntoView({ block: 'start' });
      else {
        try {
          window.scrollTo({ top: 0 });
        } catch {}
      }
    });
  }, [data, at, ch]);

  // حفظ موضع القراءة: أعلى كتلة ظاهرة
  useEffect(() => {
    if (!data || !body.current || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.isIntersecting) {
            const k = Number((e.target as HTMLElement).dataset.k);
            if (!Number.isNaN(k) && k >= 0) {
              top.current = k;
            }
          }
        }
      },
      { rootMargin: '0px 0px -75% 0px' },
    );
    body.current.querySelectorAll('[data-k]').forEach((n) => io.observe(n));
    const t = setInterval(() => onPos(ch, top.current), 2500);
    return () => {
      clearInterval(t);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ch]);

  // حفظ الموضع عند الخروج من القارئ (لا عند تغيير الباب)
  const chRef = useRef(ch);
  chRef.current = ch;
  const posCb = useRef(onPos);
  posCb.current = onPos;
  useEffect(() => {
    return () => posCb.current(chRef.current, top.current);
  }, []);

  function pickSize(d: number) {
    const n = Math.min(SIZES.length - 1, Math.max(0, size + d));
    setSize(n);
    lsSet('sira_size', n);
  }

  function mark() {
    const k = top.current;
    const b = data?.b[k];
    onMark(ch, k, b ? blockText(b).slice(0, 90) : meta.t);
    setToast('تمت إضافة علامة');
    setTimeout(() => setToast(''), 1600);
  }

  const total = ix.chapters.length;
  const fs = SIZES[size];

  return (
    <div className="sr" style={{ ['--sr-fs' as string]: `${fs}px` }}>
      <div className="sr-tools">
        <button type="button" onClick={() => pickSize(-1)} aria-label="تصغير الخط" disabled={size === 0}>
          أ-
        </button>
        <button type="button" onClick={() => pickSize(1)} aria-label="تكبير الخط" disabled={size === SIZES.length - 1}>
          أ+
        </button>
        <button type="button" onClick={mark} aria-label="علامة هنا">
          🔖 علامة
        </button>
        {meta.subs.length > 0 && (
          <button type="button" onClick={() => setSubs((v) => !v)} className={subs ? 'on' : ''}>
            ☰ الفصول
          </button>
        )}
      </div>

      <h2 className="sr-title">{meta.t}</h2>
      <p className="sr-pg">
        الباب {toAr(ch + 1)} من {toAr(total)} • ج{toAr(meta.pg[0])} ص {toAr(meta.pg[1])}
      </p>

      {subs && (
        <div className="sr-subs">
          {meta.subs.map(([t, k], n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setSubs(false);
                go(ch, k);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {err && <p className="sr-msg">تعذّر تحميل النص. تأكد من الاتصال وأعد المحاولة.</p>}
      {!data && !err && <p className="sr-msg">جارٍ التحميل…</p>}

      <div ref={body} className="sr-body">
        {data?.b.map((b, k) => {
          const cls = hl === k ? ' sr-hl' : '';
          if (typeof b === 'string') {
            return (
              <p key={k} data-k={k} className={`sr-p${cls}`}>
                {b}
              </p>
            );
          }
          if (Array.isArray(b)) {
            return (
              <div key={k} data-k={k} className={`sr-v${cls}`}>
                <span>{b[0]}</span>
                <span>{b[1]}</span>
              </div>
            );
          }
          return (
            <h3 key={k} data-k={k} className={`sr-h${cls}`}>
              {b.h}
            </h3>
          );
        })}
      </div>

      {data && (
        <div className="sr-nav">
          <button type="button" disabled={ch === 0} onClick={() => go(ch - 1, null)}>
            ‹ الباب السابق
          </button>
          <button type="button" disabled={ch === total - 1} onClick={() => go(ch + 1, null)}>
            الباب التالي ›
          </button>
        </div>
      )}
      {toast && <div className="sr-toast">{toast}</div>}

      <style>{`
        .sr-tools { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }
        .sr-tools button {
          padding: 8px 14px; border-radius: 14px; font-family: var(--font-kufi), sans-serif; font-size: 14px;
          border: 1px solid rgba(232,194,90,.35); background: rgba(232,194,90,.1); color: #f1d77a; cursor: pointer;
        }
        .sr-tools button.on { background: rgba(232,194,90,.28); }
        .sr-tools button:disabled { opacity: .4; }
        .sr-title { font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 20px; line-height: 1.7; color: #f1d77a; margin: 4px 0 4px; }
        .sr-pg { font-family: var(--font-kufi), sans-serif; font-size: 12.5px; color: rgba(255,241,196,.55); margin: 0 0 14px; }
        .sr-subs { display: flex; flex-direction: column; gap: 6px; margin: 0 0 16px; padding: 10px; border-radius: 16px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.85); max-height: 46vh; overflow: auto; }
        .sr-subs button { text-align: right; padding: 9px 10px; border-radius: 10px; border: 0; background: transparent; color: #f7ebc1; font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 1.6; border-bottom: 1px solid rgba(232,194,90,.12); }
        .sr-msg { text-align: center; color: #f1d77a; font-family: var(--font-ruqaa), serif; font-size: 18px; padding: 24px 0; }
        .sr-body { direction: rtl; }
        .sr-p { font-family: var(--font-ruqaa), serif; font-size: var(--sr-fs); line-height: 2.15; color: #f7ebc1; margin: 0 0 14px; text-align: justify; }
        .sr-h { font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: calc(var(--sr-fs) - 2px); line-height: 1.8; color: #e8c25a; margin: 22px 0 10px; padding-right: 10px; border-right: 3px solid rgba(232,194,90,.6); }
        .sr-v { display: flex; justify-content: space-between; gap: 14px; margin: 0 0 8px; padding: 8px 12px; border-radius: 12px; background: rgba(232,194,90,.07); font-family: var(--font-ruqaa), serif; font-size: calc(var(--sr-fs) - 1px); line-height: 2; color: #f1d77a; }
        .sr-v span { flex: 1; text-align: center; }
        .sr-hl { animation: srflash 2.6s ease-out; }
        @keyframes srflash { 0%, 60% { background: rgba(232,194,90,.32); } 100% { background: transparent; } }
        .sr-nav { display: flex; gap: 10px; margin: 20px 0 6px; }
        .sr-nav button { flex: 1; padding: 13px 8px; border-radius: 16px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.12); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 14.5px; cursor: pointer; }
        .sr-nav button:disabled { opacity: .35; }
        .sr-toast { position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%); padding: 10px 18px; border-radius: 20px; background: rgba(18,15,8,.95); border: 1px solid rgba(232,194,90,.5); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 14px; z-index: 30; }
      `}</style>
    </div>
  );
}
