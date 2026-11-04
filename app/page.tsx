import { CodeActions } from '@/components/CodeActions';
import { ShareButton } from '@/components/ShareButton';

function Sparkle() {
  return <span className="eyebrow-dot" aria-hidden="true" />;
}

export default function HomePage() {
  return (
    <main className="site-shell">
      <div className="container">
        <header className="topbar">
          <a className="brand" href="#home" aria-label="صلي على النبي، الصفحة الرئيسية">
            <span className="brand-mark" aria-hidden="true">ﷺ</span>
            <span>صلي على النبي ﷺ</span>
          </a>
          <div className="top-note"><span>بلا حسابات</span> · مشاركة بين الزوار</div>
        </header>

        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="eyebrow"><Sparkle /> مساحة للتعاون والخير</div>
          <h1 id="hero-title">صلي على النبي <span className="gold">ﷺ</span></h1>
          <p className="hero-copy">تبادل مفاتيح تحدي نسك ببساطة. خذ مفتاحًا إن توفر، أو أضف مفتاحك ليصل إلى من يحتاجه.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#get-started">ابدأ الآن <span aria-hidden="true">↓</span></a>
            <a className="button button-outline" href="#how-it-works">كيف تعمل الأداة؟</a>
          </div>
        </section>

        <section id="get-started" aria-label="تبادل مفاتيح نسك">
          <CodeActions />
        </section>

        <section className="stats-section" aria-labelledby="stats-heading">
          <h2 className="stats-heading" id="stats-heading">إحصائيات المنصة</h2>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-value" aria-label="غير متاح بعد">—</div><div className="stat-label">مفاتيح متاحة</div></div>
            <div className="stat-card"><div className="stat-value" aria-label="غير متاح بعد">—</div><div className="stat-label">مفاتيح تم تبادلها</div></div>
            <div className="stat-card"><div className="stat-value" aria-label="غير متاح بعد">—</div><div className="stat-label">مساهمات الزوار</div></div>
          </div>
          <p className="stats-note">ستظهر الأرقام الفعلية بعد ربط قاعدة البيانات؛ لا توجد أرقام تقديرية معروضة.</p>
        </section>

        <section className="how-section" id="how-it-works" aria-labelledby="how-heading">
          <div className="panel how-panel">
            <h2 id="how-heading">كيف تعمل الأداة؟</h2>
            <p className="how-intro">فكرتها بسيطة: مشاركة مباشرة بين الزوار، من دون إنشاء حساب.</p>
            <ol className="steps">
              <li className="step"><span className="step-number">١</span><div><strong>اطلب مفتاحًا</strong><p>اضغط «هات مفتاح» للحصول على مفتاح متاح عند تفعيل الخدمة.</p></div></li>
              <li className="step"><span className="step-number">٢</span><div><strong>أضف مفتاحك</strong><p>شارك مفتاحًا صالحًا ليستفيد منه شخص آخر.</p></div></li>
              <li className="step"><span className="step-number">٣</span><div><strong>تبادل بلا حسابات</strong><p>لا تسجيل دخول ولا حاجة لإضافة بيانات شخصية.</p></div></li>
            </ol>
            <div className="privacy-note"><span aria-hidden="true">✦</span><span>الواجهة في هذه المرحلة لا ترسل المفاتيح أو تحفظها؛ سيُفعّل التبادل بعد ربط قاعدة البيانات.</span></div>
          </div>
        </section>

        <div className="share-row"><ShareButton /></div>
      </div>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-prayer">اللهم صلِّ وسلم على نبينا محمد ﷺ</div>
          <div className="footer-note">مساحة مشاركة بسيطة · دون حسابات أو بيانات شخصية</div>
        </div>
      </footer>
    </main>
  );
}
