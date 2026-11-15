'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// وصف النبي ﷺ: ما ورد في الصحيحين (البخاري ومسلم) فقط، بدون ما فيه خلاف
type Narration = { text: string; who: string; src: string };
type Trait = { id: string; title: string; items: Narration[]; note?: string };

const TRAITS: Trait[] = [
  {
    id: 'face',
    title: 'الوجه',
    items: [
      {
        text: 'كان رسول الله ﷺ أحسن الناس وجهًا، وأحسنهم خَلقًا.',
        who: 'البراء بن عازب',
        src: 'متفق عليه',
      },
      {
        text: 'سُئل: أكان وجه رسول الله ﷺ مثل السيف؟ قال: «لا، بل مثل القمر».',
        who: 'البراء بن عازب',
        src: 'رواه البخاري',
      },
      {
        text: 'كان رسول الله ﷺ إذا سُرّ استنار وجهه، حتى كأنه قطعة قمر.',
        who: 'كعب بن مالك',
        src: 'متفق عليه',
      },
    ],
  },
  {
    id: 'color',
    title: 'اللون',
    items: [
      {
        text: 'كان رسول الله ﷺ ليس بالأبيض الأمهق، ولا بالآدم.',
        who: 'أنس بن مالك',
        src: 'متفق عليه',
      },
      {
        text: 'كان رسول الله ﷺ أزهر اللون.',
        who: 'أنس بن مالك',
        src: 'رواه مسلم',
      },
    ],
    note: 'الأمهق: شديد البياض كلون الجصّ، والآدم: الأسمر. أي لونه بين ذلك، مشرق مستنير.',
  },
  {
    id: 'height',
    title: 'القامة',
    items: [
      {
        text: 'كان رسول الله ﷺ ليس بالطويل البائن، ولا بالقصير.',
        who: 'أنس بن مالك',
        src: 'متفق عليه',
      },
      {
        text: 'كان رسول الله ﷺ مربوعًا.',
        who: 'البراء بن عازب',
        src: 'متفق عليه',
      },
    ],
    note: 'المربوع: معتدل القامة، لا طويل ولا قصير.',
  },
  {
    id: 'shoulders',
    title: 'الكتفان',
    items: [
      {
        text: 'كان رسول الله ﷺ بعيد ما بين المنكبين.',
        who: 'البراء بن عازب',
        src: 'متفق عليه',
      },
    ],
    note: 'أي عريض ما بين الكتفين.',
  },
  {
    id: 'hair',
    title: 'الشعر',
    items: [
      {
        text: 'كان رسول الله ﷺ ليس بالجعد القطط، ولا بالسبط.',
        who: 'أنس بن مالك',
        src: 'متفق عليه',
      },
      {
        text: 'وكان له شعر يبلغ شحمة أذنيه.',
        who: 'البراء بن عازب',
        src: 'رواه البخاري',
      },
    ],
    note: 'الجعد القطط: شديد الجعودة، والسبط: المسترسل تمامًا. فشعره ﷺ بين ذلك.',
  },
  {
    id: 'beard',
    title: 'اللحية والشيب',
    items: [
      {
        text: 'كان رسول الله ﷺ قد شمِط مقدَّم رأسه ولحيته، وكان إذا ادّهن لم يتبيّن، وإذا شَعِثَ رأسه تبيّن، وكان كثير شعر اللحية.',
        who: 'جابر بن سَمُرة',
        src: 'رواه مسلم',
      },
    ],
    note: 'شمِط: ظهر فيه شيء قليل من البياض.',
  },
  {
    id: 'hands',
    title: 'اليدان والقدمان',
    items: [
      {
        text: 'كان النبي ﷺ ضخم اليدين والقدمين، حسن الوجه، لم أرَ بعده ولا قبله مثله.',
        who: 'أنس بن مالك',
        src: 'رواه البخاري',
      },
      {
        text: 'ما مسِسْتُ ديباجًا ولا حريرًا ألين من كفّ رسول الله ﷺ.',
        who: 'أنس بن مالك',
        src: 'رواه البخاري',
      },
    ],
  },
  {
    id: 'scent',
    title: 'الرائحة والعرق',
    items: [
      {
        text: 'ولا شممتُ مسكًا ولا عنبرًا أطيب من رائحة رسول الله ﷺ.',
        who: 'أنس بن مالك',
        src: 'متفق عليه',
      },
      {
        text: 'كان رسول الله ﷺ أزهر اللون، كأنّ عرقه اللؤلؤ، إذا مشى تكفّأ.',
        who: 'أنس بن مالك',
        src: 'رواه مسلم',
      },
    ],
  },
  {
    id: 'seal',
    title: 'خاتم النبوة',
    items: [
      {
        text: 'ورأيت الخاتم عند كتفه، مثل بيضة الحمام، يُشبه جسده.',
        who: 'جابر بن سَمُرة',
        src: 'رواه مسلم',
      },
    ],
    note: 'علامة النبوة التي كانت بين كتفيه الشريفين ﷺ.',
  },
  {
    id: 'smile',
    title: 'الابتسامة',
    items: [
      {
        text: 'ما رأيت رسول الله ﷺ مستجمعًا قطّ ضاحكًا، حتى أرى منه لَهَواته، إنما كان يتبسّم.',
        who: 'عائشة أم المؤمنين',
        src: 'متفق عليه',
      },
      {
        text: 'ما حجبني النبي ﷺ منذ أسلمتُ، ولا رآني إلا تبسّم في وجهي.',
        who: 'جرير بن عبد الله',
        src: 'متفق عليه',
      },
    ],
  },
  {
    id: 'speech',
    title: 'الكلام',
    items: [
      {
        text: 'كان النبي ﷺ يحدّث حديثًا لو عدّه العادّ لأحصاه.',
        who: 'عائشة أم المؤمنين',
        src: 'متفق عليه',
      },
    ],
    note: 'أي كان يتكلم بتأنٍّ ووضوح، حتى يمكن عدّ كلماته.',
  },
  {
    id: 'shy',
    title: 'الحياء',
    items: [
      {
        text: 'كان رسول الله ﷺ أشدّ حياءً من العذراء في خِدرها.',
        who: 'أبو سعيد الخدري',
        src: 'متفق عليه',
      },
    ],
  },
  {
    id: 'brave',
    title: 'الشجاعة',
    items: [
      {
        text: 'كان رسول الله ﷺ أحسن الناس، وأجود الناس، وأشجع الناس.',
        who: 'أنس بن مالك',
        src: 'متفق عليه',
      },
    ],
  },
  {
    id: 'generous',
    title: 'الجود',
    items: [
      {
        text: 'كان النبي ﷺ أجود الناس، وكان أجود ما يكون في رمضان.',
        who: 'عبد الله بن عباس',
        src: 'رواه البخاري',
      },
    ],
  },
  {
    id: 'manners',
    title: 'الخُلق',
    items: [
      {
        text: 'خدمتُ رسول الله ﷺ عشر سنين، فما قال لي أُفٍّ قطّ، ولا قال لشيء صنعتُه: لِمَ صنعتَه؟',
        who: 'أنس بن مالك',
        src: 'متفق عليه',
      },
      {
        text: 'كان خُلُقه القرآن.',
        who: 'عائشة أم المؤمنين',
        src: 'رواه مسلم',
      },
    ],
  },
  {
    id: 'cloth',
    title: 'اللباس',
    items: [
      {
        text: 'كان أحبّ الثياب إلى النبي ﷺ أن يلبسها الحِبَرة.',
        who: 'أنس بن مالك',
        src: 'متفق عليه',
      },
    ],
    note: 'الحِبَرة: نوع من الثياب اليمانية المخطّطة.',
  },
];

