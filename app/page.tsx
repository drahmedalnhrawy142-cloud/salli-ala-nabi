
import { CodeActions } from '@/components/CodeActions';
import { ContactSection } from '@/components/ContactSection';
import { ShareButton } from '@/components/ShareButton';
import { StatsSection } from '@/components/StatsSection';
import { PrayerExperience } from '@/components/PrayerExperience';

export default function HomePage() {
  return (
    <main className="site-shell">
      <div className="container">
        <header className="topbar">
          <a className="brand" href="#home" aria-label="الصفحة الرئيسية">
            <span className="brand-mark" aria-hidden="true">ﷺ</span>
            <span>صلِّ على النبي</span>
          </a>

          <nav className="top-links" aria-label="القائمة الرئيسية">
            <a href="#home">الرئيسية</a>
            <a href="#prayer">الصلاة على النبي</a>
            <a href="#get-started">تبادل الأكواد</a>
            <a href="#contact">تواصل معنا</a>
          </nav>
        </header>

        <section id="home">
          <PrayerExperience />
        </section>

        <section
          id="get-started"
          aria-label="مساحة تبادل الأكواد"
        >
          <CodeActions />
        </section>

        <StatsSection />

        <section
          className="how-section"
          id="how-it-works"
          aria-labelledby="how-heading"
        >
          <div className="panel how-panel">
            <h2 id="how-heading">كيف تعمل الأدوات؟</h2>

            <p className="how-intro">
              فكرة بسيطة: مشاركة برمجية بين الزوار دون إنشاء حسابات.
            </p>

            <ol className="steps">
              <li className="step">
                <span className="step-number">1</span>
                <strong>احصل على مفتاح من منصة تبادل أو من أحد المساهمين.</strong>
              </li>

              <li className="step">
                <span className="step-number">2</span>
                <strong>شارك أو استبدل مع شخص آخر ضمن ضوابط المنصة.</strong>
              </li>

              <li className="step">
                <span className="step-number">3</span>
                <strong>استخدم المفتاح وفقًا لشروط المنصة المصدرة.</strong>
              </li>
            </ol>

            <div className="privacy-note">
              <span aria-hidden="true">✦</span>
              الأكواد لا تظهر في ملفك الشخصي، ويمكنك استخدام الموقع دون تسجيل حساب.
            </div>
          </div>
        </section>

        <section id="contact">
          <ContactSection />
        </section>

        <div className="share-row">
          <ShareButton />
        </div>
      </div>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-prayer">
            اللهم صلِّ وسلم على نبينا محمد ﷺ
          </div>

          <div className="footer-note">
            مساحة للمشاركة والذكر والصلاة والسلام.
          </div>
        </div>
      </footer>
    </main>
  );
}
