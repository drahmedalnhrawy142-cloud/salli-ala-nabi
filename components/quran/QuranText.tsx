'use client';

import { Fragment } from 'react';

/** نص قرآني بخط المصحف؛ علامة نهاية الآية (U+06DD + رقم) تُرسم دائرة منسّقة. */
export function QuranText({ text }: { text: string }) {
  const parts = text.split(/۝([٠-٩]+)/);
  return (
    <span className="ad-quran">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="qt-n">
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
      <style>{`
        .ad-quran { font-family: 'KFGQPC Hafs', 'Aref Ruqaa', serif; font-size: 1.12em; line-height: 2.2; }
        .qt-n {
          display: inline-grid; place-items: center; width: 1.45em; height: 1.45em; margin: 0 .2em;
          border: 1.5px solid #c9a24a; border-radius: 50%; font-family: var(--font-kufi), sans-serif;
          font-size: .5em; line-height: 1; vertical-align: .3em;
        }
      `}</style>
    </span>
  );
}
