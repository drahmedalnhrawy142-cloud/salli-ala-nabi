'use client';

import { useState } from 'react';
import { lsGet, lsSet, toAr, type QData } from './data';
import { bumpAct } from '../weekStats';

type Wird = { perDay: number; pos: number; last: string; streak: number; khatmat: number };
const DEF: Wird = { perDay: 20, pos: 1, last: '', streak: 0, khatmat: 0 };

function dayKey(off = 0) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.toLocaleDateString('en-CA');
}

const DAYS = [7, 10, 15, 20, 30, 60];
const PAGES = [1, 2, 4, 5, 10, 20];

/** ورد القرآن اليومي / خطة الختمة */
export function QuranWird({
  data,
  currentPage,
  onOpenAt,
}: {
  data: QData;
  currentPage: number;
  onOpenAt: (page: number, ayaIdx: number | null) => void;
}) {
  const [w, setW] = useState<Wird>(() => ({ ...DEF, ...lsGet<Partial<Wird>>('quran_wird', {}) }));

  function save(n: Wird) {
    setW(n);
    lsSet('quran_wird', n);
  }

  const today = dayKey();
  const doneToday = w.last === today;
  const from = Math.min(604, w.pos);
  const to = Math.min(604, from + w.perDay - 1);
  const remaining = 604 - from + 1;
  const daysLeft = Math.ceil(remaining / w.perDay);
  const pct = Math.round(((from - 1) / 604) * 100);

  const [fin, setFin] = useState(false);

  function complete() {
    if (doneToday) return;
    bumpAct('q', Math.max(1, to - from + 1));
    let pos = to + 1;
    let kh = w.khatmat;
    if (pos > 604) {
      pos = 1;
      kh += 1;
      setFin(true);
    }
    const streak = w.last === dayKey(-1) ? w.streak + 1 : 1;
    save({ ...w, pos, last: today, streak, khatmat: kh });
  }

  function suraAt(page: number) {
    const i = data.pageIndex[page];
    return data.suras[data.ayas[i][0] - 1].name;
  }

  return (
    <div className="qw">
      {fin && (
        <div className="qw-fin" role="status">
          <div className="qw-fin-b">🏅</div>
          <h3>ما شاء الله! أتممت الختمة رقم {toAr(w.khatmat)}</h3>
          <p>
            صحّ عن أنس بن مالك رضي الله عنه أنه كان إذا ختم القرآن جمع أهله ودعا. فاجمع أهلك وادعُ بما تحب لك وللمسلمين.
          </p>
          <p className="qw-fin-n">
            لم يثبت في السنة دعاء مخصوص بعد الختم، ولذلك لا نضع نصًّا بعينه؛ وأما الدعاء المنتشر في آخر بعض المصاحف فلا أصل له. (المصدر: فتوى
            الإسلام سؤال وجواب رقم ٦٥٥٨١)
          </p>
          <button type="button" onClick={() => setFin(false)}>
            آمين
          </button>
        </div>
      )}
      <div className="qw-card">
        <div className="qw-top">
          <span className="qw-streak">🔥 {toAr(w.streak)} يوم متتالي</span>
          <span className="qw-streak">🕋 {toAr(w.khatmat)} ختمة</span>
        </div>

        <h3 className="qw-h">{doneToday ? 'أتممت وردك اليوم، تقبّل الله منك' : 'وردك اليوم'}</h3>
        <p className="qw-range">
          {doneToday ? 'وردك القادم' : 'من'} صفحة {toAr(from)} إلى صفحة {toAr(to)}
        </p>
        <p className="qw-sub">
          تبدأ من سورة {suraAt(from)} • {toAr(Math.min(w.perDay, 604 - from + 1))} صفحة
        </p>

        <div className="qw-bar" aria-label="تقدم الختمة">
          <div className="qw-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="qw-sub">
          تقدّمك في الختمة {toAr(pct)}٪ • باقي حوالي {toAr(daysLeft)} يوم
        </p>

        <div className="qw-actions">
          <button type="button" className="qw-btn" onClick={() => onOpenAt(from, null)}>
            📖 افتح وردي
          </button>
          <button type="button" className="qw-btn qw-ok" onClick={complete} disabled={doneToday}>
            {doneToday ? '✓ تم' : '✓ أتممت وردي'}
          </button>
        </div>
      </div>

      <div className="qw-card">
        <h3 className="qw-h">خطة الختمة</h3>
        <p className="qw-sub">اختر مدة الختمة، وهيتحدد عدد الصفحات اليومية.</p>
        <div className="qw-chips">
          {DAYS.map((d) => {
            const per = Math.ceil(604 / d);
            return (
              <button
                key={d}
                type="button"
                className={`qw-chip${w.perDay === per ? ' on' : ''}`}
                onClick={() => save({ ...w, perDay: per })}
              >
                {toAr(d)} يوم
              </button>
            );
          })}
        </div>
        <p className="qw-sub">أو حدّد عدد الصفحات يوميًا:</p>
        <div className="qw-chips">
          {PAGES.map((p) => (
            <button key={p} type="button" className={`qw-chip${w.perDay === p ? ' on' : ''}`} onClick={() => save({ ...w, perDay: p })}>
              {toAr(p)} {p === 1 ? 'صفحة' : 'صفحات'}
            </button>
          ))}
        </div>
        <div className="qw-actions">
          <button type="button" className="qw-btn" onClick={() => save({ ...w, pos: Math.max(1, Math.min(604, currentPage)) })}>
            ابدأ الورد من صفحة المصحف الحالية ({toAr(currentPage)})
          </button>
        </div>
        <div className="qw-actions">
          <button type="button" className="qw-btn" onClick={() => save({ ...w, pos: 1 })}>
            ↺ ختمة جديدة من أول المصحف
          </button>
        </div>
      </div>

      <style>{`
        .qw-fin { margin: 0 0 14px; padding: 16px; text-align: center; border-radius: 20px; border: 1px solid rgba(232,194,90,.6); background: radial-gradient(circle at 50% 0%, rgba(232,194,90,.25), rgba(18,15,8,.9)); }
        .qw-fin-b { font-size: 44px; }
        .qw-fin h3 { margin: 6px 0; color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 17px; }
        .qw-fin p { margin: 6px 0; color: #fff1c4; font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 1.9; }
        .qw-fin .qw-fin-n { font-size: 12.5px; color: rgba(255,241,196,.55); }
        .qw-fin button { margin-top: 8px; padding: 8px 26px; border-radius: 999px; border: 1px solid rgba(232,194,90,.5); background: rgba(232,194,90,.15); color: #f1d77a; font-family: var(--font-kufi), sans-serif; }
        .qw { display: flex; flex-direction: column; gap: 14px; }
        .qw-card { padding: 18px 16px; border-radius: 22px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.82); text-align: center; }
        .qw-top { display: flex; justify-content: space-between; margin: 0 0 10px; }
        .qw-streak { font-family: var(--font-kufi), sans-serif; font-size: 13px; color: #f1d77a; padding: 5px 12px; border-radius: 999px; border: 1px solid rgba(232,194,90,.35); background: rgba(232,194,90,.08); }
        .qw-h { margin: 6px 0 4px; font-family: var(--font-kufi), sans-serif; font-size: 18px; color: #f1d77a; }
        .qw-range { margin: 4px 0; font-family: var(--font-kufi), sans-serif; font-size: 20px; color: #fff1c4; }
        .qw-sub { margin: 6px 0; font-family: var(--font-ruqaa), serif; font-size: 15px; color: rgba(255,241,196,.68); }
        .qw-bar { height: 10px; border-radius: 999px; background: rgba(255,255,255,.1); overflow: hidden; margin: 12px 0 4px; }
        .qw-fill { height: 100%; background: linear-gradient(90deg, #c9a24a, #ffd97a); border-radius: 999px; }
        .qw-actions { display: flex; gap: 10px; margin-top: 12px; }
        .qw-btn { flex: 1; padding: 12px 8px; border-radius: 14px; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.12); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-size: 14px; }
        .qw-btn:disabled { opacity: .5; }
        .qw-ok { background: rgba(232,194,90,.28); }
        .qw-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 8px 0; }
        .qw-chip { padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.35); background: transparent; color: rgba(241,215,122,.8); font-family: var(--font-kufi), sans-serif; font-size: 14px; }
        .qw-chip.on { background: rgba(232,194,90,.25); color: #fff1c4; border-color: rgba(232,194,90,.8); }
      `}</style>
    </div>
  );
}
