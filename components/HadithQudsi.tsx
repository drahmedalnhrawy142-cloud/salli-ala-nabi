'use client';

import { useEffect, useMemo, useState } from 'react';
import { SectionGrid, type Sec } from '@/components/SectionGrid';
import { toAr } from '@/components/quran/data';

/**
 * الأحاديث القدسية الصحيحة بنصوصها الكاملة. البيانات مولّدة بـ tools/build_qudsi.py
 * من «الأربعون القدسية» (عن sunnah.com عبر مشروع hadith-json) — بلا تعديل في الألفاظ.
 */
type Item = { n: number; t: string; p: string[]; s?: string };

const isSrc = (p: string) => p.replace(/[ً-ٰٟ]/g, '').includes('رواه');

function HadithBody({ h }: { h: Item }) {
  const [msg, setMsg] = useState('');
  const si = h.p.findIndex(isSrc);
  const before = si === -1 ? h.p : h.p.slice(0, si);
  const src = si === -1 ? h.s || '' : h.p[si];
  const after = si === -1 ? [] : h.p.slice(si + 1);
  const [head, ...body] = before;

  async function copy() {
    const txt = [...before, src, ...after].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(txt);
      setMsg('تم النسخ');
    } catch {
      setMsg('تعذّر النسخ');
    }
    setTimeout(() => setMsg(''), 1400);
  }

  return (
    <article className="hq-card">
      <p className="hq-lead">حديث قدسي: قال الله تعالى فيما يرويه عنه نبيه ﷺ</p>
      {head && <p className="hq-head">{head}</p>}
      {body.map((b, i) => (
        <p key={i} className="hq-text">
          {b}
        </p>
      ))}
      {after.length > 0 && (
        <div className="hq-after">
          {after.map((a, i) => (
            <p key={i}>{a}</p>
          ))}
        </div>
      )}
      <div className="hq-foot">
        <span>{src}</span>
        <button type="button" onClick={copy}>
          نسخ
        </button>
      </div>
      {msg && <div className="hq-toast">{msg}</div>}
      <style>{`
        .hq-card { padding: 16px; border-radius: 20px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); }
        .hq-lead { margin: 0 0 8px; font-family: var(--font-kufi), sans-serif; font-size: 13px; color: #e8c25a; }
        .hq-head { margin: 0 0 10px; font-family: var(--font-ruqaa), serif; font-size: 15.5px; line-height: 2; color: rgba(255,241,196,.72); }
        .hq-text { margin: 0 0 12px; font-family: var(--font-ruqaa), serif; font-size: 21px; line-height: 2.2; color: #fff1c4; text-align: justify; }
        .hq-after { margin: 4px 0 8px; padding-top: 8px; border-top: 1px dashed rgba(232,194,90,.25); font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 2; color: rgba(255,241,196,.8); }
        .hq-after p { margin: 0 0 6px; }
        .hq-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 12px; font-family: var(--font-kufi), sans-serif; font-size: 13px; color: #f1d77a; }
        .hq-foot button { flex: none; padding: 7px 16px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: var(--font-kufi), sans-serif; }
        .hq-toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: 110px; background: #f1d77a; color: #1c1405; padding: 8px 18px; border-radius: 999px; font-family: var(--font-kufi), sans-serif; font-size: 14px; z-index: 30; }
      `}</style>
    </article>
  );
}

export function HadithQudsi() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let live = true;
    fetch('/qudsi.json')
      .then((r) => {
        if (!r.ok) throw new Error('qudsi');
        return r.json();
      })
      .then((d: { items: Item[] }) => live && setItems(d.items))
      .catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, []);

  const secs: Sec[] = useMemo(
    () =>
      (items || []).map((h, k) => ({
        id: `q${h.n}`,
        label: h.t,
        icon: toAr(k + 1),
        render: () => <HadithBody h={h} />,
      })),
    [items],
  );

  if (err) return <p className="hq-msg">تعذّر تحميل الأحاديث. تأكد من الاتصال وأعد المحاولة.</p>;
  if (!items) return <p className="hq-msg">جارٍ التحميل…</p>;

  return (
    <div className="hq">
      <p className="hq-note">{toAr(items.length)} حديثًا قدسيًا صحيحًا. اضغط على أي حديث ليُفتح كاملًا.</p>
      <SectionGrid secs={secs} />
      <p className="hq-credit">
        النصوص: «الأربعون القدسية» (جمع عز الدين إبراهيم ودينيس جونسون ديفيز) عن sunnah.com عبر مشروع hadith-json. اقتُصر على ما خُرِّج في
        الصحيحين أو نُصّ في تخريجه على صحة إسناده أو حسنه (والدرجة ظاهرة تحت كل حديث).
      </p>
      <style>{`
        .hq-msg { text-align: center; color: #f1d77a; font-family: var(--font-ruqaa), serif; font-size: 18px; padding: 24px 0; }
        .hq-note { margin: 0 0 12px; text-align: center; font-family: var(--font-ruqaa), serif; font-size: 14.5px; color: rgba(255,241,196,.6); }
        .hq-credit { margin: 16px 0 0; text-align: center; font-family: var(--font-ruqaa), serif; font-size: 12.5px; line-height: 1.8; color: rgba(255,241,196,.45); }
      `}</style>
    </div>
  );
}
