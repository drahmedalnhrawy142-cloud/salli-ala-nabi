'use client';

import { useEffect, useMemo, useState } from 'react';

type Q = {
  q: string;
  options: [string, string, string, string]; // أول خيار هو الصحيح
  note: string;
};

const QUESTIONS: Q[] = [
  {
    q: 'ما اسم والد النبي ﷺ؟',
    options: ['عبد الله', 'عبد المطلب', 'أبو طالب', 'العباس'],
    note: 'هو عبد الله بن عبد المطلب، وتوفي قبل ولادة النبي ﷺ.',
  },
  {
    q: 'ما اسم أم النبي ﷺ؟',
    options: ['آمنة بنت وهب', 'خديجة بنت خويلد', 'فاطمة بنت أسد', 'حليمة السعدية'],
    note: 'أمه آمنة بنت وهب، وتوفيت وهو صغير.',
  },
  {
    q: 'في أي مدينة وُلد النبي ﷺ؟',
    options: ['مكة المكرمة', 'المدينة المنورة', 'الطائف', 'القدس'],
    note: 'وُلد ﷺ في مكة المكرمة في عام الفيل.',
  },
  {
    q: 'من هي المرأة التي أرضعت النبي ﷺ في بادية بني سعد؟',
    options: ['حليمة السعدية', 'آمنة بنت وهب', 'أم أيمن', 'خديجة بنت خويلد'],
    note: 'أرضعته حليمة السعدية، وعاش عندها سنوات في البادية.',
  },
  {
    q: 'من الذي كفل النبي ﷺ بعد وفاة أمه؟',
    options: ['جده عبد المطلب', 'عمه العباس', 'أبو بكر', 'عمه حمزة'],
    note: 'كفله جده عبد المطلب، ثم عمه أبو طالب بعد وفاة جده.',
  },
  {
    q: 'من هو العم الذي كفل النبي ﷺ ودافع عنه في مكة؟',
    options: ['أبو طالب', 'أبو لهب', 'العباس', 'حمزة'],
    note: 'أبو طالب كفله ودافع عنه، لكنه لم يعلن إسلامه.',
  },
  {
    q: 'بأي لقب كانت قريش تلقب النبي ﷺ قبل البعثة؟',
    options: ['الصادق الأمين', 'الفاروق', 'الصديق', 'ذو النورين'],
    note: 'عُرف بالصادق الأمين لصدقه وأمانته قبل نزول الوحي.',
  },
  {
    q: 'من هي أول زوجات النبي ﷺ؟',
    options: ['خديجة بنت خويلد', 'عائشة بنت أبي بكر', 'حفصة بنت عمر', 'سودة بنت زمعة'],
    note: 'تزوج السيدة خديجة رضي الله عنها قبل البعثة، ولم يتزوج عليها حتى وفاتها.',
  },
  {
    q: 'كم كان عمر النبي ﷺ عند نزول الوحي عليه؟',
    options: ['٤٠ سنة', '٣٠ سنة', '٥٠ سنة', '٢٥ سنة'],
    note: 'نزل عليه الوحي وهو في الأربعين من عمره.',
  },
  {
    q: 'في أي مكان نزل الوحي على النبي ﷺ لأول مرة؟',
    options: ['غار حراء', 'غار ثور', 'المسجد الحرام', 'جبل أحد'],
    note: 'كان يتعبد في غار حراء حين جاءه جبريل عليه السلام.',
  },
  {
    q: 'من الملَك الذي نزل بالوحي على النبي ﷺ؟',
    options: ['جبريل عليه السلام', 'ميكائيل عليه السلام', 'إسرافيل عليه السلام', 'عزرائيل عليه السلام'],
    note: 'جبريل عليه السلام هو الأمين على الوحي.',
  },
  {
    q: 'ما أول ما نزل من القرآن الكريم؟',
    options: ['«اقرأ باسم ربك الذي خلق»', '«يا أيها المدثر»', '«قل هو الله أحد»', '«الحمد لله رب العالمين»'],
    note: 'أول ما نزل أول آيات سورة العلق.',
  },
  {
    q: 'من أول من آمن بالنبي ﷺ من النساء؟',
    options: ['خديجة بنت خويلد', 'عائشة بنت أبي بكر', 'فاطمة الزهراء', 'أم سلمة'],
    note: 'السيدة خديجة رضي الله عنها أول من آمن به.',
  },
  {
    q: 'من أول من آمن بالنبي ﷺ من الرجال الأحرار؟',
    options: ['أبو بكر الصديق', 'عمر بن الخطاب', 'عثمان بن عفان', 'خالد بن الوليد'],
    note: 'أبو بكر الصديق رضي الله عنه من أوائل من أسلم من الرجال.',
  },
  {
    q: 'من أول مؤذن في الإسلام؟',
    options: ['بلال بن رباح', 'عبد الله بن زيد', 'سلمان الفارسي', 'أبو ذر الغفاري'],
    note: 'بلال بن رباح رضي الله عنه هو مؤذن رسول الله ﷺ.',
  },
  {
    q: 'ماذا يُسمّى العام الذي توفيت فيه خديجة رضي الله عنها وأبو طالب؟',
    options: ['عام الحزن', 'عام الفيل', 'عام الجماعة', 'عام الفتح'],
    note: 'سُمّي عام الحزن لشدة ما أصاب النبي ﷺ فيه.',
  },
  {
    q: 'إلى أي مدينة ذهب النبي ﷺ يدعو أهلها بعد وفاة عمه، فردّوه وآذوه؟',
    options: ['الطائف', 'المدينة', 'الحبشة', 'تبوك'],
    note: 'ذهب إلى الطائف فردّه أهلها، ودعا بدعاء الاستضعاف المشهور.',
  },
  {
    q: 'ما اسم الرحلة التي أُسري فيها بالنبي ﷺ من المسجد الحرام إلى المسجد الأقصى؟',
    options: ['الإسراء', 'الهجرة', 'الحج', 'البيعة'],
    note: 'الإسراء إلى بيت المقدس، ثم المعراج إلى السماوات العُلا.',
  },
  {
    q: 'إلى أي مدينة هاجر النبي ﷺ؟',
    options: ['المدينة المنورة (يثرب)', 'الحبشة', 'الطائف', 'اليمن'],
    note: 'هاجر إلى المدينة، وهي التي كانت تسمى يثرب.',
  },
  {
    q: 'من رفيق النبي ﷺ في رحلة الهجرة؟',
    options: ['أبو بكر الصديق', 'عمر بن الخطاب', 'علي بن أبي طالب', 'بلال بن رباح'],
    note: 'صحبه أبو بكر الصديق، وهما في الغار قال له: «لا تحزن إن الله معنا».',
  },
  {
    q: 'في أي غار اختبأ النبي ﷺ وأبو بكر أثناء الهجرة؟',
    options: ['غار ثور', 'غار حراء', 'غار الكهف', 'غار أحد'],
    note: 'اختبآ ثلاث ليال في غار ثور.',
  },
  {
    q: 'من الصحابي الذي بات في فراش النبي ﷺ ليلة الهجرة؟',
    options: ['علي بن أبي طالب', 'أبو بكر الصديق', 'عثمان بن عفان', 'الزبير بن العوام'],
    note: 'بات علي رضي الله عنه في فراشه لتضليل قريش.',
  },
  {
    q: 'ما أول مسجد بُني في الإسلام؟',
    options: ['مسجد قباء', 'المسجد النبوي', 'المسجد الأقصى', 'مسجد الخيف'],
    note: 'بُني مسجد قباء أول وصول النبي ﷺ إلى المدينة.',
  },
  {
    q: 'ما أول غزوة كبرى انتصر فيها المسلمون؟',
    options: ['غزوة بدر', 'غزوة أحد', 'غزوة الخندق', 'غزوة تبوك'],
    note: 'كانت في رمضان من السنة الثانية للهجرة، وانتصر فيها المسلمون وهم قلة.',
  },
  {
    q: 'في أي غزوة شُجّ وجه النبي ﷺ وكُسرت رَباعيته؟',
    options: ['غزوة أحد', 'غزوة بدر', 'غزوة حنين', 'غزوة مؤتة'],
    note: 'حدث ذلك في غزوة أحد.',
  },
  {
    q: 'من الصحابي الذي أشار بحفر الخندق؟',
    options: ['سلمان الفارسي', 'أبو ذر الغفاري', 'عمار بن ياسر', 'مصعب بن عمير'],
    note: 'أشار به سلمان الفارسي رضي الله عنه في غزوة الأحزاب.',
  },
  {
    q: 'ما اسم الصلح الذي عُقد بين النبي ﷺ وقريش قبل فتح مكة؟',
    options: ['صلح الحديبية', 'بيعة العقبة', 'ميثاق المدينة', 'حلف الفضول'],
    note: 'عُقد في السنة السادسة للهجرة، وسماه القرآن «فتحًا مبينًا».',
  },
  {
    q: 'في أي سنة هجرية كان فتح مكة؟',
    options: ['السنة الثامنة', 'السنة الخامسة', 'السنة الثانية', 'السنة العاشرة'],
    note: 'فتح النبي ﷺ مكة في رمضان من السنة الثامنة للهجرة.',
  },
  {
    q: 'ما آخر غزوة غزاها النبي ﷺ بنفسه؟',
    options: ['غزوة تبوك', 'غزوة حنين', 'غزوة خيبر', 'غزوة الطائف'],
    note: 'كانت تبوك في السنة التاسعة للهجرة.',
  },
  {
    q: 'ما اسم ناقة النبي ﷺ التي هاجر عليها؟',
    options: ['القصواء', 'العضباء', 'الجدعاء', 'البراق'],
    note: 'القصواء هي ناقته المشهورة ﷺ.',
  },
  {
    q: 'من هو الصحابي الملقب بـ«أسد الله وأسد رسوله»؟',
    options: ['حمزة بن عبد المطلب', 'علي بن أبي طالب', 'خالد بن الوليد', 'الزبير بن العوام'],
    note: 'هو حمزة عم النبي ﷺ، استشهد في غزوة أحد.',
  },
  {
    q: 'من هي زوج النبي ﷺ التي كانت بنت أبي بكر الصديق؟',
    options: ['عائشة', 'حفصة', 'أم سلمة', 'زينب بنت جحش'],
    note: 'هي السيدة عائشة أم المؤمنين رضي الله عنها.',
  },
  {
    q: 'من زوج السيدة فاطمة الزهراء بنت النبي ﷺ؟',
    options: ['علي بن أبي طالب', 'عثمان بن عفان', 'أبو العاص بن الربيع', 'عمر بن الخطاب'],
    note: 'تزوجها علي بن أبي طالب رضي الله عنه.',
  },
  {
    q: 'كم سنة أقام النبي ﷺ في المدينة بعد الهجرة؟',
    options: ['١٠ سنوات', '٥ سنوات', '١٣ سنة', '٣ سنوات'],
    note: 'أقام في المدينة عشر سنوات حتى وفاته ﷺ.',
  },
  {
    q: 'في أي سنة هجرية كانت حجة الوداع؟',
    options: ['السنة العاشرة', 'السنة الثامنة', 'السنة السادسة', 'السنة الثانية'],
    note: 'حج ﷺ حجة الوداع في السنة العاشرة، وتوفي بعدها بأشهر.',
  },
  {
    q: 'كم كان عمر النبي ﷺ عند وفاته؟',
    options: ['٦٣ سنة', '٤٠ سنة', '٥٠ سنة', '٧٠ سنة'],
    note: 'توفي ﷺ وعمره ثلاث وستون سنة.',
  },
  {
    q: 'أين دُفن النبي ﷺ؟',
    options: ['في حجرة عائشة بالمدينة المنورة', 'في مكة المكرمة', 'في بقيع الغرقد', 'في بيت المقدس'],
    note: 'دُفن في حجرة السيدة عائشة، وهو اليوم في المسجد النبوي.',
  },
  {
    q: 'ماذا قالت عائشة رضي الله عنها عن خُلق النبي ﷺ؟',
    options: ['كان خلقه القرآن', 'كان خلقه الحياء فقط', 'كان خلقه الشجاعة', 'كان خلقه الصمت'],
    note: 'قالت: «كان خلقه القرآن».',
  },
];

