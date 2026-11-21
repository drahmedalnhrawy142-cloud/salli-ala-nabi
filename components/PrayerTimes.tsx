'use client';

import { memo as __memo } from 'react';
import { useEffect, useState } from 'react';

// [الاسم, خط العرض, خط الطول]
const CITIES: [string, number, number][] = [
  ['القاهرة', 30.0444, 31.2357],
  ['الجيزة', 30.0131, 31.2089],
  ['الإسكندرية', 31.2001, 29.9187],
  ['المنصورة', 31.0409, 31.3785],
  ['طنطا', 30.7865, 31.0004],
  ['الزقازيق', 30.5877, 31.502],
  ['بنها', 30.4659, 31.1848],
  ['شبين الكوم', 30.5595, 31.0112],
  ['دمنهور', 31.0341, 30.4682],
  ['كفر الشيخ', 31.1107, 30.9388],
  ['دمياط', 31.4165, 31.8133],
  ['بورسعيد', 31.2653, 32.3019],
  ['الإسماعيلية', 30.5965, 32.2715],
  ['السويس', 29.9668, 32.5498],
  ['الفيوم', 29.3084, 30.8428],
  ['بني سويف', 29.0661, 31.0994],
  ['المنيا', 28.1099, 30.7503],
  ['أسيوط', 27.1783, 31.1859],
  ['سوهاج', 26.5569, 31.6948],
  ['قنا', 26.1551, 32.716],
  ['الأقصر', 25.6872, 32.6396],
  ['أسوان', 24.0889, 32.8998],
  ['الغردقة', 27.2579, 33.8116],
  ['شرم الشيخ', 27.9158, 34.33],
  ['مرسى مطروح', 31.3543, 27.2373],
  ['العريش', 31.1316, 33.7984],
  ['مكة المكرمة', 21.4225, 39.8262],
  ['المدينة المنورة', 24.4672, 39.6112],
  ['جدة', 21.4858, 39.1925],
  ['الرياض', 24.7136, 46.6753],
  ['دبي', 25.2048, 55.2708],
  ['الكويت', 29.3759, 47.9774],
  ['الدوحة', 25.2854, 51.531],
  ['عمّان', 31.9454, 35.9284],
  ['بغداد', 33.3152, 44.3661],
  ['الخرطوم', 15.5007, 32.5599],
  ['طرابلس', 32.8872, 13.1913],
  ['الجزائر', 36.7538, 3.0588],
  ['تونس', 36.8065, 10.1815],
  ['الرباط', 34.0209, -6.8416],
];

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** حساب المواقيت بزوايا الهيئة المصرية العامة للمساحة: الفجر ١٩٫٥° والعشاء ١٧٫٥° والعصر مثل الظل. */
export function computeTimes(date: Date, lat: number, lng: number) {
  const tz = -date.getTimezoneOffset() / 60;
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  const jdn =
    d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  const n = jdn - 2451545; // عند منتصف النهار
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = rad((357.528 + 0.9856003 * n) % 360);
  const lam = rad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const eps = rad(23.439 - 0.0000004 * n);
  const decl = Math.asin(Math.sin(eps) * Math.sin(lam));
  const ra = deg(Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)));
  const eqt = (((L - ra + 540) % 360) - 180) * 4; // دقائق

  const noon = 12 + tz - lng / 15 - eqt / 60;
  const hourAngle = (angle: number) => {
    const c =
      (Math.sin(rad(-angle)) - Math.sin(rad(lat)) * Math.sin(decl)) / (Math.cos(rad(lat)) * Math.cos(decl));
    return deg(Math.acos(Math.max(-1, Math.min(1, c)))) / 15;
  };
  const asrAlt = deg(Math.atan(1 / (1 + Math.tan(Math.abs(rad(lat) - decl)))));
  const hAsr =
    deg(
      Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (Math.sin(rad(asrAlt)) - Math.sin(rad(lat)) * Math.sin(decl)) / (Math.cos(rad(lat)) * Math.cos(decl)),
          ),
        ),
      ),
    ) / 15;

  const at = (h: number) => {
    const t = new Date(y, m - 1, d, 0, 0, 0, 0);
    t.setMilliseconds(Math.round(h * 3600_000));
    return t;
  };
  return {
    fajr: at(noon - hourAngle(19.5)),
    sunrise: at(noon - hourAngle(0.833)),
    dhuhr: at(noon + 2 / 60),
    asr: at(noon + hAsr),
    maghrib: at(noon + hourAngle(0.833)),
    isha: at(noon + hourAngle(17.5)),
  };
}

