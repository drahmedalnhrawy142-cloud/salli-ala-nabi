'use client';

import { useEffect, useState } from 'react';
import { readHistory } from '@/components/ProphetStats';
import { dayKeyOf, readDays } from '@/components/weekStats';

/** حصاد الأسبوع: آخر ٧ أيام مقابل الأسبوع الذي قبله، للصلاة على النبي ﷺ والأذكار وورد القرآن. بيانات الجهاز فقط. */
const ar = (n: number) => n.toLocaleString('ar-EG');
type Row = { id: string; label: string; unit: string; color: string; cur: number[]; prev: number };

function build(): { rows: Row[]; days: string[]; active: number; best: string } {
  const h = readHistory();
  const a = readDays();
  const keys = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => dayKeyOf(from + i));
  const cur = keys(-6, 0);
  const prv = keys(-13, -7);
  const pick = (f: (k: string) => number, ks: string[]) => ks.map(f);
  const sal = (k: string) => h[k] || 0;
  const dh = (k: string) => a[k]?.d || 0;
  const qr = (k: string) => a[k]?.q || 0;
  const sum = (x: number[]) => x.reduce((p, c) => p + c, 0);
  const rows: Row[] = [
    { id: 's', label: 'الصلاة على النبي ﷺ', unit: 'مرة', color: '#f1d77a', cur: pick(sal, cur), prev: sum(pick(sal, prv)) },
    { id: 'd', label: 'الأذكار والتسبيح', unit: 'ذكر', color: '#7fe0c0', cur: pick(dh, cur), prev: sum(pick(dh, prv)) },
    { id: 'q', label: 'ورد القرآن', unit: 'صفحة', color: '#9ec5ff', cur: pick(qr, cur), prev: sum(pick(qr, prv)) },
  ];
  const tot = cur.map((_, i) => rows.reduce((p, r) => p + r.cur[i], 0));
  const active = tot.filter((x) => x > 0).length;
  const bi = tot.indexOf(Math.max(...tot));
  const best = Math.max(...tot) > 0 ? new Date(cur[bi] + 'T12:00:00').toLocaleDateString('ar-EG', { weekday: 'long' }) : '';
  return { rows, days: cur, active, best };
}

export function WeeklyStats() {
  const [d, setD] = useState<ReturnType<typeof build> | null>(null);
  useEffect(() => {
    setD(build());
  }, []);
  if (!d) return null;
  return (
    <div className="ws">
      <h3>حصاد الأسبوع</h3>
      <p className="ws-s">
        أيام النشاط: {ar(d.active)} من ٧{d.best ? ` • أنشط يوم: ${d.best}` : ''}
      </p>
      {d.rows.map((r) => {
        const t = r.cur.reduce((p, c) => p + c, 0);
        const mx = Math.max(1, ...r.cur);
        const diff = r.prev > 0 ? Math.round(((t - r.prev) / r.prev) * 100) : null;
        return (
          <div key={r.id} className="ws-r">
            <div className="ws-h">
              <b style={{ color: r.color }}>{r.label}</b>
              <span>
                {ar(t)} {r.unit}
                {diff != null && t !== r.prev && (
                  <i style={{ color: diff > 0 ? '#7fe0c0' : '#ffb27a' }}> {diff > 0 ? '▲' : '▼'} {ar(Math.abs(diff))}٪</i>
                )}
              </span>
            </div>
            <div className="ws-b">
              {r.cur.map((v, i) => (
                <div key={i} className="ws-c" title={`${ar(v)}`}>
                  <div className="ws-bar" style={{ height: `${Math.round((v / mx) * 100)}%`, background: r.color, opacity: v ? 1 : 0.15 }} />
                  <small>{new Date(d.days[i] + 'T12:00:00').toLocaleDateString('ar-EG', { weekday: 'narrow' })}</small>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <p className="ws-n">النسبة مقارنة بالأسبوع الذي قبله. الأرقام مخزّنة على جهازك فقط، وأذكار الأيقونة العايمة الخضراء لا تدخل فيها بعد.</p>
      <style>{`
        .ws { font-family: var(--font-kufi), sans-serif; color: #fff1c4; padding: 14px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); margin-bottom: 14px; }
        .ws h3 { margin: 0 0 4px; color: #f1d77a; font-size: 16px; }
        .ws-s { margin: 0 0 10px; font-size: 12.5px; color: rgba(255,241,196,.7); }
        .ws-r { margin-bottom: 12px; }
        .ws-h { display: flex; justify-content: space-between; align-items: baseline; font-size: 13.5px; margin-bottom: 4px; }
        .ws-h i { font-style: normal; font-size: 12px; }
        .ws-b { display: flex; gap: 6px; height: 64px; align-items: flex-end; }
        .ws-c { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 2px; }
        .ws-bar { width: 100%; min-height: 3px; border-radius: 4px 4px 0 0; }
        .ws-c small { font-size: 10.5px; color: rgba(255,241,196,.6); }
        .ws-n { margin: 6px 0 0; font-size: 11px; color: rgba(255,241,196,.5); line-height: 1.7; }
      `}</style>
    </div>
  );
}