const ROUND = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newRound(): number[] {
  return shuffle(QUESTIONS.map((_, i) => i)).slice(0, ROUND);
}

const BEST_KEY = 'prophet_quiz_best';

export function ProphetQuiz() {
  const [deck, setDeck] = useState<number[] | null>(null);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setDeck(newRound());
    try {
      setBest(Number(localStorage.getItem(BEST_KEY) || 0));
    } catch {
      /* التخزين غير متاح */
    }
  }, []);

  const current = deck && pos < deck.length ? QUESTIONS[deck[pos]] : null;

  // نخلط الخيارات لكل سؤال، ونعرف مكان الإجابة الصحيحة بعد الخلط
  const shuffled = useMemo(() => {
    if (!current) return [];
    return shuffle(current.options.map((text, i) => ({ text, correct: i === 0 })));
  }, [current]);

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (shuffled[i].correct) setScore((s) => s + 1);
  }

  function next() {
    const nextPos = pos + 1;
    if (deck && nextPos >= deck.length) {
      // نهاية الجولة: نحفظ أفضل نتيجة
      setBest((b) => {
        const nb = Math.max(b, score);
        try {
          localStorage.setItem(BEST_KEY, String(nb));
        } catch {
          /* التخزين غير متاح */
        }
        return nb;
      });
    }
    setPos(nextPos);
    setPicked(null);
  }

  function again() {
    setDeck(newRound());
    setPos(0);
    setPicked(null);
    setScore(0);
  }

  if (!deck) return null;

  const finished = pos >= deck.length;

  return (
    <section className="content-card pq">
      <h2 className="section-title">اسأل نفسك عن النبي ﷺ</h2>

      {!finished && current && (
        <>
          <div className="pq-top">
            <span className="pq-step">
              سؤال {(pos + 1).toLocaleString('ar-EG')} من{' '}
              {deck.length.toLocaleString('ar-EG')}
            </span>
            <span className="pq-score">
              ✓ {score.toLocaleString('ar-EG')}
            </span>
          </div>
          <div className="pq-bar" aria-hidden="true">
            <div
              className="pq-bar-fill"
              style={{ width: `${((pos + (picked !== null ? 1 : 0)) / deck.length) * 100}%` }}
            />
          </div>

          <p className="pq-question">{current.q}</p>

          <div className="pq-options">
            {shuffled.map((o, i) => {
              let cls = 'pq-option';
              if (picked !== null) {
                if (o.correct) cls += ' pq-right';
                else if (i === picked) cls += ' pq-wrong';
                else cls += ' pq-dim';
              }
              return (
                <button
                  key={o.text}
                  type="button"
                  className={cls}
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                >
                  {o.text}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="pq-after">
              <p className="pq-result">
                {shuffled[picked].correct ? 'أحسنت! إجابة صحيحة' : 'إجابة غير صحيحة'}
              </p>
              <p className="pq-note">{current.note}</p>
              <button type="button" className="pq-next" onClick={next}>
                {pos + 1 >= deck.length ? 'شوف نتيجتك' : 'السؤال التالي'}
              </button>
            </div>
          )}
        </>
      )}

      {finished && (
        <div className="pq-final">
          <p className="pq-final-score">
            {score.toLocaleString('ar-EG')} / {deck.length.toLocaleString('ar-EG')}
          </p>
          <p className="pq-note">
            {score === deck.length
              ? 'ما شاء الله! أجبت على كل الأسئلة صح. اللهم صلِّ وسلِّم على نبينا محمد ﷺ'
              : score >= deck.length * 0.7
                ? 'ممتاز! معلوماتك عن السيرة قوية. كمّل وزوّد معرفتك بحبيبك ﷺ'
                : 'بداية طيبة. كل ما تقرأ عن سيرته ﷺ هتحبه أكتر، جرّب جولة جديدة'}
          </p>
          <p className="pq-best">
            أفضل نتيجة: {best.toLocaleString('ar-EG')} / {deck.length.toLocaleString('ar-EG')}
          </p>
          <button type="button" className="pq-next" onClick={again}>
            جولة جديدة
          </button>
        </div>
      )}

      <style>{`
        .pq-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.62);
        }
        .pq-score {
          color: #f1d58a;
          font-weight: 700;
        }
        .pq-bar {
          height: 6px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.08);
        }
        .pq-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #b98a2c, #ffe9b0);
          transition: width 0.4s ease;
        }
        .pq-question {
          margin: 20px 0 16px;
          font-size: 23px;
          line-height: 1.9;
          color: #fff1d0;
          text-align: right;
        }
        .pq-options {
          display: grid;
          gap: 10px;
        }
        .pq-option {
          font: inherit;
          font-family: var(--font-ruqaa), Tahoma, Arial, sans-serif;
          font-size: 20px;
          text-align: right;
          padding: 14px 16px;
          color: rgba(255, 255, 255, 0.92);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          cursor: pointer;
          transition: transform 0.12s ease, background 0.2s ease;
        }
        .pq-option:active:not(:disabled) {
          transform: scale(0.98);
        }
        .pq-right {
          color: #0b1a0f;
          font-weight: 700;
          background: linear-gradient(135deg, #b8f0c4, #5fcf80);
          border-color: transparent;
        }
        .pq-wrong {
          color: #fff;
          background: rgba(214, 69, 69, 0.55);
          border-color: rgba(255, 140, 140, 0.6);
        }
        .pq-dim {
          opacity: 0.45;
        }
        .pq-after,
        .pq-final {
          margin-top: 16px;
          text-align: center;
        }
        .pq-result {
          margin: 0 0 6px;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 18px;
          color: #f1d58a;
        }
        .pq-note {
          margin: 0 0 14px;
          font-size: 19px;
          line-height: 2;
          color: rgba(255, 255, 255, 0.85);
        }
        .pq-next {
          font: inherit;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 16px;
          padding: 12px 28px;
          color: #1a1305;
          font-weight: 700;
          background: linear-gradient(135deg, #ffe9b0, #d9a441);
          border: none;
          border-radius: 999px;
          cursor: pointer;
        }
        .pq-final-score {
          margin: 6px 0 10px;
          font-family: var(--font-kufi), Tahoma, Arial, sans-serif;
          font-size: 44px;
          font-weight: 700;
          background: linear-gradient(180deg, #fff1c9, #d9a441);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .pq-best {
          margin: 0 0 16px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 15px;
        }
      `}</style>
    </section>
  );
}

export default ProphetQuiz;
