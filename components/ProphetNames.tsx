'use client';

import { memo as __memo } from 'react';
import { useState } from 'react';

type NameItem = { name: string; meaning: string; source: string };

const MAIN: NameItem[] = [
  {
    name: 'محمد',
    meaning: 'المحمود، كثير الخصال المحمودة، يحمده الله وخلقه.',
    source: 'قال ﷺ: «أنا محمد» — البخاري ومسلم',
  },
  {
    name: 'أحمد',
    meaning: 'أكثر الناس حمدًا لله تعالى.',
    source: 'قال ﷺ: «وأنا أحمد» — البخاري ومسلم',
  },
  {
    name: 'الماحي',
    meaning: 'الذي يمحو الله به الكفر.',
    source: 'قال ﷺ: «وأنا الماحي الذي يمحو الله بي الكفر» — البخاري ومسلم',
  },
  {
    name: 'الحاشر',
    meaning: 'الذي يُحشر الناس على أثره يوم القيامة.',
    source:
      'قال ﷺ: «وأنا الحاشر الذي يُحشر الناس على قدمي» — البخاري ومسلم',
  },
  {
    name: 'العاقب',
    meaning: 'الذي ليس بعده نبي.',
    source: 'قال ﷺ: «وأنا العاقب» — البخاري ومسلم',
  },
];

const MORE: NameItem[] = [
  {
    name: 'المقفّي',
    meaning: 'الذي جاء على أثر الأنبياء وختمهم.',
    source: 'ورد في صحيح مسلم',
  },
  {
    name: 'نبيّ التوبة',
    meaning: 'الذي فتح الله به باب التوبة لعباده.',
    source: 'ورد في صحيح مسلم',
  },
  {
    name: 'نبيّ الرحمة',
    meaning: 'الذي أرسله الله رحمة للعالمين.',
    source: 'ورد في صحيح مسلم',
  },
];

function ProphetNames() {
  const [open, setOpen] = useState<string | null>(null);

  function card(it: NameItem) {
    const on = open === it.name;
    return (
      <button
        type="button"
        key={it.name}
        className={on ? 'pn-card pn-on' : 'pn-card'}
        onClick={() => setOpen(on ? null : it.name)}
        aria-expanded={on}
      >
        <span className="pn-name">{it.name}</span>
        {on && (
          <span className="pn-body">
            <span className="pn-meaning">{it.meaning}</span>
            <span className="pn-source">{it.source}</span>
          </span>
        )}
      </button>
    );
  }

  return (
    <section className="content-card pnames">
      <h2 className="section-title">من أسماء النبي ﷺ</h2>
      <p className="pn-intro">
        الأسماء الخمسة الواردة في الصحيحين. اضغط على اسم لتعرف معناه.
      </p>
      <div className="pn-grid">{MAIN.map(card)}</div>

      <h3 className="pn-sub">وورد في صحيح مسلم أيضًا</h3>
      <div className="pn-grid pn-wide">{MORE.map(card)}</div>

      <style>{`
        .pn-intro { font-family: var(--font-ruqaa), serif; text-align: center; opacity: .85; margin: 4px 0 14px; line-height: 1.9; }
        .pn-grid { display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-flow: dense; gap: 10px; }
        .pn-card {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 16px 10px; border-radius: 16px; cursor: pointer; text-align: center;
          border: 1px solid rgba(232,194,90,.35); background: rgba(232,194,90,.06); color: #f6e49c;
        }
        .pn-wide .pn-card:last-child { grid-column: 1 / -1; }
        .pn-on { grid-column: 1 / -1; background: rgba(232,194,90,.14); border-color: rgba(232,194,90,.8); }
        .pn-name { font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 1.5rem; }
        .pn-body { display: flex; flex-direction: column; gap: 8px; }
        .pn-meaning { font-family: var(--font-ruqaa), serif; font-size: 1.2rem; color: #fff1c4; line-height: 1.9; }
        .pn-source { font-family: var(--font-ruqaa), serif; font-size: .95rem; color: #c9a24a; line-height: 1.8; }
        .pn-sub { font-family: var(--font-kufi), sans-serif; color: #e8c25a; margin: 18px 0 10px; }
      `}</style>
    </section>
  );
}

const ProphetNamesMemo = __memo(ProphetNames);
export { ProphetNamesMemo as ProphetNames };
