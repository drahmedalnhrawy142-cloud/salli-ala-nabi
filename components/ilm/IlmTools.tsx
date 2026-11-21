'use client';

import { useEffect, useRef, useState } from 'react';
import { norm, toAr } from '@/components/quran/data';
import { FiqhBook } from '@/components/FiqhMadhahib';
import { allBooks, type BookMeta } from '@/components/ilm/books';
import { getLast, removeFav, useFavs } from '@/components/ilm/ilmStore';

/**
 * أدوات طالب العلم فوق الكتب الموحّدة الهيكل (الفقه المقارن والمكتبة العلمية):
 * متابعة القراءة، المفضلة، والبحث الشامل في كل الكتب. تعمل بلا نت داخل التطبيق.
 */
type Open = { b: BookMeta; ki: number; bi: number };
type Kit = { t: string; b: { t: string; e: string[] }[] };
type Mode = 'search' | 'fav' | 'last';

const kc = new Map<string, Promise<Kit>>();
function loadK(dir: string, n: number): Promise<Kit> {
  const k = `${dir}${n}`;
  let p = kc.get(k);
  if (!p) {
    p = fetch(`${dir}k${n}.json`).then((r) => {
      if (!r.ok) throw new Error('k');
      return r.json() as Promise<Kit>;
    });
    p.catch(() => kc.delete(k));
    kc.set(k, p);
  }
  return p;
}
const ic = new Map<string, Promise<{ t: string }[]>>();
function loadIdx(dir: string) {
  let p = ic.get(dir);
  if (!p) {
    p = fetch(`${dir}index.json`).then((r) => (r.ok ? r.json() : Promise.reject()));
    p.catch(() => ic.delete(dir));
    ic.set(dir, p);
  }
  return p;
}

const css = `
  .it { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
  .it-s { display: flex; gap: 6px; margin-bottom: 8px; }
  .it-s input { flex: 1; min-width: 0; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 14px; }
  .it-s button, .it select { padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.15); color: #f1d77a; font-family: inherit; font-size: 14px; }
  .it select { width: 100%; margin-bottom: 8px; background: #1a1409; }
  .it-c { padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); margin-bottom: 10px; }
  .it-c p { margin: 4px 0 8px; font-family: var(--font-ruqaa), serif; font-size: 18px; line-height: 2.05; text-align: justify; }
  .it-n { font-size: 12px; color: #e8c25a; }
  .it-a { display: flex; gap: 8px; }
  .it-a button { padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: inherit; font-size: 12.5px; }
  .it-p { font-size: 12px; text-align: center; color: #7fe0c0; margin: 6px 0; }
  .it-m { text-align: center; opacity: .75; padding: 24px 0; }
  .it mark { background: rgba(232,194,90,.35); color: inherit; border-radius: 3px; }
`;

