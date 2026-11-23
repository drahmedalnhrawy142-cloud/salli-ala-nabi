// ترجمة التطبيق: عربي (الأصل) / English.
// الفكرة: النصوص العربية في الواجهة بتتبدّل وقت التشغيل من قاموس. النصوص المقدّسة (آيات، أحاديث، أذكار)
// بتفضل عربي زي ما هي، والترجمة بتظهر تحتها (data-en).
import { useSyncExternalStore } from 'react';

export type Lang = 'ar' | 'en';
const KEY = 'ui_lang';
const AR = /[؀-ۿ]/;
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

let lang: Lang = 'ar';
const subs = new Set<() => void>();

function detect(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'ar' || v === 'en') return v;
  } catch {}
  const n = (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || 'ar';
  return n.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function getLang(): Lang {
  return lang;
}
export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => lang,
    () => 'ar' as Lang,
  );
}

const DIG: Record<string, string> = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '٬': ',', '٫': '.' };
const latinDigits = (s: string) => s.replace(/[٠-٩٬٫]/g, (c) => DIG[c]);

const WORDS: Record<string, string> = {
  يناير: 'January', فبراير: 'February', مارس: 'March', أبريل: 'April', إبريل: 'April', مايو: 'May', يونيو: 'June',
  يوليو: 'July', أغسطس: 'August', سبتمبر: 'September', أكتوبر: 'October', نوفمبر: 'November', ديسمبر: 'December',
  السبت: 'Saturday', الأحد: 'Sunday', الإثنين: 'Monday', الاثنين: 'Monday', الثلاثاء: 'Tuesday', الأربعاء: 'Wednesday',
  الخميس: 'Thursday', الجمعة: 'Friday', ص: 'AM', م: 'PM',
};

// أنماط فيها {0} {1} ...
const exact = new Map<string, string>();
const patterns: { re: RegExp; out: string }[] = [];
const trExact = new Map<string, string>();
let loaded = false;
let loading: Promise<void> | null = null;
// القواميس ثقيلة (~٣٠٠ك): بنحمّلها بس لما اللغة تبقى إنجليزي
function loadDict(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (!loading) {
    loading = Promise.all([import('./en/ui'), import('./en/tr')]).then(([u, t]) => {
      for (const [k, v] of Object.entries(u.UI_EN)) {
        const nk = norm(k);
        if (/\{\d\}/.test(nk)) {
          const esc = nk.replace(/[.*+?^$|\\()[\]]/g, '\\$&').replace(/\{\d\}/g, '(.+?)');
          patterns.push({ re: new RegExp('^' + esc + '$'), out: v });
        } else exact.set(nk, v);
      }
      for (const [k, v] of Object.entries(t.TR_EN)) trExact.set(norm(k), v);
      loaded = true;
    });
  }
  return loading;
}

export const missing = new Set<string>();
if (typeof window !== 'undefined') (window as unknown as { __i18nMissing: Set<string> }).__i18nMissing = missing;

export function translate(text: string, depth = 0): string | null {
  if (depth > 3) return null;
  const t = norm(text);
  if (!t || !AR.test(t)) {
    return null;
  }
  const e = exact.get(t);
  if (e !== undefined) return e;
  for (const p of patterns) {
    const m = p.re.exec(t);
    if (!m) continue;
    let ok = true;
    const outs: string[] = [];
    for (let i = 1; i < m.length; i++) {
      const g = m[i] ?? '';
      const tg = translate(g, depth + 1);
      if (tg !== null) outs.push(tg);
      else if (!AR.test(g)) outs.push(latinDigits(g));
      else {
        ok = false;
        break;
      }
    }
    if (ok) return p.out.replace(/\{(\d)\}/g, (_, i) => outs[Number(i)] ?? '');
  }
  // أرقام/مواعيد/شهور
  const parts = t.split(' ');
  const out: string[] = [];
  for (const w of parts) {
    if (/^[\d٠-٩:٬٫.,/\-+×%]+$/.test(w)) out.push(latinDigits(w));
    else if (WORDS[w]) out.push(WORDS[w]);
    else return null;
  }
  return out.join(' ');
}

const originals = new WeakMap<Node, string>();
const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];

function doText(n: Text) {
  const cur = n.data;
  if (!AR.test(cur)) return;
  const t = norm(cur);
  const tr = trExact.get(t);
  if (tr !== undefined) {
    const el = n.parentElement;
    if (el && el.getAttribute('data-en') !== tr) el.setAttribute('data-en', tr);
    return;
  }
  const out = translate(cur);
  if (out === null) {
    missing.add(t);
    return;
  }
  const lead = /^\s*/.exec(cur)![0];
  const trail = /\s*$/.exec(cur)![0];
  const next = lead + out + trail;
  if (next === cur) return; // نفس النص: متلمسوش (وإلا هيعمل حلقة لا نهائية)
  originals.set(n, cur);
  n.data = next;
}

function doAttrs(el: Element) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && AR.test(v)) {
      const out = translate(v);
      if (out !== null) {
        if (!el.hasAttribute('data-ar-' + a)) el.setAttribute('data-ar-' + a, v);
        if (out !== v) el.setAttribute(a, out);
      } else missing.add(norm(v));
    }
  }
}

function walk(root: Node) {
  if (root.nodeType === 3) return doText(root as Text);
  if (root.nodeType !== 1) return;
  const el = root as Element;
  if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
  doAttrs(el);
  el.childNodes.forEach((c) => walk(c));
}

function restoreNode(n: Node) {
  if (n.nodeType === 3) {
    const o = originals.get(n);
    if (o !== undefined) {
      (n as Text).data = o;
      originals.delete(n);
    }
    return;
  }
  if (n.nodeType !== 1) return;
  const el = n as Element;
  for (const a of ATTRS) {
    const o = el.getAttribute('data-ar-' + a);
    if (o !== null) {
      el.setAttribute(a, o);
      el.removeAttribute('data-ar-' + a);
    }
  }
  if (el.hasAttribute('data-en')) el.removeAttribute('data-en');
  el.childNodes.forEach(restoreNode);
}
function restore() {
  restoreNode(document.body);
}

let obs: MutationObserver | null = null;
function startObs() {
  if (obs) return;
  obs = new MutationObserver((muts) => {
    if (lang !== 'en') return;
    for (const m of muts) {
      if (m.type === 'characterData') doText(m.target as Text);
      else if (m.type === 'attributes') doAttrs(m.target as Element);
      else m.addedNodes.forEach((x) => walk(x));
    }
  });
  obs.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });
}

function apply() {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'en' ? 'ltr' : 'rtl';
  if (lang === 'en') {
    document.title = 'Salli ala Nabi ﷺ — Send Blessings upon the Prophet';
    loadDict().then(() => {
      if (lang !== 'en') return;
      startObs();
      walk(document.body);
    });
  } else {
    document.title = 'صل على النبي ﷺ';
    restore();
  }
  subs.forEach((f) => f());
}

export function setLang(l: Lang) {
  lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {}
  apply();
}

export function initI18n() {
  lang = detect();
  apply();
}
