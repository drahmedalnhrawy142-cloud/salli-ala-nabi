'use client';

import { useEffect, useMemo, useState } from 'react';
import { lsGet, lsSet, toAr, type QData } from './data';

/**
 * خطة الحفظ والمراجعة: سجّل ما حفظته (مقاطع من السور)، وسيجدول التطبيق مراجعتها بفواصل متباعدة
 * (١ ثم ٣ ثم ٧ ثم ١٤ ثم ٣٠ ثم ٦٠ يومًا)، ويُظهر ما حان موعد مراجعته اليوم، وتقدّمك في المصحف.
 * كل شيء على جهازك فقط.
 */
type R = { id: string; s: number; a: number; b: number; lvl: number; next: string };
const KEY = 'hifz.v1';
const GAP = [1, 3, 7, 14, 30, 60];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => iso(new Date(Date.now() + n * 86400000));

export function QuranHifz({ data, onGo }: { data: QData; onGo?: (page: number, ayaIdx: number) => void }) {
  const [rs, setRs] = useState<R[]>([]);
  const [s, setS] = useState(78);
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [goal, setGoal] = useState(5);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setRs(lsGet<R[]>(KEY, []));
    setGoal(lsGet<number>('hifz.goal', 5));
  }, []);
  function save(n: R[]) {
    setRs(n);
    lsSet(KEY, n);
  }
  const sura = data.suras[s - 1];
  const today = iso(new Date());

  function add() {
    const from = Math.max(1, Math.min(a, sura.ayas));
    const to = Math.max(from, Math.min(b, sura.ayas));
    if (rs.some((r) => r.s === s && r.a <= to && r.b >= from)) {
      setMsg('هذا المقطع (أو جزء منه) مسجَّل من قبل.');
      setTimeout(() => setMsg(''), 2500);
      return;
    }
    save([...rs, { id: `h${Date.now()}`, s, a: from, b: to, lvl: 0, next: addDays(1) }]);
    setMsg('تم التسجيل، وأول مراجعة غدًا بإذن الله ✅');
    setTimeout(() => setMsg(''), 2500);
  }
  function review(r: R, ok: boolean) {
    const lvl = ok ? Math.min(GAP.length - 1, r.lvl + 1) : 0;
    save(rs.map((x) => (x.id === r.id ? { ...x, lvl, next: addDays(ok ? GAP[lvl] : 1) } : x)));
  }
  function del(r: R) {
    save(rs.filter((x) => x.id !== r.id));
  }
  function open(r: R) {
    const i = data.ayas.findIndex((y) => y[0] === r.s && y[1] === r.a);
    if (i >= 0 && onGo) onGo(data.ayas[i][2], i);
  }

  const due = rs.filter((r) => r.next <= today).sort((x, y) => x.next.localeCompare(y.next));
  const total = useMemo(() => {
    const seen = new Set<string>();
    rs.forEach((r) => {
      for (let i = r.a; i <= r.b; i++) seen.add(`${r.s}:${i}`);
    });
    return seen.size;
  }, [rs]);
  const pct = ((total / data.ayas.length) * 100).toFixed(1);
  const label = (r: R) => `${data.suras[r.s - 1].name} ${toAr(r.a)}${r.b > r.a ? `–${toAr(r.b)}` : ''}`;

  // تقدير مدة حفظ سورة بعدد آيات يوميًّا
  const done = new Set<number>();
  rs.forEach((r) => {
    if (r.s === s) for (let i = r.a; i <= r.b; i++) done.add(i);
  });
  const left = sura.ayas - done.size;
  const days = goal > 0 ? Math.ceil(left / goal) : 0;

  return (
    <div className="hf">
      <div className="hf-sum">
        <b>{toAr(total)} آية محفوظة</b>
        <span>{toAr(Number(pct))}٪ من المصحف</span>
        <div className="hf-bar"><i style={{ width: `${Math.max(1, Number(pct))}%` }} /></div>
      </div>

      <h3>مراجعة اليوم {due.length ? `(${toAr(due.length)})` : ''}</h3>
      {due.length === 0 && <p className="hf-n">لا مراجعات مستحقة اليوم، ما شاء الله 🌿</p>}
      {due.map((r) => (
        <div key={r.id} className="hf-r">
          <button type="button" className="hf-t" onClick={() => open(r)}>{label(r)}</button>
          <div>
            <button type="button" onClick={() => review(r, true)}>راجعتها ✓</button>
            <button type="button" className="no" onClick={() => review(r, false)}>نسيت</button>
          </div>
        </div>
      ))}

      <h3>سجّل محفوظًا جديدًا</h3>
      <div className="hf-f">
        <select value={s} onChange={(e) => { const n = Number(e.target.value); setS(n); setA(1); setB(1); }}>
          {data.suras.map((x) => (
            <option key={x.n} value={x.n}>{x.name}</option>
          ))}
        </select>
        <label>من آية <input type="number" min={1} max={sura.ayas} value={a} onChange={(e) => setA(Number(e.target.value) || 1)} /></label>
        <label>إلى آية <input type="number" min={1} max={sura.ayas} value={b} onChange={(e) => setB(Number(e.target.value) || 1)} /></label>
        <button type="button" className="hf-add" onClick={add}>إضافة</button>
      </div>
      <p className="hf-n">{msg || `${sura.name}: ${toAr(sura.ayas)} آية`}</p>

      <h3>خطة حفظ السورة</h3>
      <div className="hf-g">
        <span>آيات يوميًّا</span>
        {[2, 3, 5, 10].map((g) => (
          <button key={g} type="button" className={g === goal ? 'on' : ''} onClick={() => { setGoal(g); lsSet('hifz.goal', g); }}>{toAr(g)}</button>
        ))}
      </div>
      <p className="hf-n">
        {left <= 0 ? `ما شاء الله، حفظتَ ${sura.name} كاملة.` : `باقي ${toAr(left)} آية من ${sura.name}، تُتمّها في نحو ${toAr(days)} يومًا بإذن الله.`}
      </p>

      {rs.length > 0 && (
        <>
          <h3>محفوظاتك</h3>
          {[...rs].sort((x, y) => x.s - y.s || x.a - y.a).map((r) => (
            <div key={r.id} className="hf-r">
              <button type="button" className="hf-t" onClick={() => open(r)}>
                {label(r)}
                <small>المراجعة القادمة: {r.next === today ? 'اليوم' : r.next}</small>
              </button>
              <button type="button" className="no" onClick={() => del(r)} aria-label="حذف">✕</button>
            </div>
          ))}
        </>
      )}
      <style>{`
        .hf { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 10px; }
        .hf h3 { margin: 8px 2px 0; font-size: 15px; color: #e8c25a; }
        .hf-sum { padding: 14px; border-radius: 18px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.85); text-align: center; display: flex; flex-direction: column; gap: 6px; }
        .hf-sum b { font-size: 22px; color: #f1d77a; }
        .hf-bar { height: 8px; border-radius: 8px; background: rgba(232,194,90,.15); overflow: hidden; }
        .hf-bar i { display: block; height: 100%; background: linear-gradient(90deg, #e8c25a, #7fe0c0); }
        .hf-n { margin: 0; font-size: 12.5px; text-align: center; color: rgba(255,241,196,.65); }
        .hf-r { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.8); }
        .hf-r > div { display: flex; gap: 6px; }
        .hf-r button { padding: 7px 12px; border-radius: 999px; border: 1px solid rgba(127,224,192,.5); background: rgba(127,224,192,.1); color: #7fe0c0; font-family: inherit; font-size: 13px; }
        .hf-r button.no { border-color: rgba(255,170,140,.5); background: rgba(255,170,140,.08); color: #ffb59c; }
        .hf-r .hf-t { flex: 1; text-align: start; border: 0; background: transparent; color: #fff1c4; font-size: 15px; display: flex; flex-direction: column; gap: 2px; }
        .hf-t small { font-size: 11px; color: rgba(255,241,196,.5); }
        .hf-f { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .hf-f select { grid-column: 1 / -1; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 15px; }
        .hf-f label { font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
        .hf-f input { width: 100%; box-sizing: border-box; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.9); color: #fff1c4; font-family: inherit; font-size: 15px; }
        .hf-add { grid-column: 1 / -1; padding: 11px; border-radius: 14px; border: 1px solid rgba(232,194,90,.5); background: rgba(232,194,90,.2); color: #f1d77a; font-family: inherit; font-size: 15px; font-weight: 700; }
        .hf-g { display: flex; gap: 8px; align-items: center; justify-content: center; font-size: 13px; }
        .hf-g button { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #f1d77a; font-family: inherit; }
        .hf-g button.on { background: #e8c25a; color: #1a1409; }
      `}</style>
    </div>
  );
}
