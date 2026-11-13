
'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Celebration = {
  id: number;
  left: number;
};

const poems = [
  [
    'أَغَرُّ عَلَيْهِ لِلنُّبُوَّةِ خَاتَمٌ',
    'مِنَ اللَّهِ مَشْهُودٌ يَلُوحُ وَيُشْهَدُ',
  ],
  [
    'وَضَمَّ الْإِلَهُ اسْمَ النَّبِيِّ إِلَى اسْمِهِ',
    'إِذَا قَالَ فِي الْخَمْسِ الْمُؤَذِّنُ أَشْهَدُ',
  ],
  [
    'نَبِيٌّ أَتَانَا بَعْدَ يَأْسٍ وَفَتْرَةٍ',
    'مِنَ الرُّسُلِ وَالْأَوْثَانُ فِي الْأَرْضِ تُعْبَدُ',
  ],
  [
    'مُحَمَّدٌ سَيِّدُ الْكَوْنَيْنِ وَالثَّقَلَيْنِ',
    'وَالْفَرِيقَيْنِ مِنْ عُرْبٍ وَمِنْ عَجَمِ',
  ],
  [
    'نَبِيُّنَا الْآمِرُ النَّاهِي فَلَا أَحَدٌ',
    'أَبَرُّ فِي قَوْلِ لَا مِنْهُ وَلَا نَعَمِ',
  ],
  [
    'هُوَ الْحَبِيبُ الَّذِي تُرْجَى شَفَاعَتُهُ',
    'لِكُلِّ هَوْلٍ مِنَ الْأَهْوَالِ مُقْتَحَمِ',
  ],
  [
    'فَاقَ النَّبِيِّينَ فِي خَلْقٍ وَفِي خُلُقٍ',
    'وَلَمْ يُدَانُوهُ فِي عِلْمٍ وَلَا كَرَمٍ',
  ],
  [
    'وُلِدَ الْهُدَى فَالْكَائِنَاتُ ضِيَاءُ',
    'وَفَمُ الزَّمَانِ تَبَسُّمٌ وَثَنَاءُ',
  ],
  [
    'يَا خَيْرَ مَنْ جَاءَ الْوُجُودَ تَحِيَّةً',
    'مِنْ مُرْسَلِينَ إِلَى الْهُدَى بِكَ جَاءُوا',
  ],
  [
    'وَأَبْيَضَ يُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ',
    'ثِمَالُ الْيَتَامَى عِصْمَةٌ لِلْأَرَامِلِ',
  ],
  [
    'وَشَقَّ لَهُ مِنِ اسْمِهِ لِيُجِلَّهُ',
    'فَذُو الْعَرْشِ مَحْمُودٌ وَهَذَا مُحَمَّدُ',
  ],
  [
    'فَأَمْسَى سِرَاجًا مُسْتَنِيرًا وَهَادِيًا',
    'يَلُوحُ كَمَا لَاحَ الصَّقِيلُ الْمُهَنَّدُ',
  ],
  [
    'مُحَمَّدٌ صَفْوَةُ الْبَارِي وَرَحْمَتُهُ',
    'وَبُغْيَةُ اللَّهِ مِنْ خَلْقٍ وَمِنْ نَسَمِ',
  ],
  [
    'وَأَنْذَرَنَا نَارًا وَبَشَّرَ جَنَّةً',
    'وَعَلَّمَنَا الْإِسْلَامَ فَاللَّهَ نَحْمَدُ',
  ],
  [
    'وَمَا حَمَلَتْ مِنْ نَاقَةٍ فَوْقَ رَحْلِهَا',
    'أَعَفَّ وَأَوْفَى ذِمَّةً مِنْ مُحَمَّدِ',
  ],
  [
    'دَعَا إِلَى اللَّهِ فَالْمُسْتَمْسِكُونَ بِهِ',
    'مُسْتَمْسِكُونَ بِحَبْلٍ غَيْرِ مُنْفَصِمِ',
  ],
  [
    'أَلَا إِنَّ خَيْرَ النَّاسِ نَفْسًا وَوَالِدًا',
    'إِذَا عُدَّ سَادَاتُ الْبَرِيَّةِ أَحْمَدُ',
  ],
];

