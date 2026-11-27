'use client';

import { useEffect, useRef, useState } from 'react';
import { Figure } from './Figure';
import { Evidence, type Ev } from './Evidence';

/**
 * «كيف كان النبي ﷺ يصلي؟» خطوةً خطوة.
 * الرسوم لمصلٍّ مجهول الملامح يوضّح الهيئة فقط. وكل خطوة دليلها اقتباس من نص الحديث في التطبيق.
 * العبارات الشارحة قصيرة جدًا ومأخوذة من لفظ الأحاديث المقتبسة تحتها.
 */
type Step = { pose: string; t: string; d: string; say?: string; ev: Ev[] };

const B = (file: number, num: string, phrase: string, len?: number): Ev => ({ coll: 'bukhari', file, num, phrase, len });
const M = (file: number, num: string, phrase: string, len?: number): Ev => ({ coll: 'muslim', file, num, phrase, len });

export const STEPS: Step[] = [
  { pose: 'stand', t: 'الاستعداد والقبلة', d: 'أسبغ الوضوء، واستقبل القبلة، ثم قم إلى الصلاة.', ev: [B(79, '6016', 'إذا قمت إلى الصلاة فأسبغ الوضوء ثم استقبل القبلة فكبر', 120)] },
  { pose: 'takbir', t: 'تكبيرة الإحرام', d: 'تقول «الله أكبر» وترفع يديك حذاء منكبيك.', say: 'الله أكبر', ev: [B(10, '810', 'إذا كبر جعل يديه حذاء منكبيه', 80)] },
  { pose: 'chest', t: 'القراءة', d: 'اقرأ الفاتحة وما تيسّر من القرآن.', ev: [B(10, '738', 'لا صلاة لمن لم يقرأ بفاتحة الكتاب', 40), B(79, '6016', 'ثم اقرأ بما تيسر معك من القرآن', 40)] },
  { pose: 'ruku', t: 'الركوع', d: 'تمكّن يديك من ركبتيك، وتسوّي ظهرك، وتطمئن راكعًا.', say: 'سبحان ربي العظيم', ev: [B(10, '810', 'وإذا ركع أمكن يديه من ركبتيه', 60), M(6, '1706', 'فجعل يقول سبحان ربي العظيم', 40)] },
  { pose: 'rise', t: 'الرفع والاعتدال', d: 'ترفع رأسك حتى تستوي قائمًا ويعود كل عظم مكانه.', say: 'سمع الله لمن حمده · ربنا لك الحمد', ev: [B(10, '810', 'فإذا رفع رأسه استوى حتى يعود كل فقار مكانه', 40), M(6, '1706', 'ثم قال سمع الله لمن حمده', 90)] },
  { pose: 'sujud', t: 'السجود', d: 'تسجد على سبعة أعضاء: الجبهة مع الأنف، والكفين، والركبتين، وأطراف القدمين.', say: 'سبحان ربي الأعلى', ev: [B(10, '795', 'أمرت أن أسجد على سبعة أعظم', 140), B(10, '810', 'فإذا سجد وضع يديه غير مفترش ولا قابضهما', 120), M(6, '1706', 'ثم سجد فقال سبحان ربي الأعلى', 30)] },
  { pose: 'jalsa', t: 'الجلوس بين السجدتين', d: 'تجلس مطمئنًّا على رجلك اليسرى وتنصب اليمنى.', ev: [B(79, '6016', 'ثم ارفع حتى تطمئن جالسا', 30), B(10, '810', 'فإذا جلس في الركعتين جلس على رجله اليسرى ونصب اليمنى', 40)] },
  { pose: 'sujud', t: 'السجدة الثانية', d: 'تسجد مرة ثانية، ثم تفعل ذلك في صلاتك كلها.', say: 'سبحان ربي الأعلى', ev: [B(79, '6016', 'ثم اسجد حتى تطمئن ساجدا ثم ارفع حتى تطمئن جالسا ثم افعل ذلك في صلاتك كلها', 20)] },
  { pose: 'tashahhud', t: 'التشهد', d: 'تجلس للتشهد في الركعتين وفي الأخيرة، وتقرأ التحيات.', say: 'التحيات لله والصلوات والطيبات', ev: [B(79, '6030', 'التحيات لله والصلوات والطيبات', 160), B(10, '810', 'وإذا جلس في الركعة الآخرة قدم رجله اليسرى ونصب الأخرى وقعد على مقعدته', 20)] },
  { pose: 'taslim', t: 'التسليم', d: 'تسلّم عن يمينك وعن يسارك فتنتهي الصلاة.', say: 'السلام عليكم ورحمة الله', ev: [M(5, '1215', 'يسلم عن يمينه وعن يساره', 60)] },
];

