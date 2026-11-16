'use client';

import { setLang, useLang } from '@/components/i18n';

export function LangSwitch() {
  const lang = useLang();
  return (
    <section className="content-card" id="s-lang">
      <h2 className="section-title">اللغة · Language</h2>
      <div style={{ display: 'flex', gap: 10 }}>
        {(['ar', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            className={`haptic-toggle rem-main${lang === l ? ' rem-on' : ''}`}
            style={{ flex: 1 }}
            onClick={() => setLang(l)}
          >
            {l === 'ar' ? 'العربية' : 'English'}
          </button>
        ))}
      </div>
      <style>{`
        html[lang='en'] [data-en]::after {
          content: attr(data-en);
          display: block;
          margin-top: 8px;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          font-weight: 400;
          font-size: 0.82rem;
          line-height: 1.55;
          letter-spacing: 0;
          direction: ltr;
          text-align: left;
          color: rgba(255, 241, 196, 0.85);
        }
        html[lang='en'] .celebration-message { direction: ltr; }
        html[lang='en'] .pq-question,
        html[lang='en'] .pq-option,
        html[lang='en'] .rem-field { text-align: left; }
      `}</style>
    </section>
  );
}
