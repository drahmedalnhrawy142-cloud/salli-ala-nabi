'use client';

const MILESTONES = [
  10_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 50_000_000,
  100_000_000, 500_000_000, 1_000_000_000,
];

/** ختمة جماعية: تقدّم العدّاد العام نحو الهدف الجماعي القادم. */
export function GlobalKhatma({ total, loading }: { total: number; loading: boolean }) {
  const target = MILESTONES.find((m) => total < m) ?? total + 1_000_000_000;
  const prev = [...MILESTONES].reverse().find((m) => m <= total) ?? 0;
  const pct = loading ? 0 : Math.min(100, ((total - prev) / (target - prev)) * 100);
  const n = (v: number) => v.toLocaleString('ar-EG');

  return (
    <section className="content-card khatma">
      <h2 className="section-title">ختمة الصلاة الجماعية</h2>
      <p className="kh-text">
        {loading ? '…' : `${n(total)} صلاة على النبي ﷺ من كل من يصلّي معك`}
      </p>
      <div className="kh-bar">
        <div className="kh-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="kh-goal">
        {loading ? '' : `الهدف القادم ${n(target)} — باقي ${n(target - total)}`}
      </p>
      <style>{`
        .kh-text { font-family: var(--font-ruqaa), serif; font-size: 1.2rem; text-align: center; color: #fff1c4; margin: 4px 0 10px; line-height: 1.9; }
        .kh-bar { height: 10px; border-radius: 10px; background: rgba(232,194,90,.15); overflow: hidden; }
        .kh-fill { height: 100%; background: linear-gradient(90deg,#b8902f,#f1d77a); transition: width .4s ease; }
        .kh-goal { font-family: var(--font-kufi), sans-serif; text-align: center; color: #e8c25a; margin: 10px 0 0; font-size: .95rem; }
      `}</style>
    </section>
  );
}
