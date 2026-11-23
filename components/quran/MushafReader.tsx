'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent as RMouseEvent, type ReactNode, type TouchEvent as RTouchEvent } from 'react';
import { AyahPlayer } from './AyahPlayer';
import { BASMALA, RIWAYAT, loadRiwaya, loadAudioMap, loadAsbab, type AsbabData, loadQiraat, loadTajweed, loadTafsir, loadSaadi, loadGharib, loadGharibIndex, type TJ, lsGet, lsSet, pageAyas, toAr, type QData, type QV } from './data';
import { VerseShare } from './VerseShare';

type Theme = 'night' | 'paper';

// رمز الحكم -> [مجموعة اللون، الاسم]
const TJ_INFO: Record<string, [string, string]> = {
  ghunnah: ['g', 'غنّة'],
  ikhfa: ['k', 'إخفاء'],
  ikhfa_shafawi: ['k', 'إخفاء شفوي'],
  idghaam_ghunnah: ['i', 'إدغام بغنّة'],
  idghaam_shafawi: ['i', 'إدغام شفوي'],
  idghaam_mutajanisayn: ['i', 'إدغام متجانسين'],
  idghaam_mutaqaribayn: ['i', 'إدغام متقاربين'],
  idghaam_no_ghunnah: ['n', 'إدغام بلا غنّة'],
  iqlab: ['q', 'إقلاب'],
  qalqalah: ['l', 'قلقلة'],
  madd_2: ['m2', 'مدّ طبيعي (حركتان)'],
  madd_246: ['m4', 'مدّ عارض للسكون / لين (٢ أو ٤ أو ٦)'],
  madd_muttasil: ['m5', 'مدّ متصل (٤–٥ حركات)'],
  madd_munfasil: ['m5', 'مدّ منفصل (٤–٥ حركات)'],
  madd_6: ['m6', 'مدّ لازم (٦ حركات)'],
  hamzat_wasl: ['s', 'همزة وصل'],
  lam_shamsiyyah: ['s', 'لام شمسية'],
  silent: ['s', 'حرف لا يُنطق'],
};
// خطوط المصحف المتاحة (كلها مضمَّنة في التطبيق فتعمل بلا نت)
const MFONTS: { id: string; name: string; css: string }[] = [
  { id: 'hafs', name: 'العثماني — مجمع الملك فهد (الأصلي)', css: "'KFGQPC Hafs', 'Aref Ruqaa', serif" },
  { id: 'naskh', name: 'عثمان طه نسخ — مجمع الملك فهد', css: "'KFGQPC Naskh', 'KFGQPC Hafs', serif" },
  { id: 'amiriq', name: 'أميري قرآن', css: "var(--f-amiriq), 'Amiri Quran', 'KFGQPC Hafs', serif" },
  { id: 'schehe', name: 'شهرزاد الجديد', css: "var(--f-schehe), 'Scheherazade New', 'KFGQPC Hafs', serif" },
];
const TJ_LEGEND: [string, string][] = [
  ['g', 'غنّة'], ['k', 'إخفاء'], ['i', 'إدغام بغنّة'], ['n', 'إدغام بلا غنّة'], ['q', 'إقلاب'], ['l', 'قلقلة'],
  ['m2', 'مدّ طبيعي'], ['m4', 'مدّ عارض/لين'], ['m5', 'مدّ متصل/منفصل'], ['m6', 'مدّ لازم'], ['s', 'لا يُنطق'],
];

