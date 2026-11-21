'use client';

import { useEffect, useMemo, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { VH } from '@/components/virtueData';

/** أيام الفضل: التاريخ الهجري بتقويم أم القرى (Intl) + أحاديث موثّقة + تذكير بإشعار قبلها. */
type Ev = { key: string; title: string; hint: string; hk: keyof typeof VH; at: Date; remind: Date; label: string };

const MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];

function hijri(d: Date) {
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const p = f.formatToParts(d);
    const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
    return { d: g('day'), m: g('month'), y: g('year') };
  } catch {
    return null;
  }
}

function at(day: Date, h: number, m = 0) {
  const x = new Date(day);
  x.setHours(h, m, 0, 0);
  return x;
}

export function buildEvents(from: Date, days: number): Ev[] {
  const out: Ev[] = [];
  const base = new Date(from);
  base.setHours(12, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    const eve = new Date(day);
    eve.setDate(day.getDate() - 1);
    const h = hijri(day);
    if (!h) continue;
    const dow = day.getDay();
    const hd = `${toAr(h.d)} ${MONTHS[h.m - 1]}`;
    const push = (key: string, title: string, hint: string, hk: keyof typeof VH, remind: Date) =>
      out.push({ key: `${key}-${i}`, title, hint, hk, at: day, remind, label: hd });
    if ((dow === 1 || dow === 4) && h.m !== 9)
      push('mt', dow === 1 ? 'يوم الاثنين' : 'يوم الخميس', 'يُستحب صيامه', 'monthu', at(eve, 20, 30));
    if ([13, 14, 15].includes(h.d) && h.m !== 9 && h.m !== 12)
      push('wh', `من الأيام البيض (${toAr(h.d)})`, 'صيام الأيام البيض', 'white', at(eve, 20, 30));
    if (h.m === 1 && h.d === 9) push('ts', 'تاسوعاء', 'يُستحب صيامه مع عاشوراء', 'tasua', at(eve, 20, 30));
    if (h.m === 1 && h.d === 10) push('as', 'يوم عاشوراء', 'صيام عاشوراء', 'ashura', at(eve, 20, 30));
    if (h.m === 12 && h.d === 1) push('tn', 'بدء عشر ذي الحجة', 'أفضل أيام الدنيا للعمل الصالح', 'ten', at(eve, 20, 30));
    if (h.m === 12 && h.d === 9) push('ar', 'يوم عرفة', 'صيام عرفة لغير الحاج', 'arafah', at(eve, 20, 30));
    if (h.m === 10 && h.d === 2) push('sh', 'ستّ من شوّال', 'ابدأ صيام الست بعد العيد', 'shawwal', at(eve, 20, 30));
    if (h.m === 9 && [21, 23, 25, 27, 29].includes(h.d - 1))
      push('qd', `ليلة ${toAr(h.d - 1)} من رمضان`, 'من ليالي الوتر في العشر الأواخر — تحرَّ ليلة القدر', 'qadr', at(day, 0, 0));
  }
  // ليالي الوتر تبدأ عند غروب اليوم السابق: نذكّر مساء ذلك اليوم
  return out.map((e) => (e.key.startsWith('qd') ? { ...e, remind: at(new Date(e.at.getTime() - 86400000), 19, 30) } : e));
}

type Cap = { isNativePlatform?: () => boolean; Plugins?: Record<string, Record<string, (o?: unknown) => Promise<unknown>> | undefined> };
function fp() {
  const c = (window as unknown as { Capacitor?: Cap }).Capacitor;
  return c?.isNativePlatform?.() ? c.Plugins?.FloatingButton ?? null : null;
}

