'use client';

import { useEffect, useState } from 'react';

type Opt = { id: string; label: string; v: string; serif: boolean };

/** v = متغير الخط المعرَّف في app/fonts.ts */
const DEFAULT_BODY: Opt = { id: 'ruqaa', label: 'رقعة (الافتراضي)', v: '--font-ruqaa', serif: true };
const DEFAULT_HEAD: Opt = { id: 'kufi', label: 'كوفي (الافتراضي)', v: '--font-kufi', serif: false };

const BODY: Opt[] = [
  DEFAULT_BODY,
  { id: 'amiri', label: 'أميري', v: '--f-amiri', serif: true },
  { id: 'naskh', label: 'نسخ', v: '--f-naskh', serif: true },
  { id: 'schehe', label: 'شهرزاد', v: '--f-schehe', serif: true },
  { id: 'cairo', label: 'القاهرة', v: '--f-cairo', serif: false },
  { id: 'tajawal', label: 'تجوّل', v: '--f-tajawal', serif: false },
  { id: 'almarai', label: 'المراعي', v: '--f-almarai', serif: false },
  { id: 'plex', label: 'IBM بلكس', v: '--f-plex', serif: false },
  { id: 'notokufi', label: 'نوتو كوفي', v: '--f-notokufi', serif: false },
];

const HEAD: Opt[] = [
  DEFAULT_HEAD,
  { id: 'notokufi', label: 'نوتو كوفي', v: '--f-notokufi', serif: false },
  { id: 'cairo', label: 'القاهرة', v: '--f-cairo', serif: false },
  { id: 'messiri', label: 'المسيري', v: '--f-messiri', serif: false },
  { id: 'tajawal', label: 'تجوّل', v: '--f-tajawal', serif: false },
  { id: 'amiri', label: 'أميري', v: '--f-amiri', serif: true },
];

const KEYS = { body: 'ui_font_body', head: 'ui_font_head' } as const;
const TARGET = { body: '--font-ruqaa', head: '--font-kufi' } as const;

function apply(kind: 'body' | 'head', o: Opt) {
  const root = document.documentElement.style;
  if ((kind === 'body' && o.id === 'ruqaa') || (kind === 'head' && o.id === 'kufi')) root.removeProperty(TARGET[kind]);
  else root.setProperty(TARGET[kind], `var(${o.v})`);
}

function read(kind: 'body' | 'head'): string {
  try {
    return localStorage.getItem(KEYS[kind]) || '';
  } catch {
    return '';
  }
}

/** اختيار نوع الخط: خط للنصوص وخط للعناوين، ويُحفظ على الجهاز. */
export function FontFamily() {
  const [body, setBody] = useState('ruqaa');
  const [head, setHead] = useState('kufi');

  useEffect(() => {
    const b = read('body');
    const h = read('head');
    if (BODY.some((x) => x.id === b)) setBody(b);
    if (HEAD.some((x) => x.id === h)) setHead(h);
  }, []);

  function pick(kind: 'body' | 'head', o: Opt) {
    if (kind === 'body') setBody(o.id);
    else setHead(o.id);
    apply(kind, o);
    try {
      localStorage.setItem(KEYS[kind], o.id);
    } catch {}
  }

  function reset() {
    setBody('ruqaa');
    setHead('kufi');
    apply('body', DEFAULT_BODY);
    apply('head', DEFAULT_HEAD);
    try {
      localStorage.removeItem(KEYS.body);
      localStorage.removeItem(KEYS.head);
    } catch {}
  }

  const group = (kind: 'body' | 'head', title: string, list: Opt[], cur: string) => (
    <div className="ff-group">
      <h3 className="ff-h">{title}</h3>
      <div className="ff-grid">
        {list.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`ff-opt${o.id === cur ? ' on' : ''}`}
            onClick={() => pick(kind, o)}
            aria-pressed={o.id === cur}
          >
            <span className="ff-sample" style={{ fontFamily: `var(${o.v}), ${o.serif ? 'serif' : 'sans-serif'}`, fontWeight: kind === 'head' ? 700 : 400 }}>
              {kind === 'head' ? 'صلِّ على النبي ﷺ' : 'اللهم صلِّ وسلم على نبينا محمد'}
            </span>
            <span className="ff-name">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="content-card" id="s-fontfam">
      <h2 className="section-title">نوع الخط</h2>
      <p className="ff-note">اختار الخط المريح لعينك. التغيير يشمل النصوص والعناوين في التطبيق، ومصحف القرآن له خطه الثابت.</p>
      {group('body', 'خط النصوص', BODY, body)}
      {group('head', 'خط العناوين', HEAD, head)}
      <button type="button" className="ff-reset" onClick={reset}>
        رجوع للخطوط الافتراضية
      </button>
      <style>{`
        .ff-note { font-family: var(--font-ruqaa), serif; font-size: 15px; line-height: 1.9; color: rgba(255,241,196,.75); margin: 0 0 12px; }
        .ff-h { font-family: var(--font-kufi), sans-serif; font-size: 15px; color: #f1d77a; margin: 14px 0 8px; }
        .ff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .ff-opt { display: flex; flex-direction: column; gap: 6px; align-items: center; padding: 12px 6px; border-radius: 16px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.78); color: #f7ebc1; cursor: pointer; }
        .ff-opt.on { border-color: #f1d77a; background: rgba(232,194,90,.18); }
        .ff-sample { font-size: 17px; line-height: 1.8; text-align: center; }
        .ff-name { font-family: var(--font-kufi), sans-serif; font-size: 12px; color: #e8c25a; }
        .ff-reset { display: block; margin: 16px auto 0; padding: 9px 20px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; font-family: var(--font-kufi), sans-serif; font-weight: 700; cursor: pointer; }
      `}</style>
    </section>
  );
}
