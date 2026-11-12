'use client';

import { useEffect, useState } from 'react';

export function PrayerHome() {
  const [count, setCount] = useState(0);
  const [goal, setGoal] = useState(100);

  useEffect(() => {
    const saved = localStorage.getItem('prayer_personal_count');
    if (saved) setCount(Number(saved) || 0);
  }, []);

  function addPrayer(amount: number) {
    const next = count + amount;
    setCount(next);
    localStorage.setItem('prayer_personal_count', String(next));
  }

  function resetCount() {
    setCount(0);
    localStorage.setItem('prayer_personal_count', '0');
  }

  const progress = Math.min((count / goal) * 100, 100);

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
          <a href="#share">شارك الخير</a>
        </nav>
      </header>

      <section className="prayer-hero" id="home">
        <p className="prayer-eyebrow">مساحة للذكر والطمأنينة</p>
        <h1>اللهم صلِّ وسلم على<br />نبينا محمد ﷺ</h1>
        <p className="prayer-subtitle">
          اجعل الصلاة على النبي جزءًا جميلًا من يومك.
        </p>

        <div className="prayer-counters">
          <div className="prayer-counter">
            <span>صلواتك الشخصية</span>
            <strong>{count.toLocaleString('ar-EG')}</strong>
          </div>
          <div className="prayer-counter">
            <span>إجمالي صلوات الزوار</span>
            <strong>قريبًا</strong>
          </div>
        </div>

        <button
          className="prayer-main-button"
          onClick={() => addPrayer(1)}
        >
          ♥ اللهم صلِّ وسلم على نبينا محمد ﷺ
        </button>

        <div className="prayer-small-buttons">
          <button onClick={() => addPrayer(10)}>+١٠</button>
          <button onClick={() => addPrayer(100)}>+١٠٠</button>
          <button onClick={resetCount}>تصفير العداد</button>
        </div>

        <p className="prayer-save-note">
          عدادك الشخصي محفوظ على جهازك دون إنشاء حساب.
        </p>
      </section>

      <section className="daily-section" id="daily">
        <h2>🌿 وردك اليومي</h2>
        <p>اختر هدفًا يوميًا يناسبك وتابع تقدمك.</p>

        <div className="goal-options">
          {[100, 500, 1000].map((value) => (
            <button
              key={value}
              className={goal === value ? 'goal-active' : ''}
              onClick={() => setGoal(value)}
            >
              {value.toLocaleString('ar-EG')}
            </button>
          ))}
        </div>

        <div className="goal-progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <p>
          {count.toLocaleString('ar-EG')} من{' '}
          {goal.toLocaleString('ar-EG')} صلاة
        </p>
      </section>

      <section className="phrases-section" id="phrases">
        <h2>صيغ الصلاة على النبي ﷺ</h2>

        <div className="phrase-card">
          <p>اللهم صلِّ وسلم وبارك على نبينا محمد.</p>
          <button
            onClick={() =>
              navigator.clipboard.writeText(
                'اللهم صلِّ وسلم وبارك على نبينا محمد ﷺ'
              )
            }
          >
            نسخ الصيغة
          </button>
        </div>

        <div className="phrase-card">
          <p>اللهم صلِّ على محمد وعلى آل محمد، كما صليت على إبراهيم وعلى آل إبراهيم.</p>
          <button
            onClick={() =>
              navigator.clipboard.writeText(
                'اللهم صلِّ على محمد وعلى آل محمد، كما صليت على إبراهيم وعلى آل إبراهيم.'
              )
            }
          >
            نسخ الصيغة
          </button>
        </div>
      </section>

      <section className="share-section" id="share">
        <h2>انشر الخير ❤️</h2>
        <p>شارك المنصة مع أصحابك وشجعهم على الصلاة على النبي ﷺ.</p>
        <button
          onClick={() =>
            navigator.share?.({
              title: 'صلي على النبي ﷺ',
              text: 'شاركنا الصلاة على النبي ﷺ',
              url: window.location.origin,
            })
          }
        >
          مشاركة الموقع
        </button>
      </section>

      <footer className="prayer-footer">
        اللهم صلِّ وسلم على نبينا محمد ﷺ
      </footer>
    </main>
  );
}
