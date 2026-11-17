'use client';

import { memo as __memo } from 'react';
import { useState } from 'react';

const MOMENTS: { title: string; text: string; source: string }[] = [
  {
    title: 'خُلُقه مع خادمه',
    text: 'قال أنس رضي الله عنه: «خدمتُ النبيَّ ﷺ عشر سنين، فما قال لي: أُفٍّ قطّ، ولا قال لشيء فعلتُه: لِمَ فعلتَه؟ ولا لشيء لم أفعله: ألا فعلتَ كذا؟»',
    source: 'رواه البخاري ومسلم',
  },
  {
    title: 'رفقه بالأعرابي',
    text: 'بال أعرابي في المسجد فقام الناس إليه، فقال النبي ﷺ: «دعوه، وأهريقوا على بوله ذَنوبًا من ماء، فإنما بُعثتم مُيسِّرين ولم تُبعثوا مُعسِّرين».',
    source: 'رواه البخاري',
  },
  {
    title: 'في خدمة أهله',
    text: 'سُئلت عائشة رضي الله عنها: ما كان النبي ﷺ يصنع في بيته؟ قالت: «كان يكون في مِهنة أهله، فإذا حضرت الصلاة قام إلى الصلاة».',
    source: 'رواه البخاري',
  },
  {
    title: 'رحمته بالأطفال',
    text: 'قبّل النبي ﷺ الحسن بن علي، فقال الأقرع بن حابس: إن لي عشرة من الولد ما قبّلتُ منهم أحدًا. فنظر إليه النبي ﷺ ثم قال: «مَن لا يَرحم لا يُرحم».',
    source: 'رواه البخاري ومسلم',
  },
  {
    title: 'بلال ودفّ نعليه',
    text: 'قال النبي ﷺ لبلال عند صلاة الفجر: «حدِّثني بأرجى عملٍ عملتَه في الإسلام، فإني سمعتُ دفَّ نعليك بين يديَّ في الجنة». قال: ما عملتُ عملًا أرجى عندي من أني لم أتطهّر طُهورًا في ساعة ليل أو نهار إلا صليتُ بذلك الطُّهور ما كُتب لي أن أصلّي.',
    source: 'رواه البخاري ومسلم',
  },
  {
    title: 'محبة عمر للنبي ﷺ',
    text: 'قال عمر: يا رسول الله، لأنت أحبُّ إليَّ من كل شيء إلا من نفسي. فقال النبي ﷺ: «لا، والذي نفسي بيده، حتى أكون أحبَّ إليك من نفسك». فقال عمر: فإنه الآن والله لأنت أحبُّ إليَّ من نفسي. فقال النبي ﷺ: «الآن يا عمر».',
    source: 'رواه البخاري',
  },
  {
    title: 'ضيف رسول الله وأبو طلحة',
    text: 'جاء رجل إلى النبي ﷺ فلم يجد عنده ما يُطعمه، فضمّه أبو طلحة الأنصاري إلى بيته وآثره هو وزوجته على أنفسهم وعلى صبيتهم، فقال النبي ﷺ: «ضَحِك اللهُ الليلةَ (أو عَجِب) من فِعالكما». ونزلت: ﴿وَيُؤْثِرُونَ عَلَىٰ أَنفُسِهِمْ وَلَوْ كَانَ بِهِمْ خَصَاصَةٌ﴾.',
    source: 'رواه البخاري ومسلم',
  },
  {
    title: 'عند وفاة ابنه إبراهيم',
    text: 'دمعت عينا النبي ﷺ عند وفاة ابنه إبراهيم وقال: «إنّ العين تدمع، والقلب يحزن، ولا نقول إلا ما يرضى ربّنا، وإنّا بفراقك يا إبراهيم لمحزونون».',
    source: 'رواه البخاري',
  },
];

function ProphetMoments() {
  const [i, setI] = useState(() => new Date().getDate() % MOMENTS.length);
  const m = MOMENTS[i];

  return (
    <section className="content-card moments" id="s-moments">
      <h2 className="section-title">من مواقفه ﷺ</h2>
      <h3 className="mo-title">{m.title}</h3>
      <p className="mo-text">{m.text}</p>
      <p className="mo-src">{m.source}</p>
      <div className="mo-row">
        <button type="button" onClick={() => setI((i + MOMENTS.length - 1) % MOMENTS.length)}>
          السابق
        </button>
        <span>
          {(i + 1).toLocaleString('ar-EG')} / {MOMENTS.length.toLocaleString('ar-EG')}
        </span>
        <button type="button" onClick={() => setI((i + 1) % MOMENTS.length)}>
          التالي
        </button>
      </div>
      <style>{`
        .mo-title { font-family: var(--font-kufi), sans-serif; color: #e8c25a; text-align: center; margin: 6px 0; }
        .mo-text { font-family: var(--font-ruqaa), serif; font-size: 1.25rem; line-height: 2.1; color: #fff1c4; text-align: center; margin: 6px 0; }
        .mo-src { font-family: var(--font-ruqaa), serif; text-align: center; color: #c9a24a; margin: 4px 0 12px; }
        .mo-row { display: flex; align-items: center; justify-content: center; gap: 14px; font-family: var(--font-kufi), sans-serif; color: #e8c25a; }
        .mo-row button { padding: 8px 18px; border-radius: 999px; cursor: pointer; border: 1px solid rgba(232,194,90,.5); background: rgba(232,194,90,.1); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-weight: 700; }
      `}</style>
    </section>
  );
}

const ProphetMomentsMemo = __memo(ProphetMoments);
export { ProphetMomentsMemo as ProphetMoments };
