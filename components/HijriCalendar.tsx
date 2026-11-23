'use client';

import { useEffect, useMemo, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { CITIES, computeTimes } from '@/components/PrayerTimes';

/**
 * التقويم الهجري (أم القرى عبر Intl) مع المناسبات الشرعية المتفق عليها، وإمساكية رمضان بمواقيت مدينتك.
 * التواريخ والمواقيت تقريبية؛ العبرة برؤية الهلال في بلدك وبما تعلنه الجهة الرسمية.
 */
const MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function hj(d: Date) {
  try {
    const p = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d);
    const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
    return { d: g('day'), m: g('month'), y: g('year') };
  } catch {
    return null;
  }
}
const noon = (d: Date) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};
const addD = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
function firstOf(d: Date) {
  let x = noon(d);
  for (let i = 0; i < 31; i++) {
    if (hj(x)?.d === 1) return x;
    x = addD(x, -1);
  }
  return noon(d);
}
function events(h: { d: number; m: number }, dow: number): { t: string; k: 'e' | 'f' | 'n' }[] {
  const o: { t: string; k: 'e' | 'f' | 'n' }[] = [];
  if (h.m === 1 && h.d === 1) o.push({ t: 'رأس السنة الهجرية', k: 'n' });
  if (h.m === 1 && h.d === 9) o.push({ t: 'تاسوعاء — يُستحب صيامه', k: 'f' });
  if (h.m === 1 && h.d === 10) o.push({ t: 'عاشوراء — يُستحب صيامه', k: 'f' });
  if (h.m === 9 && h.d === 1) o.push({ t: 'أول رمضان — صيام الفريضة', k: 'n' });
  if (h.m === 9 && [21, 23, 25, 27, 29].includes(h.d)) o.push({ t: `ليلة ${toAr(h.d)} (من وتر العشر الأواخر)`, k: 'n' });
  if (h.m === 10 && h.d === 1) o.push({ t: 'عيد الفطر — يحرم صيامه', k: 'e' });
  if (h.m === 10 && h.d >= 2 && h.d <= 7) o.push({ t: 'أيام الست من شوال', k: 'f' });
  if (h.m === 12 && h.d <= 9) o.push({ t: `من عشر ذي الحجة (${toAr(h.d)})`, k: 'n' });
  if (h.m === 12 && h.d === 9) o.push({ t: 'يوم عرفة — يُستحب صيامه لغير الحاج', k: 'f' });
  if (h.m === 12 && h.d === 10) o.push({ t: 'عيد الأضحى — يحرم صيامه', k: 'e' });
  if (h.m === 12 && h.d >= 11 && h.d <= 13) o.push({ t: 'أيام التشريق — أيام أكل وشرب وذكر لله', k: 'e' });
  if ([13, 14, 15].includes(h.d) && h.m !== 9 && h.m !== 12) o.push({ t: 'من الأيام البيض — يُستحب صيامها', k: 'f' });
  if ((dow === 1 || dow === 4) && h.m !== 9) o.push({ t: dow === 1 ? 'الاثنين — يُستحب صيامه' : 'الخميس — يُستحب صيامه', k: 'f' });
  return o;
}
const ft = (d: Date) => d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

