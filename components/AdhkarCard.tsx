'use client';

import { gardenAdd } from '@/components/garden/store';
import { memo as __memo } from 'react';
import { useEffect, useState } from 'react';
import { V } from '@/components/quran/verses';
import { QuranText } from '@/components/quran/QuranText';

type Item = { id: string; text: string; count: number; source: string; quran?: boolean };

const KURSI = V.KURSI;

const SURAS = [V.IKHLAS, V.FALAQ, V.NAS].join('\n');

const SAYYID =
  'اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك عليّ، وأبوء بذنبي فاغفر لي، فإنه لا يغفر الذنوب إلا أنت';

const COMMON: Item[] = [
  { id: 'kursi', text: KURSI, quran: true, count: 1, source: 'آية الكرسي — رواه الحاكم والنسائي في الكبرى وصححه الألباني' },
  { id: 'suras', text: SURAS, quran: true, count: 3, source: 'الإخلاص والفلق والناس — رواه أبو داود والترمذي وحسّنه الألباني' },
  { id: 'sayyid', text: SAYYID, count: 1, source: 'سيد الاستغفار — رواه البخاري' },
  { id: 'bismillah', text: 'بسم الله الذي لا يضرّ مع اسمه شيءٌ في الأرض ولا في السماء وهو السميع العليم', count: 3, source: 'رواه أبو داود والترمذي وصححه الألباني' },
  { id: 'radeet', text: 'رضيتُ بالله ربًّا، وبالإسلام دينًا، وبمحمدٍ ﷺ نبيًّا', count: 3, source: 'رواه أبو داود وأحمد وحسّنه الألباني' },
  { id: 'subhan', text: 'سبحان الله وبحمده', count: 100, source: 'رواه مسلم' },
  { id: 'salat', text: 'اللهم صلِّ وسلِّم وبارك على سيدنا محمد', count: 10, source: 'الصلاة على النبي ﷺ مستحبة في كل وقت' },
];

const MORNING: Item[] = [
  { id: 'bika', text: 'اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور', count: 1, source: 'رواه أبو داود والترمذي وحسّنه الألباني' },
  ...COMMON,
];
const EVENING: Item[] = [
  { id: 'bika', text: 'اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير', count: 1, source: 'رواه أبو داود والترمذي وحسّنه الألباني' },
  ...COMMON,
];

const BAQARA_END = V.BAQARA_END;