function Card({ src, t, q, onOpen, extra }: { src: string; t: string; q?: string[]; onOpen: () => void; extra?: React.ReactNode }) {
  const [m, setM] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${t}\n— ${src}`);
      setM('تم النسخ');
    } catch {
      setM('تعذّر النسخ');
    }
    setTimeout(() => setM(''), 1300);
  }
  return (
    <div className="it-c">
      <div className="it-n">{src}</div>
      <p>{t}</p>
      <div className="it-a">
        <button type="button" onClick={onOpen}>فتح في الكتاب</button>
        <button type="button" onClick={copy}>{m || 'نسخ'}</button>
        {extra}
      </div>
    </div>
  );
}

function SearchAll({ books, onOpen }: { books: BookMeta[]; onOpen: (o: Open) => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState('all');
  const [res, setRes] = useState<{ b: BookMeta; ki: number; bi: number; src: string; p: string }[] | null>(null);
  const [prog, setProg] = useState<number | null>(null);
  const stop = useRef(0);
  useEffect(() => () => void stop.current++, []);

  async function run() {
    const w = norm(q).split(' ').filter(Boolean);
    if (!w.length) return;
    const my = ++stop.current;
    const out: { b: BookMeta; ki: number; bi: number; src: string; p: string }[] = [];
    setRes([]);
    setProg(0);
    const pool = books.filter((b) => sel === 'all' || b.id === sel);
    const jobs: { b: BookMeta; i: number }[] = [];
    for (const b of pool) {
      try {
        const idx = await loadIdx(b.dir);
        idx.forEach((_, i) => jobs.push({ b, i }));
      } catch {}
    }
    for (let j = 0; j < jobs.length; j++) {
      const { b, i } = jobs[j];
      try {
        const k = await loadK(b.dir, i);
        if (stop.current !== my) return;
        k.b.forEach((bab, bi) => {
          for (const p of bab.e) if (out.length < 80 && w.every((x) => norm(p).includes(x))) out.push({ b, ki: i, bi, src: `${b.title} ‹ ${k.t === b.title ? '' : k.t + ' ‹ '}${bab.t}`, p });
        });
      } catch {}
      if (j % 4 === 0 || j === jobs.length - 1) {
        setProg(Math.round(((j + 1) / jobs.length) * 100));
        setRes([...out]);
      }
    }
    setProg(null);
    setRes([...out]);
  }
  return (
    <div className="it">
      <select value={sel} onChange={(e) => setSel(e.target.value)} aria-label="الكتاب">
        <option value="all">كل الكتب ({toAr(books.length)})</option>
        {books.map((b) => (
          <option key={b.id} value={b.id}>{b.title}</option>
        ))}
      </select>
      <div className="it-s">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ابحث في كل الكتب (مثال: المسح على الخفين)" />
        <button type="button" onClick={run}>بحث</button>
      </div>
      {prog != null && <div className="it-p">جارٍ البحث… {toAr(prog)}٪</div>}
      {res && (
        <>
          <div className="it-p">{res.length === 0 && prog == null ? 'لا نتائج.' : `${toAr(res.length)} نتيجة${res.length >= 80 ? ' (أول ٨٠)' : ''}`}</div>
          {res.map((r, i) => (
            <Card key={i} src={r.src} t={r.p} onOpen={() => onOpen({ b: r.b, ki: r.ki, bi: r.bi })} />
          ))}
        </>
      )}
      {!res && <p className="it-m">يبحث في الفقه المقارن والمكتبة العلمية كلها بلا نت.</p>}
    </div>
  );
}

function Favs({ books, onOpen }: { books: BookMeta[]; onOpen: (o: Open) => void }) {
  const favs = useFavs();
  if (!favs.length) return <div className="it"><p className="it-m">لا توجد فقرات محفوظة بعد.<br />اضغط ☆ على أي فقرة داخل الكتب لحفظها هنا.</p></div>;
  return (
    <div className="it">
      {favs.map((f) => {
        const b = books.find((x) => x.dir === f.dir);
        return (
          <Card
            key={f.id}
            src={`${f.book} ‹ ${f.where}`}
            t={f.t}
            onOpen={() => b && onOpen({ b, ki: f.ki, bi: f.bi })}
            extra={<button type="button" onClick={() => removeFav(f.id)}>إزالة ★</button>}
          />
        );
      })}
    </div>
  );
}

export function IlmTools({ mode }: { mode: Mode }) {
  const [books, setBooks] = useState<BookMeta[] | null>(null);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState<Open | null>(null);
  const [last] = useState(() => (mode === 'last' ? getLast() : null));
  useEffect(() => {
    allBooks().then(setBooks).catch(() => setErr(true));
  }, []);
  useEffect(() => {
    if (mode !== 'last' || !last || !books) return;
    const b = books.find((x) => x.dir === last.dir);
    if (b) setOpen({ b, ki: last.ki, bi: last.bi });
  }, [mode, last, books]);

  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل الكتب.</p>;
  if (!books) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;
  if (open)
    return (
      <FiqhBook
        key={`${open.b.dir}${open.ki}${open.bi}`}
        dir={open.b.dir}
        title={open.b.title}
        credit={open.b.credit}
        fiqh={open.b.fiqh}
        start={{ ki: open.ki, bi: open.bi }}
        backLabel="← رجوع"
        onBack={() => setOpen(null)}
      />
    );
  return (
    <>
      <style>{css}</style>
      {mode === 'search' && <SearchAll books={books} onOpen={setOpen} />}
      {mode === 'fav' && <Favs books={books} onOpen={setOpen} />}
      {mode === 'last' && <div className="it"><p className="it-m">لم تقرأ في أي كتاب بعد.<br />افتح كتابًا من المكتبة العلمية أو المذاهب الأربعة وسيُحفظ مكانك تلقائيًا.</p></div>}
    </>
  );
}
