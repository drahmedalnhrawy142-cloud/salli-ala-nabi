'use client';

import { memo as __memo } from 'react';
import { useState } from 'react';

// خط زمني لسيرة النبي ﷺ: أحداث متفق عليها فقط
type Ev = { when: string; title: string; text: string };
type Era = { id: string; label: string; range: string; events: Ev[] };

const ERAS: Era[] = [
  {
    id: 'before',
    label: 'قبل البعثة',
    range: 'من المولد إلى ٤٠ سنة',
    events: [
      {
        when: 'عام الفيل',
        title: 'المولد',
        text: 'وُلد ﷺ في مكة المكرمة يوم الاثنين من شهر ربيع الأول، في العام الذي حاول فيه أبرهة هدم الكعبة.',
      },
      {
        when: '٦ سنوات',
        title: 'وفاة أمه',
        text: 'توفيت أمه آمنة بنت وهب بالأبواء، فكفله جده عبد المطلب.',
      },
      {
        when: '٨ سنوات',
        title: 'وفاة جده',
        text: 'توفي جده عبد المطلب، فكفله عمه أبو طالب.',
      },
      {
        when: '٢٥ سنة',
        title: 'الزواج من خديجة',
        text: 'تزوج السيدة خديجة بنت خويلد رضي الله عنها، وكانت أول من آمن به.',
      },
      {
        when: '٣٥ سنة',
        title: 'الحجر الأسود',
        text: 'حكّمته قريش عند بناء الكعبة، فوضع الحجر الأسود في ثوب وحمله زعماء القبائل معًا.',
      },
    ],
  },
  {
    id: 'mecca',
    label: 'العهد المكي',
    range: 'من البعثة إلى الهجرة',
    events: [
      {
        when: '٤٠ سنة',
        title: 'البعثة',
        text: 'نزل عليه الوحي في غار حراء في شهر رمضان بقوله تعالى: «اقرأ باسم ربك الذي خلق».',
      },
      {
        when: 'بعد ٣ سنوات',
        title: 'الجهر بالدعوة',
        text: 'أُمر بالجهر بالدعوة، فصعد جبل الصفا ونادى قريشًا.',
      },
      {
        when: 'السنة ٥ من البعثة',
        title: 'الهجرة إلى الحبشة',
        text: 'أمر المستضعفين من أصحابه بالهجرة إلى الحبشة، وكان ملكها النجاشي لا يُظلم عنده أحد.',
      },
      {
        when: 'نحو ٣ سنوات',
        title: 'مقاطعة شعب أبي طالب',
        text: 'قاطعت قريش بني هاشم وبني المطلب، فصبروا في الشعب حتى انتهت المقاطعة.',
      },
      {
        when: 'السنة ١٠ من البعثة',
        title: 'عام الحزن',
        text: 'توفي عمه أبو طالب وزوجته خديجة رضي الله عنها، فاشتد الأذى عليه.',
      },
      {
        when: 'السنة ١٠ من البعثة',
        title: 'الطائف',
        text: 'ذهب إلى الطائف يدعو أهلها ومعه زيد بن حارثة، فردّوه وآذوه.',
      },
      {
        when: 'قبل الهجرة',
        title: 'الإسراء والمعراج',
        text: 'أُسري به من المسجد الحرام إلى المسجد الأقصى، ثم عُرج به إلى السماوات، وفُرضت الصلوات الخمس.',
      },
      {
        when: 'السنة ١٣ من البعثة',
        title: 'بيعة العقبة الثانية',
        text: 'بايعه وفد من الأنصار بمنى في موسم الحج على نصرته وحمايته.',
      },
    ],
  },
  {
    id: 'medina',
    label: 'العهد المدني',
    range: 'من الهجرة إلى الوفاة',
    events: [
      {
        when: '١ هـ',
        title: 'الهجرة إلى المدينة',
        text: 'هاجر مع أبي بكر الصديق، ومكثا ثلاث ليال في غار ثور، ثم وصلا إلى المدينة المنورة.',
      },
      {
        when: '١ هـ',
        title: 'المسجد والمؤاخاة',
        text: 'بنى المسجد النبوي، وآخى بين المهاجرين والأنصار.',
      },
      {
        when: '٢ هـ',
        title: 'تحويل القبلة وفرض الصيام',
        text: 'حُوّلت القبلة من بيت المقدس إلى الكعبة، وفُرض صيام رمضان.',
      },
      {
        when: '٢ هـ',
        title: 'غزوة بدر',
        text: 'في السابع عشر من رمضان انتصر المسلمون، وهم نحو ثلاثمئة وثلاثة عشر رجلًا، على المشركين.',
      },
      {
        when: '٣ هـ',
        title: 'غزوة أحد',
        text: 'في شوال، واستُشهد فيها حمزة ومصعب بن عمير رضي الله عنهما.',
      },
      {
        when: '٥ هـ',
        title: 'غزوة الخندق',
        text: 'حفر المسلمون الخندق بإشارة سلمان الفارسي، وردّ الله الأحزاب.',
      },
      {
        when: '٦ هـ',
        title: 'صلح الحديبية',
        text: 'بايع الصحابة بيعة الرضوان، وعُقد صلح مع قريش سمّاه القرآن «فتحًا مبينًا».',
      },
      {
        when: '٧ هـ',
        title: 'غزوة خيبر',
        text: 'فُتحت حصون خيبر، وأخذ الراية يومها علي بن أبي طالب رضي الله عنه.',
      },
      {
        when: '٨ هـ',
        title: 'فتح مكة',
        text: 'دخل مكة في رمضان في عشرة آلاف، وعفا عن أهلها وقال: «اذهبوا فأنتم الطلقاء».',
      },
      {
        when: '٩ هـ',
        title: 'غزوة تبوك',
        text: 'جيش العسرة، وهي آخر غزوة غزاها النبي ﷺ بنفسه.',
      },
      {
        when: '١٠ هـ',
        title: 'حجة الوداع',
        text: 'خطب بعرفة، ونزل قوله تعالى: «اليوم أكملت لكم دينكم».',
      },
      {
        when: '١١ هـ',
        title: 'وفاته ﷺ',
        text: 'توفي يوم الاثنين في شهر ربيع الأول، في بيت عائشة رضي الله عنها، وعمره ثلاث وستون سنة.',
      },
    ],
  },
];

