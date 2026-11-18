'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

export type Sec = {
  id: string;
  label: string;
  icon: string;
  /** وصف قصير يظهر تحت اسم القسم داخل البطاقة */
  hint?: string;
  /** المحتوى: دالة علشان ما يتحمّلش غير لما القسم يتفتح */
  render: () => ReactNode;
  /** يفضل شغّال (مخفي) حتى لو القسم مقفول — للأقسام اللي ليها مهام خلفية */
  keepMounted?: boolean;
  hidden?: boolean;
};

/**
 * شبكة أيقونات: كل قسم أيقونة صغيرة منظمة، ولما تدوس عليها يفتح محتواها
 * (بدل ما كل المحتوى يتفرد على الشاشة). زر الرجوع في الجهاز يقفل القسم.
 */
export function SectionGrid({
  secs,
  onOpenChange,
  command,
}: {
  secs: Sec[];
  onOpenChange?: (id: string | null) => void;
  /** فتح قسم برمجيًا (مثلًا من الفهرس إلى المصحف). غيّر n لتنفيذ الأمر. */
  command?: { id: string; n: number } | null;
}) {
  const gid = useId();
  const [open, setOpen] = useState<string | null>(null);
  const cb = useRef(onOpenChange);
  cb.current = onOpenChange;

  const set = useCallback((id: string | null) => {
    setOpen(id);
    cb.current?.(id);
  }, []);

  // زر الرجوع بالجهاز / المتصفح
  useEffect(() => {
    function onPop(e: PopStateEvent) {
      const st = (e.state || {}) as Record<string, string>;
      set(st[gid] ?? null);
      try {
        window.scrollTo({ top: 0 });
      } catch {}
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [gid, set]);

  const lastCmd = useRef(0);
  useEffect(() => {
    if (command && command.n !== lastCmd.current) {
      lastCmd.current = command.n;
      openSec(command.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);

  function openSec(id: string) {
    try {
      history.pushState({ ...(history.state || {}), [gid]: id }, '');
    } catch {}
    set(id);
    try {
      window.scrollTo({ top: 0 });
    } catch {}
  }

  function back() {
    let pushed = false;
    try {
      pushed = !!(history.state && (history.state as Record<string, string>)[gid]);
    } catch {}
    if (pushed) history.back();
    else set(null);
  }

  const visible = secs.filter((s) => !s.hidden);
  const cur = visible.find((s) => s.id === open) || null;

  return (
    <div className="sg">
      {!cur && (
        <nav className="sg-grid" aria-label="الأقسام">
          {visible.map((s) => (
            <button key={s.id} type="button" className="sg-tile" onClick={() => openSec(s.id)}>
              <span className="sg-ico" aria-hidden="true">
                {s.icon}
              </span>
              <span className="sg-lbl">{s.label}</span>
              {s.hint && <span className="sg-hint">{s.hint}</span>}
            </button>
          ))}
        </nav>
      )}

      {cur && (
        <div className="sg-bar">
          <button type="button" className="sg-back" onClick={back} aria-label="رجوع">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="sg-bar-ico" aria-hidden="true">{cur.icon}</span>
          <span className="sg-bar-title">{cur.label}</span>
        </div>
      )}

      {visible.map((s) => {
        const on = s.id === open;
        if (!on && !s.keepMounted) return null;
        return (
          <div key={s.id} className="sg-body" hidden={!on}>
            {s.render()}
          </div>
        );
      })}

      <style>{`
        .sg-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin: 0 0 8px;
        }
        .sg-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 9px;
          padding: 16px 6px 13px;
          min-height: 118px;
          border-radius: 22px;
          border: 1px solid rgba(232, 194, 90, 0.34);
          background:
            radial-gradient(120% 90% at 50% 0%, rgba(232, 194, 90, 0.14), rgba(232, 194, 90, 0.03) 70%),
            rgba(18, 15, 8, 0.78);
          color: #f1d77a;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.12s ease, border-color 0.2s ease;
        }
        .sg-tile:active { transform: scale(0.95); border-color: rgba(232, 194, 90, 0.7); }
        .sg-ico {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(232, 194, 90, 0.14);
          border: 1px solid rgba(232, 194, 90, 0.28);
          font-size: 26px;
          line-height: 1;
        }
        .sg-lbl {
          font-family: var(--font-kufi), sans-serif;
          font-weight: 700;
          font-size: 14.5px;
          line-height: 1.35;
          text-align: center;
        }
        .sg-hint {
          font-family: var(--font-ruqaa), serif;
          font-size: 12.5px;
          line-height: 1.4;
          color: rgba(255, 241, 196, 0.6);
          text-align: center;
        }
        .sg-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 14px;
          padding: 8px 10px;
          border-radius: 18px;
          border: 1px solid rgba(232, 194, 90, 0.28);
          background: rgba(18, 15, 8, 0.78);
          position: sticky;
          top: 8px;
          z-index: 6;
        }
        .sg-back {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(232, 194, 90, 0.4);
          background: rgba(232, 194, 90, 0.12);
          color: #f1d77a;
          cursor: pointer;
        }
        .sg-bar-ico { font-size: 20px; }
        .sg-bar-title {
          font-family: var(--font-kufi), sans-serif;
          font-weight: 700;
          font-size: 17px;
          color: #f1d77a;
        }
        .sg-body[hidden] { display: none; }
      `}</style>
    </div>
  );
}