export function MushafReader({
  data: hdata,
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
  const [rw, setRw] = useState<string>(() => String(lsGet('quran_riwaya', 'hafs')));
  const [rdata, setRdata] = useState<{ id: string; d: QData } | null>(null);
  const [rerr, setRerr] = useState(false);
  const [fs, setFs] = useState<number>(() => lsGet('quran_fs', 25));
  const [theme, setTheme] = useState<Theme>(() => lsGet<Theme>('quran_theme', 'night'));
  const [sel, setSel] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [shareIdx, setShareIdx] = useState<number | null>(null);
  const [showQ, setShowQ] = useState<boolean>(() => lsGet('quran_showq', true));
  const [qv, setQv] = useState<QV[]>([]);
  const [qSel, setQSel] = useState<number | null>(null);
  const [showT, setShowT] = useState<boolean>(() => lsGet('quran_showt', false));
  const [tj, setTj] = useState<TJ | null>(null);
  const [tjName, setTjName] = useState('');
  const [tafOpen, setTafOpen] = useState(false);
  const [asb, setAsb] = useState<AsbabData | null>(null);
  const [asbOpen, setAsbOpen] = useState(false);
  const [ghIdx, setGhIdx] = useState<Record<string, number[]> | null>(null);
  const [ghOpen, setGhOpen] = useState(false);
  const [gh, setGh] = useState<string[] | null>(null);
  useEffect(() => {
    let live = true;
    loadGharibIndex().then((d) => live && setGhIdx(d)).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (sel == null || asb) return;
    let live = true;
    loadAsbab().then((d) => live && setAsb(d)).catch(() => {});
    return () => {
      live = false;
    };
  }, [sel, asb]);
  useEffect(() => setAsbOpen(false), [sel]);
  useEffect(() => setGhOpen(false), [sel]);
  const [mfont, setMfont] = useState<string>(() => String(lsGet('quran_mfont', 'hafs')));
  const [fontsOpen, setFontsOpen] = useState(false);
  const [playIdx, setPlayIdx] = useState<number | null>(null);
  const [taf, setTaf] = useState<string | null>(null);
  const [tafSrc, setTafSrc] = useState<'mu' | 'sa'>(() => lsGet<'mu' | 'sa'>('mr.tafsrc', 'mu'));
  const [tafRange, setTafRange] = useState<[number, number] | null>(null);
  const [jump, setJump] = useState('');
  // نص الرواية المختارة (حفص هو الأساس، وبقية الروايات تُحمَّل عند الاختيار وتُخزَّن للاستخدام بلا نت)
  const data: QData = rw === 'hafs' || rdata?.id !== rw ? hdata : rdata.d;
  const isH = data === hdata;
  const rinfo = RIWAYAT.find((r) => r.id === rw) || RIWAYAT[0];
  useEffect(() => {
    setRerr(false);
    let live = true;
    if (rw !== 'hafs')
      loadRiwaya(rw)
        .then((d) => live && setRdata({ id: rw, d }))
        .catch(() => live && setRerr(true));
    return () => {
      live = false;
    };
  }, [rw]);
  const [amap, setAmap] = useState<{ id: string; m: Record<string, [number, number]> } | null>(null);
  useEffect(() => {
    if (rw === 'hafs' || playIdx == null || amap?.id === rw) return;
    let live = true;
    loadAudioMap(rw).then((m) => live && setAmap({ id: rw, m })).catch(() => live && setPlayIdx(null));
    return () => {
      live = false;
    };
  }, [rw, playIdx]); // eslint-disable-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    if (!showT || tj) return;
    let live = true;
    loadTajweed()
      .then((d) => live && setTj(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [showT, tj]);

  useEffect(() => {
    setTaf(null);
    if (!tafOpen || sel == null) return;
    const a = data.ayas[sel];
    let live = true;
    setTafRange(null);
    const fail = () => live && setTaf('تعذّر تحميل التفسير. تأكد من الاتصال وأعد المحاولة.');
    if (tafSrc === 'sa') {
      loadSaadi(a[0])
        .then((d) => {
          if (!live) return;
          const g = d.find((x) => a[1] >= x[0] && a[1] <= x[1]);
          setTaf(g ? g[2] : 'لا يوجد تفسير لهذه الآية في المصدر.');
          setTafRange(g && g[0] !== g[1] ? [g[0], g[1]] : null);
        })
        .catch(fail);
    } else {
      loadTafsir(a[0])
        .then((d) => live && setTaf(d[a[1] - 1] || 'لا يوجد تفسير لهذه الآية في المصدر.'))
        .catch(fail);
    }
    return () => {
      live = false;
    };
  }, [tafOpen, sel, data, tafSrc]);

  useEffect(() => {
    setGh(null);
    if (!ghOpen || sel == null) return;
    const a = hdata.ayas[sel];
    let live = true;
    loadGharib(a[0])
      .then((d) => live && setGh(d[String(a[1])] || []))
      .catch(() => live && setGh([]));
    return () => {
      live = false;
    };
  }, [ghOpen, sel, hdata]);

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
    const te = (e.target as HTMLElement).closest('[data-tj]') as HTMLElement | null;
    setTjName(te ? te.dataset.tj || '' : '');
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

  // هل آية الفاتحة الأولى في هذه الرواية هي البسملة؟ (حفص وشعبة نعم، وغيرهما تُعدّ البسملة غير آية)
  const hasBas = data.ayas[0][4].replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').startsWith('بسم');
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
      if (a[0] !== 9 && (a[0] !== 1 || !hasBas)) {
        rows.push(
          <div className="q-basmala" key={`b${i}`}>
            {BASMALA}
          </div>
        );
      }
    }
    const words = a[4].split(' ');
    const qs = isH && showQ ? qmap.get(i) : undefined;
    rows.push(
      <span
        key={i}
        data-i={i}
        ref={isH && focus === i ? focusRef : undefined}
        className={`qa${sel === i ? ' qa-sel' : ''}${playIdx === i ? ' qa-play' : ''}${isH && focus === i ? ' qa-focus' : ''}${isH && marks.includes(i) ? ' qa-mark' : ''}`}
      >
        {(() => {
          const marks2 = isH && showT && tj ? tj.a[i] || [] : [];
          let off = 0;
          return words.map((w, k) => {
            const wb = off;
            off += w.length + 1;
            const k2 = qs?.find((q) => k >= qv[q].f && k < qv[q].t);
            let inner: ReactNode = w;
            if (marks2.length) {
              const parts: ReactNode[] = [];
              let pos = 0;
              for (let m = 0; m < marks2.length; m += 3) {
                const b = Math.max(marks2[m + 1], wb) - wb;
                const e = Math.min(marks2[m + 2], wb + w.length) - wb;
                if (e <= b || b < pos) continue;
                const info = TJ_INFO[tj!.rules[marks2[m]]];
                if (!info) continue;
                if (b > pos) parts.push(w.slice(pos, b));
                parts.push(
                  <span key={m} className={`tj tj-${info[0]}`} data-tj={info[1]}>
                    {w.slice(b, e)}
                  </span>
                );
                pos = e;
              }
              if (parts.length) {
                if (pos < w.length) parts.push(w.slice(pos));
                inner = parts;
              }
            }
            return (
              <Fragment key={k}>
                {k2 != null ? (
                  <span className="qw qw-q" data-q={k2}>
                    {inner}
                  </span>
                ) : (
                  <span className="qw">{inner}</span>
                )}{' '}
              </Fragment>
            );
          });
        })()}
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
        <div className="mr-nav">
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
              placeholder={`صفحة ${toAr(page)} من ٦٠٤`}
              aria-label="اذهب إلى صفحة"
            />
          </form>
          <button type="button" className="mr-btn" onClick={() => go(page + 1)} disabled={page >= 604} aria-label="الصفحة التالية">
            ‹
          </button>
        </div>
        <div className="mr-acts">
          <button type="button" className="mr-act" onClick={() => changeFs(-1)} aria-label="تصغير الخط">
            <b>أ−</b>
            <small>تصغير</small>
          </button>
          <button type="button" className="mr-act" onClick={() => changeFs(1)} aria-label="تكبير الخط">
            <b>أ+</b>
            <small>تكبير</small>
          </button>
          {isH && (
            <>
              <button
                type="button"
                className={`mr-act${showT ? ' mr-on' : ''}`}
                onClick={() => {
                  const n = !showT;
                  setShowT(n);
                  setTjName('');
                  lsSet('quran_showt', n);
                }}
                aria-label="تلوين أحكام التجويد"
              >
                <b>ت</b>
                <small>التجويد</small>
              </button>
              <button
                type="button"
                className={`mr-act${showQ ? ' mr-on' : ''}`}
                onClick={() => {
                  const n = !showQ;
                  setShowQ(n);
                  lsSet('quran_showq', n);
                }}
                aria-label="علامات اختلاف القراءات"
              >
                <b>ق</b>
                <small>القراءات</small>
              </button>
            </>
          )}
          <button type="button" className={`mr-act${fontsOpen ? ' mr-on' : ''}`} onClick={() => setFontsOpen((o) => !o)} aria-label="الرواية وخط المصحف">
            <b>⚙</b>
            <small>الرواية</small>
          </button>
          <button type="button" className="mr-act" onClick={changeTheme} aria-label="تغيير الخلفية">
            <b>{theme === 'night' ? '☀' : '☾'}</b>
            <small>الخلفية</small>
          </button>
        </div>
      </div>

      {fontsOpen && (
        <div className="mr-fonts">
          <div className="mr-rw">
            {RIWAYAT.map((r) => (
              <button
                key={r.id}
                type="button"
                className={rw === r.id ? 'on' : ''}
                onClick={() => {
                  setRw(r.id);
                  lsSet('quran_riwaya', r.id);
                  setSel(null);
                  setPlayIdx(null);
                  setTafOpen(false);
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
          {rerr && <div className="mr-q-n">تعذّر تحميل هذه الرواية. تأكد من الاتصال وأعد المحاولة (تُحفظ بعدها على جهازك).</div>}
          {rw !== 'hafs' && !rerr && !rdata && <div className="mr-q-n">جارٍ تحميل الرواية…</div>}
          {rw === 'hafs' && MFONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={mfont === f.id ? 'on' : ''}
              onClick={() => {
                setMfont(f.id);
                lsSet('quran_mfont', f.id);
              }}
            >
              <span style={{ fontFamily: f.css }}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</span>
              <small>{f.name}</small>
            </button>
          ))}
        </div>
      )}

      {showT && (
        <div className="mr-leg">
          {TJ_LEGEND.map(([c, n]) => (
            <span key={c}>
              <i className={`tj-${c}`} />
              {n}
            </span>
          ))}
        </div>
      )}

      <div className="mr-page" onClick={onTap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="mr-head">
          <span>{suraNames}</span>
          <span>الجزء {toAr(juz)}</span>
        </div>
        <div className="mr-text" style={{ fontSize: `${fs}px`, fontFamily: isH && rw === 'hafs' ? (MFONTS.find((f) => f.id === mfont) || MFONTS[0]).css : `'${rinfo.font}', serif` }}>
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
          {tjName && showT && <div className="mr-tjn">حكم التجويد: {tjName}</div>}
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
          {isH && asbOpen && sel != null && asb && (
            <div className="mr-taf">
              <div className="mr-taf-t">ما ورد عن نزولها في الصحيحين</div>
              <div className="mr-taf-b">
                {(asb.a[`${data.ayas[sel][0]}:${data.ayas[sel][1]}`] || []).map((i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ color: '#e8c25a', fontSize: 13 }}>{asb.h[i].b} — {asb.h[i].c} (حديث {toAr(Number(asb.h[i].n) || 0)})</div>
                    <div>{asb.h[i].t}</div>
                  </div>
                ))}
              </div>
              <div className="mr-q-n">أحاديث من البخاري ومسلم ذُكر فيها نزول الآية، رُبطت بها بمطابقة نص الآية. قد يكون المذكور سببًا أو وقتَ نزول، فاقرأ الحديث كاملًا.</div>
            </div>
          )}
          {isH && ghOpen && (
            <div className="mr-taf">
              <div className="mr-taf-t">غريب القرآن</div>
              <div className="mr-taf-b">
                {gh == null ? 'جارٍ التحميل…' : gh.map((t, i) => (
                  <p key={i} style={{ margin: '0 0 8px' }}>{t}</p>
                ))}
              </div>
            </div>
          )}
          {isH && tafOpen && (
            <div className="mr-taf">
              <div className="mr-taf-t">
                <button type="button" className={tafSrc === 'mu' ? 'mr-on' : ''} onClick={() => { setTafSrc('mu'); lsSet('mr.tafsrc', 'mu'); }}>الميسّر</button>
                <button type="button" className={tafSrc === 'sa' ? 'mr-on' : ''} onClick={() => { setTafSrc('sa'); lsSet('mr.tafsrc', 'sa'); }}>السعدي</button>
              </div>
              {tafSrc === 'sa' && tafRange && (
                <div className="mr-q-n">تفسير مجموعة الآيات {toAr(tafRange[0])}–{toAr(tafRange[1])} معًا كما في الكتاب.</div>
              )}
              <div className="mr-taf-b">{taf ?? 'جارٍ التحميل…'}</div>
            </div>
          )}
          <div className="mr-sheet-btns">
            <button type="button" onClick={() => { setPlayIdx(sel); setSel(null); }}>
              ▶ استماع
            </button>
            {isH && (
              <>
                <button type="button" className={tafOpen ? 'mr-on' : ''} onClick={() => setTafOpen((o) => !o)}>
                  تفسير
                </button>
                {sel != null && ghIdx?.[String(data.ayas[sel][0])]?.includes(data.ayas[sel][1]) && (
                  <button type="button" className={ghOpen ? 'mr-on' : ''} onClick={() => setGhOpen((o) => !o)}>
                    غريب
                  </button>
                )}
                {sel != null && asb?.a[`${data.ayas[sel][0]}:${data.ayas[sel][1]}`] && (
                  <button type="button" className={asbOpen ? 'mr-on' : ''} onClick={() => setAsbOpen((o) => !o)}>
                    سبب النزول
                  </button>
                )}
              </>
            )}
            <button type="button" onClick={() => copyAya(sel)}>
              نسخ
            </button>
            {isH && (
              <>
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
              </>
            )}
            <button type="button" onClick={() => setSel(null)}>
              إغلاق
            </button>
          </div>
        </div>
      )}
      {playIdx != null && (rw === 'hafs' || amap?.id === rw) && (
        <AyahPlayer data={data} amap={rw === 'hafs' ? null : amap!.m} hsuras={hdata.suras} rwName={rw} idx={playIdx} setIdx={setPlayIdx} goPage={(p) => setPage(p)} onClose={() => setPlayIdx(null)} />
      )}
      {toast && <div className="mr-toast">{toast}</div>}
      {shareIdx != null && <VerseShare data={data} idx={shareIdx} onClose={() => setShareIdx(null)} />}

      <style>{`
        .mr { position: relative; }
        .mr-tools {
          display: flex; flex-direction: column; gap: 8px; margin: 0 0 12px; padding: 8px;
          position: sticky; top: 64px; z-index: 5;
          border-radius: 20px; background: linear-gradient(180deg, rgba(24,20,9,.97), rgba(12,10,5,.97));
          border: 1px solid rgba(232,194,90,.35); box-shadow: 0 6px 18px rgba(0,0,0,.45), inset 0 0 0 3px rgba(232,194,90,.05);
        }
        .mr-nav { display: grid; grid-template-columns: 52px 1fr 52px; gap: 8px; align-items: center; }
        .mr-acts { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; }
        .mr-btn {
          height: 42px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1);
          color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 24px; line-height: 1; cursor: pointer;
        }
        .mr-btn:disabled { opacity: .35; }
        .mr-act {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; min-width: 0;
          padding: 7px 2px 6px; border-radius: 14px; border: 1px solid rgba(232,194,90,.28);
          background: rgba(232,194,90,.06); color: #f1d77a; cursor: pointer;
        }
        .mr-act b { font-family: var(--font-kufi), sans-serif; font-size: 18px; line-height: 1.1; font-weight: 400; }
        .mr-act small { font-family: var(--font-kufi), sans-serif; font-size: 9.5px; color: rgba(255,241,196,.7); white-space: nowrap; }
        .mr-act.mr-on { background: linear-gradient(180deg, rgba(232,194,90,.38), rgba(232,194,90,.16)); border-color: #f1d77a; }
        .mr-act.mr-on small { color: #fff1c4; }
        .mr-on { background: rgba(232,194,90,.32); border-color: #e8c25a; }
        .tj-g { color: #16a37f; } .tj-k { color: #e08a1e; } .tj-i { color: #12a4b8; } .tj-n { color: #7f8c9a; }
        .tj-q { color: #a855d9; } .tj-l { color: #3b82e6; } .tj-m2 { color: #e0605f; } .tj-m4 { color: #d94a8c; }
        .tj-m5 { color: #e8672a; } .tj-m6 { color: #c81d25; } .tj-s { color: #8a93a0; }
.mr-fonts { display: flex; flex-direction: column; gap: 6px; margin: 0 0 8px; padding: 8px; border-radius: 14px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.9); }
.mr-rw { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
        .mr-rw button { flex: 0 1 auto; padding: 6px 10px; font-family: var(--font-kufi), sans-serif; font-size: 12.5px; }
        .mr-fonts button { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px; border-radius: 12px; border: 1px solid rgba(232,194,90,.25); background: transparent; color: #fff1c4; }
        .mr-fonts button.on { border-color: #f1d77a; background: rgba(232,194,90,.18); }
        .mr-fonts span { font-size: 22px; direction: rtl; }
        .mr-fonts small { font-family: var(--font-kufi), sans-serif; font-size: 11.5px; color: #f1d77a; }
        .mr-leg { display: flex; flex-wrap: wrap; gap: 6px 12px; justify-content: center; margin: 0 0 8px; padding: 8px; border-radius: 12px; background: rgba(232,194,90,.06); font-family: var(--font-kufi), sans-serif; font-size: 11.5px; color: rgba(255,241,196,.75); }
        .mr-leg span { display: inline-flex; align-items: center; gap: 4px; }
        .mr-leg i { width: 10px; height: 10px; border-radius: 50%; background: currentColor; display: inline-block; }
        .mr-tjn { text-align: center; margin: 0 0 8px; color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 14px; }
        .qw-q { text-decoration: underline dotted #4fc3a1; text-decoration-thickness: 2px; text-underline-offset: 8px; cursor: pointer; }
        .mr-q { margin: 0 0 10px; padding: 10px; border-radius: 14px; border: 1px solid rgba(79,195,161,.5); background: rgba(79,195,161,.08); }
        .mr-q-t { text-align: center; color: #7fe0c0; font-family: var(--font-kufi), sans-serif; font-size: 13px; margin: 0 0 6px; }
        .mr-q-r { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 4px 0; color: rgba(255,241,196,.75); font-family: var(--font-kufi), sans-serif; font-size: 12.5px; }
        .mr-q-h { font-family: 'KFGQPC Hafs', serif; font-size: 24px; color: #fff1c4; font-weight: 400; direction: rtl; }
        .mr-q-s { font-family: 'KFGQPC Shouba', serif; font-size: 24px; color: #fff1c4; font-weight: 400; direction: rtl; }
        .mr-q-n { text-align: center; font-size: 11.5px; color: rgba(255,241,196,.5); font-family: var(--font-ruqaa), serif; margin-top: 4px; }
        .mr-jump { min-width: 0; }
        .mr-jump input {
          width: 100%; height: 42px; text-align: center; border-radius: 14px; border: 1px solid rgba(232,194,90,.3);
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
        .qa-play { background: rgba(127,224,192,.22); }
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
        .mr-sheet-btns { display: flex; flex-wrap: wrap; gap: 6px; }
        .mr-sheet-btns button { flex: 1 1 28%; }
        .mr-taf { margin: 0 0 10px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.35); background: rgba(232,194,90,.06); }
        .mr-taf-t { display: flex; justify-content: center; gap: 8px; text-align: center; color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 13px; margin: 0 0 6px; }
        .mr-taf-t button { padding: 4px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #f1d77a; font-family: inherit; font-size: 13px; }
        .mr-taf-t button.mr-on { background: #e8c25a; color: #1a1409; }
        .mr-taf-b { max-height: 34vh; overflow-y: auto; white-space: pre-line; direction: rtl; text-align: justify; font-family: var(--font-ruqaa), serif; font-size: 17px; line-height: 2; color: #fff1c4; }
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
