'use client';

import { memo as __memo } from 'react';
import { useEffect, useState } from 'react';

type Fp = { volumeSet?: (o: { on: boolean }) => Promise<unknown>; volumeStatus?: () => Promise<{ on?: boolean }> };
function fp(): Fp | null {
  const c = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, Fp> } }).Capacitor;
  if (!c?.isNativePlatform?.()) return null;
  const p = c.Plugins?.FloatingButton;
  return p && p.volumeSet ? p : null;
}

function VolumeKeys() {
  const [ok, setOk] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const p = fp();
    if (!p) return;
    setOk(true);
    p.volumeStatus?.().then((r) => setOn(!!r.on)).catch(() => {});
  }, []);
  if (!ok) return null;
  return (
    <section className="content-card" id="s-volume">
      <h2 className="section-title">العدّ بأزرار الصوت</h2>
      <p className="float-note">
        والتطبيق مفتوح، زر رفع أو خفض الصوت بيعدّ صلاة (أو تسبيحة في السبحة) بدل ما يغيّر الصوت. بيشتغل والتطبيق قدّامك بس.
      </p>
      <button
        type="button"
        className={`haptic-toggle rem-main${on ? ' rem-on' : ''}`}
        onClick={() => {
          const v = !on;
          setOn(v);
          fp()?.volumeSet?.({ on: v });
        }}
      >
        {on ? 'مفعّل ✓' : 'غير مفعّل'}
      </button>
    </section>
  );
}

const VolumeKeysMemo = __memo(VolumeKeys);
export { VolumeKeysMemo as VolumeKeys };
