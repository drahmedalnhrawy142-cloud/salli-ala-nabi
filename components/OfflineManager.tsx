'use client';

import { useEffect, useState } from 'react';
import { toAr } from '@/components/quran/data';

/** تحميل حزم المحتوى للاستخدام بدون إنترنت: تُحفظ في نفس مخزن الـ service worker (sn-v1)، وتتحدّث تلقائيًّا عند الاتصال. */
type Pack = { id: string; t: string; files: string[]; kb: number };
const CACHE = 'sn-v1';
const KEY = 'off.v1';

export function OfflineManager() {
  const [packs, setPacks] = useState<Pack[] | null>(null);
  const [done, setDone] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [prog, setProg] = useState(0);
  const [msg, setMsg] = useState('');
  const [quota, setQuota] = useState('');

  useEffect(() => {
    fetch('/offline-manifest.json').then((r) => r.json()).then(setPacks).catch(() => setMsg('تعذّر تحميل قائمة الحزم.'));
    try {
      setDone(JSON.parse(localStorage.getItem(KEY) || '{}') || {});
    } catch {}
    navigator.storage?.estimate?.().then((e) => {
      if (e.usage != null && e.quota != null) setQuota(`المستخدم الآن ${toAr(Math.round(e.usage / 1048576))} م.ب من ${toAr(Math.round(e.quota / 1048576))} م.ب المتاحة`);
    }).catch(() => {});
  }, []);

  async function get(p: Pack) {
    if (busy || !('caches' in window)) {
      if (!('caches' in window)) setMsg('المتصفح لا يدعم التخزين للاستخدام بدون نت.');
      return;
    }
    setBusy(p.id);
    setProg(0);
    setMsg('');
    try {
      const c = await caches.open(CACHE);
      let n = 0;
      let fail = 0;
      const q = [...p.files];
      async function worker() {
        while (q.length) {
          const f = q.shift()!;
          try {
            const r = await fetch(f, { cache: 'reload' });
            if (r.ok) await c.put(f, r);
            else fail++;
          } catch {
            fail++;
          }
          n++;
          setProg(Math.round((n / p.files.length) * 100));
        }
      }
      await Promise.all([worker(), worker(), worker(), worker()]);
      if (fail === 0) {
        const nd = { ...done, [p.id]: Date.now() };
        setDone(nd);
        try {
          localStorage.setItem(KEY, JSON.stringify(nd));
        } catch {}
        setMsg(`تم تحميل «${p.t}»`);
      } else setMsg(`تعذّر تحميل ${toAr(fail)} ملفًّا، تأكد من الاتصال وأعد المحاولة.`);
    } catch {
      setMsg('تعذّر التحميل (ربما المساحة ممتلئة).');
    }
    setBusy(null);
  }

  if (!packs) return <p style={{ textAlign: 'center', opacity: 0.7 }}>{msg || 'جارٍ التحميل…'}</p>;
  return (
    <div className="om">
      <p className="om-n">حمّل ما تحتاجه مرة واحدة على شبكة الواي فاي، ثم اقرأ بلا إنترنت. ما قرأته من قبل محفوظ تلقائيًّا.</p>
      {packs.map((p) => (
        <div key={p.id} className={`om-p${done[p.id] ? ' ok' : ''}`}>
          <div>
            <b>{p.t}</b>
            <small>{toAr(Math.round(p.kb / 1024))} م.ب تقريبًا • {toAr(p.files.length)} ملفًّا</small>
            {busy === p.id && <span className="om-b"><i style={{ width: `${prog}%` }} /></span>}
          </div>
          <button type="button" disabled={!!busy} onClick={() => get(p)}>
            {busy === p.id ? `${toAr(prog)}٪` : done[p.id] ? '✓ حدّث' : '⬇ تحميل'}
          </button>
        </div>
      ))}
      {msg && <p className="om-n">{msg}</p>}
      {quota && <p className="om-n">{quota}</p>}
      <style>{`
        .om { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 10px; }
        .om-n { margin: 0; font-size: 12.5px; line-height: 2; text-align: center; color: rgba(255,241,196,.65); }
        .om-p { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); }
        .om-p.ok { border-color: rgba(127,224,192,.55); }
        .om-p > div { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .om-p b { font-size: 14.5px; color: #f1d77a; }
        .om-p small { font-size: 11.5px; color: rgba(255,241,196,.55); }
        .om-b { height: 6px; border-radius: 6px; background: rgba(232,194,90,.15); overflow: hidden; display: block; }
        .om-b i { display: block; height: 100%; background: linear-gradient(90deg, #e8c25a, #7fe0c0); }
        .om-p button { padding: 9px 14px; border-radius: 14px; border: 1px solid rgba(232,194,90,.5); background: rgba(232,194,90,.18); color: #f1d77a; font-family: inherit; font-size: 13px; white-space: nowrap; }
        .om-p button:disabled { opacity: .5; }
      `}</style>
    </div>
  );
}
