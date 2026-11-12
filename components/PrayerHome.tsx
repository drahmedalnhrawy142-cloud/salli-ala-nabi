
'use client';

import { useEffect, useState } from 'react';
import './PrayerHome.css';

const phrases = [
  'اللهم صل وسلم وبارك على سيدنا محمد ﷺ',
  'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم',
  'صلى الله عليه وسلم',
];

export function PrayerHome() {
  const [count, setCount] = useState(0);
  const [goal, setGoal] = useState(100);
  const [copied, setCopied] = useState(false);

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

  async function copyPhrase(phrase: string) {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function shareWebsite() {
    const shareData = {
      title: 'صلي على النبي ﷺ',
      text: 'شاركنا الصلاة على النبي ﷺ، واجعل لك وردًا يوميًا.',
      url: window.location.origin,
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      alert('تم نسخ رابط الموقع');
    }
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
          <a href="#share">مشاركة</a>
        </nav>
      </header>

      <section className="prayer-hero" id="home">
        <p className="prayer-eyebrow">مساحة للذكر والصلاة والسلام</p>

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
            <span>العداد الجماعي</span>
            <strong>قريبًا</strong>
          </div>
        </div>

        <button
          className="prayer-main-button"
          onClick={() => addPrayer(1)}
        >
          ﷺ صليت على النبي
        </button>

        <div className="prayer-small-buttons">
          <button onClick={() => addPrayer(10)}>+١٠</button>
          <button onClick={() => addPrayer(100)}>+١٠٠</button>
          <button onClick={resetCount}>تصفير العداد</button>
        </div>

        <p className="prayer-save-note">
          عدادك الشخصي يُحفظ على جهازك دون إنشاء حساب.
        </p>
      </section>

      <section className="daily-section" id="daily">
        <h2>🌿 وردك اليومي</h2>
        <p>اختر هدفك اليومي وتابع تقدمك في الصلاة على النبي ﷺ.</p>

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
          أنجزت {count.toLocaleString('ar-EG')} من
          {' '}{goal.toLocaleString('ar-EG')} صلاة
        </p>

        <p>
          {progress >= 100
            ? 'ما شاء الله، أتممت وردك اليومي 🌟'
            : `باقي ${(goal - count > 0 ? goal - count : 0).toLocaleString('ar-EG')} لإتمام وردك`}
        </p>
      </section>

      <section className="phrases-section" id="phrases">
        <h2>صيغ الصلاة على النبي ﷺ</h2>

        {phrases.map((phrase) => (
          <div className="phrase-card" key={phrase}>
            <p>{phrase}</p>
            <button onClick={() => copyPhrase(phrase)}>
              {copied ? 'تم النسخ ✓' : 'نسخ الصيغة'}
            </button>
          </div>
        ))}
      </section>

      <section className="share-section" id="share">
        <h2>شارك الخير مع أصدقائك ❤️</h2>
        <p>
          دلّ غيرك على الصلاة على النبي ﷺ، فالدال على الخير كفاعله.
        </p>
        <button onClick={shareWebsite}>مشاركة الموقع</button>
      </section>

      <footer className="prayer-footer">
        اللهم صل وسلم وبارك على نبينا محمد ﷺ
      </footer>
    </main>
  );
}
