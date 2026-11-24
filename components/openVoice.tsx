'use client';

import { useEffect, useState } from 'react';

/** صوت «صلِّ على النبي ﷺ» عند فتح التطبيق: يعمل افتراضيًا، ويمكن إيقافه من المزيد ← التنبيهات والتحكم. */
const KEY = 'open_voice';
const SES = 'open_voice_played';
const SRC = '/audio/salli_short.mp3';

export const openVoiceOn = () => {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
};

export function playOpenVoice() {
  try {
    if (!openVoiceOn() || sessionStorage.getItem(SES)) return;
    const a = new Audio(SRC);
    a.volume = 1;
    const mark = () => {
      try { sessionStorage.setItem(SES, '1'); } catch {}
    };
    a.play().then(mark).catch(() => {
      // المتصفح منع التشغيل التلقائي: نشغّله عند أول لمسة
      const go = () => {
        ['pointerdown', 'touchstart', 'keydown'].forEach((e) => window.removeEventListener(e, go));
        if (openVoiceOn() && !sessionStorage.getItem(SES)) {
          mark();
          new Audio(SRC).play().catch(() => {});
        }
      };
      ['pointerdown', 'touchstart', 'keydown'].forEach((e) => window.addEventListener(e, go, { once: true }));
    });
  } catch {}
}

export function OpenVoiceSetting() {
  const [on, setOn] = useState(true);
  useEffect(() => setOn(openVoiceOn()), []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-kufi), sans-serif', color: '#fff1c4' }}>
      <p style={{ margin: 0, lineHeight: 1.9 }}>عند فتح التطبيق يُسمَعُ تنبيه صوتي قصير: «صلِّ على النبي ﷺ».</p>
      <button
        type="button"
        onClick={() => {
          const v = !on;
          setOn(v);
          try { localStorage.setItem(KEY, v ? '1' : '0'); } catch {}
        }}
        style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(232,194,90,.4)', background: on ? '#e8c25a' : 'transparent', color: on ? '#1a1409' : '#fff1c4', fontFamily: 'inherit', fontSize: 15 }}
      >
        {on ? '🔊 مفعّل' : '🔇 متوقف'}
      </button>
      <button
        type="button"
        onClick={() => new Audio(SRC).play().catch(() => {})}
        style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(232,194,90,.3)', background: 'transparent', color: '#fff1c4', fontFamily: 'inherit' }}
      >
        ▶ جرّب الصوت
      </button>
    </div>
  );
}
