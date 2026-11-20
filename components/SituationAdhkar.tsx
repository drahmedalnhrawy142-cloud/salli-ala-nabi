'use client';

import { useEffect, useState } from 'react';
import { SectionGrid, type Sec } from '@/components/SectionGrid';
import { toAr } from '@/components/quran/data';

/** أذكار المواقف — من «حصن المسلم» (عبر rn0x/adhkar-json) بنصوصها كما هي. تُولَّد بـ tools/build_situations.py */
type Cat = { t: string; a: { x: string; n: number }[] };
type Grp = { id: string; label: string; icon: string; cats: Cat[] };

function CatCard({ c }: { c: Cat }) {
  const [msg, setMsg] = useState('');
  async function copy(t: string) {
    try {
      await navigator.clipboard.writeText(t);
      setMsg('تم النسخ');
    } catch {
      setMsg('تعذّر النسخ');
    }
    setTimeout(() => setMsg(''), 1300);
  }
  return (
    <article className="sa-card">
      <h3>{c.t}</h3>
      {c.a.map((it, i) => (
        <div key={i} className="sa-it">
          <p>{it.x}</p>
          <div className="sa-f">
            {it.n > 1 && <span>التكرار: {toAr(it.n)} مرات</span>}
            <button type="button" onClick={() => copy(it.x)}>نسخ</button>
          </div>
        </div>
      ))}
      {msg && <div className="sa-toast">{msg}</div>}
    </article>
  );
}

export function SituationAdhkar() {
  const [g, setG] = useState<Grp[] | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    fetch('/adhkar/situations.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setG)
      .catch(() => setErr(true));
  }, []);
  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل الأذكار.</p>;
  if (!g) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;
  const secs: Sec[] = g.map((x) => ({
    id: x.id,
    label: x.label,
    icon: x.icon,
    render: () => (
      <div className="sa">
        {x.cats.map((c, i) => (
          <CatCard key={i} c={c} />
        ))}
      </div>
    ),
  }));
  return (
    <div>
      <SectionGrid secs={secs} />
      <p className="sa-src">المصدر: «حصن المسلم» — نصوص الأدعية كما وردت فيه.</p>
      <style>{`
        .sa { display: flex; flex-direction: column; gap: 12px; }
        .sa-card { padding: 14px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); }
        .sa-card h3 { margin: 0 0 8px; font-family: var(--font-kufi), sans-serif; font-size: 15px; color: #e8c25a; }
        .sa-it { padding: 8px 0; border-top: 1px dashed rgba(232,194,90,.2); }
        .sa-it:first-of-type { border-top: 0; }
        .sa-it p { margin: 0; font-family: var(--font-ruqaa), serif; font-size: 20px; line-height: 2.1; color: #fff1c4; text-align: justify; }
        .sa-f { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-family: var(--font-kufi), sans-serif; font-size: 12.5px; color: #7fe0c0; }
        .sa-f button { padding: 5px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: inherit; }
        .sa-toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: 110px; background: #f1d77a; color: #1c1405; padding: 8px 18px; border-radius: 999px; font-family: var(--font-kufi), sans-serif; font-size: 14px; z-index: 30; }
        .sa-src { text-align: center; font-size: 11.5px; color: rgba(255,241,196,.45); margin-top: 12px; font-family: var(--font-kufi), sans-serif; }
      `}</style>
    </div>
  );
}
