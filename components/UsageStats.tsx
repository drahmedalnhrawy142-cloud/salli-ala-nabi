'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toAr } from '@/components/quran/data';

/**
 * إحصائية استخدام مجهولة: معرّف عشوائي للجهاز + المنصة مرة في اليوم، بلا أي بيانات شخصية (supabase/usage_stats.sql).
 * يقدر المستخدم إيقافها من الإعدادات. الفشل صامت ولا يؤثر على التطبيق.
 */
const ID = 'usage.id';
const OFF = 'usage.off';
const LAST = 'usage.last';

function platform(): 'android' | 'pwa' | 'web' {
  try {
    const c = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (c?.isNativePlatform?.()) return 'android';
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone) return 'pwa';
  } catch {}
  return 'web';
}

export async function pingUsage() {
  try {
    if (localStorage.getItem(OFF) === '1') return;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(LAST) === today) return;
    let id = localStorage.getItem(ID);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID, id);
    }
    const { error } = await supabase.rpc('app_ping', { p_id: id, p_platform: platform() });
    if (!error) localStorage.setItem(LAST, today);
  } catch {}
}

type S = { total: number; today: number; d7: number; d30: number; android: number; pwa: number; web: number };

export function UsageStats() {
  const [s, setS] = useState<S | null>(null);
  const [err, setErr] = useState(false);
  const [on, setOn] = useState(true);

  useEffect(() => {
    try {
      setOn(localStorage.getItem(OFF) !== '1');
    } catch {}
    Promise.resolve(supabase.rpc('app_stats'))
      .then(({ data, error }) => (error || !data ? setErr(true) : setS(data as S)))
      .catch(() => setErr(true));
  }, []);

  function set(v: boolean) {
    setOn(v);
    try {
      localStorage.setItem(OFF, v ? '0' : '1');
    } catch {}
  }

  const cell = (n: number | undefined, l: string) => (
    <div><b>{n == null ? '—' : toAr(n)}</b><span>{l}</span></div>
  );
  return (
    <div className="us">
      {err && <p className="us-n">تعذّر تحميل الأرقام (لا اتصال، أو لم تُفعَّل الإحصائية على الخادم بعد).</p>}
      <div className="us-g">
        {cell(s?.total, 'جهاز إجمالًا')}
        {cell(s?.d30, 'نشط آخر ٣٠ يومًا')}
        {cell(s?.d7, 'نشط آخر ٧ أيام')}
        {cell(s?.today, 'نشط اليوم')}
        {cell(s?.android, 'تطبيق أندرويد')}
        {cell(s?.pwa, 'مثبّت على الشاشة')}
        {cell(s?.web, 'متصفح')}
      </div>
      <label className="us-l">
        <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} /> شارك إحصائية استخدام مجهولة من جهازي
      </label>
      <p className="us-n">
        تُرسَل مرة في اليوم: رقم عشوائي للجهاز ونوع المنصة فقط، بلا اسم ولا موقع ولا أي بيانات شخصية، لنعرف تقريبًا كم جهازًا يستعمل التطبيق. العدد بالأجهزة لا بالأشخاص.
      </p>
      <style>{`
        .us { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 10px; }
        .us-g { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .us-g div { padding: 12px 6px; border-radius: 14px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.8); text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .us-g b { font-size: 24px; color: #f1d77a; }
        .us-g span { font-size: 12px; color: rgba(255,241,196,.65); }
        .us-l { font-size: 14px; }
        .us-n { font-size: 11.5px; line-height: 1.9; text-align: center; color: rgba(255,241,196,.55); margin: 0; }
      `}</style>
    </div>
  );
}
