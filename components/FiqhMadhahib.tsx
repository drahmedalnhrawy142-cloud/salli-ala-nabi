'use client';

import { useState } from 'react';
import { BookReader } from '@/components/BookReader';
import { FIQH_BOOKS } from '@/components/ilm/books';

/**
 * الفقه المقارن بين المذاهب الأربعة: «اختلاف الأئمة العلماء» لابن هبيرة الوزير (ت ٥٦٠هـ).
 * النص من المكتبة الشاملة (تحقيق السيد يوسف أحمد، دار الكتب العلمية) عبر مشروع OpenITI (CC BY-NC-SA 4.0)،
 * مقسّم بـ tools/build_fiqh.py إلى كتب وأبواب وفقرات دون تعديل ألفاظ المؤلف. يعمل بلا نت داخل التطبيق.
 */
export function FiqhBook({ dir, title, onBack, fiqh = true, backLabel = '← الكتب الفقهية', start }: { dir: string; title: string; credit?: string; onBack: () => void; fiqh?: boolean; backLabel?: string; start?: { ki: number; bi: number | null } }) {
  return <BookReader dir={dir} title={title} fiqh={fiqh} backLabel={backLabel} onBack={onBack} start={start} />;
}

export function FiqhMadhahib() {
  const [bk, setBk] = useState<(typeof FIQH_BOOKS)[number] | null>(null);
  if (bk) return <FiqhBook key={bk.id} dir={bk.dir} title={bk.title} credit={bk.credit} onBack={() => setBk(null)} />;
  return (
    <div style={{ fontFamily: 'var(--font-kufi), sans-serif', color: '#fff1c4' }}>
      {FIQH_BOOKS.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => setBk(b)}
          style={{ width: '100%', display: 'block', textAlign: 'right', padding: 14, marginBottom: 10, borderRadius: 16, border: '1px solid rgba(232,194,90,.35)', background: 'rgba(18,15,8,.82)', color: '#fff1c4', fontFamily: 'inherit', fontSize: 15 }}
        >
          {b.title}
          <small style={{ display: 'block', color: '#7fe0c0', fontSize: 12, marginTop: 2 }}>{b.sub}</small>
        </button>
      ))}
    </div>
  );
}
