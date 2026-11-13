
'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Celebration = {
  id: number;
  left: number;
};

const poems = [
  [
    'مُحَمَّدٌ سَيِّدُ الْكَوْنَيْنِ وَالثَّقَلَيْنِ',
    'وَالْفَرِيقَيْنِ مِنْ عُرْبٍ وَمِنْ عَجَمِ',
  ],
  [
    'وَإِنَّ مِنْ جُودِكَ الدُّنْيَا وَضَرَّتَهَا',
    'وَمِنْ عُلُومِكَ عِلْمِ اللَّوْحِ وَالْقَلَمِ',
  ],
  [
    'يَا أَكْرَمَ الْخَلْقِ مَا لِي مَنْ أَلُوذُ بِهِ',
    'سِوَاكَ عِنْدَ حُلُولِ الْحَادِثِ الْعَمَمِ',
  ],
  [
    'فَإِنَّ مِنْ جُودِكَ الْإِحْسَانَ وَالشِّيَمَا',
    'وَمِنْ عُلُومِكَ عِلْمَ اللَّوْحِ وَالْقَلَمِ',
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
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const nextId = useRef(0);

  // تحميل العدادات المحلية والإجمالي من قاعدة البيانات
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

  // قراءة إجمالي الصلوات من Supabase
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

  // تسجيل ضغطة جديدة في قاعدة البيانات
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

    const nextToday =
      savedDate === today ? todayCount + 1 : 1;

    setCount(nextCount);
    setTodayCount(nextToday);

    localStorage.setItem(
      'prayer_personal_count',
      String(nextCount)
    );
    localStorage.setItem('prayer_count_date', today);
    localStorage.setItem(
      'prayer_today_count',
      String(nextToday)
    );

    // كل ضغطة تُسجَّل مرة واحدة في الإجمالي العام
    incrementGlobalCount();

    // حركة الكرة والاحتفال مع كل ضغطة
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
    }, 2600);
  }

  function changePoem() {
    setPoemIndex((old) => (old + 1) % poems.length);
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
            inset 0 1px 1px rgba(255, 255, 255, 0.8);
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

        .celebration-orb {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 30%,
            #fff 0%,
            rgba(225, 244, 255, 0.8) 38%,
            rgba(175, 218, 255, 0.22) 72%,
            transparent 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            0 0 18px 7px rgba(210, 237, 255, 0.55),
            0 0 45px 15px rgba(115, 183, 255, 0.25);
          animation: orb-flight 1.05s cubic-bezier(.2, .7, .25, 1) forwards;
        }

        @keyframes orb-flight {
          0% {
            transform: translate(-50%, 0) scale(0.65);
            opacity: 0;
          }
          12% { opacity: 1; }
          75% { opacity: 1; }
          100% {
            transform: translate(-50%, -65vh) scale(1.2);
            opacity: 0;
          }
        }

        .celebration-burst {
          position: absolute;
          left: 0;
          bottom: 60vh;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff8d9;
          box-shadow:
            0 0 14px 9px rgba(255, 230, 155, 0.8),
            0 0 45px 25px rgba(255, 190, 75, 0.45);
          opacity: 0;
          animation: golden-burst 1.1s 0.85s ease-out forwards;
        }

        @keyframes golden-burst {
          0% {
            transform: translate(-50%, 0) scale(0.1);
            opacity: 0;
          }
          35% {
            transform: translate(-50%, 0) scale(3.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 0) scale(0.6);
            opacity: 0;
          }
        }

        .celebration-message {
          position: absolute;
          left: 0;
          bottom: calc(60vh - 58px);
          width: max-content;
          transform: translateX(-50%);
          color: #ffe5a0;
          font-size: clamp(19px, 5vw, 28px);
          font-weight: 900;
          text-shadow:
            0 0 9px #f3c65f,
            0 0 25px rgba(255, 208, 105, 0.95);
          opacity: 0;
          animation: message-appear 1.9s 1s ease-out forwards;
        }

        @keyframes message-appear {
          0% {
            opacity: 0;
            transform: translate(-50%, 12px) scale(0.65);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.08);
          }
          70% {
            opacity: 1;
            transform: translate(-50%, -5px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -28px) scale(0.95);
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
            inset 0 1px 1px rgba(255, 255, 255, 0.04);
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

        .poem-change {
          margin-top: 17px;
          padding: 12px 23px;
          border: 1px solid rgba(242, 213, 142, 0.45);
          border-radius: 15px;
          color: #f4d991;
          background: rgba(242, 213, 142, 0.08);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
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
            <div className="celebration-orb" />
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

        <section className="content-card">
          <h2 className="section-title">صيغة الصلاة والسلام</h2>
          <p className="salawat-text">{salawat}</p>
        </section>

        <section className="content-card">
          <h2 className="section-title">
            من مدح رسول الله ﷺ
          </h2>

          {poems[poemIndex].map((line, index) => (
            <p className="poem-line" key={index}>
              {line}
            </p>
          ))}

          <button
            type="button"
            className="poem-change"
            onClick={changePoem}
          >
            تغيير الأبيات
          </button>
        </section>
      </div>
    </main>
  );
}

export default PrayerExperience;
      