export function qiblaBearing(lat: number, lng: number) {
  const kl = rad(21.4225);
  const kg = rad(39.8262);
  const p = rad(lat);
  const dl = kg - rad(lng);
  const y = Math.sin(dl);
  const x = Math.cos(p) * Math.tan(kl) - Math.sin(p) * Math.cos(dl);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

const NAMES: [keyof ReturnType<typeof computeTimes>, string][] = [
  ['fajr', 'الفجر'],
  ['sunrise', 'الشروق'],
  ['dhuhr', 'الظهر'],
  ['asr', 'العصر'],
  ['maghrib', 'المغرب'],
  ['isha', 'العشاء'],
];

type Cap = {
  isNativePlatform?: () => boolean;
  Plugins?: Record<string, Record<string, (o?: unknown) => Promise<{ on?: boolean }>> | undefined>;
};
function nativeFp() {
  const c = (window as unknown as { Capacitor?: Cap }).Capacitor;
  if (!c?.isNativePlatform?.()) return null;
  const fp = c.Plugins?.FloatingButton;
  return fp && fp.prayerAfterSet ? fp : null;
}

const OFFSET_MIN = 10;

function fmt(d: Date) {
  return d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
}

function PrayerTimes() {
  const [city, setCity] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [after, setAfter] = useState(false);
  const [native, setNative] = useState(false);
  const [adhan, setAdhan] = useState(false);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem('pt_city'));
      if (Number.isFinite(v) && v >= 0 && v < CITIES.length) setCity(v);
    } catch {}
    try {
      setAdhan(localStorage.getItem('pt_adhan') === '1');
    } catch {}
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    const fp = nativeFp();
    if (fp) {
      setNative(true);
      fp.prayerAfterStatus?.().then((r) => setAfter(!!r.on)).catch(() => {});
    }
    return () => clearInterval(t);
  }, []);

  // بوصلة القبلة (لو الجهاز بيدّي اتجاه)
  useEffect(() => {
    function onOri(e: Event) {
      const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      if (typeof ev.webkitCompassHeading === 'number') setHeading(ev.webkitCompassHeading);
      else if (typeof ev.alpha === 'number') setHeading((360 - ev.alpha) % 360);
    }
    window.addEventListener('deviceorientationabsolute', onOri as EventListener, true);
    return () => window.removeEventListener('deviceorientationabsolute', onOri as EventListener, true);
  }, []);

  const [cn, lat, lng] = CITIES[city];

  // مزامنة تذكير ما بعد الصلاة (٥ أيام قدّام)
  useEffect(() => {
    const fp = nativeFp();
    if (!fp) return;
    const items: string[] = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      const tm = computeTimes(day, lat, lng);
      for (const [k, name] of NAMES) {
        if (k === 'sunrise') continue;
        items.push(`${tm[k].getTime() + OFFSET_MIN * 60_000}|${name}`);
      }
    }
    fp.prayerAfterSet?.({ on: after, list: items.join(';') }).catch(() => {});
  }, [after, lat, lng, now?.toDateString()]);

  // تنبيه عند دخول وقت الصلاة (إشعار بصوت الإشعارات الافتراضي، ٧ أيام قدّام)
  useEffect(() => {
    const fp = nativeFp();
    if (!fp) return;
    const items: { at: number; title: string; text: string }[] = [];
    if (adhan) {
      for (let i = 0; i < 7; i++) {
        const day = new Date();
        day.setDate(day.getDate() + i);
        const tm = computeTimes(day, lat, lng);
        for (const [k, name] of NAMES) {
          if (k === 'sunrise') continue;
          items.push({ at: tm[k].getTime(), title: `حان وقت صلاة ${name}`, text: `حسب مواقيت ${cn} (حساب تقريبي). حيّ على الصلاة.` });
        }
      }
    }
    (fp as unknown as { eventsSet?: (o: unknown) => Promise<void> }).eventsSet?.({ group: 'adhan', items })?.catch?.(() => {});
  }, [adhan, lat, lng, cn, now?.toDateString()]);

  if (!now) return null;
  const today = computeTimes(now, lat, lng);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tmr = computeTimes(tomorrow, lat, lng);
  const upcoming = NAMES.filter(([k]) => k !== 'sunrise').find(([k]) => today[k] > now);
  const next = upcoming ? { name: upcoming[1], at: today[upcoming[0]] } : { name: 'الفجر', at: tmr.fajr };
  const mins = Math.max(0, Math.round((next.at.getTime() - now.getTime()) / 60000));
  const left = `${Math.floor(mins / 60).toLocaleString('ar-EG')} ساعة و${(mins % 60).toLocaleString('ar-EG')} دقيقة`;
  const q = qiblaBearing(lat, lng);
  const rot = heading === null ? q : q - heading;

  return (
    <section className="content-card pt" id="s-times">
      <h2 className="section-title">مواقيت الصلاة والقبلة</h2>

      <label className="pt-city">
        <span>المدينة</span>
        <select
          value={city}
          onChange={(e) => {
            const v = Number(e.target.value);
            setCity(v);
            try {
              localStorage.setItem('pt_city', String(v));
            } catch {}
          }}
        >
          {CITIES.map((c, i) => (
            <option key={c[0]} value={i}>
              {c[0]}
            </option>
          ))}
        </select>
      </label>

      <p className="pt-next">
        الصلاة القادمة: <b>{next.name}</b> {fmt(next.at)} — باقي {left}
      </p>

      <div className="pt-grid">
        {NAMES.map(([k, name]) => (
          <div key={k} className={'pt-row' + (name === next.name && k !== 'sunrise' ? ' pt-on' : '')}>
            <span>{name}</span>
            <b>{fmt(today[k])}</b>
          </div>
        ))}
      </div>
      <p className="pt-note">
        حساب تقريبي بزوايا الهيئة المصرية العامة للمساحة (الفجر ١٩٫٥° والعشاء ١٧٫٥°) — اعتمد على التقويم الرسمي في بلدك.
      </p>

      <div className="pt-qibla">
        <div className="pt-compass" aria-label="اتجاه القبلة">
          <span className="pt-n">ش</span>
          <div className="pt-arrow" style={{ transform: `rotate(${rot}deg)` }}>
            <i />
          </div>
        </div>
        <div>
          <b>القبلة من {cn}</b>
          <p>
            {Math.round(q).toLocaleString('ar-EG')}° من الشمال{' '}
            {heading === null
              ? '(حرّك الموبايل ليتحرك السهم، أو ثبّته على الشمال)'
              : '— وجّه السهم لأعلى الشاشة'}
          </p>
        </div>
      </div>

      {native && (
        <button
          type="button"
          className={'pt-toggle' + (adhan ? ' pt-toggle-on' : '')}
          onClick={() => {
            const v = !adhan;
            setAdhan(v);
            if (v) (nativeFp() as unknown as { reminderRequestPermission?: () => Promise<void> } | null)?.reminderRequestPermission?.()?.catch?.(() => {});
            try {
              localStorage.setItem('pt_adhan', v ? '1' : '0');
            } catch {}
          }}
          style={{ marginBottom: 8 }}
        >
          {adhan ? '✓ ' : ''}نبّهني عند دخول وقت كل صلاة (إشعار بلا صوت أذان)
        </button>
      )}
      {native && (
        <button
          type="button"
          className={'pt-toggle' + (after ? ' pt-toggle-on' : '')}
          onClick={() => setAfter(!after)}
        >
          {after ? '✓ ' : ''}ذكّرني بالصلاة على النبي ﷺ بعد كل صلاة بـ{OFFSET_MIN.toLocaleString('ar-EG')} دقايق
        </button>
      )}

      <style>{`
        .pt-city { display:flex; align-items:center; justify-content:space-between; gap:10px; font-family: var(--font-kufi), sans-serif; color:#f1d77a; margin-bottom:10px; }
        .pt-city select { flex:1; max-width:60%; padding:10px; border-radius:12px; background:rgba(255,255,255,.06); color:#fff1c4; border:1px solid rgba(232,194,90,.4); font-family: inherit; }
        .pt-next { font-family: var(--font-kufi), sans-serif; text-align:center; color:#fff1c4; margin:8px 0 12px; }
        .pt-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:8px; }
        .pt-row { display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 4px; border-radius:12px; background:rgba(255,255,255,.05); font-family: var(--font-kufi), sans-serif; color:rgba(255,241,196,.85); font-size:.85rem; }
        .pt-row b { font-size:1rem; color:#f1d77a; }
        .pt-on { outline:2px solid #e8c25a; background:rgba(232,194,90,.12); }
        .pt-note { font-size:.75rem; opacity:.65; margin:10px 0; }
        .pt-qibla { display:flex; align-items:center; gap:14px; padding:12px; border-radius:14px; background:rgba(255,255,255,.04); margin-bottom:12px; }
        .pt-qibla p { margin:4px 0 0; font-size:.8rem; opacity:.8; }
        .pt-compass { position:relative; width:84px; height:84px; flex:none; border-radius:50%; border:2px solid rgba(232,194,90,.5); }
        .pt-n { position:absolute; top:2px; left:50%; transform:translateX(-50%); font-size:.65rem; opacity:.7; font-family: var(--font-kufi), sans-serif; }
        .pt-arrow { position:absolute; inset:0; transition: transform .2s; }
        .pt-arrow i { position:absolute; left:50%; top:10px; width:0; height:0; margin-left:-7px; border-left:7px solid transparent; border-right:7px solid transparent; border-bottom:34px solid #e8c25a; }
        .pt-toggle { width:100%; padding:12px; border-radius:14px; border:1px solid rgba(232,194,90,.4); background:transparent; color:#fff1c4; font-family: var(--font-kufi), sans-serif; cursor:pointer; }
        .pt-toggle-on { background:rgba(232,194,90,.18); border-color:#e8c25a; }
      `}</style>
    </section>
  );
}

const PrayerTimesMemo = __memo(PrayerTimes);
export { PrayerTimesMemo as PrayerTimes };
