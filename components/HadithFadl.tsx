'use client';

import { useState } from 'react';

type H = { text: string; note: string; source: string };

// أحاديث في فضل الصلاة على النبي ﷺ (صحيحة أو حسنة مع بيان مصدرها)
const LIST: H[] = [
  {
    text: 'مَن صلّى عليَّ صلاةً صلّى الله عليه بها عشرًا',
    note: 'كل صلاة واحدة عليه ﷺ يصلّي الله بها عليك عشر مرات، أي يرحمك ويرفع ذكرك.',
    source: 'رواه مسلم',
  },
  {
    text: 'إذا سمعتم المؤذّن فقولوا مثل ما يقول، ثم صلّوا عليَّ، فإنه مَن صلّى عليَّ صلاةً صلّى الله عليه بها عشرًا',
    note: 'من المواضع المستحبة للصلاة عليه ﷺ: بعد إجابة المؤذن.',
    source: 'رواه مسلم',
  },
  {
    text: 'البخيلُ مَن ذُكرتُ عنده فلم يصلِّ عليَّ',
    note: 'مَن سمع اسمه ﷺ فنسي الصلاة عليه فقد فاته خير عظيم.',
    source: 'رواه الترمذي وصححه الألباني',
  },
  {
    text: 'أكثِروا الصلاةَ عليَّ يوم الجمعة، فإنّ صلاتكم معروضةٌ عليَّ',
    note: 'يُستحب الإكثار من الصلاة عليه ﷺ يوم الجمعة.',
    source: 'رواه أبو داود وصححه الألباني',
  },
  {
    text: 'صلّوا عليَّ فإنّ صلاتكم تبلغني حيثما كنتم',
    note: 'صلاتك تبلغه ﷺ أينما كنت، قريبًا أو بعيدًا.',
    source: 'رواه أبو داود وصححه الألباني',
  },
  {
    text: 'إنّ لله ملائكةً سيّاحين في الأرض، يبلّغوني من أمّتي السلام',
    note: 'يبلّغه الملائكة سلام أمته عليه ﷺ.',
    source: 'رواه النسائي وأحمد وصححه الألباني',
  },
  {
    text: 'قلنا: يا رسول الله، كيف نصلّي عليك؟ فقال: قولوا: اللهم صلِّ على محمد وعلى آل محمد، كما صلّيت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد، اللهم بارك على محمد وعلى آل محمد، كما باركت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد',
    note: 'هذه أشهر صيغة علّمها النبي ﷺ لأصحابه، وهي التي تُقال في التشهد.',
    source: 'رواه البخاري ومسلم',
  },
  {
    text: 'قال أُبيّ: يا رسول الله، إني أُكثر الصلاة عليك، فكم أجعل لك من صلاتي؟ ... قال: أجعل لك صلاتي كلها. قال: إذًا تُكفى همَّك ويُغفر لك ذنبك',
    note: 'مَن جعل دعاءه كله صلاةً على النبي ﷺ كفاه الله همّه وغفر ذنبه.',
    source: 'رواه الترمذي وحسّنه الألباني',
  },
];

function dayIndex() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function HadithFadl() {
  const [i, setI] = useState(() => dayIndex() % LIST.length);
  const h = LIST[i];

  return (
    <section className="content-card hfadl">
      <h2 className="section-title">فضل الصلاة على النبي ﷺ</h2>
      <p className="hf-text">«{h.text}»</p>
      <p className="hf-note">{h.note}</p>
      <p className="hf-source">{h.source}</p>
      <button
        type="button"
        className="hf-next"
        onClick={() => setI((v) => (v + 1) % LIST.length)}
      >
        حديث آخر
      </button>
      <p className="hf-count">
        {(i + 1).toLocaleString('ar-EG')} من {LIST.length.toLocaleString('ar-EG')}
      </p>

      <style>{`
        .hf-text { font-family: var(--font-ruqaa), serif; font-size: 1.35rem; line-height: 2.1; text-align: center; color: #fff1c4; margin: 6px 0; }
        .hf-note { font-family: var(--font-ruqaa), serif; text-align: center; line-height: 1.9; opacity: .9; margin: 6px 0; }
        .hf-source { font-family: var(--font-ruqaa), serif; text-align: center; color: #c9a24a; margin: 4px 0 12px; }
        .hf-next { display: block; margin: 0 auto; padding: 10px 28px; border-radius: 999px; cursor: pointer; border: 1px solid rgba(232,194,90,.6); background: rgba(232,194,90,.12); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-weight: 700; }
        .hf-count { text-align: center; font-family: var(--font-kufi), sans-serif; opacity: .6; margin: 8px 0 0; font-size: .85rem; }
      `}</style>
    </section>
  );
}
