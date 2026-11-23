'use client';

import { useEffect, useState } from 'react';
import { toAr, useQuran } from '@/components/quran/data';
import { SURAH_META } from '@/components/quran/surahMeta';
import { addStars, bump } from './store';

/** أسئلة للصغار عن المصحف (ترتيب السور وعدد آياتها ومكيّها ومدنيّها) من بيانات المصحف نفسها، وأسئلة أساسية ثابتة. */
type Q = { q: string; opts: string[]; ans: string };
const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const CHEER = ['أحسنت! 🌟', 'ما شاء الله! ⭐', 'بارك الله فيك! ✨', 'رائع! 🌸'];
const TRY = ['حاول مرة أخرى 💛', 'قريب! جرّب ثانية 🌱'];
const FIXED: Q[] = [
  { q: 'كم عدد أركان الإسلام؟', opts: ['٣', '٥', '٧'], ans: '٥' },
  { q: 'كم عدد الصلوات المفروضة في اليوم والليلة؟', opts: ['٣', '٤', '٥'], ans: '٥' },
  { q: 'كم عدد أجزاء القرآن الكريم؟', opts: ['٢٠', '٣٠', '٤٠'], ans: '٣٠' },
  { q: 'كم عدد سور القرآن الكريم؟', opts: ['١١٤', '١٠٠', '١٢٠'], ans: '١١٤' },
  { q: 'ما أول سورة في المصحف؟', opts: ['البقرة', 'الفاتحة', 'الناس'], ans: 'الفاتحة' },
  { q: 'ما آخر سورة في المصحف؟', opts: ['الناس', 'الإخلاص', 'الفلق'], ans: 'الناس' },
  { q: 'ما أطول سورة في القرآن؟', opts: ['آل عمران', 'البقرة', 'النساء'], ans: 'البقرة' },
];

export function KidsQuiz() {
  const { data } = useQuran();
  const [q, setQ] = useState<Q | null>(null);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  function next() {
    if (!data) return;
    const names = data.suras.map((s) => s.name.replace(/^سورة\s*/, ''));
    const r = Math.random();
    let nq: Q;
    if (r < 0.15) nq = pick(FIXED);
    else if (r < 0.4) {
      const i = Math.floor(Math.random() * 113);
      nq = { q: `ما السورة التي تأتي بعد سورة ${names[i]}؟`, ans: names[i + 1], opts: [] };
      nq.opts = shuffle([names[i + 1], ...shuffle(names.filter((n) => n !== names[i + 1] && n !== names[i])).slice(0, 2)]);
    } else if (r < 0.65) {
      const i = Math.floor(Math.random() * 114);
      const c = data.suras[i].ayas;
      const o = new Set<number>([c]);
      while (o.size < 3) o.add(Math.max(3, c + Math.floor(Math.random() * 13) - 6));
      nq = { q: `كم عدد آيات سورة ${names[i]}؟`, ans: toAr(c), opts: shuffle([...o].map(toAr)) };
    } else if (r < 0.85) {
      const i = Math.floor(Math.random() * 114);
      nq = { q: `سورة ${names[i]}: مكية أم مدنية؟`, ans: SURAH_META[i][0] ? 'مدنية' : 'مكية', opts: ['مكية', 'مدنية'] };
    } else {
      const i = Math.floor(Math.random() * 114);
      const o = new Set<number>([i + 1]);
      while (o.size < 3) o.add(1 + Math.floor(Math.random() * 114));
      nq = { q: `ما ترتيب سورة ${names[i]} في المصحف؟`, ans: toAr(i + 1), opts: shuffle([...o].map(toAr)) };
    }
    setQ(nq);
    setMsg('');
    setOk(false);
  }
  useEffect(next, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;
  return (
    <div className="kq">
      <p className="kq-q">{q.q}</p>
      <div className="kq-o">
        {q.opts.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => {
              if (ok) return;
              if (o === q.ans) {
                setOk(true);
                setMsg(pick(CHEER));
                addStars(1);
                bump('plays');
              } else setMsg(pick(TRY));
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {msg && <div className="kq-m">{msg}</div>}
      <button type="button" className="kq-n" onClick={next}>{ok ? 'السؤال التالي ›' : 'تخطّي'}</button>
      <style>{`
        .kq { font-family: var(--font-kufi), sans-serif; color: #fff1c4; padding: 16px; border-radius: 22px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.85); display: flex; flex-direction: column; gap: 14px; }
        .kq-q { margin: 0; font-size: 20px; line-height: 2; text-align: center; color: #f1d77a; }
        .kq-o { display: flex; flex-direction: column; gap: 10px; }
        .kq-o button { padding: 14px; border-radius: 16px; border: 2px solid rgba(232,194,90,.5); background: rgba(232,194,90,.12); color: #fff1c4; font-family: inherit; font-size: 19px; }
        .kq-o button:active { transform: scale(.97); }
        .kq-m { text-align: center; font-size: 20px; color: #7fe0c0; }
        .kq-n { align-self: center; padding: 9px 20px; border-radius: 999px; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.12); color: #f1d77a; font-family: inherit; font-size: 15px; }
      `}</style>
    </div>
  );
}
