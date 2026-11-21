'use client';

import { useEffect, useState } from 'react';

/** بانر يظهر يوم الجمعة (وبعد مغرب الخميس) يذكّر بالإكثار من الصلاة على النبي ﷺ. */
export function FridayBanner({ onGo }: { onGo: () => void }) {
  const [mode, setMode] = useState<'' | 'eve' | 'day'>('');

  useEffect(() => {
    const d = new Date();
    if (d.getDay() === 5) setMode('day');
    else if (d.getDay() === 4 && d.getHours() >= 18) setMode('eve');
  }, []);

  if (!mode) return null;

  return (
    <section className="content-card friday">
      <h2 className="section-title">
        {mode === 'day' ? 'يوم الجمعة' : 'ليلة الجمعة'}
      </h2>
      {mode === 'day' ? (
        <p className="fr-text">
          «أكثِروا الصلاةَ عليَّ يوم الجمعة، فإنّ صلاتكم معروضةٌ عليَّ»
        </p>
      ) : (
        <p className="fr-text">
          غدًا الجمعة، ومن السنة الإكثار من الصلاة على النبي ﷺ يوم الجمعة.
        </p>
      )}
      <p className="fr-src">
        {mode === 'day' ? 'رواه أبو داود وصححه الألباني' : 'جعلنا الله ممن يكثرون من الصلاة عليه ﷺ'}
      </p>
      <button type="button" className="fr-btn" onClick={onGo}>
        اذهب إلى وردك
      </button>
      <style>{`
        .friday { border-color: rgba(232, 194, 90, 0.7); background: linear-gradient(160deg, rgba(232,194,90,.12), rgba(232,194,90,.03)); }
        .fr-text { font-family: var(--font-ruqaa), serif; font-size: 1.3rem; line-height: 2.1; text-align: center; color: #fff1c4; margin: 4px 0; }
        .fr-src { font-family: var(--font-ruqaa), serif; text-align: center; color: #c9a24a; margin: 4px 0 12px; }
        .fr-btn { display: block; margin: 0 auto; padding: 10px 28px; border-radius: 999px; cursor: pointer; border: 1px solid rgba(232,194,90,.6); background: rgba(232,194,90,.14); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-weight: 700; }
      `}</style>
    </section>
  );
}
