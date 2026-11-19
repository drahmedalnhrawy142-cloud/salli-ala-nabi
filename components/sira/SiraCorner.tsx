'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { SectionGrid } from '@/components/SectionGrid';
import { lsGet, lsSet, toAr } from '@/components/quran/data';
import { loadSiraIndex, type SiraIndex as IX } from './data';
import { SiraReader } from './SiraReader';
import { SiraIndex } from './SiraIndex';
import { SiraSearch } from './SiraSearch';

type Mark = { c: number; k: number; txt: string };

export function SiraCorner() {
  const [ix, setIx] = useState<IX | null>(null);
  const [err, setErr] = useState(false);
  const [ch, setCh] = useState<number>(() => lsGet<{ c: number; k: number }>('sira_pos', { c: 0, k: 0 }).c);
  const [at, setAt] = useState<number | null>(() => lsGet<{ c: number; k: number }>('sira_pos', { c: 0, k: 0 }).k);
  const [hl, setHl] = useState<number | null>(null);
  const [marks, setMarks] = useState<Mark[]>(() => lsGet<Mark[]>('sira_marks', []));
  const [cmd, setCmd] = useState<{ id: string; n: number } | null>(null);
  const posRef = useRef({ c: ch, k: at ?? 0 });

  useEffect(() => {
    loadSiraIndex()
      .then((d) => {
        setIx(d);
        setCh((c) => (c >= 0 && c < d.chapters.length ? c : 0));
      })
      .catch(() => setErr(true));
  }, []);

  const open = useCallback((c: number, k: number | null, flash = false) => {
    setCh(c);
    setAt(k);
    setHl(flash ? k : null);
    posRef.current = { c, k: k ?? 0 };
    lsSet('sira_pos', posRef.current);
    setCmd((p) => ({ id: 'read', n: (p?.n ?? 0) + 1 }));
  }, []);

  // التنقل بين الأبواب وهو داخل القارئ بالفعل (لا يحتاج فتح القسم)
  const go = useCallback((c: number, k: number | null) => {
    setCh(c);
    setAt(k);
    setHl(null);
    posRef.current = { c, k: k ?? 0 };
    lsSet('sira_pos', posRef.current);
  }, []);

  const onPos = useCallback((c: number, k: number) => {
    posRef.current = { c, k };
    lsSet('sira_pos', posRef.current);
  }, []);

  const onMark = useCallback((c: number, k: number, txt: string) => {
    setMarks((m) => {
      const n = [{ c, k, txt }, ...m.filter((x) => !(x.c === c && x.k === k))].slice(0, 200);
      lsSet('sira_marks', n);
      return n;
    });
  }, []);

  const need = (node: (d: IX) => ReactNode) => {
    if (err) return <p className="sc-msg">تعذّر تحميل الكتاب. تأكد من الاتصال وأعد المحاولة.</p>;
    if (!ix) return <p className="sc-msg">جارٍ تحميل الفهرس…</p>;
    return node(ix);
  };

  return (
    <div className="sc">
      <style>{`
        .sc-msg { text-align: center; color: #f1d77a; font-family: var(--font-ruqaa), serif; font-size: 18px; padding: 24px 0; }
        .sc-credit { text-align: center; margin: 18px 0 0; font-family: var(--font-ruqaa), serif; font-size: 13px; line-height: 1.8; color: rgba(255,241,196,.5); }
        .sc-about { font-family: var(--font-ruqaa), serif; font-size: 16.5px; line-height: 2; color: #f7ebc1; }
        .sc-about b { color: #f1d77a; font-family: var(--font-kufi), sans-serif; }
        .sc-about p { margin: 0 0 12px; }
        .sc-mark { display: flex; gap: 8px; align-items: stretch; margin: 0 0 8px; }
        .sc-mark-main { flex: 1; display: flex; flex-direction: column; gap: 6px; text-align: right; padding: 12px; border-radius: 16px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.78); cursor: pointer; }
        .sc-mark-t { font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 1.9; color: #f7ebc1; }
        .sc-mark-r { font-family: var(--font-kufi), sans-serif; font-size: 12px; color: #e8c25a; }
        .sc-mark-del { width: 44px; border-radius: 14px; border: 1px solid rgba(232,194,90,.3); background: rgba(232,194,90,.08); color: #f1d77a; }
      `}</style>
      <SectionGrid
        command={cmd}
        secs={[
          {
            id: 'read',
            label: 'تابع القراءة',
            icon: '📖',
            hint: ix ? `الباب ${toAr(ch + 1)}` : undefined,
            render: () =>
              need((d) => (
                <SiraReader ix={d} ch={ch} at={at} hl={hl} go={go} onPos={onPos} onMark={onMark} />
              )),
          },
          { id: 'index', label: 'الفهرس', icon: '🗂️', hint: ix ? `${toAr(ix.chapters.length)} بابًا` : undefined, render: () => need((d) => <SiraIndex ix={d} onGo={(c, k) => open(c, k)} />) },
          { id: 'search', label: 'بحث', icon: '🔎', hint: 'في نص الكتاب كله', render: () => need((d) => <SiraSearch ix={d} onGo={(c, k) => open(c, k, true)} />) },
          {
            id: 'marks',
            label: 'علاماتي',
            icon: '🔖',
            hint: marks.length ? `${toAr(marks.length)} علامة` : undefined,
            render: () =>
              need((d) => (
                <div>
                  {marks.length === 0 && <p className="sc-msg">لا توجد علامات بعد. اضغط «علامة» أثناء القراءة.</p>}
                  {marks.map((m) => (
                    <div key={`${m.c}-${m.k}`} className="sc-mark">
                      <button type="button" className="sc-mark-main" onClick={() => open(m.c, m.k, true)}>
                        <span className="sc-mark-t">{m.txt}</span>
                        <span className="sc-mark-r">{d.chapters[m.c]?.t}</span>
                      </button>
                      <button
                        type="button"
                        className="sc-mark-del"
                        aria-label="حذف العلامة"
                        onClick={() =>
                          setMarks((all) => {
                            const n = all.filter((x) => !(x.c === m.c && x.k === m.k));
                            lsSet('sira_marks', n);
                            return n;
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )),
          },
          {
            id: 'about',
            label: 'عن الكتاب',
            icon: 'ℹ️',
            render: () =>
              need((d) => (
                <div className="sc-about">
                  <p>
                    <b>الكتاب:</b> {d.title} — {d.author}
                  </p>
                  <p>
                    <b>الطبعة:</b> {d.edition}
                  </p>
                  <p>
                    <b>مصدر النص:</b> {d.source}. الترخيص: {d.license}. النص منقول كما هو دون تعديل في ألفاظه، وحُذفت منه علامات الصفحات والحواشي المرقّمة فقط.
                  </p>
                  <p>
                    <b>تنبيه:</b> هذا كتاب سيرة تاريخي يجمع الروايات بأسانيدها وأشعارها، وفيه روايات تحتاج إلى تمحيص، وليس مقصورًا على الصحيح.
                    للأحكام والعقائد يُرجع إلى كتب الحديث وأهل العلم.
                  </p>
                </div>
              )),
          },
        ]}
      />
      <p className="sc-credit">سيرة ابن هشام — مكتبة OpenITI (مشروع KITAB) عن المكتبة الشاملة • CC BY-NC-SA 4.0</p>
    </div>
  );
}
