'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadQuran, loadTafsir, lsGet, lsSet, toAr, type QData } from './data';

/** آية عند كل فتح للتطبيق: تظهر بتشكيلها وعلامات المصحف، ترتيبًا (آية بعد آية) أو عشوائيًا. الإعداد يُحفظ على الجهاز. */
const K_ON = 'aoo_on';
const K_MODE = 'aoo_mode';
const K_IDX = 'aoo_idx';

type Cap = { isNativePlatform?: () => boolean; Plugins?: Record<string, Record<string, (o?: unknown) => Promise<{ on?: boolean; mode?: string; overlay?: boolean }>> | undefined> };
function nativeFp() {
  try {
    const c = (window as unknown as { Capacitor?: Cap }).Capacitor;
    if (!c?.isNativePlatform?.()) return null;
    const f = c.Plugins?.FloatingButton;
    return f && f.unlockAyahSet ? f : null;
  } catch {
    return null;
  }
}

function nextIdx(d: QData, mode: string): number {
  if (mode === 'rand') return Math.floor(Math.random() * d.ayas.length);
  const i = Number(lsGet<number>(K_IDX, 0)) || 0;
  lsSet(K_IDX, (i + 1) % d.ayas.length);
  return i % d.ayas.length;
}

export function AyahCard({ d, i, onClose, onNext }: { d: QData; i: number; onClose: () => void; onNext: () => void }) {
  const a = d.ayas[i];
  const s = d.suras[a[0] - 1];
  const [taf, setTaf] = useState<string | null>(null);
  const [showTaf, setShowTaf] = useState(false);
  useEffect(() => {
    setTaf(null);
  }, [i]);
  useEffect(() => {
    if (!showTaf) return;
    let live = true;
    loadTafsir(a[0])
      .then((t) => live && setTaf(t[a[1] - 1] || 'لا يوجد تفسير لهذه الآية في المصدر.'))
      .catch(() => live && setTaf('تعذّر تحميل التفسير.'));
    return () => {
      live = false;
    };
  }, [showTaf, a]);
  return (
    <div className="ao-back" role="dialog" aria-label="آية">
      <div className="ao">
        <div className="ao-top">
          <b>
            سورة {s.name.replace(/^سورة\s*/, '')} • آية {toAr(a[1])}
          </b>
          <button type="button" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <p className="ao-t">
          {a[4]} <span className="ao-n">﴿{toAr(a[1])}﴾</span>
        </p>
        {showTaf && <div className="ao-taf">{taf ?? 'جارٍ التحميل…'}<small>التفسير الميسّر</small></div>}
        <div className="ao-btns">
          <button type="button" onClick={() => setShowTaf((v) => !v)}>{showTaf ? 'إخفاء التفسير' : 'تفسير'}</button>
          <button type="button" onClick={onNext}>آية أخرى</button>
          <button type="button" className="ao-ok" onClick={onClose}>اللهم بارك</button>
        </div>
      </div>
      <style>{`
        .ao-back { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.82); display: flex; align-items: center; justify-content: center; padding: 14px; }
        .ao { width: min(460px, 100%); max-height: 92vh; overflow: auto; padding: 16px; border-radius: 22px; border: 1px solid rgba(232,194,90,.6); background: linear-gradient(180deg,#14100a,#0b0905); box-shadow: 0 10px 40px rgba(0,0,0,.7); font-family: var(--font-kufi), sans-serif; color: #f7ebc1; }
        .ao-top { display: flex; justify-content: space-between; align-items: center; color: #f1d77a; font-size: 14px; }
        .ao-top button { background: none; border: 0; color: #f1d77a; font-size: 18px; padding: 4px 8px; }
        .ao-t { margin: 14px 0; font-family: var(--f-amiriq), 'Amiri Quran', 'KFGQPC Hafs', serif; font-size: 30px; line-height: 2.3; text-align: center; color: #fff1c4; }
        .ao-n { color: #e8c25a; font-size: 22px; white-space: nowrap; }
        .ao-taf { font-family: var(--f-amiri), 'Amiri', 'Noto Naskh Arabic', serif; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.35); background: rgba(232,194,90,.06); font-size: 14.5px; line-height: 1.9; margin-bottom: 10px; }
        .ao-taf small { font-family: var(--f-amiri), 'Amiri', serif; display: block; margin-top: 4px; font-size: 11px; opacity: .6; }
        .ao-btns { display: flex; gap: 8px; }
        .ao-btns button { flex: 1; padding: 11px 6px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #f7ebc1; font-family: inherit; font-size: 13.5px; }
        .ao-btns .ao-ok { background: rgba(232,194,90,.25); color: #f1d77a; }
      `}</style>
    </div>
  );
}

