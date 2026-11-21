'use client';

import { memo as __memo } from 'react';
import { useMemo, useState } from 'react';
import { ASMA } from '@/components/asmaData';

function AsmaAllah() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const t = q.trim();
    return t ? ASMA.filter(([n, m]) => n.includes(t) || m.includes(t)) : ASMA;
  }, [q]);

  return (
    <section className="content-card asma" id="s-asma">
      <h2 className="section-title">أسماء الله الحسنى</h2>
      <p className="as-hadith">
        قال ﷺ: «إنّ لله تسعةً وتسعين اسمًا، مَن أحصاها دخل الجنة» — رواه البخاري ومسلم
      </p>
      <input
        className="as-search"
        placeholder="ابحث عن اسم"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="as-grid">
        {list.map(([n, m]) => {
          const on = open === n;
          return (
            <button
              key={n}
              type="button"
              className={on ? 'as-card as-on' : 'as-card'}
              onClick={() => setOpen(on ? null : n)}
            >
              <span className="as-name">{n}</span>
              {on && <span className="as-mean">{m}</span>}
            </button>
          );
        })}
      </div>
      <p className="as-note">
        الأسماء على الترتيب المشهور في الرواية، وقد اختلف العلماء في تعيين التسعة
        والتسعين، وبعض الأسماء يُذكر مقرونًا بما يقابله مثل المعزّ والمذلّ.
      </p>
      <style>{`
        .as-hadith { font-family: var(--font-ruqaa), serif; text-align: center; line-height: 1.9; color: #fff1c4; margin: 4px 0 12px; }
        .as-search { width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(255,255,255,.04); color: #fff1c4; font-family: var(--font-ruqaa), serif; font-size: 1.05rem; margin-bottom: 12px; }
        .as-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; grid-auto-flow: dense; }
        .as-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px; border-radius: 14px; cursor: pointer; border: 1px solid rgba(232,194,90,.3); background: rgba(232,194,90,.05); color: #f6e49c; text-align: center; }
        .as-on { grid-column: 1 / -1; background: rgba(232,194,90,.14); border-color: rgba(232,194,90,.8); }
        .as-name { font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 1.05rem; }
        .as-mean { font-family: var(--font-ruqaa), serif; color: #fff1c4; font-size: 1.1rem; line-height: 1.8; }
        .as-note { font-family: var(--font-ruqaa), serif; opacity: .65; line-height: 1.8; font-size: .9rem; margin: 12px 0 0; }
      `}</style>
    </section>
  );
}

const AsmaAllahMemo = __memo(AsmaAllah);
export { AsmaAllahMemo as AsmaAllah };
