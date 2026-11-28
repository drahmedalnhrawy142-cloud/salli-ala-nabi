'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadIndex, loadKit, type K, type Kit } from '@/components/ilm/sources';
import { allBooks } from '@/components/ilm/books';
import { setLast, toggleFav, useFavs } from '@/components/ilm/ilmStore';
import { addMark, getPos, removeMark, setPos, useMarks } from '@/components/ilm/bookStore';
import { toAr } from '@/components/quran/data';

/**
 * قارئ الكتب: صفحات حقيقية يُقلَّب بينها، وورق وخط على طراز زمن الكتاب (مخطوطة ← طبعة حديثة).
 * - اسحب بإصبعك أو المس طرف الصفحة لتقليبها، والفهرس يقلّب لك الصفحات حتى الباب المطلوب.
 * - شريط الإشارة أعلى الصفحة لعلامة المكان، والضغط المطوّل على فقرة يظلّلها ويحفظها في المفضلة.
 * التقسيم إلى صفحات يتم بأعمدة CSS (column-fill: auto) فيناسب أي حجم شاشة وخط.
 */
type Th = { key: string; name: string; p1: string; p2: string; ink: string; rub: string; grain: number; vig: number; cover: string };
const THEMES: Th[] = [
  { key: 'ms', name: 'مخطوطة قديمة', p1: '#d8bd86', p2: '#c4a064', ink: '#1c1006', rub: '#8e1b16', grain: 0.4, vig: 0.55, cover: '#3b2412' },
  { key: 'old', name: 'ورق عتيق', p1: '#e0c791', p2: '#d0b074', ink: '#1f1308', rub: '#962218', grain: 0.3, vig: 0.42, cover: '#4a2a14' },
  { key: 'mid', name: 'ورق قديم', p1: '#e9d6a4', p2: '#dcc58c', ink: '#21160a', rub: '#9a2a1c', grain: 0.22, vig: 0.3, cover: '#2b3a2c' },
  { key: 'print', name: 'طبعة قديمة', p1: '#f0e4c4', p2: '#e6d6ac', ink: '#1c130a', rub: '#842018', grain: 0.14, vig: 0.18, cover: '#1f2f4a' },
  { key: 'new', name: 'طبعة حديثة', p1: '#f8f2e3', p2: '#efe6cf', ink: '#17110a', rub: '#7a2318', grain: 0.05, vig: 0.08, cover: '#3a1c24' },
];
const NIGHT = { p1: '#241b10', p2: '#1b140a', ink: '#ecdeb4', rub: '#e2a65c' };

/** سنة وفاة المؤلف الهجرية من نص مثل «(ت ٣٢١هـ)» */
export function eraYear(author: string): number | null {
  const m = author.match(/ت[^٠-٩0-9]*([٠-٩0-9]+)/);
  if (!m) return null;
  const n = Number(m[1].replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
  return Number.isFinite(n) ? n : null;
}
export function themeOf(y: number | null): Th {
  if (y == null) return THEMES[4];
  return y <= 250 ? THEMES[0] : y <= 450 ? THEMES[1] : y <= 750 ? THEMES[2] : y <= 1100 ? THEMES[3] : THEMES[4];
}

type F = { k: 't' } | { k: 's'; ki: number; bi: number; pg: number } | { k: 'b' };
type Pos = { ki: number; bi: number; pg: number };
type Info = { pages: number; starts: number[] };
type Anim = { dir: 'next' | 'prev'; base: F; leaves: F[]; to: Pos | null };

const esc = (s: string) => s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
const MZ = /(أبو حنيفة|أبي حنيفة|الحنفية|مالك|المالكية|الشافعي|الشافعية|أحمد|الحنابلة)/g;
const MC = (w: string) => (/حنيف|الحنفية/.test(w) ? 'h' : /مالك/.test(w) ? 'm' : /شافع/.test(w) ? 's' : 'b');
function secHtml(sec: { t: string; e: string[] }, hl: Set<number>, fiqh = false) {
  let h = `<h2 class="bk-h"><i>❖</i>${esc(sec.t)}<i>❖</i></h2>`;
  sec.e.forEach((t0, i) => {
    const kind = t0.charCodeAt(0) === 1 ? 'sub' : t0.charCodeAt(0) === 2 ? 'po' : '';
    const t = kind ? t0.slice(1) : t0;
    const m = kind ? null : t.match(/^\((\d+)\)\s*([\s\S]*)$/);
    const color = (x: string) => (fiqh ? esc(x).replace(MZ, (w) => `<b class="mz ${MC(w)}">${w}</b>`) : esc(x));
    const body = m ? `<b class="bk-n">${toAr(Number(m[1]))}</b> ${color(m[2])}` : color(t);
    const cls = [kind, hl.has(i) ? 'hl' : ''].filter(Boolean).join(' ');
    h += `<p data-oi="${i}"${cls ? ` class="${cls}"` : ''}>${body}</p>`;
  });
  return h;
}
const lsg = (k: string, d: string) => {
  try {
    return localStorage.getItem(k) || d;
  } catch {
    return d;
  }
};
const lss = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};
const FONTS: Record<string, { n: string; v: string }> = {
  amiri: { n: 'أميري', v: "var(--f-amiri), 'Amiri', 'Noto Naskh Arabic', serif" },
  naskh: { n: 'نسخ', v: "var(--f-naskh), 'Noto Naskh Arabic', 'Amiri', serif" },
  schehe: { n: 'شهرزاد', v: "var(--f-schehe), 'Scheherazade New', 'Amiri', serif" },
  ruqaa: { n: 'رقعة', v: "var(--font-ruqaa), 'Amiri', serif" },
};
const FONT_KEYS = Object.keys(FONTS);
const FLIP = 640;
const STAG = 85;

