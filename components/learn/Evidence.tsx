'use client';

import { useEffect, useState } from 'react';

/**
 * الدليل: نقتبس من نصوص الأحاديث الموجودة في التطبيق نفسه (public/hadith)، لا من الذاكرة.
 * نبحث عن عبارة داخل الحديث (بإهمال التشكيل) ونعرض مقطعًا حولها مع رقم الحديث.
 */
const DIA = new RegExp('[' + ['\\u064b-\\u065f', '\\u0670', '\\u0640', '\\u060c', '"', "'", '\\u00ab', '\\u00bb', '.', ',', ':', '\\u061b', '\\-', '\\u2013', '\\u2014', '\\(', '\\)'].join('') + ']');
const NORM: Record<string, string> = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ة': 'ه' };

function normMap(s: string) {
  let out = '';
  const idx: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (DIA.test(ch)) continue;
    if (/\s/.test(ch) && (out === '' || out.endsWith(' '))) continue;
    out += /\s/.test(ch) ? ' ' : NORM[ch] || ch;
    idx.push(i);
  }
  return { out, idx };
}

export function excerpt(text: string, phrase: string, len = 170) {
  const a = normMap(text);
  const p = normMap(phrase).out;
  const at = a.out.indexOf(p);
  if (at < 0) return null;
  const start = a.idx[at];
  let end = Math.min(text.length, start + len + phrase.length);
  while (end < text.length && !/\s/.test(text[end])) end++;
  return (start > 0 ? '… ' : '') + text.slice(start, end).trim() + (end < text.length ? ' …' : '');
}

const cache: Record<string, Promise<[string, string][]>> = {};
function load(coll: string, file: number) {
  const k = coll + '/' + file;
  if (!cache[k]) {
    cache[k] = fetch(`/hadith/${coll}/${file}.json`).then((r) => r.json());
  }
  return cache[k];
}

const EV_CSS = `
        .ev { margin: 8px 0 0; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(232,194,90,.28); border-right: 3px solid #e8c25a; background: rgba(232,194,90,.07); }
        .ev-t { font-family: var(--f-amiri), var(--font-ruqaa), serif; font-size: 1.12rem; line-height: 2; color: #fff1c4; }
        .ev cite { display: block; margin-top: 4px; font-family: var(--font-kufi), sans-serif; font-style: normal; font-size: .78rem; color: #c9a24a; }
`;

export type Ev = { coll: 'bukhari' | 'muslim'; file: number; num: string; phrase: string; len?: number };

export function Evidence({ ev }: { ev: Ev }) {
  const [t, setT] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    load(ev.coll, ev.file)
      .then((d) => {
        const h = d.find((x) => String(x[0]) === ev.num);
        const ex = h ? excerpt(h[1], ev.phrase, ev.len) : null;
        if (live) { if (ex) setT(ex); else setErr(true); }
      })
      .catch(() => live && setErr(true));
    return () => { live = false; };
  }, [ev]);
  if (err) return null;
  return (
    <blockquote className="ev">
      <div className="ev-t">{t ?? '…'}</div>
      <cite>{ev.coll === 'bukhari' ? 'صحيح البخاري' : 'صحيح مسلم'} — حديث رقم {ev.num}</cite>
      <style>{EV_CSS}</style>
    </blockquote>
  );
}

/* ———— آية من المصحف الموجود في التطبيق (رسم حفص) ———— */
let qCache: Promise<Map<string, string>> | null = null;
function loadQ() {
  if (!qCache) {
    qCache = fetch('/quran/hafs.json').then((r) => r.json()).then((h) => {
      const m = new Map<string, string>();
      for (const a of h.ayas) m.set(a[0] + ':' + a[1], a[4]);
      return m;
    });
  }
  return qCache;
}

export function QEvidence({ sura, from, to, name }: { sura: number; from: number; to?: number; name: string }) {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadQ().then((m) => {
      const out: string[] = [];
      for (let i = from; i <= (to || from); i++) { const v = m.get(sura + ':' + i); if (v) out.push(v); }
      if (live && out.length) setT(out.join(' ﴾ ﴿ '));
    }).catch(() => {});
    return () => { live = false; };
  }, [sura, from, to]);
  if (!t) return null;
  return (
    <blockquote className="ev">
      <div className="ev-t">﴿ {t} ﴾</div>
      <style>{EV_CSS}</style>
      <cite>سورة {name} — الآية {to && to !== from ? `${from}–${to}` : from}</cite>
    </blockquote>
  );
}
