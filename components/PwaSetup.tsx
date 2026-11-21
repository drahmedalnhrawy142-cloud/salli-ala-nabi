'use client';

import { useEffect, useState } from 'react';

/**
 * تجهيز النسخة الويب للتثبيت على الشاشة الرئيسية (خصوصًا الآيفون):
 * - تسجيل خدمة العمل (خارج تطبيق الأندرويد الأصلي).
 * - على iOS: مراعاة منطقة الأمان العلوية عند التثبيت، وإظهار تلميح لمرة واحدة يشرح خطوات الإضافة.
 */
const HINT = 'pwa_hint_v1';

export function PwaSetup() {
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const native = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
    if (native) return;
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
    const standalone = (navigator as unknown as { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;

    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    if (ios) {
      const vp = document.querySelector('meta[name="viewport"]');
      if (vp && !vp.getAttribute('content')?.includes('viewport-fit')) vp.setAttribute('content', `${vp.getAttribute('content')},viewport-fit=cover`);
      if (standalone) document.documentElement.classList.add('ios-pwa');
      let seen = false;
      try {
        seen = localStorage.getItem(HINT) === '1';
      } catch {}
      if (!standalone && !seen) setHint(true);
    }
  }, []);

  if (!hint) return null;
  return (
    <div className="pwa-hint" role="dialog" aria-label="تثبيت التطبيق">
      <p>
        ثبّت التطبيق على آيفونك: اضغط زر المشاركة <b aria-hidden="true">⎙</b> في أسفل الشاشة، ثم اختر <b>«إضافة إلى الشاشة الرئيسية»</b>.
      </p>
      <button
        type="button"
        onClick={() => {
          setHint(false);
          try {
            localStorage.setItem(HINT, '1');
          } catch {}
        }}
      >
        تمام
      </button>
      <style>{`
        .pwa-hint { position: fixed; z-index: 60; left: 12px; right: 12px; bottom: calc(92px + env(safe-area-inset-bottom, 0px)); padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.5); background: rgba(14,11,5,.96); color: #fff1c4; font-family: var(--font-ruqaa), serif; font-size: 15px; line-height: 1.9; display: flex; gap: 12px; align-items: center; box-shadow: 0 8px 30px rgba(0,0,0,.6); }
        .pwa-hint p { margin: 0; flex: 1; }
        .pwa-hint button { padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(232,194,90,.5); background: rgba(232,194,90,.18); color: #f1d77a; font-family: inherit; }
      `}</style>
    </div>
  );
}