export function BookReader({
  dir,
  title,
  author: authorP,
  sub: subP,
  year,
  fiqh = false,
  onBack,
  backLabel = '← المكتبة',
  start,
}: {
  dir: string;
  title: string;
  author?: string;
  sub?: string;
  year?: number | null;
  fiqh?: boolean;
  onBack: () => void;
  backLabel?: string;
  start?: { ki: number; bi: number | null };
}) {
  const [meta, setMeta] = useState<{ author: string; sub: string } | null>(null);
  useEffect(() => {
    if (authorP != null) return;
    allBooks().then((l) => {
      const m = l.find((x) => x.dir === dir);
      if (m) setMeta({ author: m.author || '', sub: m.sub || '' });
    }).catch(() => {});
  }, [dir, authorP]);
  const author = authorP ?? meta?.author ?? '';
  const sub = subP ?? meta?.sub ?? '';
  const th = themeOf(year !== undefined ? year : author ? eraYear(author) : null);
  const [night, setNight] = useState(() => lsg('bk.night', '0') === '1');
  const [fs, setFs] = useState(() => Number(lsg('bk.fs', '19')));
  const [ft, setFt] = useState(() => lsg('bk.font', 'amiri'));
  const [jf, setJf] = useState(() => lsg('bk.just', '1'));
  const [lh, setLh] = useState(() => Number(lsg('bk.lh', '2.02')));
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [rw, setRw] = useState(0);
  const [vh, setVh] = useState(0);
  const [idx, setIdx] = useState<K[] | null>(null);
  const [err, setErr] = useState(false);
  const kits = useRef(new Map<number, Kit>());
  const meas = useRef(new Map<string, Info>());
  const [, bump] = useState(0);
  const [pos, setP] = useState<Pos | null>(null); // ki = -1 → صفحة العنوان
  const [anim, setAnim] = useState<Anim | null>(null);
  const [sheet, setSheet] = useState<null | 'toc' | 'marks'>(null);
  const [openKi, setOpenKi] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const favs = useFavs();
  const marks = useMarks();
  const busy = useRef(false);
  const gest = useRef<{ x: number; y: number; lp: boolean; tm: number; el: EventTarget | null } | null>(null);

  const W = Math.max(250, Math.min((rw || 340) - 26, 440));
  const H = Math.max(380, Math.min((vh || 760) - 262, 720));
  const PADX = 22;
  const Wi = W - PADX * 2;
  const Hi = H - 76;
  const dimKey = `${Wi}x${Hi}x${fs}x${lh}x${ft}x${jf}`;

  useEffect(() => {
    const up = () => {
      setRw(root.current?.clientWidth || 340);
      setVh(window.innerHeight);
    };
    up();
    window.addEventListener('resize', up);
    return () => window.removeEventListener('resize', up);
  }, []);
  useEffect(() => {
    loadIndex(dir).then(setIdx).catch(() => setErr(true));
  }, [dir]);

  // تغيّر الخط/المقاس يُبطل حساب الصفحات
  const lastDim = useRef('');
  if (lastDim.current !== dimKey) {
    lastDim.current = dimKey;
    meas.current.clear();
  }
  useEffect(() => {
    const d = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!d) return;
    const on = () => {
      meas.current.clear();
      bump((n) => n + 1);
    };
    d.addEventListener?.('loadingdone', on);
    return () => d.removeEventListener?.('loadingdone', on);
  }, []);

  const getKit = useCallback(
    async (ki: number) => {
      let k = kits.current.get(ki);
      if (!k) {
        k = await loadKit(dir, ki);
        kits.current.set(ki, k);
      }
      return k;
    },
    [dir]
  );

  /** يحسب عدد صفحات الباب وبداية كل فقرة (رقم الصفحة) بعرضه خفيةً بنفس القياس */
  const measure = useCallback(
    async (ki: number, bi: number): Promise<Info> => {
      const key = `${ki}:${bi}`;
      const hit = meas.current.get(key);
      if (hit) return hit;
      const kit = await getKit(ki);
      const sec = kit.b[bi];
      const h = host.current!;
      h.innerHTML = secHtml(sec, new Set(), fiqh);
      const right = h.getBoundingClientRect().right;
      const starts: number[] = [];
      let pages = 1;
      h.querySelectorAll('p[data-oi]').forEach((p) => {
        const rs = p.getClientRects();
        if (!rs.length) {
          starts.push(starts.length ? starts[starts.length - 1] : 0);
          return;
        }
        const c0 = Math.max(0, Math.round((right - rs[0].right) / Wi));
        const c1 = Math.max(0, Math.round((right - rs[rs.length - 1].right) / Wi));
        starts.push(c0);
        pages = Math.max(pages, c1 + 1);
      });
      const info = { pages, starts };
      meas.current.set(key, info);
      return info;
    },
    [getKit, Wi]
  );

  const pageAt = useCallback(
    async (ki: number, bi: number, oi: number, off: number): Promise<Pos> => {
      const m = await measure(ki, bi);
      const base = m.starts[Math.min(oi, m.starts.length - 1)] ?? 0;
      return { ki, bi, pg: Math.max(0, Math.min(m.pages - 1, base + off)) };
    },
    [measure]
  );

  // البداية: من حيث توقّف القارئ، أو من الباب المطلوب، أو من صفحة العنوان
  const inited = useRef(false);
  useEffect(() => {
    if (!idx || !rw || inited.current) return;
    inited.current = true;
    (async () => {
      try {
        if (start && start.ki != null) {
          await getKit(start.ki);
          setP({ ki: start.ki, bi: start.bi ?? 0, pg: 0 });
          return;
        }
        const sp = getPos(dir);
        if (sp && idx[sp.ki]) {
          const kit = await getKit(sp.ki);
          if (kit.b[sp.bi]) {
            setP(await pageAt(sp.ki, sp.bi, sp.oi, sp.off));
            return;
          }
        }
        setP({ ki: -1, bi: 0, pg: 0 });
      } catch {
        setErr(true);
      }
    })();
  }, [idx, rw, dir, start, getKit, pageAt]);

  // حفظ الموضع ومتابعة القراءة
  useEffect(() => {
    if (!pos || pos.ki < 0) return;
    const kit = kits.current.get(pos.ki);
    const m = meas.current.get(`${pos.ki}:${pos.bi}`);
    if (!kit || !kit.b[pos.bi]) return;
    let oi = 0;
    if (m) for (let i = 0; i < m.starts.length; i++) if (m.starts[i] <= pos.pg) oi = i;
    const off = m ? Math.max(0, pos.pg - (m.starts[oi] ?? 0)) : 0;
    setPos(dir, { ki: pos.ki, bi: pos.bi, oi, off });
    setLast({ dir, ki: pos.ki, bi: pos.bi, label: `${title} ‹ ${kit.b[pos.bi].t}` });
  }, [pos, dir, title]);

  const say = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(''), 1600);
  };

  const nextOf = useCallback(
    async (p: Pos): Promise<Pos | null> => {
      if (!idx) return null;
      if (p.ki < 0) {
        await getKit(0);
        return { ki: 0, bi: 0, pg: 0 };
      }
      const m = await measure(p.ki, p.bi);
      if (p.pg + 1 < m.pages) return { ...p, pg: p.pg + 1 };
      const kit = await getKit(p.ki);
      if (p.bi + 1 < kit.b.length) return { ki: p.ki, bi: p.bi + 1, pg: 0 };
      if (p.ki + 1 < idx.length) {
        const k2 = await getKit(p.ki + 1);
        return k2.b.length ? { ki: p.ki + 1, bi: 0, pg: 0 } : null;
      }
      return null;
    },
    [idx, getKit, measure]
  );
  const prevOf = useCallback(
    async (p: Pos): Promise<Pos | null> => {
      if (p.ki < 0) return null;
      if (p.pg > 0) return { ...p, pg: p.pg - 1 };
      if (p.bi > 0) {
        const m = await measure(p.ki, p.bi - 1);
        return { ki: p.ki, bi: p.bi - 1, pg: m.pages - 1 };
      }
      if (p.ki > 0) {
        const k2 = await getKit(p.ki - 1);
        const bi = k2.b.length - 1;
        const m = await measure(p.ki - 1, bi);
        return { ki: p.ki - 1, bi, pg: m.pages - 1 };
      }
      return { ki: -1, bi: 0, pg: 0 };
    },
    [getKit, measure]
  );

  const run = useCallback((a: Anim, n: number) => {
    busy.current = true;
    setAnim(a);
    window.setTimeout(() => {
      if (a.to) setP(a.to);
      setAnim(null);
      busy.current = false;
    }, FLIP + Math.max(0, n - 1) * STAG + 60);
  }, []);

  const toF = (p: Pos): F => (p.ki < 0 ? { k: 't' } : { k: 's', ki: p.ki, bi: p.bi, pg: p.pg });

  const turn = useCallback(
    async (dir2: 'next' | 'prev') => {
      if (busy.current || !pos || anim) return;
      busy.current = true;
      try {
        const t = dir2 === 'next' ? await nextOf(pos) : await prevOf(pos);
        if (!t) {
          busy.current = false;
          say(dir2 === 'next' ? 'هذه آخر صفحة في الكتاب' : 'هذه أول صفحة');
          return;
        }
        if (t.ki >= 0) await measure(t.ki, t.bi);
        busy.current = false;
        run(dir2 === 'next' ? { dir: 'next', base: toF(t), leaves: [toF(pos)], to: t } : { dir: 'prev', base: toF(pos), leaves: [toF(t)], to: t }, 1);
      } catch (e) {
        console.error('book', e);
        busy.current = false;
        setErr(true);
      }
    },
    [pos, anim, nextOf, prevOf, measure, run]
  );

  /** ينتقل إلى مكان بعيد مع تقليب عدة أوراق متتابعة */
  const goTo = useCallback(
    async (ki: number, bi: number, oi = 0, off = 0) => {
      if (busy.current || !pos) return;
      busy.current = true;
      setSheet(null);
      try {
        await getKit(ki);
        const t = await pageAt(ki, bi, oi, off);
        const fwd = pos.ki < 0 || t.ki > pos.ki || (t.ki === pos.ki && (t.bi > pos.bi || (t.bi === pos.bi && t.pg > pos.pg)));
        const dist = Math.abs(t.ki - pos.ki) * 4 + Math.abs(t.bi - pos.bi) + Math.abs(t.pg - pos.pg);
        const n = Math.max(1, Math.min(8, dist + 1));
        busy.current = false;
        if (dist === 0 && pos.ki >= 0) return;
        const blanks: F[] = Array.from({ length: n - 1 }, () => ({ k: 'b' }));
        run(
          fwd ? { dir: 'next', base: toF(t), leaves: [toF(pos), ...blanks], to: t } : { dir: 'prev', base: toF(pos), leaves: [...blanks, toF(t)], to: t },
          n
        );
      } catch (e) {
        console.error('book', e);
        busy.current = false;
        setErr(true);
      }
    },
    [pos, getKit, pageAt, run]
  );

  const hlOf = (ki: number, bi: number) => {
    const s = new Set<number>();
    const pre = `${dir}|${ki}|${bi}|`;
    favs.forEach((f) => {
      if (f.id.startsWith(pre)) s.add(Number(f.id.slice(pre.length)));
    });
    return s;
  };

  const curInfo = pos && pos.ki >= 0 ? meas.current.get(`${pos.ki}:${pos.bi}`) : undefined;
  const anchor = (p: Pos) => {
    const m = meas.current.get(`${p.ki}:${p.bi}`);
    let oi = 0;
    if (m) for (let i = 0; i < m.starts.length; i++) if (m.starts[i] <= p.pg) oi = i;
    return { oi, off: m ? Math.max(0, p.pg - (m.starts[oi] ?? 0)) : 0 };
  };
  const marked =
    pos && pos.ki >= 0
      ? marks.find((m) => {
          if (m.dir !== dir || m.ki !== pos.ki || m.bi !== pos.bi) return false;
          const inf = meas.current.get(`${m.ki}:${m.bi}`);
          if (!inf) return false;
          const pg = Math.min(inf.pages - 1, (inf.starts[Math.min(m.oi, inf.starts.length - 1)] ?? 0) + m.off);
          return pg === pos.pg;
        })
      : undefined;
  function toggleMark() {
    if (!pos || pos.ki < 0) return say('الإشارة تكون داخل صفحات الكتاب');
    if (marked) {
      removeMark(marked.id);
      return say('رُفعت الإشارة');
    }
    const kit = kits.current.get(pos.ki)!;
    const a = anchor(pos);
    addMark({ dir, book: title, ki: pos.ki, bi: pos.bi, oi: a.oi, off: a.off, where: kit.b[pos.bi].t, t: kit.b[pos.bi].e[a.oi] || '' });
    say('وُضعت إشارة في هذه الصفحة');
  }
  function holdPara(p: HTMLElement) {
    if (!pos || pos.ki < 0) return;
    const oi = Number(p.dataset.oi);
    const kit = kits.current.get(pos.ki)!;
    const sec = kit.b[pos.bi];
    const had = hlOf(pos.ki, pos.bi).has(oi);
    toggleFav({ id: `${dir}|${pos.ki}|${pos.bi}|${oi}`, dir, ki: pos.ki, bi: pos.bi, book: title, where: `${kit.t === title ? '' : kit.t + ' ‹ '}${sec.t}`, t: sec.e[oi] });
    say(had ? 'أُزيل التظليل' : 'ظُلّلت الفقرة وحُفظت في المفضلة');
  }

  function down(e: React.PointerEvent) {
    const g = { x: e.clientX, y: e.clientY, lp: false, tm: 0, el: e.target };
    g.tm = window.setTimeout(() => {
      const p = (g.el as HTMLElement)?.closest?.('p[data-oi]') as HTMLElement | null;
      if (p && gest.current === g) {
        g.lp = true;
        holdPara(p);
      }
    }, 520);
    gest.current = g;
  }
  function move(e: React.PointerEvent) {
    const g = gest.current;
    if (g && g.tm && (Math.abs(e.clientX - g.x) > 12 || Math.abs(e.clientY - g.y) > 12)) {
      clearTimeout(g.tm);
      g.tm = 0;
    }
  }
  function up(e: React.PointerEvent) {
    const g = gest.current;
    gest.current = null;
    if (!g) return;
    clearTimeout(g.tm);
    if (g.lp) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) return void turn(dx > 0 ? 'next' : 'prev');
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      if (x < 0.3) turn('next');
      else if (x > 0.7) turn('prev');
    }
  }

  const css: Record<string, string | number> = {
    '--p1': night ? NIGHT.p1 : th.p1,
    '--p2': night ? NIGHT.p2 : th.p2,
    '--ink': night ? NIGHT.ink : th.ink,
    '--rub': night ? NIGHT.rub : th.rub,
    '--grain': night ? 0.06 : th.grain,
    '--vig': night ? 0.5 : th.vig,
    '--cover': th.cover,
    '--lh': lh,
    '--f': FONTS[ft]?.v || FONTS.amiri.v,
    '--ta': jf === '1' ? 'justify' : 'right',
    '--fs': `${fs}px`,
    '--W': `${W}px`,
    '--H': `${H}px`,
    '--Wi': `${Wi}px`,
    '--Hi': `${Hi}px`,
  };
  const grain = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 .42  0 0 0 0 .3  0 0 0 0 .14  0 0 0 1 0'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>")`;

  function face(f: F, live: boolean) {
    if (f.k === 't')
      return (
        <div className="bk-pg bk-ti">
          <div className="bk-fr">
            <div className="bk-or">❖ ✦ ❖</div>
            <h1>{title}</h1>
            {author && <div className="bk-au">{author}</div>}
            {sub && <div className="bk-sb">{sub}</div>}
            <div className="bk-or sm">— {th.name} —</div>
            <div className="bk-hint">اقلب الصفحة ‹</div>
          </div>
        </div>
      );
    if (f.k === 'b')
      return (
        <div className="bk-pg">
          <div className="bk-rh"><span>{title}</span></div>
          <div className="bk-vw"><div className="bk-fake" /></div>
        </div>
      );
    const kit = kits.current.get(f.ki);
    const sec = kit?.b[f.bi];
    if (!sec) return <div className="bk-pg" />;
    const info = meas.current.get(`${f.ki}:${f.bi}`);
    return (
      <div className="bk-pg">
        <div className="bk-rh">
          <span>{title.length > 28 ? title.slice(0, 27) + '…' : title}</span>
          <span>{kit!.t === title ? '' : kit!.t.length > 26 ? kit!.t.slice(0, 25) + '…' : kit!.t}</span>
        </div>
        <div className="bk-vw">
          <div className="bk-cols" style={{ transform: `translateX(${f.pg * Wi}px)` }} dangerouslySetInnerHTML={{ __html: secHtml(sec, hlOf(f.ki, f.bi), fiqh) }} />
        </div>
        <div className="bk-ft">
          <i>❖</i> {toAr(f.pg + 1)}
          {info ? <small> / {toAr(info.pages)}</small> : null} <i>❖</i>
        </div>
        {live && (
          <button type="button" className={`bk-rib${marked ? ' on' : ''}`} onClick={toggleMark} aria-label={marked ? 'رفع الإشارة' : 'وضع إشارة'} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} />
        )}
      </div>
    );
  }

  const total = idx ? idx.reduce((a, k) => a + k.n, 0) || 1 : 1;
  const prog =
    idx && pos
      ? pos.ki < 0
        ? 0
        : (idx.slice(0, pos.ki).reduce((a, k) => a + k.n, 0) + ((pos.bi + (curInfo ? pos.pg / curInfo.pages : 0)) / Math.max(1, kits.current.get(pos.ki)?.b.length || 1)) * idx[pos.ki].n) / total
      : 0;

  if (err) return (
    <div className="bk" style={css as React.CSSProperties}>
      <button type="button" className="bk-bk" onClick={onBack}>{backLabel}</button>
      <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل الكتاب.</p>
    </div>
  );

  const myMarks = marks.filter((m) => m.dir === dir);
  const myHl = favs.filter((f) => f.dir === dir);

  return (
    <div className="bk" ref={root} style={css as React.CSSProperties}>
      <div className="bk-bar">
        <button type="button" className="bk-bk" onClick={onBack}>{backLabel}</button>
        <div className="bk-tools">
          <button type="button" onClick={() => setSheet('toc')} aria-label="الفهرس">☰ الفهرس</button>
          <button type="button" onClick={() => setSheet('marks')} aria-label="العلامات">🔖 {myMarks.length + myHl.length || ''}</button>
          <button type="button" onClick={() => (setFs((v) => (lss('bk.fs', String(Math.max(15, v - 1))), Math.max(15, v - 1))))} aria-label="تصغير الخط">أ−</button>
          <button type="button" onClick={() => (setFs((v) => (lss('bk.fs', String(Math.min(30, v + 1))), Math.min(30, v + 1))))} aria-label="تكبير الخط">أ+</button>
          <button type="button" onClick={() => setFt((v) => { const n = FONT_KEYS[(FONT_KEYS.indexOf(v) + 1) % FONT_KEYS.length]; lss('bk.font', n); return n; })} aria-label="نوع الخط">خط: {FONTS[ft]?.n}</button>
          <button type="button" onClick={() => setJf((v) => { const n = v === '1' ? '0' : '1'; lss('bk.just', n); return n; })} aria-label="ضبط الأسطر">{jf === '1' ? '☰ ضبط' : '☰ يمين'}</button>
          <button type="button" onClick={() => setLh((v) => { const n = v < 1.8 ? 2.02 : v < 2.2 ? 2.4 : 1.65; lss('bk.lh', String(n)); return n; })} aria-label="تباعد الأسطر">☰↕</button>
          <button type="button" onClick={() => (setNight((n) => (lss('bk.night', n ? '0' : '1'), !n)))} aria-label="وضع الليل">{night ? '☀' : '☾'}</button>
        </div>
      </div>

      <div className="bk-desk">
        <div className="bk-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { if (gest.current) clearTimeout(gest.current.tm); gest.current = null; }}>
          {!pos || !idx ? (
            <div className="bk-pg" style={{ display: 'grid', placeItems: 'center' }}>جارٍ فتح الكتاب…</div>
          ) : anim ? (
            <>
              <div className="bk-under">{face(anim.base, false)}<div className="bk-cast" /></div>
              {anim.leaves.map((lf, i) => {
                const nxt = anim.dir === 'next';
                const n = anim.leaves.length;
                return (
                  <div key={i} className={`bk-leaf ${nxt ? 'nx' : 'pv'}`} style={{ animationDelay: `${i * STAG}ms`, zIndex: nxt ? n - i + 2 : i + 2 }}>
                    <div className="bk-fa">{face(lf, false)}<div className="bk-sh" /></div>
                    <div className="bk-ba"><div className="bk-pg"><div className="bk-vw"><div className="bk-fake" style={{ opacity: 0.5 }} /></div></div></div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="bk-live">{face(toF(pos), true)}</div>
          )}
          {toast && <div className="bk-toast">{toast}</div>}
        </div>
      </div>

      <div className="bk-nav">
        <button type="button" onClick={() => turn('prev')} aria-label="الصفحة السابقة">›</button>
        <div className="bk-pn">
          {pos && pos.ki >= 0 && kits.current.get(pos.ki) ? (
            <>
              <b>{kits.current.get(pos.ki)!.b[pos.bi]?.t}</b>
              <div className="bk-pr"><i style={{ width: `${Math.round(prog * 100)}%` }} /></div>
            </>
          ) : (
            <b>صفحة العنوان</b>
          )}
        </div>
        <button type="button" onClick={() => turn('next')} aria-label="الصفحة التالية">‹</button>
      </div>
      <div className="bk-hl">اضغط مطوّلًا على فقرة لتظليلها · اسحب أو المس طرف الصفحة لتقليبها · الشريط الأحمر للإشارة</div>

      <div className="bk-clip" aria-hidden="true"><div className="bk-cols bk-meas" ref={host} /></div>

      {sheet && (
        <div className="bk-sheet" onClick={() => setSheet(null)}>
          <div className="bk-card" onClick={(e) => e.stopPropagation()}>
            <div className="bk-tabs">
              <button type="button" className={sheet === 'toc' ? 'on' : ''} onClick={() => setSheet('toc')}>الفهرس</button>
              <button type="button" className={sheet === 'marks' ? 'on' : ''} onClick={() => setSheet('marks')}>العلامات ({toAr(myMarks.length + myHl.length)})</button>
              <button type="button" className="x" onClick={() => setSheet(null)} aria-label="إغلاق">✕</button>
            </div>
            <div className="bk-lst">
              {sheet === 'toc' && idx && (
                <>
                  <button type="button" className="bk-it" onClick={() => { setSheet(null); if (pos && pos.ki >= 0) run({ dir: 'prev', base: toF(pos), leaves: [{ k: 'b' }, { k: 'b' }, { k: 't' }], to: { ki: -1, bi: 0, pg: 0 } }, 3); }}>
                    ✦ صفحة العنوان
                  </button>
                  {idx.length === 1 ? (
                    <TocSecs ki={0} getKit={getKit} onPick={(b) => goTo(0, b)} />
                  ) : (
                    idx.map((k, i) => (
                      <div key={i}>
                        <button type="button" className="bk-it hd" onClick={() => setOpenKi(openKi === i ? null : i)}>
                          <span>{k.t}</span>
                          <small>{toAr(k.b)} باب {openKi === i ? '▴' : '▾'}</small>
                        </button>
                        {openKi === i && <TocSecs ki={i} getKit={getKit} onPick={(b) => goTo(i, b)} />}
                      </div>
                    ))
                  )}
                </>
              )}
              {sheet === 'marks' && (
                <>
                  {!myMarks.length && !myHl.length && <p className="bk-em">لا علامات بعد. ضع شريط الإشارة على صفحة، أو اضغط مطوّلًا على فقرة لتظليلها.</p>}
                  {myMarks.map((m) => (
                    <div key={m.id} className="bk-mk">
                      <button type="button" onClick={() => goTo(m.ki, m.bi, m.oi, m.off)}>
                        <b>🔖 {m.where}</b>
                        <span>{m.t.slice(0, 90)}…</span>
                      </button>
                      <button type="button" className="d" onClick={() => removeMark(m.id)} aria-label="حذف">✕</button>
                    </div>
                  ))}
                  {myHl.map((f) => (
                    <div key={f.id} className="bk-mk">
                      <button type="button" onClick={() => goTo(f.ki, f.bi, Number(f.id.split('|').pop()), 0)}>
                        <b>✎ {f.where}</b>
                        <span>{f.t.slice(0, 90)}…</span>
                      </button>
                      <button type="button" className="d" onClick={() => toggleFav({ id: f.id, dir: f.dir, ki: f.ki, bi: f.bi, book: f.book, where: f.where, t: f.t })} aria-label="إزالة">✕</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bk { --f: var(--f-amiri), var(--font-ruqaa), 'Amiri', 'Noto Naskh Arabic', serif; font-family: var(--font-kufi), sans-serif; color: #fff1c4; position: relative; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; padding-bottom: 96px; }
        .bk-bar { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 8px; }
        .bk-bk { background: none; border: 0; color: #f1d77a; font-family: inherit; font-size: 14px; padding: 6px 0; }
        .bk-tools { display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end; }
        .bk-tools button { padding: 6px 9px; border-radius: 10px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: inherit; font-size: 12.5px; }
        .bk-desk { padding: 18px 0 22px; border-radius: 14px; background: radial-gradient(ellipse at 50% 30%, #2a1a0c, #0b0704 85%); box-shadow: inset 0 0 40px rgba(0,0,0,.8); display: flex; justify-content: center; }
        .bk-stage { position: relative; width: var(--W); height: var(--H); perspective: 1900px; touch-action: pan-y; overflow: hidden; border-radius: 3px 8px 8px 3px;
          box-shadow: -2px 2px 0 #e9dcb4, -3px 3px 0 #b9a36c, -4px 4px 0 #ecdfb8, -5px 5px 0 #b9a36c, -6px 6px 0 #e9dcb4, -7px 7px 0 #b9a36c, -8px 8px 0 var(--cover), -9px 9px 0 var(--cover), -10px 10px 0 var(--cover), -11px 11px 0 color-mix(in srgb, var(--cover) 70%, #000), 5px 2px 0 var(--cover), 7px 3px 0 color-mix(in srgb, var(--cover) 70%, #000), 0 22px 30px rgba(0,0,0,.75); }
        .bk-live, .bk-under { position: absolute; inset: 0; }
        .bk-pg { position: relative; width: var(--W); height: var(--H); box-sizing: border-box; background: ${grain}, radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(60,30,5,var(--vig)) 130%), linear-gradient(170deg, var(--p1), var(--p2)); background-blend-mode: multiply, normal, normal; color: var(--ink); font-family: var(--f); direction: rtl; overflow: hidden; box-shadow: -1px 0 0 rgba(0,0,0,.18), -3px 0 0 var(--p2), -4px 0 0 rgba(0,0,0,.22), -6px 0 0 var(--p2), -7px 0 0 rgba(0,0,0,.25); }
        .bk-pg::before { content: ''; position: absolute; inset: 0; background: linear-gradient(270deg, rgba(40,20,0,.38), transparent 11%); pointer-events: none; z-index: 3; }
        .bk-pg::after { content: ''; position: absolute; inset: 9px 12px 9px 16px; border: 1px solid color-mix(in srgb, var(--ink) 45%, transparent); outline: 1px solid color-mix(in srgb, var(--ink) 20%, transparent); outline-offset: 3px; pointer-events: none; opacity: .65; }
        .bk-rh { position: absolute; top: 14px; left: 26px; right: 66px; display: flex; justify-content: space-between; font-size: 12px; color: color-mix(in srgb, var(--ink) 70%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--ink) 25%, transparent); padding-bottom: 3px; }
        .bk-vw { position: absolute; top: 40px; right: 24px; width: var(--Wi); height: var(--Hi); overflow: hidden; }
        .bk-cols, .bk-meas { direction: rtl; column-width: var(--Wi); column-gap: 0; column-fill: auto; width: var(--Wi); height: var(--Hi); font-size: var(--fs); line-height: var(--lh); text-align: var(--ta); word-spacing: .04em; hyphens: none; }
        .bk-clip { position: absolute; top: 0; right: 0; width: 0; height: 0; overflow: hidden; pointer-events: none; }
        .bk-meas { position: absolute; top: 0; right: 0; visibility: hidden; font-family: var(--f); color: var(--ink); }
        .bk-cols p, .bk-meas p { margin: 0 0 .35em; text-indent: 1.3em; orphans: 2; widows: 2; font-family: var(--f); }
        .bk-cols p.sub, .bk-meas p.sub { text-indent: 0; text-align: center; font-weight: 700; color: var(--rub); margin: .5em 0 .3em; break-after: avoid; }
        .bk-cols p.po, .bk-meas p.po { text-indent: 0; text-align: center; margin: .2em 0 .5em; font-size: .96em; }
        .bk-cols p.hl { background: color-mix(in srgb, #f3c640 42%, transparent); border-radius: 3px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
        .bk-cols .mz { font-weight: 700; } .mz.h { color: #0b6b50; } .mz.m { color: #a65a10; } .mz.s { color: #1a4f9c; } .mz.b { color: #7a2a9e; }
        .bk-cols .bk-n, .bk-meas .bk-n { color: var(--rub); font-weight: 700; }
        .bk-cols .bk-h, .bk-meas .bk-h { padding: .25em 0; border-top: 1px solid color-mix(in srgb, var(--rub) 55%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--rub) 55%, transparent); box-shadow: 0 3px 0 -2px color-mix(in srgb, var(--rub) 30%, transparent), 0 -3px 0 -2px color-mix(in srgb, var(--rub) 30%, transparent); margin: 0 0 .7em; text-align: center; font-size: 1.12em; line-height: 1.7; font-weight: 700; color: var(--rub); break-after: avoid; }
        .bk-h i { font-style: normal; font-size: .6em; opacity: .75; margin: 0 .5em; }
        .bk-ft { position: absolute; bottom: 15px; left: 0; right: 0; text-align: center; font-size: 14px; font-weight: 700; color: var(--rub); }
        .bk-ft i { font-style: normal; font-size: 9px; opacity: .7; margin: 0 6px; } .bk-ft small { font-weight: 400; opacity: .7; }
        .bk-fake { width: 100%; height: 100%; background: repeating-linear-gradient(180deg, transparent 0 22px, color-mix(in srgb, var(--ink) 18%, transparent) 22px 24px); opacity: .5; }
        .bk-ti .bk-fr { position: absolute; inset: 24px 28px 24px 32px; border: 3px double var(--rub); display: flex; flex-direction: column; align-items: center; justify-content: space-around; text-align: center; padding: 16px 12px; z-index: 1; }
        .bk-ti h1 { margin: 0; font-size: 31px; line-height: 1.6; color: var(--rub); text-shadow: 0 1px 0 rgba(255,255,255,.25); }
        .bk-au { font-size: 19px; font-weight: 700; } .bk-sb { font-size: 15px; opacity: .85; line-height: 1.8; }
        .bk-or { font-size: 20px; color: var(--rub); letter-spacing: 6px; } .bk-or.sm { font-size: 13px; letter-spacing: 0; opacity: .8; }
        .bk-hint { font-size: 12.5px; opacity: .6; }
        .bk-rib { position: absolute; top: -4px; right: 34px; width: 20px; height: 44px; border: 0; padding: 0; z-index: 6; background: linear-gradient(180deg,#a8201c,#7a1010); clip-path: polygon(0 0,100% 0,100% 100%,50% 78%,0 100%); filter: drop-shadow(0 2px 2px rgba(0,0,0,.5)); opacity: .6; transition: opacity .2s, height .25s; height: 30px; }
        .bk-rib.on { opacity: 1; height: 58px; }
        .bk-leaf { position: absolute; inset: 0; transform-origin: right center; transform-style: preserve-3d; animation-duration: ${FLIP}ms; animation-fill-mode: both; animation-timing-function: cubic-bezier(.45,.05,.3,1); }
        .bk-leaf.nx { animation-name: bk-nx; } .bk-leaf.pv { animation-name: bk-pv; }
        @keyframes bk-nx { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }
        @keyframes bk-pv { from { transform: rotateY(180deg); } to { transform: rotateY(0deg); } }
        .bk-fa, .bk-ba { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .bk-ba { transform: rotateY(180deg); filter: brightness(.9); }
        .bk-sh { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,.45), rgba(0,0,0,0) 60%); opacity: 0; animation: bk-shade ${FLIP}ms both; pointer-events: none; z-index: 5; }
        .bk-leaf.pv .bk-sh { animation-direction: reverse; }
        @keyframes bk-shade { 0% { opacity: 0 } 55% { opacity: .55 } 100% { opacity: .15 } }
        .bk-cast { position: absolute; inset: 0; background: linear-gradient(270deg, rgba(0,0,0,.4), transparent 45%); animation: bk-cast ${FLIP}ms both; z-index: 4; pointer-events: none; }
        @keyframes bk-cast { from { opacity: 1 } to { opacity: 0 } }
        .bk-toast { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); z-index: 20; padding: 7px 14px; border-radius: 20px; background: rgba(20,14,6,.92); color: #f1d77a; font-size: 12.5px; white-space: nowrap; font-family: var(--font-kufi), sans-serif; }
        .bk-nav { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
        .bk-nav > button { width: 46px; height: 46px; border-radius: 50%; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.12); color: #f1d77a; font-size: 24px; }
        .bk-pn { flex: 1; min-width: 0; text-align: center; font-size: 13.5px; color: #f1d77a; }
        .bk-pn b { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
        .bk-pr { height: 4px; margin-top: 6px; border-radius: 3px; background: rgba(232,194,90,.18); overflow: hidden; direction: rtl; } .bk-pr i { display: block; height: 100%; background: #e8c25a; }
        .bk-hl { margin-top: 8px; text-align: center; font-size: 11px; color: rgba(255,241,196,.45); line-height: 1.7; }
        .bk-sheet { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.7); display: flex; align-items: flex-end; }
        .bk-card { width: 100%; max-height: 82vh; background: #14100a; border-top: 2px solid #c99a2e; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; }
        .bk-tabs { display: flex; gap: 6px; padding: 10px 12px 6px; }
        .bk-tabs button { flex: 1; padding: 9px; border-radius: 12px; border: 1px solid rgba(232,194,90,.3); background: transparent; color: #f1d77a; font-family: inherit; font-size: 14px; }
        .bk-tabs button.on { background: rgba(232,194,90,.2); } .bk-tabs .x { flex: none; width: 42px; }
        .bk-lst { overflow-y: auto; padding: 6px 12px 28px; }
        .bk-it { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px; text-align: right; padding: 12px 14px; margin-bottom: 7px; border-radius: 12px; border: 1px solid rgba(232,194,90,.25); background: rgba(232,194,90,.05); color: #fff1c4; font-family: inherit; font-size: 14.5px; }
        .bk-it.hd { background: rgba(232,194,90,.12); } .bk-it small { color: #7fe0c0; font-size: 11.5px; white-space: nowrap; }
        .bk-it.sub { margin-right: 14px; width: calc(100% - 14px); font-size: 13.5px; }
        .bk-mk { display: flex; gap: 6px; margin-bottom: 7px; }
        .bk-mk button:first-child { flex: 1; text-align: right; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(232,194,90,.25); background: rgba(232,194,90,.05); color: #fff1c4; font-family: inherit; }
        .bk-mk b { display: block; color: #e8c25a; font-size: 13.5px; font-weight: 500; } .bk-mk span { font-size: 12.5px; opacity: .8; line-height: 1.7; font-family: var(--f); }
        .bk-mk .d { width: 40px; border-radius: 12px; border: 1px solid rgba(232,194,90,.25); background: transparent; color: #ffb36b; }
        .bk-em { text-align: center; opacity: .7; font-size: 13px; line-height: 1.9; padding: 20px 8px; }
      `}</style>
    </div>
  );
}

function TocSecs({ ki, getKit, onPick }: { ki: number; getKit: (ki: number) => Promise<Kit>; onPick: (bi: number) => void }) {
  const [k, setK] = useState<Kit | null>(null);
  useEffect(() => {
    let live = true;
    getKit(ki).then((d) => live && setK(d)).catch(() => {});
    return () => {
      live = false;
    };
  }, [ki, getKit]);
  if (!k) return <p className="bk-em">جارٍ التحميل…</p>;
  return (
    <>
      {k.b.map((b, i) => (
        <button key={i} type="button" className="bk-it sub" onClick={() => onPick(i)}>
          <span>{b.t}</span>
          <small>{toAr(b.e.length)}</small>
        </button>
      ))}
    </>
  );
}