export function HijriCalendar() {
  const [today, setToday] = useState<Date | null>(null);
  const [first, setFirst] = useState<Date | null>(null);
  const [sel, setSel] = useState<Date | null>(null);
  const [city, setCity] = useState(0);

  useEffect(() => {
    const t = noon(new Date());
    setToday(t);
    setFirst(firstOf(t));
    setSel(t);
    try {
      const v = Number(localStorage.getItem('pt_city'));
      if (Number.isFinite(v) && v >= 0 && v < CITIES.length) setCity(v);
    } catch {}
  }, []);

  const days = useMemo(() => {
    if (!first) return [];
    const m = hj(first)!.m;
    const out: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = addD(first, i);
      if (hj(d)?.m !== m) break;
      out.push(d);
    }
    return out;
  }, [first]);

  if (!today || !first || !sel || !hj(first)) return null;
  const hf = hj(first)!;
  const go = (n: number) => {
    const base = n > 0 ? addD(first, 29 + 0) : addD(first, -1);
    let x = base;
    if (n > 0) {
      for (let i = 0; i < 4 && hj(x)?.m === hf.m; i++) x = addD(x, 1);
    }
    setFirst(firstOf(x));
  };
  const hs = hj(sel)!;
  const ev = events(hs, sel.getDay());
  const [cn, lat, lng] = CITIES[city];
  const ram = hf.m === 9;
  const lead = first.getDay();

  return (
    <div className="hc">
      <div className="hc-top">
        <button type="button" onClick={() => go(-1)} aria-label="الشهر السابق">›</button>
        <div>
          <b>{MONTHS[hf.m - 1]} {toAr(hf.y)}هـ</b>
          <small>{first.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</small>
        </div>
        <button type="button" onClick={() => go(1)} aria-label="الشهر التالي">‹</button>
      </div>
      <div className="hc-g">
        {WD.map((w) => (
          <span key={w} className="hc-w">{w.slice(0, 3)}</span>
        ))}
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {days.map((d) => {
          const h = hj(d)!;
          const e = events(h, d.getDay());
          const kind = e.find((x) => x.k === 'e') ? 'e' : e.find((x) => x.k === 'n') ? 'n' : e.length ? 'f' : '';
          return (
            <button
              key={d.toISOString()}
              type="button"
              className={`hc-d${d.toDateString() === today.toDateString() ? ' td' : ''}${d.toDateString() === sel.toDateString() ? ' sl' : ''} k${kind}`}
              onClick={() => setSel(d)}
            >
              <b>{toAr(h.d)}</b>
              <small>{toAr(d.getDate())}</small>
            </button>
          );
        })}
      </div>
      <div className="hc-leg">
        <span><i className="kf" /> صيام مستحب</span>
        <span><i className="kn" /> مناسبة</span>
        <span><i className="ke" /> عيد</span>
      </div>
      <div className="hc-sel">
        <b>{WD[sel.getDay()]} {toAr(hs.d)} {MONTHS[hs.m - 1]} {toAr(hs.y)}هـ</b>
        <small>{sel.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
        {ev.length ? ev.map((x, i) => <p key={i}>• {x.t}</p>) : <p className="mu">لا مناسبة خاصة في هذا اليوم.</p>}
      </div>
      {ram && (
        <div className="hc-r">
          <h3>إمساكية رمضان — {cn}</h3>
          <div className="hc-rt">
            <div className="hh"><span>اليوم</span><span>الفجر (الإمساك)</span><span>المغرب (الإفطار)</span></div>
            {days.map((d) => {
              const tm = computeTimes(d, lat, lng);
              return (
                <div key={d.toISOString()} className={d.toDateString() === today.toDateString() ? 'td' : ''}>
                  <span>{toAr(hj(d)!.d)} • {WD[d.getDay()].slice(0, 3)}</span>
                  <span>{ft(tm.fajr)}</span>
                  <span>{ft(tm.maghrib)}</span>
                </div>
              );
            })}
          </div>
          <p className="mu">المدينة من إعدادات «مواقيت الصلاة». يُحتاط للإمساك بدقائق قبل الفجر.</p>
        </div>
      )}
      <p className="mu">التقويم بنظام أم القرى وقد يختلف يومًا عن رؤية الهلال في بلدك؛ فاعتمد ما تعلنه الجهة الرسمية. المواقيت حساب تقريبي.</p>
      <style>{`
        .hc { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 10px; }
        .hc-top { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 18px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.85); }
        .hc-top div { text-align: center; display: flex; flex-direction: column; }
        .hc-top b { font-size: 19px; color: #f1d77a; }
        .hc-top small { font-size: 12px; color: rgba(255,241,196,.6); }
        .hc-top button { width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.1); color: #f1d77a; font-size: 22px; }
        .hc-g { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
        .hc-w { text-align: center; font-size: 11px; color: rgba(255,241,196,.55); padding: 4px 0; }
        .hc-d { aspect-ratio: 1; border-radius: 12px; border: 1px solid rgba(232,194,90,.18); background: rgba(18,15,8,.7); color: #fff1c4; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: inherit; padding: 0; }
        .hc-d b { font-size: 16px; }
        .hc-d small { font-size: 9.5px; color: rgba(255,241,196,.45); }
        .hc-d.kf { border-color: rgba(127,224,192,.5); }
        .hc-d.kn { border-color: rgba(232,194,90,.7); background: rgba(232,194,90,.1); }
        .hc-d.ke { border-color: rgba(255,150,150,.7); background: rgba(255,120,120,.12); }
        .hc-d.td { box-shadow: 0 0 0 2px #e8c25a inset; }
        .hc-d.sl { background: #e8c25a; color: #1a1409; }
        .hc-d.sl small { color: rgba(26,20,9,.65); }
        .hc-leg { display: flex; gap: 14px; justify-content: center; font-size: 11.5px; color: rgba(255,241,196,.65); }
        .hc-leg i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-inline-end: 4px; }
        .kf { background: rgba(127,224,192,.8); } .kn { background: #e8c25a; } .ke { background: rgba(255,120,120,.85); }
        .hc-sel { padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.8); display: flex; flex-direction: column; gap: 3px; }
        .hc-sel b { color: #f1d77a; font-size: 16px; }
        .hc-sel small { font-size: 12px; color: rgba(255,241,196,.55); }
        .hc-sel p { margin: 4px 0 0; font-size: 14px; line-height: 1.9; }
        .mu { color: rgba(255,241,196,.55) !important; font-size: 11.5px !important; text-align: center; margin: 0; line-height: 1.9; }
        .hc-r h3 { margin: 4px 2px 8px; font-size: 15px; color: #e8c25a; }
        .hc-rt { border-radius: 16px; border: 1px solid rgba(232,194,90,.3); overflow: hidden; background: rgba(18,15,8,.8); }
        .hc-rt { display: flex; flex-direction: column; }
        .hc-rt > div { display: grid; grid-template-columns: 1.2fr 1fr 1fr; }
        .hc-rt .hh { background: rgba(232,194,90,.15); color: #f1d77a; font-size: 12px; }
        .hc-rt div { padding: 8px 12px; font-size: 13.5px; border-top: 1px solid rgba(232,194,90,.12); }
        .hc-rt div.td { background: rgba(232,194,90,.18); color: #f1d77a; }
      `}</style>
    </div>
  );
}