export function ProphetDescription() {
  const [open, setOpen] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const trait = open !== null ? TRAITS[open] : null;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function go(delta: number) {
    setOpen((o) => (o === null ? o : (o + delta + TRAITS.length) % TRAITS.length));
  }

  return (
    <section className="content-card pd">
      <h2 className="section-title">صفات النبي ﷺ وشمائله</h2>
      <p className="pd-intro">
        اختر صفة لتقرأ وصف الصحابة رضي الله عنهم لها. اقتصرنا على ما ورد في
        الصحيحين.
      </p>

      <div className="pd-grid">
        {TRAITS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className="pd-chip"
            onClick={() => setOpen(i)}
          >
            {t.title}
          </button>
        ))}
      </div>

      {mounted && trait && createPortal(
        <div className="pd-overlay" onClick={() => setOpen(null)}>
          <div
            className="pd-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={trait.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pd-handle" aria-hidden="true" />
            <div className="pd-head">
              <span className="pd-count">
                {(open! + 1).toLocaleString('ar-EG')} /{' '}
                {TRAITS.length.toLocaleString('ar-EG')}
              </span>
              <button
                type="button"
                className="pd-close"
                onClick={() => setOpen(null)}
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <h3 className="pd-title">{trait.title}</h3>
            <span className="pd-rule" aria-hidden="true" />

            <div className="pd-body">
              {trait.items.map((n) => (
                <figure key={n.text} className="pd-quote">
                  <blockquote>{n.text}</blockquote>
                  <figcaption>
                    عن {n.who} رضي الله عنه · {n.src}
                  </figcaption>
                </figure>
              ))}
              {trait.note && <p className="pd-note">{trait.note}</p>}
            </div>

            <p className="pd-salat">اللهم صلِّ وسلِّم وبارك عليه</p>

            <div className="pd-nav">
              <button type="button" className="pd-btn" onClick={() => go(1)}>
                التالي
              </button>
              <button type="button" className="pd-btn" onClick={() => go(-1)}>
                السابق
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .pd-intro {
          margin: -6px 0 16px;
          font-size: 17px;
          line-height: 1.9;
          color: rgba(255, 255, 255, 0.62);
        }
        .pd-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .pd-chip {
          font: inherit;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 16px;
          padding: 14px 10px;
          color: #f1d58a;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(233, 189, 90, 0.28);
          border-radius: 16px;
          cursor: pointer;
          transition: transform 0.12s ease, background 0.2s ease;
        }
        .pd-chip:active {
          transform: scale(0.97);
          background: rgba(233, 189, 90, 0.14);
        }
        .pd-overlay {
          position: fixed;
          inset: 0;
          z-index: 9000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: rgba(0, 0, 0, 0.72);
          -webkit-backdrop-filter: blur(6px);
          backdrop-filter: blur(6px);
          animation: pd-fade 0.2s ease both;
        }
        .pd-sheet {
          font-family: var(--font-ruqaa), Tahoma, Arial, sans-serif;
          width: 100%;
          max-width: 560px;
          max-height: 88vh;
          overflow-y: auto;
          padding: 10px 22px calc(22px + env(safe-area-inset-bottom, 0px));
          border: 1px solid rgba(233, 189, 90, 0.35);
          border-bottom: none;
          border-radius: 30px 30px 0 0;
          background:
            radial-gradient(ellipse at top, rgba(233, 189, 90, 0.14), transparent 60%),
            #0c0a07;
          box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.6);
          animation: pd-up 0.32s cubic-bezier(0.2, 0.9, 0.3, 1) both;
        }
        .pd-handle {
          width: 44px;
          height: 4px;
          margin: 0 auto 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.2);
        }
        .pd-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pd-count {
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }
        .pd-close {
          font: inherit;
          width: 36px;
          height: 36px;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.06);
          border: none;
          border-radius: 50%;
          cursor: pointer;
        }
        .pd-title {
          margin: 6px 0 0;
          text-align: center;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 34px;
          font-weight: 700;
          background: linear-gradient(180deg, #fff6d6, #e9bd5a 60%, #b98a2c);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .pd-rule {
          display: block;
          width: 110px;
          height: 1px;
          margin: 8px auto 16px;
          background: linear-gradient(90deg, transparent, rgba(233, 189, 90, 0.9), transparent);
        }
        .pd-body {
          display: grid;
          gap: 14px;
        }
        .pd-quote {
          margin: 0;
          padding: 16px 16px 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
        }
        .pd-quote blockquote {
          margin: 0 0 10px;
          font-size: 22px;
          line-height: 2.1;
          color: #fff1d0;
        }
        .pd-quote figcaption {
          font-family: var(--font-ruqaa), Tahoma, Arial, sans-serif;
          font-size: 17px;
          color: rgba(233, 189, 90, 0.85);
        }
        .pd-note {
          margin: 0;
          font-size: 18px;
          line-height: 1.9;
          color: rgba(255, 255, 255, 0.62);
        }
        .pd-salat {
          margin: 18px 0 14px;
          text-align: center;
          font-size: 20px;
          color: #f1d58a;
        }
        .pd-nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .pd-btn {
          font: inherit;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 16px;
          padding: 13px;
          color: #1a1305;
          font-weight: 700;
          background: linear-gradient(135deg, #ffe9b0, #d9a441);
          border: none;
          border-radius: 999px;
          cursor: pointer;
        }
        @keyframes pd-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: none; opacity: 1; }
        }
        @keyframes pd-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pd-sheet, .pd-overlay { animation: none; }
        }
      `}</style>
    </section>
  );
}

export default ProphetDescription;
