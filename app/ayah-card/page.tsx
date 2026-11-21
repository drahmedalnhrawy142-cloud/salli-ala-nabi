'use client';

import { useEffect, useState } from 'react';
import { AyahCard } from '@/components/quran/AyahOnOpen';
import { loadQuran, type QData } from '@/components/quran/data';

/** صفحة تُحمَّل داخل شاشة «آية عند فتح الهاتف» (UnlockAyahActivity): ?i=رقم الآية في المصحف &m=r للعشوائي */
export default function AyahCardPage() {
  const [d, setD] = useState<QData | null>(null);
  const [i, setI] = useState(0);
  const [rnd, setRnd] = useState(false);
  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    const q = new URLSearchParams(window.location.search);
    setI(parseInt(q.get('i') || '0', 10) || 0);
    setRnd(q.get('m') === 'r');
    loadQuran().then(setD).catch(() => {});
  }, []);
  if (!d) return null;
  const close = () => {
    try {
      (window as unknown as { Android?: { close(): void } }).Android?.close();
    } catch {}
  };
  return (
    <AyahCard
      d={d}
      i={i % d.ayas.length}
      onClose={close}
      onNext={() => setI((x) => (rnd ? Math.floor(Math.random() * d.ayas.length) : (x + 1) % d.ayas.length))}
    />
  );
}