const AFTER_PRAYER: Item[] = [
  { id: 'istighfar', text: 'أستغفر الله', count: 3, source: 'ثلاثًا بعد السلام — رواه مسلم' },
  { id: 'salam', text: 'اللهم أنت السلام ومنك السلام، تباركت يا ذا الجلال والإكرام', count: 1, source: 'رواه مسلم' },
  { id: 'la', text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، اللهم لا مانع لما أعطيت، ولا معطي لما منعت، ولا ينفع ذا الجَدِّ منك الجَدُّ', count: 1, source: 'رواه البخاري ومسلم' },
  { id: 'sub33', text: 'سبحان الله', count: 33, source: 'رواه مسلم' },
  { id: 'ham33', text: 'الحمد لله', count: 33, source: 'رواه مسلم' },
  { id: 'akb33', text: 'الله أكبر', count: 33, source: 'رواه مسلم' },
  { id: 'tamam', text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', count: 1, source: 'تمام المائة — رواه مسلم' },
  { id: 'kursi', text: KURSI, quran: true, count: 1, source: 'آية الكرسي دبر كل صلاة — رواه النسائي في الكبرى وصححه الألباني' },
  { id: 'suras', text: SURAS, quran: true, count: 1, source: 'المعوذات دبر كل صلاة — رواه أبو داود والترمذي وصححه الألباني' },
];

const SLEEP: Item[] = [
  { id: 'kursi', text: KURSI, quran: true, count: 1, source: 'آية الكرسي عند النوم — رواه البخاري' },
  { id: 'baqara', text: BAQARA_END, quran: true, count: 1, source: 'آخر آيتين من سورة البقرة — رواه البخاري ومسلم' },
  { id: 'suras', text: SURAS, quran: true, count: 3, source: 'يقرؤها وينفث في كفيه ويمسح بهما جسده، ثلاث مرات — رواه البخاري' },
  { id: 'bismika', text: 'باسمك ربي وضعتُ جنبي وبك أرفعه، فإن أمسكتَ نفسي فارحمها، وإن أرسلتَها فاحفظها بما تحفظ به عبادك الصالحين', count: 1, source: 'رواه البخاري ومسلم' },
  { id: 'amut', text: 'باسمك اللهم أموت وأحيا', count: 1, source: 'رواه البخاري' },
  { id: 'sub33', text: 'سبحان الله', count: 33, source: 'التسبيح عند النوم — رواه البخاري ومسلم' },
  { id: 'ham33', text: 'الحمد لله', count: 33, source: 'رواه البخاري ومسلم' },
  { id: 'akb34', text: 'الله أكبر', count: 34, source: 'رواه البخاري ومسلم' },
];

type Period = 'm' | 'e' | 'p' | 's';

function dayStr() {
  return new Date().toLocaleDateString('en-CA');
}
function nowPeriod(): Period {
  return new Date().getHours() < 14 ? 'm' : 'e';
}

function AdhkarCard() {
  const [period, setPeriod] = useState<Period>('m');
  const [done, setDone] = useState<Record<string, number>>({});
  const items =
    period === 'm' ? MORNING : period === 'e' ? EVENING : period === 'p' ? AFTER_PRAYER : SLEEP;
  const key = `adhkar_${dayStr()}_${period}`;

  useEffect(() => {
    setPeriod(nowPeriod());
    const onPeriod = (e: Event) => {
      const v = (e as CustomEvent<string>).detail;
      if (v === 'm' || v === 'e') setPeriod(v);
    };
    window.addEventListener('adhkar-period', onPeriod);
    return () => window.removeEventListener('adhkar-period', onPeriod);
  }, []);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(key) || '{}') || {});
    } catch {
      setDone({});
    }
  }, [key]);

  function tap(it: Item) {
    const cur = done[it.id] || 0;
    if (cur >= it.count) return;
    gardenAdd(1);
    const next = { ...done, [it.id]: cur + 1 };
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      if (cur + 1 === it.count && navigator.vibrate) navigator.vibrate(30);
    } catch {}
  }

  const finished = items.filter((it) => (done[it.id] || 0) >= it.count).length;
  const n = (v: number) => v.toLocaleString('ar-EG');

  return (
    <section className="content-card adhkar">
      <h2 className="section-title">أذكار اليوم</h2>

      <div className="ad-tabs">
        {(
          [
            ['m', 'الصباح'],
            ['e', 'المساء'],
            ['p', 'بعد الصلاة'],
            ['s', 'النوم'],
          ] as [Period, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={period === id ? 'ad-tab ad-on' : 'ad-tab'}
            onClick={() => setPeriod(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="ad-progress">
        أتممت {n(finished)} من {n(items.length)}
      </p>

      {items.map((it) => {
        const c = done[it.id] || 0;
        const ok = c >= it.count;
        return (
          <button
            type="button"
            key={it.id}
            className={ok ? 'ad-item ad-done' : 'ad-item'}
            onClick={() => tap(it)}
          >
            <span className="ad-text">{it.quran ? <QuranText text={it.text} /> : it.text}</span>
            <span className="ad-source">{it.source}</span>
            <span className="ad-count">
              {ok ? '✓ تم' : `${n(c)} / ${n(it.count)}`}
            </span>
          </button>
        );
      })}
      <p className="ad-note">اضغط على الذكر في كل مرة تقوله.</p>

      <style>{`
        .ad-tabs { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 10px; }
        .ad-tab { font-family: var(--font-kufi), sans-serif; font-weight: 700; padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; cursor: pointer; }
        .ad-on { background: rgba(232,194,90,.2); color: #f6e49c; }
        .ad-progress { font-family: var(--font-kufi), sans-serif; color: #e8c25a; margin: 6px 0 12px; }
        .ad-item { display: block; width: 100%; text-align: center; margin-bottom: 10px; padding: 16px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.3); background: rgba(232,194,90,.05); color: #fff1c4; cursor: pointer; }
        .ad-item:active { transform: scale(.99); }
        .ad-done { opacity: .5; border-color: rgba(232,194,90,.7); }
        .ad-text { display: block; white-space: pre-line; font-family: var(--font-ruqaa), serif; font-size: 1.2rem; line-height: 2.1; }
        .ad-source { display: block; margin-top: 8px; font-family: var(--font-ruqaa), serif; font-size: .9rem; color: #c9a24a; line-height: 1.8; }
        .ad-count { display: inline-block; margin-top: 10px; padding: 4px 16px; border-radius: 999px; background: rgba(232,194,90,.15); font-family: var(--font-kufi), sans-serif; font-weight: 700; color: #f1d77a; }
        .ad-note { font-family: var(--font-ruqaa), serif; opacity: .65; margin: 4px 0 0; }
      `}</style>
    </section>
  );
}

const AdhkarCardMemo = __memo(AdhkarCard);
export { AdhkarCardMemo as AdhkarCard };