const FLOW: { pose: string; cap: string }[] = [
  { pose: 'stand', cap: 'قيام واستقبال القبلة' },
  { pose: 'takbir', cap: 'الله أكبر' },
  { pose: 'chest', cap: 'قراءة الفاتحة' },
  { pose: 'ruku', cap: 'ركوع: سبحان ربي العظيم' },
  { pose: 'rise', cap: 'سمع الله لمن حمده' },
  { pose: 'sujud', cap: 'سجود: سبحان ربي الأعلى' },
  { pose: 'jalsa', cap: 'جلوس بين السجدتين' },
  { pose: 'sujud', cap: 'سجدة ثانية' },
  { pose: 'stand', cap: 'قيام للركعة التالية' },
];

export function PrayGuide() {
  const [playing, setPlaying] = useState(false);
  const [fi, setFi] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => setFi((i) => (i + 1) % FLOW.length), 1700);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing]);

  return (
    <div className="pg">
      <section className="pg-hero">
        <h2>كيف نصلّي كما كان النبي ﷺ يصلّي؟</h2>
        <Evidence ev={B(10, '616', 'وصلوا كما رأيتموني أصلي', 40)} />
        <div className="pg-stage">
          <Figure pose={FLOW[fi].pose} ms={900} label={FLOW[fi].cap} />
        </div>
        <div className="pg-cap">{FLOW[fi].cap}</div>
        <button type="button" className="pg-play" onClick={() => setPlaying((p) => !p)}>
          {playing ? '⏸ إيقاف' : '▶ شاهد ركعة كاملة'}
        </button>
        <p className="pg-note">الرسم لمصلٍّ مجهول يوضّح الهيئة فقط.</p>
      </section>

      <ol className="pg-steps">
        {STEPS.map((s, i) => (
          <li key={i} className={open === i ? 'pg-step on' : 'pg-step'}>
            <button type="button" className="pg-head" onClick={() => setOpen(open === i ? null : i)}>
              <span className="pg-n">{(i + 1).toLocaleString('ar-EG')}</span>
              <span className="pg-t">{s.t}</span>
              <span className="pg-chev">{open === i ? '▴' : '▾'}</span>
            </button>
            {open === i && (
              <div className="pg-body">
                <Figure pose={s.pose} ms={600} label={s.t} />
                <p className="pg-d">{s.d}</p>
                {s.say && <div className="pg-say">{s.say}</div>}
                {s.ev.map((e, k) => <Evidence key={k} ev={e} />)}
              </div>
            )}
          </li>
        ))}
      </ol>

      <section className="pg-rak">
        <h3>كم ركعة في كل صلاة؟</h3>
        <div className="pg-bars">
          {[['الفجر', 2], ['الظهر', 4], ['العصر', 4], ['المغرب', 3], ['العشاء', 4]].map(([n, r]) => (
            <div key={n as string} className="pg-bar">
              <div className="pg-fill" style={{ height: (r as number) * 18 }}>{(r as number).toLocaleString('ar-EG')}</div>
              <span>{n}</span>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .pg { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 14px; }
        .pg-hero { text-align: center; padding: 12px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); }
        .pg-hero h2 { margin: 0 0 8px; font-size: 1.15rem; color: #f1d77a; font-family: var(--font-ruqaa), serif; }
        .pg-stage { max-width: 330px; margin: 10px auto 4px; }
        .pg-cap { min-height: 28px; font-size: 1.05rem; color: #7fe0c0; }
        .pg-play { margin-top: 6px; padding: 10px 22px; border-radius: 14px; border: 1px solid #e8c25a; background: rgba(232,194,90,.22); color: #f1d77a; font-family: inherit; font-size: 15px; }
        .pg-note { margin: 8px 0 0; font-size: .75rem; opacity: .6; }
        .pg-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .pg-step { border-radius: 16px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.78); overflow: hidden; }
        .pg-step.on { border-color: rgba(232,194,90,.6); }
        .pg-head { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px; background: none; border: 0; color: #fff1c4; font-family: inherit; font-size: 1rem; text-align: start; }
        .pg-n { width: 30px; height: 30px; border-radius: 50%; background: #e8c25a; color: #1a1408; display: grid; place-items: center; font-weight: 700; flex: none; }
        .pg-t { flex: 1; } .pg-chev { color: #e8c25a; }
        .pg-body { padding: 0 12px 14px; }
        .pg-d { font-size: 1rem; line-height: 1.9; margin: 8px 0 4px; }
        .pg-say { display: inline-block; padding: 4px 12px; border-radius: 999px; background: rgba(127,224,192,.14); border: 1px solid #7fe0c0; color: #bff3e1; font-family: var(--font-ruqaa), serif; font-size: 1.05rem; }
        .pg-rak { padding: 12px; border-radius: 18px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.78); }
        .pg-rak h3 { margin: 0 0 10px; font-size: 1rem; color: #f1d77a; }
        .pg-bars { display: flex; justify-content: space-around; align-items: flex-end; height: 110px; }
        .pg-bar { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: .8rem; }
        .pg-fill { width: 34px; border-radius: 8px 8px 0 0; background: linear-gradient(#ffd24a, #b8860b); color: #1a1408; display: grid; place-items: center; font-weight: 700; }
      `}</style>
    </div>
  );
}
