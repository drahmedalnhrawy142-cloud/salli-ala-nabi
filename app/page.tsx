import { CodeActions } from '@/components/CodeActions';
import { ContactSection } from '@/components/ContactSection';
import { ShareButton } from '@/components/ShareButton';
import { StatsSection } from '@/components/StatsSection';

function Sparkle() {
  return <span className="eyebrow-dot" aria-hidden="true" />;
}

export default function HomePage() {
  return (
    <main className="site-shell">
      <div className="container">
        <header className="topbar">
          <a className="brand" href="#home" aria-label="الصفحة الرئيسية">
            <span className="brand-mark" aria-hidden="true">ﷺ</span>
            <span>صلي على النبي</span>
          </a>
          <a className="top-note" href="#contact">
            <span>تواصل معنا</span>
          </a>
        </header>

        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="eyebrow">
            <Sparkle /> مساحة التبادل والبرمجة
          </div>

          <h1 id="hero-title">
            <span className="gold">صلي</span> على النبي <span aria-hidden="true">ﷺ</span>
          </h1>

          <p className="hero-copy">
            مثال بسيط لتبادل نسخ برمجية. هذه مساحة خفيفة لتبادل الأكواد وملاحظات سريعة حول أدوات.
            <br />
            منصة تجريبية للعرض فقط.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#get-started">
              ابدأ الآن <span aria-hidden="true">←</span>
            </a>
            <a className="button button-outline" href="#how-it-works">
              كيف تعمل الأدوات
            </a>
          </div>
        </section>

        <section id="get-started" aria-label="مبادئ نسك">
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
              فكرة بسيطة: مشاركة سريعة بين الزوار دون إنشاء حسابات.
            </p>

            <ol className="steps">
              <li className="step">
                <span className="step-number">1</span>
                <strong>احصل على مفتاح</strong> من منصة تبادل أو منح أدوات صغيرة.
              </li>
              <li className="step">
                <span className="step-number">2</span>
                <strong>شارك أو استبدل</strong> مع شخص آخر ضمن قواعد واضحة.
              </li>
              <li className="step">
                <span className="step-number">3</span>
                <strong>استخدم المفتاح</strong> في أدواتك المعتمدة.
              </li>
            </ol>

            <div className="privacy-note">
              <span aria-hidden="true">✦</span> المفاتيح لا تظهر في اللوحة، ولا يمكن استرجاعها بعد إغلاق الصفحة.
            </div>
          </div>
        </section>

        <ContactSection />
        <div className="share-row">
          <ShareButton />
        </div>
      </div>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-prayer">
            اللهم صل وسلم على نبينا محمد ﷺ
          </div>
          <div className="footer-note">
            مساحة مشاركة بسيطة، دون حسابات أو بيانات محفوظة.
          </div>
        </div>
      </footer>
    </main>
  );
}
