'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { SectionGrid } from '@/components/SectionGrid';
import { MushafReader } from './MushafReader';
import { QuranIndex } from './QuranIndex';
import { QuranSearch } from './QuranSearch';
import { lsGet, lsSet, toAr, useQuran } from './data';

export function QuranCorner() {
  const { data, error } = useQuran();
  const [page, setPageState] = useState<number>(() => lsGet('quran_page', 1));
  const [focus, setFocus] = useState<number | null>(null);
  const [marks, setMarks] = useState<number[]>(() => lsGet<number[]>('quran_marks', []));
  const [cmd, setCmd] = useState<{ id: string; n: number } | null>(null);

  useEffect(() => {
    lsSet('quran_page', page);
  }, [page]);

  const setPage = useCallback((p: number) => {
    setFocus(null);
    setPageState(p);
  }, []);

  const toggleMark = useCallback((i: number) => {
    setMarks((m) => {
      const n = m.includes(i) ? m.filter((x) => x !== i) : [...m, i];
      lsSet('quran_marks', n);
      return n;
    });
  }, []);

  const openAt = useCallback((p: number, idx: number | null) => {
    setPageState(p);
    setFocus(idx);
    setCmd((c) => ({ id: 'mushaf', n: (c?.n ?? 0) + 1 }));
  }, []);

  const loading = !data && !error;

  const need = (node: (d: NonNullable<typeof data>) => ReactNode) => {
    if (error) return <p className="qc-msg">تعذّر تحميل المصحف. تأكد من الاتصال وأعد المحاولة.</p>;
    if (loading || !data) return <p className="qc-msg">جارٍ تحميل المصحف…</p>;
    return node(data);
  };

  return (
    <div className="qc">
      <style>{`
        @font-face {
          font-family: 'KFGQPC Hafs';
          src: url('/fonts/hafs.18.woff2') format('woff2');
          font-display: swap;
        }
        .qc-msg { text-align: center; color: #f1d77a; font-family: var(--font-ruqaa), serif; font-size: 18px; padding: 24px 0; }
        .qc-credit { text-align: center; margin: 18px 0 0; font-family: var(--font-ruqaa), serif; font-size: 13px; color: rgba(255,241,196,.5); }
      `}</style>
      <SectionGrid
        command={cmd}
        secs={[
          {
            id: 'mushaf',
            label: 'المصحف',
            icon: '📖',
            hint: data ? `ص ${toAr(page)}` : undefined,
            render: () =>
              need((d) => (
                <MushafReader data={d} page={page} setPage={setPage} focus={focus} marks={marks} toggleMark={toggleMark} />
              )),
          },
          { id: 'index', label: 'الفهرس', icon: '🗂️', hint: 'السور والأجزاء', render: () => need((d) => <QuranIndex data={d} onGo={openAt} />) },
          { id: 'search', label: 'بحث', icon: '🔎', hint: 'في كل الآيات', render: () => need((d) => <QuranSearch data={d} onGo={openAt} />) },
          {
            id: 'marks',
            label: 'علاماتي',
            icon: '🔖',
            hint: marks.length ? `${toAr(marks.length)} علامة` : undefined,
            render: () =>
              need((d) => (
                <div className="qm">
                  {marks.length === 0 && <p className="qc-msg">لا توجد علامات بعد. اضغط على أي آية في المصحف لإضافة علامة.</p>}
                  {marks.map((i) => {
                    const a = d.ayas[i];
                    return (
                      <div key={i} className="qm-row">
                        <button type="button" className="qm-main" onClick={() => openAt(a[2], i)}>
                          <span className="qm-text">{a[4]}</span>
                          <span className="qm-ref">
                            {d.suras[a[0] - 1].name} • {toAr(a[1])} • ص {toAr(a[2])}
                          </span>
                        </button>
                        <button type="button" className="qm-del" onClick={() => toggleMark(i)} aria-label="حذف العلامة">
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  <style>{`
                    .qm { display: flex; flex-direction: column; gap: 8px; }
                    .qm-row { display: flex; gap: 8px; align-items: stretch; }
                    .qm-main { flex: 1; display: flex; flex-direction: column; gap: 6px; text-align: right; padding: 12px; border-radius: 16px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.78); }
                    .qm-text { font-family: 'KFGQPC Hafs', serif; font-size: 20px; line-height: 2; color: #f7ebc1; direction: rtl; }
                    .qm-ref { font-family: var(--font-kufi), sans-serif; font-size: 12.5px; color: #e8c25a; }
                    .qm-del { width: 44px; border-radius: 14px; border: 1px solid rgba(232,194,90,.3); background: rgba(232,194,90,.08); color: #f1d77a; }
                  `}</style>
                </div>
              )),
          },
        ]}
      />
      <p className="qc-credit">نص المصحف وخطه: مجمع الملك فهد لطباعة المصحف الشريف — رواية حفص عن عاصم</p>
    </div>
  );
}
