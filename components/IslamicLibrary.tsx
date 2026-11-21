'use client';

import { useEffect, useState } from 'react';
import { FiqhBook } from '@/components/FiqhMadhahib';

/**
 * المكتبة العلمية لطالب العلم: كتب متفق عليها عند أهل السنة (عقيدة، حديث ومصطلح، أصول فقه، علم وآداب، لغة).
 * النصوص من المكتبة الشاملة عبر مشروع OpenITI (CC BY-NC-SA 4.0)، مقسّمة بـ tools/build_library.py دون تعديل ألفاظ المؤلفين.
 * لإضافة كتاب: أضفه إلى BOOKS في tools/build_library.py وأعد التوليد. تعمل بلا نت داخل التطبيق.
 */
type B = { id: string; cat: string; title: string; author: string; sub: string; via: string };
const CATS = ['العقيدة', 'علوم القرآن', 'الحديث وعلومه', 'أصول الفقه', 'العلم وآدابه', 'اللغة العربية'];

export function IslamicLibrary() {
  const [list, setList] = useState<B[] | null>(null);
  const [err, setErr] = useState(false);
  const [bk, setBk] = useState<B | null>(null);
  useEffect(() => {
    fetch('/library/index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setList)
      .catch(() => setErr(true));
  }, []);
  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل المكتبة.</p>;
  if (!list) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;
  if (bk)
    return (
      <FiqhBook
        key={bk.id}
        dir={`/library/${bk.id}/`}
        title={bk.title}
        fiqh={false}
        backLabel="← المكتبة"
        onBack={() => setBk(null)}
        credit={`الكتاب: «${bk.title}» — ${bk.author}. النص من ${bk.via} عبر مشروع OpenITI بترخيص CC BY-NC-SA 4.0، دون تعديل في ألفاظ المؤلف (وقد تظهر فيه هوامش المحقق وأرقام الأحاديث كما في النسخة الرقمية). للدراسة والاطّلاع؛ والأفضل قراءة الكتب على شيخ أو معلّم.`}
      />
    );
  const cats = [...CATS, ...Array.from(new Set(list.map((b) => b.cat))).filter((c) => !CATS.includes(c))];
  return (
    <div style={{ fontFamily: 'var(--font-kufi), sans-serif', color: '#fff1c4' }}>
      {cats.map((c) => {
        const bs = list.filter((b) => b.cat === c);
        if (!bs.length) return null;
        return (
          <div key={c}>
            <h3 style={{ margin: '14px 0 8px', color: '#e8c25a', fontSize: 15 }}>{c}</h3>
            {bs.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBk(b)}
                style={{ width: '100%', display: 'block', textAlign: 'right', padding: 14, marginBottom: 10, borderRadius: 16, border: '1px solid rgba(232,194,90,.35)', background: 'rgba(18,15,8,.82)', color: '#fff1c4', fontFamily: 'inherit', fontSize: 15 }}
              >
                {b.title}
                <small style={{ display: 'block', color: '#7fe0c0', fontSize: 12, marginTop: 2 }}>{b.author} • {b.sub}</small>
              </button>
            ))}
          </div>
        );
      })}
      <p style={{ textAlign: 'center', fontSize: 11.5, color: 'rgba(255,241,196,.5)', lineHeight: 1.8, marginTop: 14 }}>
        اقتُصرت المكتبة على كتب مجمع على قبولها عند أهل السنة، وتُضاف إليها كتب أخرى تباعًا. كتب الحديث والفقه المقارن والسيرة وعلوم القرآن في أقسامها المستقلة.
      </p>
    </div>
  );
}
