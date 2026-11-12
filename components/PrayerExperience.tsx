
'use client';

import { useEffect, useRef, useState } from 'react';

type Celebration = {
  id: number;
  left: number;
};

const prayers = [
  'اللهم صلِّ وسلم على نبينا محمد ﷺ',
  'اللهم صلِّ على محمد وعلى آل محمد',
  'صلاةً وسلامًا عليك يا رسول الله ﷺ',
  'عدد ما صلى عليك الله جل جلاله، وملائكته، وجميع خلقه، وكما يليق بصلاته، سلّم وصلّى عليك الله يا خير الورى إلى يوم الدين، عني وعن والديّ والمسلمين',
];

export function PrayerExperience() {
  const [count, setCount] = useState(0);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [currentPrayer, setCurrentPrayer] = useState(prayers[0]);
  const nextId = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('prayer_personal_count');
    if (saved) setCount(Number(saved) || 0);
  }, []);

  function addPrayer() {
    const next = count + 1;
    setCount(next);
    localStorage.setItem('prayer_personal_count', String(next));

    const id = ++nextId.current;

    setCurrentPrayer(
      prayers[Math.floor(Math.random() * prayers.length)]
    );

    const celebration = {
      id,
      left: 35 + Math.random() * 30,
    };

    setCelebrations((old) => [...old, celebration]);

    window.setTimeout(() => {
      setCelebrations((old) => old.filter((item) => item.id !== id));
    }, 2600);
  }

  return (
    <main className="prayer-experience" dir="rtl">
      <style jsx global>{`
        .prayer-experience {
          min-height: 720px;
          position: relative;
          overflow: hidden;
          padding: 35px 18px 55px;
          color: #fff5d5;
          text-align: center;
          background:
            radial-gradient(ellipse at 50% 10%, #17634d 0%, transparent 48%),
            linear-gradient(180deg, #031b1b 0%, #052d25 55%, #031b1b 100%);
          font-family: inherit;
        }

        .prayer-experience::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .65;
          background-image:
            radial-gradient(2px 2px at 12% 15%, #fff4c2 50%, transparent 100%),
            radial-gradient(1px 1px at 28% 35%, #fff 50%, transparent 100%),
            radial-gradient(2px 2px at 75% 18%, #ffe8a0 50%, transparent 100%),
            radial-gradient(1px 1px at 88% 42%, #fff 50%, transparent 100%),
            radial-gradient(2px 2px at 52% 28%, #fff4c2 50%, transparent 100%),
            radial-gradient(1px 1px at 40% 12%, #fff 50%, transparent 100%);
          background-size: 260px 240px;
        }

        .prayer-content {
          position: relative;
          z-index: 2;
          max-width: 650px;
          margin: auto;
        }

        .prayer-eyebrow {
          color: #e8c879;
          font-size: 17px;
          margin-bottom: 22px;
        }

        .prayer-title {
          color: #e9c875;
          font-size: clamp(27px, 6vw, 42px);
          line-height: 1.8;
          margin: 0 0 12px;
          font-weight: 700;
        }

        .prayer-subtitle {
          color: #f4ead4;
          font-size: 17px;
          line-height: 2;
          margin: 0 auto 30px;
          max-width: 500px;
        }

        .prayer-count-card {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin: 25px 0;
        }

        .prayer-count-box {
          flex: 1;
          max-width: 220px;
          padding: 20px 10px;
          border: 1px solid rgba(225, 196, 119, .35);
          border-radius: 22px;
          background: rgba(255,255,255,.06);
        }

        .prayer-count-label {
          display: block;
          color: #e9dec4;
          font-size: 15px;
          margin-bottom: 12px;
        }

        .prayer-count-number {
          color: #f1cf79;
          font-size: 32px;
          font-weight: bold;
        }

        .prayer-scene {
          position: relative;
          margin: 32px auto 20px;
          min-height: 330px;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid rgba(230, 199, 120, .45);
          background-image:
            linear-gradient(180deg, rgba(2, 23, 24, .35), rgba(2, 23, 24, .78)),
            url('/images/c5a8d5c4609027ede5212a874381354e.jpg');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: end;
          justify-content: center;
          padding: 25px 18px;
        }

        .prayer-scene::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, transparent 35%, rgba(0,0,0,.45));
        }

        .prayer-button {
          position: relative;
          z-index: 3;
          width: 100%;
          min-height: 100px;
          border: 1px solid #f4d88c;
          border-radius: 22px;
          background: linear-gradient(135deg, #f1d48a, #c99d45);
          color: #153d30;
          font-size: clamp(18px, 4vw, 25px);
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 30px rgba(0,0,0,.3);
          transition: transform .15s ease, filter .15s ease;
        }

        .prayer-button:active {
          transform: scale(.96);
          filter: brightness(1.15);
        }

        .prayer-button:focus-visible {
          outline: 3px solid white;
          outline-offset: 4px;
        }

        .prayer-current {
          color: #f5dfaa;
          font-size: 18px;
          line-height: 2;
          margin: 25px auto 5px;
          max-width: 560px;
        }

        .celebration {
          position: absolute;
          z-index: 5;
          bottom: 100px;
          transform: translateX(-50%);
          pointer-events: none;
          animation: prayer-rise 2.5s ease-out forwards;
          width: min(90%, 420px);
        }

        .celebration-prayer {
          color: #fff2c6;
          font-size: 17px;
          line-height: 1.8;
          text-shadow: 0 0 12px #ffe6a0;
          animation: prayer-fade 2.5s ease-out forwards;
        }

        .gold-burst {
          position: relative;
          margin: 8px auto;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff5c9;
          box-shadow:
            0 0 12px 8px rgba(255, 215, 110, .7),
            0 0 35px 20px rgba(255, 185, 55, .35);
          animation: burst 1.1s ease-out forwards;
        }

        .celebration-message {
          display: block;
          color: #ffdc83;
          font-size: clamp(19px, 5vw, 27px);
          font-weight: 900;
          white-space: nowrap;
          text-shadow:
            0 0 8px #f4bd4d,
            0 0 22px rgba(255, 196, 76, .9);
          animation: gold-message 2.5s ease-out forwards;
        }

        @keyframes prayer-rise {
          0% { opacity: 0; bottom: 95px; }
          12% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; bottom: 300px; }
        }

        @keyframes burst {
          0% { transform: scale(.2); opacity: 0; }
          35% { transform: scale(2.8); opacity: 1; }
          100% { transform: scale(.5); opacity: 0; }
        }

        @keyframes gold-message {
          0%, 25% { opacity: 0; transform: scale(.4); }
          45% { opacity: 1; transform: scale(1.12); }
          65% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: translateY(-35px) scale(.9); }
        }

        @keyframes prayer-fade {
          0%, 15% { opacity: 0; }
          30%, 65% { opacity: 1; }
          100% { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .celebration,
          .celebration-prayer,
          .gold-burst,
          .celebration-message {
            animation-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="prayer-content">
        <div className="prayer-eyebrow">
          مساحة للذكر والصلاة والسلام
        </div>

        <h1 className="prayer-title">
          اللهم صلِّ وسلم على نبينا محمد ﷺ
        </h1>

        <p className="prayer-subtitle">
          اجعل لسانك رطبًا بالصلاة على رسول الله ﷺ،
          وشارك الأجر مع من تحب.
        </p>

        <div className="prayer-count-card">
          <div className="prayer-count-box">
            <span className="prayer-count-label">صلواتك على النبي ﷺ</span>
            <span className="prayer-count-number">{count.toLocaleString('ar-EG')}</span>
          </div>
        </div>

        <div className="prayer-scene">
          {celebrations.map((item) => (
            <div
              key={item.id}
              className="celebration"
              style={{ left: `${item.left}%` }}
            >
              <div className="celebration-prayer">
                {currentPrayer}
              </div>
              <div className="gold-burst" />
              <span className="celebration-message">
                صلّى الله عليك عشرًا
              </span>
            </div>
          ))}

          <button
            type="button"
            className="prayer-button"
            onClick={addPrayer}
            aria-label="صلِّ على النبي صلى الله عليه وسلم"
          >
            هنا السلام على رسول الله ﷺ
          </button>
        </div>

        <p className="prayer-current">
          {currentPrayer}
        </p>
      </div>
    </main>
  );
}

export default PrayerExperience;