/** يُركَّب مرة واحدة في التطبيق: يظهر الآية عند الرجوع للتطبيق بعد غلق الشاشة/الخروج منه. */
export function AyahOnOpen() {
  const [d, setD] = useState<QData | null>(null);
  const [i, setI] = useState<number | null>(null);
  const hiddenAt = useRef<number | null>(null);
  const first = useRef(true);

  const trigger = useCallback(() => {
    if (lsGet<boolean>(K_ON, false) !== true) return;
    loadQuran()
      .then((q) => {
        setD(q);
        setI(nextIdx(q, String(lsGet<string>(K_MODE, 'seq'))));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (nativeFp()) return; // في التطبيق: العرض عند فتح القفل يتولاه نظام أندرويد لا الصفحة
    first.current = false;
    const onVis = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current > 2500) {
        hiddenAt.current = null;
        trigger();
      }
    };
    const onNow = () => trigger();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('aoo-preview', onNow);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('aoo-preview', onNow);
    };
  }, [trigger]);

  if (!d || i == null) return null;
  return <AyahCard d={d} i={i} onClose={() => setI(null)} onNext={() => setI(nextIdx(d, String(lsGet<string>(K_MODE, 'seq'))))} />;
}

/** قسم الإعداد داخل القرآن */
export function AyahOnOpenSettings() {
  const [on, setOn] = useState(false);
  const [mode, setMode] = useState('seq');
  const [nat, setNat] = useState(false);
  const [needOverlay, setNeedOverlay] = useState(false);
  useEffect(() => {
    const f = nativeFp();
    if (f) {
      setNat(true);
      f.unlockAyahStatus?.()
        .then((r) => {
          setOn(!!r.on);
          setMode(r.mode || 'seq');
          setNeedOverlay(!r.overlay);
        })
        .catch(() => {});
      return;
    }
    setOn(lsGet<boolean>(K_ON, false) === true);
    setMode(String(lsGet<string>(K_MODE, 'seq')));
  }, []);
  async function apply(nextOn: boolean, nextMode: string) {
    setOn(nextOn);
    setMode(nextMode);
    lsSet(K_ON, nextOn);
    lsSet(K_MODE, nextMode);
    const f = nativeFp();
    if (!f) return;
    try {
      if (nextOn) await f.reminderRequestPermission?.();
      const r = await f.unlockAyahSet?.({ on: nextOn, mode: nextMode });
      if (nextOn && r && !r.overlay) {
        setNeedOverlay(true);
        await f.requestPermission?.();
      } else setNeedOverlay(false);
    } catch {}
  }
  return (
    <div className="aos">
      <p>عند تفعيلها تظهر لك آية من القرآن بتشكيلها وعلاماتها كلما فتحت قفل هاتفك، فتقرأها وتتدبّرها ثم تكمل ما كنت فيه.</p>
      <button type="button" className={on ? 'on' : ''} onClick={() => apply(!on, mode)}>
        {on ? '✓ مفعّلة: آية عند فتح الهاتف' : 'فعّل: آية عند فتح الهاتف'}
      </button>
      <div className="aos-m">
        <button type="button" className={mode === 'seq' ? 'on' : ''} onClick={() => apply(on, 'seq')}>
          ترتيبًا من أول المصحف
        </button>
        <button type="button" className={mode === 'rand' ? 'on' : ''} onClick={() => apply(on, 'rand')}>
          عشوائيًا
        </button>
      </div>
      {!nat && (
        <button type="button" onClick={() => window.dispatchEvent(new Event('aoo-preview'))} style={{ opacity: on ? 1 : 0.5 }} disabled={!on}>
          جرّب الآن
        </button>
      )}
      {nat && on && needOverlay && (
        <p className="aos-n" style={{ color: '#ffd9a0', opacity: 1 }}>
          لازم تسمح لـ «صل على النبي» بالعرض فوق التطبيقات من الإعدادات التي فتحت لك، ثم ارجع وأعد التفعيل.
        </p>
      )}
      <p className="aos-n">
        {nat
          ? 'تعمل بخدمة صغيرة في الخلفية مع إشعار دائم خفيف (يمكنك إيقافها من هنا أو من الإشعار). لم تُجرَّب بعد على جميع الأجهزة، وبعض الهواتف تمنع الخدمات الخلفية فاسمح للتطبيق بالعمل في الخلفية.'
          : 'في المتصفح تظهر الآية عند الرجوع للصفحة بعد غلق الشاشة.'}
      </p>
      <style>{`
        .aos { display: flex; flex-direction: column; gap: 10px; font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
        .aos p { margin: 0; font-size: 14px; line-height: 1.9; }
        .aos .aos-n { font-size: 12px; opacity: .6; }
        .aos button { padding: 12px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #fff1c4; font-family: inherit; font-size: 14px; }
        .aos button.on { background: rgba(232,194,90,.2); border-color: #e8c25a; }
        .aos-m { display: flex; gap: 8px; }
        .aos-m button { flex: 1; font-size: 13px; }
      `}</style>
    </div>
  );
}
