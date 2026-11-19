'use client';

import { useMemo, useState } from 'react';
import { norm, toAr } from '@/components/quran/data';
import type { SiraIndex as IX } from './data';

/** تجميع الفهرس بحسب صفحات الطبعة نفسها (كل ١٠٠ صفحة) — دون أي تقسيم من عندنا */
export function SiraIndex({ ix, onGo }: { ix: IX; onGo: (c: number, k: number | null) => void }) {
  const [q, setQ] = useState('');
  const [openG, setOpenG] = useState<string | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, { key: string; label: string; items: number[] }>();
    ix.chapters.forEach((c, i) => {
      const [v, p] = c.pg;
      const b = Math.floor((p - 1) / 100);
      const key = `${v}-${b}`;
      let g = m.get(key);
      if (!g) {
        g = { key, label: `الجزء ${toAr(v)} • صفحات ${toAr(b * 100 + 1)} – ${toAr(b * 100 + 100)}`, items: [] };
        m.set(key, g);
      }
      g.items.push(i);
    });
    return [...m.values()];
  }, [ix]);

  const nq = norm(q);
  const found = useMemo(() => {
    if (nq.length < 2) return null;
    const out: { c: number; k: number | null; t: string; sub?: string }[] = [];
    ix.chapters.forEach((c, i) => {
      if (norm(c.t).includes(nq)) out.push({ c: i, k: null, t: c.t });
      for (const [st, k] of c.subs) if (norm(st).includes(nq)) out.push({ c: i, k, t: c.t, sub: st });
    });
    return out;
  }, [ix, nq]);

  return (
    <div className="si">
      <input className="si-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في عناوين الأبواب والفصول" />

      {found && (
        <div className="si-list">
          <p className="si-note">{found.length ? `${toAr(found.length)} نتيجة` : 'لا توجد نتائج'}</p>
          {found.slice(0, 120).map((r, n) => (
            <button key={n} type="button" className="si-row" onClick={() => onGo(r.c, r.k)}>
              <span className="si-t">{r.sub ?? r.t}</span>
              {r.sub && <span className="si-s">{r.t}</span>}
            </button>
          ))}
        </div>
      )}

      {!found &&
        groups.map((g) => (
          <section key={g.key} className="si-g">
            <button type="button" className="si-gh" onClick={() => setOpenG(openG === g.key ? null : g.key)} aria-expanded={openG === g.key}>
              <span>{g.label}</span>
              <span className="si-cnt">{toAr(g.items.length)} باب</span>
            </button>
            {openG === g.key && (
              <div className="si-list">
                {g.items.map((i) => (
                  <button key={i} type="button" className="si-row" onClick={() => onGo(i, null)}>
                    <span className="si-n">{toAr(i + 1)}</span>
                    <span className="si-t">{ix.chapters[i].t}</span>
                    <span className="si-p">ص {toAr(ix.chapters[i].pg[1])}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}

      <style>{`
        .si-in { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.85); color: #f7ebc1; font-family: var(--font-ruqaa), serif; font-size: 16px; margin: 0 0 12px; }
        .si-note { font-family: var(--font-kufi), sans-serif; font-size: 13px; color: rgba(255,241,196,.6); margin: 0 0 8px; }
        .si-g { margin: 0 0 10px; }
        .si-gh { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 14px; border-radius: 18px; border: 1px solid rgba(232,194,90,.34); background: radial-gradient(120% 90% at 50% 0%, rgba(232,194,90,.12), rgba(232,194,90,.03) 70%), rgba(18,15,8,.78); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; }
        .si-cnt { font-weight: 400; font-size: 12.5px; color: rgba(255,241,196,.6); }
        .si-list { display: flex; flex-direction: column; gap: 6px; margin: 8px 0 4px; }
        .si-row { display: flex; align-items: center; gap: 10px; text-align: right; padding: 11px 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.2); background: rgba(18,15,8,.7); color: #f7ebc1; cursor: pointer; }
        .si-n { flex: 0 0 34px; text-align: center; font-family: var(--font-kufi), sans-serif; font-size: 12.5px; color: #e8c25a; }
        .si-t { flex: 1; font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 1.6; }
        .si-s { display: block; font-family: var(--font-kufi), sans-serif; font-size: 12px; color: rgba(255,241,196,.55); }
        .si-p { flex: 0 0 auto; font-family: var(--font-kufi), sans-serif; font-size: 12px; color: rgba(255,241,196,.55); }
      `}</style>
    </div>
  );
}
