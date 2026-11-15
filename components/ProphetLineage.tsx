'use client';

// نسب النبي ﷺ من محمد إلى عدنان، من ولد إسماعيل بن إبراهيم
const CHAIN: { name: string }[] = [
  { name: 'محمد ﷺ' },
  { name: 'عبد الله' },
  { name: 'عبد المطلب' },
  { name: 'هاشم' },
  { name: 'عبد مناف' },
  { name: 'قُصَيّ' },
  { name: 'كلاب' },
  { name: 'مُرّة' },
  { name: 'كعب' },
  { name: 'لُؤَيّ' },
  { name: 'غالب' },
  { name: 'فِهر' },
  { name: 'مالك' },
  { name: 'النَّضر' },
  { name: 'كِنانة' },
  { name: 'خُزيمة' },
  { name: 'مُدركة' },
  { name: 'إلياس' },
  { name: 'مُضَر' },
  { name: 'نِزار' },
  { name: 'مَعَدّ' },
  { name: 'عدنان' },
];

export function ProphetLineage() {
  return (
    <section className="content-card lineage">
      <h2 className="section-title">نسب النبي ﷺ</h2>

      <ol className="lineage-list">
        {CHAIN.map((p, i) => (
          <li
            key={p.name}
            className={`lineage-item${i === 0 ? ' lineage-first' : ''}`}
          >
            <span className="lineage-dot" aria-hidden="true" />
            <span className="lineage-name">
              {i > 0 && <span className="lineage-ibn">بن </span>}
              {p.name}
            </span>
          </li>
        ))}
        <li className="lineage-item lineage-last">
          <span className="lineage-dot" aria-hidden="true" />
          <span className="lineage-name">
            من ولد إسماعيل بن إبراهيم عليهم وعلى نبينا الصلاة والسلام
          </span>
        </li>
      </ol>

      <p className="lineage-note">
        محمد بن عبد الله بن عبد المطلب بن هاشم بن عبد مناف بن قصي بن كلاب بن
        مرة بن كعب بن لؤي بن غالب بن فهر بن مالك بن النضر بن كنانة بن خزيمة بن
        مدركة بن إلياس بن مضر بن نزار بن معد بن عدنان، من ولد إسماعيل بن
        إبراهيم عليهم وعلى نبينا الصلاة والسلام.
      </p>

      <style>{`
        .lineage-list {
          list-style: none;
          margin: 0;
          padding: 0 4px 0 0;
          position: relative;
        }
        .lineage-list::before {
          content: '';
          position: absolute;
          top: 14px;
          bottom: 14px;
          right: 11px;
          width: 2px;
          background: linear-gradient(
            180deg,
            rgba(233, 189, 90, 0.9),
            rgba(233, 189, 90, 0.15)
          );
        }
        .lineage-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 6px 0;
        }
        .lineage-dot {
          flex: none;
          width: 14px;
          height: 14px;
          margin-right: 5px;
          border-radius: 50%;
          background: #1a1305;
          border: 2px solid #e9bd5a;
          z-index: 1;
        }
        .lineage-name {
          font-size: 21px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.92);
        }
        .lineage-ibn {
          color: rgba(255, 255, 255, 0.45);
          font-size: 17px;
        }
        .lineage-first .lineage-name {
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(180deg, #fff1c9, #d9a441);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lineage-first .lineage-dot,
        .lineage-last .lineage-dot {
          background: #e9bd5a;
          box-shadow: 0 0 14px rgba(233, 189, 90, 0.7);
        }
        .lineage-last .lineage-name {
          color: #f1d58a;
        }
        .lineage-note {
          margin: 16px 0 0;
          font-size: 17px;
          line-height: 1.9;
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </section>
  );
}

export default ProphetLineage;
