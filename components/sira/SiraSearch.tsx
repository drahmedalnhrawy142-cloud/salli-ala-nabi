'use client';

import { useEffect, useRef, useState } from 'react';
import { norm, toAr } from '@/components/quran/data';
import { blockText, loadShard, type SiraIndex } from './data';

type Row = { c: number; k: number; raw: string; n: string };

/** بحث في نص الكتاب كله. تُحمَّل الشرائح مرة واحدة عند أول بحث. */
export function SiraSearch({ ix, onGo }: { ix: SiraIndex; onGo: (c: number, k: number) => void }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [prog, setProg] = useState(0);
  const [res, setRes] = useState<{ r: Row; at: number }[]>([]);
  const [total, setTotal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let live = true;
    (async () => {
      const out: Row[] = [];
      for (let s = 0; s < ix.shards; s++) {
        const chs = await loadShard(s);
        const first = ix.chapters.findIndex((c) => c.s === s);
        chs.forEach((ch, o) => {
          ch.b.forEach((b, k) => {
            const raw = blockText(b);
            out.push({ c: first + o, k, raw, n: norm(raw) });
          });
        });
        if (live) setProg(Math.round(((s + 1) / ix.shards) * 100));
      }
      if (live) setRows(out);
    })().catch(() => {
      started.current = false;
    });
    return () => {
      live = false;
    };
  }, [ix]);

  useEffect(() => {
    if (!rows) return;
    const t = setTimeout(() => {
      const nq = norm(q);
      const words = nq.split(' ').filter(Boolean);
      if (nq.length < 3) {
        setRes([]);
        setTotal(0);
        return;
      }
      const out: { r: Row; at: number }[] = [];
      let n = 0;
      for (const r of rows) {
        let ok = true;
        for (const w of words) {
          if (!r.n.includes(w)) {
            ok = false;
            break;
          }
        }
        if (ok) {
          n++;
          if (out.length < 80) out.push({ r, at: r.n.indexOf(words[0]) });
        }
      }
      setRes(out);
      setTotal(n);
    }, 300);
    return () => clearTimeout(t);
  }, [q, rows]);

  function snippet(raw: string, at: number) {
    const s = Math.max(0, at - 50);
    let t = raw.slice(s, s + 170);
    if (s > 0) t = '… ' + t.slice(t.indexOf(' ') + 1);
    if (s + 170 < raw.length) t = t.slice(0, t.lastIndexOf(' ')) + ' …';
    return t;
  }

  return (
    <div className="ss">
      <input className="ss-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب كلمة أو أكثر (٣ أحرف فأكثر)" autoFocus />
      {!rows && <p className="ss-note">جارٍ تجهيز البحث… {toAr(prog)}٪</p>}
      {rows && norm(q).length >= 3 && (
        <p className="ss-note">{total === 0 ? 'لا توجد نتائج' : `${toAr(total)} موضع${total > 80 ? ' (أول ٨٠ نتيجة)' : ''}`}</p>
      )}
      <div className="ss-list">
        {res.map(({ r, at }, n) => (
          <button key={n} type="button" className="ss-row" onClick={() => onGo(r.c, r.k)}>
            <span className="ss-t">{snippet(r.raw, at)}</span>
            <span className="ss-s">{ix.chapters[r.c].t}</span>
          </button>
        ))}
      </div>
      <style>{`
        .ss-in { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.85); color: #f7ebc1; font-family: var(--font-ruqaa), serif; font-size: 16px; margin: 0 0 10px; }
        .ss-note { font-family: var(--font-kufi), sans-serif; font-size: 13px; color: rgba(255,241,196,.6); margin: 0 0 8px; }
        .ss-list { display: flex; flex-direction: column; gap: 8px; }
        .ss-row { display: flex; flex-direction: column; gap: 6px; text-align: right; padding: 12px; border-radius: 16px; border: 1px solid rgba(232,194,90,.22); background: rgba(18,15,8,.75); cursor: pointer; }
        .ss-t { font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 1.9; color: #f7ebc1; }
        .ss-s { font-family: var(--font-kufi), sans-serif; font-size: 12px; color: #e8c25a; }
      `}</style>
    </div>
  );
}
