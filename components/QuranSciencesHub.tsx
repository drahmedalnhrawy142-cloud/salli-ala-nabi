'use client';

import { useEffect, useState } from 'react';
import { loadQuran, type QData } from '@/components/quran/data';
import { QuranSciences } from '@/components/quran/QuranSciences';

/** علوم القرآن داخل تبويب العلوم: يحمّل بيانات المصحف بنفسه. */
export function QuranSciencesHub() {
  const [d, setD] = useState<QData | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    loadQuran().then(setD).catch(() => setErr(true));
  }, []);
  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل البيانات.</p>;
  if (!d) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;
  return <QuranSciences data={d} />;
}