export function VirtueDays() {
  const [now, setNow] = useState<Date | null>(null);
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [native, setNative] = useState(false);
  useEffect(() => {
    setNow(new Date());
    try {
      setOn(localStorage.getItem('virtue_on') === '1');
    } catch {}
    setNative(!!fp()?.eventsSet);
  }, []);
  const evs = useMemo(() => (now ? buildEvents(now, 75) : []), [now?.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const f = fp();
    if (!f?.eventsSet || !now) return;
    const items = on
      ? evs
          .filter((e) => e.remind.getTime() > Date.now())
          .slice(0, 55)
          .map((e) => ({ at: e.remind.getTime(), title: `غدًا: ${e.title}`, text: e.hk === 'monthu' || e.hk === 'white' ? `${VH[e.hk].text} — ${VH[e.hk].source}` : e.hint }))
      : [];
    f.eventsSet({ group: 'virtue', items })?.catch?.(() => {});
  }, [on, evs, now]);

  if (!now) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diff = (d: Date) => Math.round((new Date(d).setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
  const h = hijri(now);
  const todays = evs.filter((e) => diff(e.at) === 0);
  const specials = evs.filter((e) => !e.key.startsWith('mt') && !e.key.startsWith('wh'));
  const list = evs.filter((e) => diff(e.at) > 0).slice(0, 24);

  function Row({ e }: { e: Ev }) {
    const dd = diff(e.at);
    const hd = VH[e.hk];
    const o = open === e.key;
    return (
      <div className="vd-r">
        <button type="button" onClick={() => setOpen(o ? null : e.key)}>
          <b>{e.title}</b>
          <span>
            {dd === 0 ? 'اليوم' : dd === 1 ? 'غدًا' : `بعد ${toAr(dd)} أيام`} • {e.label}
          </span>
        </button>
        {o && (
          <div className="vd-h">
            <p>{e.hint}</p>
            <q>{hd.text}</q>
            <small>
              {hd.narrator} — {hd.source}
            </small>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="vd">
      {h && (
        <div className="vd-date">
          {toAr(h.d)} {MONTHS[h.m - 1]} {toAr(h.y)} هـ
        </div>
      )}
      {todays.length > 0 && (
        <div className="vd-today">
          <b>اليوم</b>
          {todays.map((e) => (
            <Row key={e.key} e={e} />
          ))}
        </div>
      )}
      {native && (
        <button
          type="button"
          className={'vd-on' + (on ? ' on' : '')}
          onClick={() => {
            const v = !on;
            setOn(v);
            try {
              localStorage.setItem('virtue_on', v ? '1' : '0');
            } catch {}
            if (v) (fp() as unknown as { reminderRequestPermission?: () => Promise<void> } | null)?.reminderRequestPermission?.()?.catch?.(() => {});
          }}
        >
          {on ? '🔔 تذكير أيام الفضل مفعّل' : '🔕 فعّل تذكير أيام الفضل (إشعار قبلها)'}
        </button>
      )}
      <h3 className="vd-h3">القادم</h3>
      {list.length === 0 && <p style={{ opacity: 0.7 }}>لا شيء قريبًا.</p>}
      {list.map((e) => (
        <Row key={e.key} e={e} />
      ))}
      {specials.length === 0 && null}
      <p className="vd-n">التاريخ الهجري بتقويم أم القرى، وقد يختلف يومًا عن رؤية الهلال في بلدك. الأحاديث من الصحيحين والسنن بنصوصها.</p>
      <style>{`
        .vd { font-family: var(--font-kufi), sans-serif; }
        .vd-date { text-align: center; font-size: 17px; color: #f1d77a; margin-bottom: 10px; }
        .vd-today { padding: 10px; border-radius: 16px; border: 1px solid #e8c25a; background: rgba(232,194,90,.12); margin-bottom: 12px; }
        .vd-today > b { color: #f1d77a; font-size: 13px; }
        .vd-h3 { margin: 14px 0 6px; font-size: 14px; color: #e8c25a; }
        .vd-r { border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); border-radius: 14px; margin-bottom: 8px; overflow: hidden; }
        .vd-r > button { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 12px; background: none; border: 0; color: #fff1c4; font-family: inherit; text-align: right; }
        .vd-r > button span { font-size: 12px; color: #7fe0c0; }
        .vd-h { padding: 0 12px 12px; }
        .vd-h p { margin: 0 0 6px; font-size: 13px; color: rgba(255,241,196,.75); }
        .vd-h q { display: block; font-family: var(--font-ruqaa), serif; font-size: 20px; line-height: 2.1; color: #fff1c4; quotes: none; }
        .vd-h small { display: block; margin-top: 4px; color: #f1d77a; font-size: 12px; }
        .vd-on { width: 100%; padding: 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #fff1c4; font-family: inherit; }
        .vd-on.on { background: rgba(232,194,90,.18); border-color: #e8c25a; }
        .vd-n { margin-top: 12px; text-align: center; font-size: 11.5px; color: rgba(255,241,196,.5); }
      `}</style>
    </div>
  );
}