function ProphetTimeline() {
  const [eraId, setEraId] = useState('before');
  const era = ERAS.find((e) => e.id === eraId) ?? ERAS[0];

  return (
    <section className="content-card tl">
      <h2 className="section-title">سيرة النبي ﷺ</h2>

      <div className="tl-tabs" role="tablist">
        {ERAS.map((e) => (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={e.id === eraId}
            className={`tl-tab${e.id === eraId ? ' tl-tab-on' : ''}`}
            onClick={() => setEraId(e.id)}
          >
            {e.label}
          </button>
        ))}
      </div>
      <p className="tl-range">{era.range}</p>

      <ol className="tl-list" key={era.id}>
        {era.events.map((ev, i) => (
          <li key={ev.title} className="tl-item" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="tl-dot" aria-hidden="true" />
            <div className="tl-card">
              <span className="tl-when">{ev.when}</span>
              <h3 className="tl-title">{ev.title}</h3>
              <p className="tl-text">{ev.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <style>{`
        .tl-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          padding: 5px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .tl-tab {
          font: inherit;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 14px;
          padding: 10px 4px;
          color: rgba(255, 255, 255, 0.7);
          background: transparent;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .tl-tab-on {
          color: #1a1305;
          font-weight: 700;
          background: linear-gradient(135deg, #ffe9b0, #d9a441);
        }
        .tl-range {
          margin: 12px 0 14px;
          text-align: center;
          font-size: 17px;
          color: rgba(255, 255, 255, 0.55);
        }
        .tl-list {
          list-style: none;
          margin: 0;
          padding: 0 4px 0 0;
          position: relative;
        }
        .tl-list::before {
          content: '';
          position: absolute;
          top: 8px;
          bottom: 8px;
          right: 11px;
          width: 2px;
          background: linear-gradient(180deg, rgba(233, 189, 90, 0.9), rgba(233, 189, 90, 0.12));
        }
        .tl-item {
          position: relative;
          display: flex;
          gap: 14px;
          padding: 7px 0;
          animation: tl-in 0.45s ease both;
        }
        .tl-dot {
          flex: none;
          width: 14px;
          height: 14px;
          margin: 18px 5px 0 0;
          border-radius: 50%;
          background: #e9bd5a;
          box-shadow: 0 0 12px rgba(233, 189, 90, 0.6);
          z-index: 1;
        }
        .tl-card {
          flex: 1;
          min-width: 0;
          padding: 14px 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
        }
        .tl-when {
          display: inline-block;
          padding: 2px 12px;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 13px;
          color: #1a1305;
          font-weight: 700;
          background: linear-gradient(135deg, #ffe9b0, #d9a441);
          border-radius: 999px;
        }
        .tl-title {
          margin: 8px 0 2px;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 19px;
          color: #f1d58a;
        }
        .tl-text {
          margin: 0;
          font-size: 19px;
          line-height: 2;
          color: rgba(255, 255, 255, 0.88);
        }
        @keyframes tl-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tl-item { animation: none; }
        }
      `}</style>
    </section>
  );
}

export default ProphetTimeline;

const ProphetTimelineMemo = __memo(ProphetTimeline);
export { ProphetTimelineMemo as ProphetTimeline };
