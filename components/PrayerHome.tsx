
'use client';

import { useEffect, useRef, useState } from 'react';
import './PrayerHome.css';

const phrases = [
  'اللهم صل وسلم وبارك على سيدنا محمد ﷺ',
  'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم',
  'صلى الله عليه وسلم',
];

export function PrayerHome() {
  const [count, setCount] = useState(0);
  const [goal, setGoal] = useState(100);
  const [copied, setCopied] = useState<number | null>(null);
  const [flights, setFlights] = useState<
    { id: number; variant: number }[]
  >([]);

  const flightId = useRef(0);

  useEffect(() => {
    const savedCount = localStorage.getItem('prayer_personal_count');
    const savedGoal = localStorage.getItem('prayer_daily_goal');

    if (savedCount) setCount(Number(savedCount) || 0);
    if (savedGoal) setGoal(Number(savedGoal) || 100);
  }, []);

  function addPrayer() {
    const next = count + 1;

    setCount(next);
    localStorage.setItem('prayer_personal_count', String(next));

    flightId.current += 1;
    const id = flightId.current;
    const variant = id % 3;

    setFlights((old) => [...old, { id, variant }]);

    window.setTimeout(() => {
      setFlights((old) => old.filter((item) => item.id !== id));
    }, 2600);
  }

  function resetCount() {
    if (!window.confirm('هل تريد تصفير عدادك الشخصي؟')) return;

    setCount(0);
    localStorage.setItem('prayer_personal_count', '0');
  }

  function changeGoal(value: number) {
    setGoal(value);
    localStorage.setItem('prayer_daily_goal', String(value));
  }

  async function copyPhrase(phrase: string, index: number) {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(index);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      alert('تعذر النسخ. حاول مرة أخرى.');
    }
  }

  async function shareWebsite() {
    const shareData = {
      title: 'صلي على النبي ﷺ',
      text: 'شاركنا الصلاة على النبي ﷺ، واجعل لك وردًا يوميًا.',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('تم نسخ رابط الموقع');
      }
    } catch {
      // ألغى المستخدم المشاركة
    }
  }

  const progress = Math.min((count / goal) * 100, 100);
  const remaining = Math.max(goal - count, 0);

  return (
    <main className="prayer-home" dir="rtl">
      <header className="prayer-header">
        <div className="prayer-brand">
          <span>ﷺ</span>
          <strong>صلي على النبي</strong>
        </div>

        <nav>
          <a href="#home">الرئيسية</a>
          <a href="#daily">وردي اليومي</a>
          <a href="#phrases">صيغ الصلاة</a>
          <a href="#share">مشاركة</a>
        </nav>
      </header>

      <section className="prayer-hero" id="home">
        <p className="prayer-eyebrow">
          مساحة للذكر والصلاة والسلام
        </p>

        <h1>اللهم صل وسلم على نبينا محمد ﷺ</h1>

        <p className="prayer-subtitle">
          اجعل لسانك رطبًا بالصلاة على رسول الله ﷺ
          <br />
          وابدأ وردك اليومي وشارك الأجر مع من تحب.
        </p>

        <div className="prayer-counters">
          <div className="prayer-counter">
            <span>عدادك الشخصي</span>
            <strong>{count.toLocaleString('ar-EG')}</strong>
          </div>

          <div className="prayer-counter">
            <span>الجزاء في الحديث</span>
            <strong>عشر صلوات</strong>
          </div>
        </div>

        <div className="prayer-action-area">
          {flights.map((flight) => (
            <span
              key={flight.id}
              className={`salawat-flight flight-${flight.variant}`}
            >
              صلّى الله عليك عشرًا
            </span>
          ))}

          <button
            className="prayer-main-button"
            onClick={addPrayer}
            type="button"
          >
            <span className="button-glow" />
            صلّيت على النبي ﷺ
          </button>
        </div>

        <div className="prayer-small-buttons">
          <button onClick={() => addPrayer()} type="button">
            +١
          </button>

          <button onClick={() => addPrayer()} type="button">
            +١٠
          </button>

          <button onClick={() => addPrayer()} type="button">
            +١٠٠
          </button>

          <button onClick={resetCount} type="button">
            تصفير العداد
          </button>
        </div>

        <p className="prayer-save-note">
          عدادك الشخصي يُحفظ على جهازك دون إنشاء حساب.
        </p>

        <p className="hadith-note">
          قال رسول الله ﷺ:
          <br />
          «مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً؛
          صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا»
        </p>
      </section>

      <section className="daily-section" id="daily">
        <h2>🌿 وردك اليومي</h2>

        <p>
          اختر هدفك اليومي وتابع تقدمك في الصلاة على النبي ﷺ.
        </p>

        <div className="goal-options">
          {[100, 500, 1000, 5000].map((value) => (
            <button
              key={value}
              className={goal === value ? 'goal-active' : ''}
              onClick={() => changeGoal(value)}
              type="button"
            >
              {value.toLocaleString('ar-EG')}
            </button>
          ))}
        </div>

        <div
          className="goal-progress"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ width: `${progress}%` }} />
        </div>

        <p>
          أنجزت {Math.min(count, goal).toLocaleString('ar-EG')} من{' '}
          {goal.toLocaleString('ar-EG')} صلاة
        </p>

        <p>
          {remaining === 0
            ? 'ما شاء الله! أتممت وردك اليومي 🌟'
            : `باقي ${remaining.toLocaleString('ar-EG')} لإتمام وردك`}
        </p>
      </section>

      <section className="phrases-section" id="phrases">
        <h2>صيغ الصلاة على النبي ﷺ</h2>

        {phrases.map((phrase, index) => (
          <div className="phrase-card" key={phrase}>
            <p>{phrase}</p>

            <button
              onClick={() => copyPhrase(phrase, index)}
              type="button"
            >
              {copied === index ? 'تم النسخ ✓' : 'نسخ الصيغة'}
            </button>
          </div>
        ))}
      </section>

      <section className="share-section" id="share">
        <h2>شارك الخير مع أصدقائك ❤️</h2>

        <p>
          دُل غيرك على الصلاة على النبي ﷺ، فالدال على الخير كفاعله.
        </p>

        <button onClick={shareWebsite} type="button">
          مشاركة الموقع
        </button>
      </section>

      <footer className="prayer-footer">
        اللهم صل وسلم وبارك على نبينا محمد ﷺ
      </footer>

      <style jsx>{`
        .prayer-action-area {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: visible;
          isolation: isolate;
        }

        .prayer-main-button {
          position: relative;
          overflow: hidden;
          z-index: 2;
        }

        .button-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 20%,
            rgba(255, 255, 255, 0.3) 48%,
            transparent 75%
          );
          transform: translateX(-120%);
          animation: button-shine 4s ease-in-out infinite;
          pointer-events: none;
        }

        .salawat-flight {
          position: absolute;
          z-index: 5;
          bottom: 75%;
          left: 50%;
          width: max-content;
          max-width: 95%;
          color: #f4d58a;
          font-size: clamp(17px, 4vw, 25px);
          font-weight: 700;
          text-shadow:
            0 0 8px rgba(239, 202, 111, 0.8),
            0 0 22px rgba(239, 202, 111, 0.5);
          white-space: nowrap;
          pointer-events: none;
          animation: salawat-rise 2.5s ease-out forwards;
        }

        .flight-0 {
          --drift: -35px;
        }

        .flight-1 {
          --drift: 28px;
        }

        .flight-2 {
          --drift: 0px;
        }

        @keyframes salawat-rise {
          0% {
            opacity: 0;
            transform: translate(-50%, 25px) scale(0.75);
            filter: blur(5px);
          }

          15% {
            opacity: 1;
            filter: blur(0);
          }

          65% {
            opacity: 1;
            transform: translate(
              calc(-50% + var(--drift)),
              -135px
            ) scale(1.08);
          }

          100% {
            opacity: 0;
            transform: translate(
              calc(-50% + var(--drift)),
              -260px
            ) scale(0.85);
            filter: blur(4px);
          }
        }

        @keyframes button-shine {
          0%, 65% {
            transform: translateX(-120%);
          }

          90%, 100% {
            transform: translateX(120%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .salawat-flight,
          .button-glow {
            animation: none;
          }

          .salawat-flight {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
