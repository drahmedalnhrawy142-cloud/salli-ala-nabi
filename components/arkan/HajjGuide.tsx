'use client';

import { useEffect, useState } from 'react';
import { FiqhBook } from '@/components/FiqhMadhahib';
import { allBooks, type BookMeta } from '@/components/ilm/books';
import { toAr } from '@/components/quran/data';

/**
 * دليل الحاج والمعتمر: يرتّب أبواب «الإيضاح في مناسك الحج والعمرة» للنووي على مراحل الرحلة، مع علامة «أتممتُ قراءته».
 * عناوين الأبواب من الكتاب نفسه؛ لا نضيف حكمًا ولا صفة نسك من عندنا، والتفصيل في نصّ الإمام النووي.
 */
const STEPS: { ki: number; t: string; d: string; who: 'both' | 'hajj' | 'other' }[] = [
  { ki: 0, t: 'مقدمة الكتاب وأسرار الحج ومنافعه', d: 'قبل البدء: أسرار الحج ومنافعه الدينية والدنيوية', who: 'both' },
  { ki: 1, t: 'الباب الأول: آداب السفر', d: 'في آداب سفره وفيه مسائل', who: 'both' },
  { ki: 2, t: 'الباب الثاني: الإحرام', d: 'في الإحرام', who: 'both' },
  { ki: 3, t: 'الباب الثالث: دخول مكة', d: 'دخول مكة وما يتعلق به', who: 'both' },
  { ki: 4, t: 'الباب الرابع: العمرة', d: 'في العمرة وفيه مسائل', who: 'both' },
  { ki: 5, t: 'الباب الخامس: المقام بمكة وطواف الوداع', d: 'في المقام بمكة وطواف الوداع وفيه مسائل', who: 'both' },
  { ki: 6, t: 'الباب السادس: زيارة قبر النبي ﷺ', d: 'في زيارة قبر رسول الله ﷺ وما يتعلق بذلك', who: 'other' },
  { ki: 7, t: 'الباب السابع: ما يجب على من ترك نسكًا أو ارتكب محرَّمًا', d: 'فيما يجب على من ترك من نسكه مأمورًا أو ارتكب محرمًا', who: 'other' },
  { ki: 8, t: 'الباب الثامن: حج الصبي والعبد والمرأة', d: 'في حج الصبي والعبد والمرأة ومن في معناهم', who: 'other' },
];
const KEY = 'hj.v1';
const GROUPS = [
  { t: 'مراحل الرحلة', f: (s: (typeof STEPS)[number]) => s.who === 'both' },
  { t: 'أبواب تكميلية', f: (s: (typeof STEPS)[number]) => s.who === 'other' },
];

export function HajjGuide() {
  const [meta, setMeta] = useState<BookMeta | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [read, setRead] = useState<number | null>(null);

  useEffect(() => {
    allBooks().then((b) => setMeta(b.find((x) => x.id === 'manasik') || null)).catch(() => {});
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(v)) setDone(v);
    } catch {}
  }, []);

  function toggle(k: number) {
    const nx = done.includes(k) ? done.filter((x) => x !== k) : [...done, k];
    setDone(nx);
    try {
      localStorage.setItem(KEY, JSON.stringify(nx));
    } catch {}
  }

  if (read !== null && meta)
    return (
      <FiqhBook
        key={read}
        dir={meta.dir}
        title={meta.title}
        credit={meta.credit}
        fiqh={meta.fiqh}
        start={{ ki: read, bi: null }}
        backLabel="← رجوع للدليل"
        onBack={() => setRead(null)}
      />
    );

  const pct = Math.round((done.length / STEPS.length) * 100);
  return (
    <div className="hj">
      <div className="hj-sum">
        <b>{toAr(done.length)} من {toAr(STEPS.length)} أبواب قرأتَها</b>
        <div className="hj-bar"><i style={{ width: `${pct}%` }} /></div>
      </div>
      {GROUPS.map((g) => (
        <section key={g.t}>
          <h3>{g.t}</h3>
          {STEPS.filter(g.f).map((s) => (
            <div key={s.ki} className={`hj-s${done.includes(s.ki) ? ' ok' : ''}`}>
              <button type="button" className="hj-c" aria-label="أتممت قراءته" onClick={() => toggle(s.ki)}>
                {done.includes(s.ki) ? '✓' : ''}
              </button>
              <button type="button" className="hj-o" disabled={!meta} onClick={() => setRead(s.ki)}>
                <b>{s.t}</b>
                <span>{s.d}</span>
              </button>
            </div>
          ))}
        </section>
      ))}
      <p className="hj-n">الإيضاح في مناسك الحج والعمرة — الإمام النووي (ت ٦٧٦هـ). النص من المكتبة الشاملة (OpenITI). للفتوى في حالتك الخاصة راجع أهل العلم.</p>
      <style>{`
        .hj { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 10px; }
        .hj-sum { padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.85); display: flex; flex-direction: column; gap: 8px; }
        .hj-bar { height: 8px; border-radius: 8px; background: rgba(232,194,90,.15); overflow: hidden; }
        .hj-bar i { display: block; height: 100%; background: linear-gradient(90deg, #e8c25a, #f1d77a); }
        .hj h3 { margin: 6px 2px; font-size: 15px; color: #e8c25a; }
        .hj-s { display: flex; gap: 10px; align-items: stretch; margin-bottom: 8px; }
        .hj-c { flex: none; width: 44px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.08); color: #1a1409; font-size: 20px; font-weight: 700; }
        .hj-s.ok .hj-c { background: #e8c25a; }
        .hj-o { flex: 1; text-align: start; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.8); color: #fff1c4; font-family: inherit; display: flex; flex-direction: column; gap: 3px; }
        .hj-o b { color: #f1d77a; font-size: 14.5px; }
        .hj-o span { font-size: 12.5px; color: rgba(255,241,196,.62); line-height: 1.7; }
        .hj-n { font-size: 11.5px; text-align: center; color: rgba(255,241,196,.5); margin: 4px 0 0; }
      `}</style>
    </div>
  );
}