const salawat =
  'عَدَدَ مَا صَلَّى عَلَيْكَ اللهُ جَلَّ جَلَالُهُ، وَمَلَائِكَتُهُ، وَجَمِيعُ خَلْقِهِ، وَكَمَا يَلِيقُ بِصَلَاتِهِ، سَلَّمَ وَصَلَّى عَلَيْكَ اللهُ يَا خَيْرَ الوَرَى إِلَى يَوْمِ الدِّينِ، عَنِّي وَعَنْ وَالِدَيَّ وَالمُسْلِمِينَ';

export function PrayerExperience() {
  const [count, setCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [globalCount, setGlobalCount] = useState(0);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [poemIndex, setPoemIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const savedCount = Number(
      localStorage.getItem('prayer_personal_count') || 0
    );
    setCount(savedCount);

    const today = new Date().toLocaleDateString('en-CA');
    const savedDate = localStorage.getItem('prayer_count_date');
    const savedToday = Number(
      localStorage.getItem('prayer_today_count') || 0
    );

    if (savedDate === today) {
      setTodayCount(savedToday);
    } else {
      localStorage.setItem('prayer_count_date', today);
      localStorage.setItem('prayer_today_count', '0');
      setTodayCount(0);
    }

    loadGlobalCount();
  }, []);

  async function loadGlobalCount() {
    try {
      const { data, error } = await supabase
        .from('prayer_stats')
        .select('total_count')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setGlobalCount(Number(data.total_count || 0));
    } catch (error) {
      console.error('تعذر تحميل إجمالي الصلوات:', error);
    } finally {
      setGlobalLoading(false);
    }
  }

  async function incrementGlobalCount() {
    try {
      const { data, error } = await supabase.rpc(
        'increment_prayer_count'
      );

      if (error) throw error;
      setGlobalCount(Number(data));
    } catch (error) {
      console.error('تعذر تحديث إجمالي الصلوات:', error);
    }
  }

  function addPrayer() {
    const nextCount = count + 1;
    const today = new Date().toLocaleDateString('en-CA');
    const savedDate = localStorage.getItem('prayer_count_date');
    const nextToday = savedDate === today ? todayCount + 1 : 1;

    setCount(nextCount);
    setTodayCount(nextToday);

    localStorage.setItem('prayer_personal_count', String(nextCount));
    localStorage.setItem('prayer_count_date', today);
    localStorage.setItem('prayer_today_count', String(nextToday));

    incrementGlobalCount();

    const id = ++nextId.current;

    setCelebrations((old) => [
      ...old,
      {
        id,
        left: 35 + Math.random() * 30,
      },
    ]);

    window.setTimeout(() => {
      setCelebrations((old) =>
        old.filter((item) => item.id !== id)
      );
    }, 3300);
  }

  function changePoem() {
    setPoemIndex((old) => (old + 1) % poems.length);
    setCopied(false);
  }

  async function copyPoem() {
    try {
      await navigator.clipboard.writeText(
        poems[poemIndex].join('\n')
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('تعذر نسخ الأبيات:', error);
    }
  }

  return (
    <main className="prayer-experience" dir="rtl">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #07172e;
        }

        .prayer-experience {
          min-height: 100vh;
          overflow: hidden;
          color: #f8f5ed;
          background:
            radial-gradient(
              ellipse at 50% 8%,
              rgba(57, 112, 166, 0.45),
              transparent 48%
            ),
            linear-gradient(
              180deg,
              #07172e 0%,
              #102c50 48%,
              #0a1c35 100%
            );
          font-family: Tahoma, Arial, sans-serif;
          text-align: center;
        }

        .sky-scene {
          min-height: 720px;
          height: 100svh;
          max-height: 1000px;
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(
              circle at 50% 58%,
              rgba(100, 157, 205, 0.2),
              transparent 35%
            ),
            linear-gradient(
              180deg,
              #07152b 0%,
              #102c50 55%,
              #183d63 100%
            );
        }

        .sky-scene::before,
        .sky-scene::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background-image:
            radial-gradient(2px 2px at 12% 18%, #fff 50%, transparent 100%),
            radial-gradient(1px 1px at 28% 32%, #ffe7a3 50%, transparent 100%),
            radial-gradient(2px 2px at 76% 14%, #fff 50%, transparent 100%),
            radial-gradient(1px 1px at 88% 42%, #fff 50%, transparent 100%),
            radial-gradient(2px 2px at 52% 24%, #ffe7a3 50%, transparent 100%),
            radial-gradient(1px 1px at 42% 9%, #fff 50%, transparent 100%),
            radial-gradient(1px 1px at 18% 57%, #fff 50%, transparent 100%),
            radial-gradient(2px 2px at 83% 62%, #ffe7a3 50%, transparent 100%);
          background-size: 310px 290px;
          animation: stars-twinkle 4s ease-in-out infinite alternate;
        }

        .sky-scene::after {
          opacity: 0.5;
          transform: translateY(40px);
          animation-delay: 1.5s;
          background-size: 230px 250px;
        }

        @keyframes stars-twinkle {
          from { opacity: 0.25; }
          to { opacity: 1; }
        }

        .sky-glow {
          position: absolute;
          width: 75vw;
          height: 75vw;
          max-width: 600px;
          max-height: 600px;
          border-radius: 50%;
          background: rgba(83, 150, 210, 0.12);
          filter: blur(65px);
          top: 8%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 0;
        }

        .scene-image {
          position: absolute;
          z-index: 2;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 43%;
          background-image:
            linear-gradient(
              180deg,
              #102c50 0%,
              rgba(16, 44, 80, 0.35) 28%,
              rgba(4, 13, 25, 0.15) 100%
            ),
            url('/images/c5a8d5c4609027ede5212a874381354e.jpg');
          background-size: cover;
          background-position: center 38%;
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 22%,
            black 100%
          );
        }

        .scene-image::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 35%,
            rgba(5, 16, 31, 0.5) 100%
          );
        }

        .prayer-button {
          position: absolute;
          z-index: 5;
          bottom: 28px;
          left: 6%;
          width: 88%;
          min-height: 76px;
          border: 1px solid rgba(255, 232, 177, 0.9);
          border-radius: 24px;
          color: #173453;
          background: linear-gradient(
            135deg,
            #fff7db 0%,
            #e7c779 48%,
            #cda44f 100%
          );
          box-shadow:
            0 8px 35px rgba(0, 0, 0, 0.35),
            0 0 35px rgba(245, 211, 137, 0.2),
            inset 0 1px rgba(255, 255, 255, 0.8);
          font-size: clamp(18px, 4.5vw, 24px);
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .prayer-button:active {
          transform: scale(0.97);
        }

        .celebration {
          position: absolute;
          z-index: 4;
          bottom: 110px;
          pointer-events: none;
          width: 1px;
          height: 1px;
        }

        /* الكرة الزجاجية وبداخلها ﷺ */
        .celebration-orb {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.9);
          background: radial-gradient(
            circle at 35% 25%,
            rgba(255, 255, 255, 0.95),
            rgba(225, 244, 255, 0.48) 35%,
            rgba(132, 194, 255, 0.18) 72%,
            rgba(255, 255, 255, 0.08) 100%
          );
          box-shadow:
            inset -5px -5px 12px rgba(130, 190, 255, 0.2),
            0 0 18px 7px rgba(210, 237, 255, 0.55),
            0 0 45px 15px rgba(115, 183, 255, 0.25);
          animation: orb-flight 1s cubic-bezier(.2, .7, .25, 1) forwards;
        }

        .orb-text {
          color: #b68a38;
          font-size: 17px;
          font-weight: 900;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.9);
        }

        @keyframes orb-flight {
          0% {
            transform: translate(-50%, 0) scale(0.55);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -60vh) scale(1.25);
            opacity: 0;
          }
        }

        /* الانفجار في نفس نقطة وصول الكرة */
        .celebration-burst {
          position: absolute;
          left: 0;
          bottom: 60vh;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff8d9;
          box-shadow:
            0 0 14px 9px rgba(255, 230, 155, 0.9),
            0 0 45px 25px rgba(255, 190, 75, 0.55);
          opacity: 0;
          animation: golden-burst 1.2s 0.95s ease-out forwards;
        }

        .celebration-burst::before,
        .celebration-burst::after {
          content: '';
          position: absolute;
          inset: -24px;
          border: 2px solid rgba(255, 226, 153, 0.8);
          border-radius: 50%;
          animation: burst-ring 1s 1s ease-out forwards;
        }

        .celebration-burst::after {
          inset: -42px;
          animation-delay: 1.08s;
        }

        @keyframes golden-burst {
          0% {
            transform: translate(-50%, 50%) scale(0.1);
            opacity: 0;
          }
          25% {
            transform: translate(-50%, 50%) scale(3.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 50%) scale(0.7);
            opacity: 0;
          }
        }

        @keyframes burst-ring {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }

        /* العبارة تخرج من مركز الانفجار */
        .celebration-message {
          position: absolute;
          left: 0;
          bottom: calc(60vh + 7px);
          width: max-content;
          max-width: 90vw;
          color: #ffe5a0;
          font-size: clamp(19px, 5vw, 28px);
          font-weight: 900;
          text-shadow:
            0 0 9px #f3c65f,
            0 0 25px rgba(255, 208, 105, 0.95);
          opacity: 0;
          transform: translate(-50%, 50%) scale(0.15);
          animation: message-appear 2s 1.05s ease-out forwards;
        }

        @keyframes message-appear {
          0% {
            opacity: 0;
            transform: translate(-50%, 50%) scale(0.15);
            filter: blur(5px);
          }
          22% {
            opacity: 1;
            transform: translate(-50%, 50%) scale(1.12);
            filter: blur(0);
          }
          65% {
            opacity: 1;
            transform: translate(-50%, 25%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.9);
          }
        }

        .content-area {
          position: relative;
          z-index: 3;
          width: min(100% - 32px, 720px);
          margin: -1px auto 0;
          padding: 30px 0 55px;
        }

        .content-card {
          margin-bottom: 18px;
          padding: 25px 20px;
          border: 1px solid rgba(190, 218, 245, 0.2);
          border-radius: 25px;
          background: linear-gradient(
            145deg,
            rgba(29, 64, 101, 0.82),
            rgba(12, 31, 57, 0.9)
          );
          box-shadow:
            0 15px 45px rgba(0, 0, 0, 0.16),
            inset 0 1px rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(12px);
        }

        .section-title {
          margin: 0 0 15px;
          color: #f2d58e;
          font-size: 19px;
          font-weight: 800;
        }

        .hadith-text {
          margin: 0;
          color: #fff8e8;
          font-size: 18px;
          line-height: 2.1;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .stat-card {
          padding: 20px 10px;
          border: 1px solid rgba(224, 201, 147, 0.28);
          border-radius: 19px;
          background: rgba(7, 23, 43, 0.42);
        }

        .stat-card.global-stat {
          grid-column: 1 / -1;
          background: rgba(139, 105, 43, 0.16);
          border-color: rgba(242, 213, 142, 0.45);
        }

        .stat-number {
          display: block;
          color: #f2d58e;
          font-size: 29px;
          font-weight: 900;
          direction: ltr;
        }

        .stat-label {
          display: block;
          margin-top: 7px;
          color: #e4dede;
          font-size: 13px;
        }

        .salawat-text {
          margin: 0;
          color: #fff1d0;
          font-size: 18px;
          line-height: 2.2;
          text-align: center;
        }

        .poem-line {
          margin: 9px 0;
          color: #fff7e8;
          font-size: 19px;
          font-weight: 700;
          line-height: 2;
        }

        .poem-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 17px;
        }

        .poem-change,
        .poem-copy {
          padding: 12px 23px;
          border: 1px solid rgba(242, 213, 142, 0.45);
          border-radius: 15px;
          color: #f4d991;
          background: rgba(242, 213, 142, 0.08);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .poem-copy {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #fff4d8;
          background: rgba(255, 255, 255, 0.07);
        }

        .poem-copy:active,
        .poem-change:active {
          transform: scale(0.97);
        }

        @media (min-width: 700px) {
          .sky-scene {
            min-height: 850px;
          }

          .scene-image {
            height: 48%;
            background-position: center 42%;
          }

          .prayer-button {
            left: 50%;
            width: min(600px, 76%);
            transform: translateX(-50%);
          }

          .prayer-button:active {
            transform: translateX(-50%) scale(0.97);
          }

          .content-card {
            padding: 32px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sky-scene::before,
          .sky-scene::after,
          .celebration-orb,
          .celebration-burst,
          .celebration-burst::before,
          .celebration-burst::after,
          .celebration-message {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>

      <section className="sky-scene" aria-label="سماء الصلاة على النبي">
        <div className="sky-glow" />
        <div className="scene-image" />

        {celebrations.map((item) => (
          <div
            className="celebration"
            key={item.id}
            style={{ left: `${item.left}%` }}
          >
            <div className="celebration-orb">
              <span className="orb-text">ﷺ</span>
            </div>

            <div className="celebration-burst" />

            <div className="celebration-message">
              صلّى الله عليك عشرًا
            </div>
          </div>
        ))}

        <button
          type="button"
          className="prayer-button"
          onClick={addPrayer}
        >
          هنا الصلاة والسلام على رسول الله ﷺ
        </button>
      </section>

      <div className="content-area">
        <section className="content-card">
          <h2 className="section-title">حديث النبي ﷺ</h2>
          <p className="hadith-text">
            «مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً؛
            صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا»
          </p>
        </section>

        <section className="content-card">
          <h2 className="section-title">عدادات الصلوات</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">
                {count.toLocaleString('ar-EG')}
              </span>
              <span className="stat-label">إجمالي صلواتك</span>
            </div>

            <div className="stat-card">
              <span className="stat-number">
                {todayCount.toLocaleString('ar-EG')}
              </span>
              <span className="stat-label">صلواتك اليوم</span>
            </div>

            <div className="stat-card global-stat">
              <span className="stat-number">
                {globalLoading
                  ? '...'
                  : globalCount.toLocaleString('ar-EG')}
              </span>
                            <span className="stat-label">
                إجمالي صلوات جميع زوار الموقع
              </span>
            </div>
          </div>
        </section>

        {/* نص الصلاة موجود بدون عنوان */}
        <section className="content-card">
          <p className="salawat-text">{salawat}</p>
        </section>

        <section className="content-card">
          <h2 className="section-title">من مدح رسول الله ﷺ</h2>

          {poems[poemIndex].map((line, index) => (
            <p className="poem-line" key={index}>
              {line}
            </p>
          ))}

          <div className="poem-actions">
            <button
              type="button"
              className="poem-copy"
              onClick={copyPoem}
            >
              {copied ? '✓ تم النسخ' : '⧉ نسخ الأبيات'}
            </button>

            <button
              type="button"
              className="poem-change"
              onClick={changePoem}
            >
              تغيير الأبيات
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default PrayerExperience;
