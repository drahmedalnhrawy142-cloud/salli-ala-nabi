'use client';

export type Chip = { id: string; label: string; icon: string };

/** صف أيقونات في أول كل تبويب: الضغط عليها ينزلك مباشرة للقسم. */
export function SectionChips({ items }: { items: Chip[] }) {
  function go(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="sec-chips" aria-label="أقسام هذه الصفحة">
      {items.map((c) => (
        <button key={c.id} type="button" className="sec-chip" onClick={() => go(c.id)}>
          <span className="sec-ico" aria-hidden="true">
            {c.icon}
          </span>
          <span className="sec-lbl">{c.label}</span>
        </button>
      ))}
      <style>{`
        .sec-chips {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin: 0 0 18px;
        }
        .sec-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(232, 194, 90, 0.4);
          background: rgba(232, 194, 90, 0.08);
          color: #f1d77a;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .sec-chip:active { transform: scale(0.96); }
        .sec-ico {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(232, 194, 90, 0.16);
          font-size: 15px;
        }
        .sec-lbl {
          font-family: var(--font-kufi), sans-serif;
          font-weight: 700;
          font-size: 14px;
        }
      `}</style>
    </nav>
  );
}
