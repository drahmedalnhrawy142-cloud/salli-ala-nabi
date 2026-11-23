'use client';

import { useEffect, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { SunriseDoodle } from '@/components/Doodles';

/**
 * حديث اليوم: من الأربعين النووية (نصوصها من sunnah.com عبر hadith-json، بلا تعديل).
 * يتغيّر الحديث كل يوم بالتتابع، مع زر للحديث التالي والسابق، وتذكير اختياري بإشعار صباحي.
 * لا شرح مضافًا: لا نكتب شرحًا من عندنا، والشرح عند أهل العلم في كتبهم.
 */
type Cap = { isNativePlatform?: () => boolean; Plugins?: Record<string, Record<string, (o?: unknown) => Promise<unknown>> | undefined> };
function fp() {
  const c = (window as unknown as { Capacitor?: Cap }).Capacitor;
  return c?.isNativePlatform?.() ? c.Plugins?.FloatingButton ?? null : null;
}

const DAY = 86400000;
function dayIndex(d: Date) {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY);
}
const KEY = 'dh_on';
const HOUR = 'dh_hour';

export function DailyHadith() {
  const [list, setList] = useState<[string, string, string][] | null>(null);
  const [err, setErr] = useState(false);
  const [off, setOff] = useState(0);
  const [on, setOn] = useState(false);
  const [hour, setHour] = useState(8);
  const [native, setNative] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const get = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject())) as Promise<[string, string][]>;
    get('/hadith/nawawi/0.json')
      .then(async (nw) => {
        // رياض الصالحين (المتفق عليه فقط) مع الأربعين مبثوثة بينها؛ إن تعذّر تحميله نكتفي بالأربعين
        let ry: [string, string][] = [];
        try { ry = await get('/hadith/riyad/0.json'); } catch {}
        const out: [string, string, string][] = [];
        let k = 0;
        ry.forEach((h, j) => {
          out.push([h[0], h[1], 'رياض الصالحين']);
          if ((j + 1) % 13 === 0 && k < nw.length) { out.push([nw[k][0], nw[k][1], 'الأربعون النووية']); k++; }
        });
        for (; k < nw.length; k++) out.push([nw[k][0], nw[k][1], 'الأربعون النووية']);
        setList(out);
      })
      .catch(() => setErr(true));
    try {
      setOn(localStorage.getItem(KEY) === '1');
      const h = Number(localStorage.getItem(HOUR));
      if (h >= 0 && h < 24 && localStorage.getItem(HOUR) !== null) setHour(h);
    } catch {}
    setNative(!!fp()?.eventsSet);
  }, []);

  // جدولة إشعارات الأيام القادمة (٣٠ يومًا) بحديث كل يوم
  useEffect(() => {
    const f = fp();
    if (!f?.eventsSet || !list) return;
    const items: { at: number; title: string; text: string }[] = [];
    if (on) {
      const base = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        d.setHours(hour, 0, 0, 0);
        if (d.getTime() <= Date.now()) continue;
        const t = list[((dayIndex(d) % list.length) + list.length) % list.length][1].replace(/\s+/g, ' ');
        items.push({ at: d.getTime(), title: 'حديث اليوم', text: t.length > 220 ? t.slice(0, 217) + '…' : t });
      }
    }
    f.eventsSet({ group: 'hadith', items })?.catch?.(() => {});
  }, [on, hour, list]);

  function setOnS(v: boolean) {
    setOn(v);
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {}
  }
  function setHourS(h: number) {
    setHour(h);
    try {
      localStorage.setItem(HOUR, String(h));
    } catch {}
  }

  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل الحديث.</p>;
  if (!list) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;

  const i = (((dayIndex(new Date()) + off) % list.length) + list.length) % list.length;
  const [n, t, src] = list[i];
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${t}\n— ${src} (حديث ${n})`);
      setMsg('تم النسخ');
    } catch {
      setMsg('تعذّر النسخ');
    }
    setTimeout(() => setMsg(''), 1300);
  }

  return (
    <div className="dh">
      <SunriseDoodle />
      <article className="dh-c">
        <div className="dh-n">{off === 0 ? 'حديث اليوم' : 'حديث آخر'} — {src} • الحديث {toAr(Number(n) || 0)}</div>
        <p>{t}</p>
        <div className="dh-a">
          <button type="button" onClick={() => setOff(off + 1)}>التالي ›</button>
          <button type="button" onClick={() => setOff(off - 1)}>‹ السابق</button>
          <button type="button" onClick={copy}>{msg || 'نسخ'}</button>
          {off !== 0 && (
            <button type="button" onClick={() => setOff(0)}>حديث اليوم</button>
          )}
        </div>
      </article>
      {native ? (
        <div className="dh-r">
          <label>
            <input type="checkbox" checked={on} onChange={(e) => setOnS(e.target.checked)} /> ذكّرني بحديث اليوم كل يوم بإشعار
          </label>
          {on && (
            <label>
              الساعة:{' '}
              <select value={hour} onChange={(e) => setHourS(Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{toAr(h)}:٠٠</option>
                ))}
              </select>
            </label>
          )}
        </div>
      ) : (
        <p className="dh-note">الإشعار اليومي متاح داخل تطبيق الأندرويد.</p>
      )}
      <style>{`
        .dh { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
        .dh-c { padding: 16px; border-radius: 18px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.85); margin-bottom: 12px; }
        .dh-c p { margin: 8px 0 12px; font-family: var(--font-ruqaa), serif; font-size: 20px; line-height: 2.2; text-align: justify; }
        .dh-n { font-size: 12.5px; color: #e8c25a; }
        .dh-a { display: flex; flex-wrap: wrap; gap: 8px; }
        .dh-a button { padding: 7px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: inherit; font-size: 13px; }
        .dh-r { display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.7); font-size: 14px; }
        .dh-r select { padding: 6px 10px; border-radius: 10px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; }
        .dh-note { font-size: 11.5px; text-align: center; color: rgba(255,241,196,.5); margin: 10px 0 0; }
      `}</style>
    </div>
  );
}
