'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { CrescentDoodle } from '@/components/Doodles';

/**
 * جدول العبادات اليومية: صفوف عبادات، وأعمدة آخر ٧ أيام، تعلّم فيها ما فعلته وتصحّح ما فاتك.
 * تقدر تحذف صفًّا أو تضيف صفوفك بكتابتك، ولكل صف تذكير اختياري بوقت ونغمة بلا موسيقى.
 * كل البيانات على جهازك فقط. التذكير بإشعار متاح داخل تطبيق الأندرويد.
 */
type Tone = 'voice' | 'vibrate' | 'silent';
type Row = { id: string; t: string; custom?: boolean; r?: { h: number; m: number; tone: Tone } };
type Store = { rows: Row[]; days: Record<string, string[]>; notes: Record<string, string> };

const DEFAULT_ROWS: Row[] = [
  { id: 'fajr', t: 'صلاة الفجر' },
  { id: 'dhuhr', t: 'صلاة الظهر' },
  { id: 'asr', t: 'صلاة العصر' },
  { id: 'maghrib', t: 'صلاة المغرب' },
  { id: 'isha', t: 'صلاة العشاء' },
  { id: 'rawatib', t: 'السنن الرواتب' },
  { id: 'duha', t: 'صلاة الضحى' },
  { id: 'witr', t: 'الوتر' },
  { id: 'quran', t: 'ورد القرآن' },
  { id: 'morning', t: 'أذكار الصباح' },
  { id: 'evening', t: 'أذكار المساء' },
  { id: 'afterp', t: 'أذكار بعد الصلاة' },
  { id: 'sleep', t: 'أذكار النوم' },
  { id: 'salawat', t: 'الصلاة على النبي ﷺ' },
  { id: 'fast', t: 'صيام اليوم' },
];
const TONES: [Tone, string][] = [
  ['voice', 'صوت الصلاة على النبي ﷺ (بصوت بشري، بلا موسيقى)'],
  ['vibrate', 'اهتزاز فقط'],
  ['silent', 'إشعار صامت'],
];
const KEY = 'wt.v1';

const pad = (n: number) => String(n).padStart(2, '0');
const dkey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WD = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

type Cap = { isNativePlatform?: () => boolean; Plugins?: Record<string, Record<string, (o?: unknown) => Promise<unknown>> | undefined> };
function fp() {
  const c = (window as unknown as { Capacitor?: Cap }).Capacitor;
  return c?.isNativePlatform?.() ? c.Plugins?.FloatingButton ?? null : null;
}

function load(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && Array.isArray(s.rows)) return { rows: s.rows, days: s.days || {}, notes: s.notes || {} };
  } catch {}
  return { rows: DEFAULT_ROWS, days: {}, notes: {} };
}

export function WorshipTracker() {
  const [st, setSt] = useState<Store | null>(null);
  const [edit, setEdit] = useState<string | null>(null);
  const [add, setAdd] = useState('');
  const [native, setNative] = useState(false);
  const [off, setOff] = useState(0); // 0 = اليوم، والأيام السابقة بالسالب (إزاحة الأسبوع المعروض)

  useEffect(() => {
    setSt(load());
    setNative(!!fp()?.eventsSet);
  }, []);

  const days = useMemo(() => {
    const out: Date[] = [];
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() + off - i);
      out.push(d);
    }
    return out;
  }, [off]);
  const today = dkey(new Date());

  function save(next: Store) {
    setSt(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }

  // جدولة التذكيرات (مجموعة track): الأيام القادمة لكل صف له تذكير، بحد أقصى ٦٠ موعدًا
  useEffect(() => {
    const f = fp();
    if (!f?.eventsSet || !st) return;
    const withR = st.rows.filter((r) => r.r);
    const items: { at: number; title: string; text: string; tone: Tone }[] = [];
    if (withR.length) {
      const span = Math.max(1, Math.min(14, Math.floor(60 / withR.length)));
      for (let i = 0; i < span; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const k = dkey(d);
        for (const r of withR) {
          if (!r.r) continue;
          const at = new Date(d);
          at.setHours(r.r.h, r.r.m, 0, 0);
          if (at.getTime() <= Date.now() + 5000) continue;
          if (st.days[k]?.includes(r.id)) continue;
          items.push({ at: at.getTime(), title: 'تذكير بعبادتك', text: r.t, tone: r.r.tone });
        }
      }
      items.sort((a, b) => a.at - b.at);
    }
    f.eventsSet({ group: 'track', items: items.slice(0, 60) })?.catch?.(() => {});
  }, [st]);

  if (!st) return null;

  const toggle = (id: string, k: string) => {
    const cur = st.days[k] || [];
    const nx = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    save({ ...st, days: { ...st.days, [k]: nx } });
  };
  const doneToday = (st.days[today] || []).filter((id) => st.rows.some((r) => r.id === id)).length;
  const pct = st.rows.length ? Math.round((doneToday / st.rows.length) * 100) : 0;

  function addRow() {
    const t = add.trim();
    if (!t) return;
    save({ ...st!, rows: [...st!.rows, { id: `c${Date.now()}`, t, custom: true }] });
    setAdd('');
  }
  function delRow(id: string) {
    if (!confirm('حذف هذا الصف من الجدول؟')) return;
    save({ ...st!, rows: st!.rows.filter((r) => r.id !== id) });
    setEdit(null);
  }
  function setRem(id: string, r: Row['r'] | undefined) {
    save({ ...st!, rows: st!.rows.map((x) => (x.id === id ? { ...x, r } : x)) });
  }
  function resetRows() {
    if (!confirm('إرجاع الصفوف الافتراضية؟ (صفوفك المكتوبة بخطك تبقى)')) return;
    const customs = st!.rows.filter((r) => r.custom);
    const keep = DEFAULT_ROWS.map((d) => st!.rows.find((r) => r.id === d.id) || d);
    save({ ...st!, rows: [...keep, ...customs] });
  }

  const noteKey = today;

  // إحصائيات: نسبة الالتزام = المنجَز ÷ (عدد البنود × عدد الأيام). اليوم «ناجح» إن أُنجز نصف بنوده فأكثر.
  function dayPct(k: string) {
    if (!st!.rows.length) return 0;
    const n = (st!.days[k] || []).filter((id) => st!.rows.some((r) => r.id === id)).length;
    return n / st!.rows.length;
  }
  function span(nd: number) {
    let sum = 0;
    const b = new Date();
    b.setHours(12, 0, 0, 0);
    for (let i = 0; i < nd; i++) {
      const d = new Date(b);
      d.setDate(b.getDate() - i);
      sum += dayPct(dkey(d));
    }
    return Math.round((sum / nd) * 100);
  }
  const wk = span(7);
  const mo = span(30);
  let streak = 0;
  {
    const b = new Date();
    b.setHours(12, 0, 0, 0);
    for (let i = 0; i < 400; i++) {
      const d = new Date(b);
      d.setDate(b.getDate() - i);
      if (dayPct(dkey(d)) >= 0.5) streak++;
      else if (i === 0) continue; // اليوم لم ينتهِ بعد
      else break;
    }
  }
  const cheer =
    streak >= 30 ? 'ثبّتك الله، شهرٌ من المداومة! وأحبّ العمل إلى الله أدومه وإن قلّ.'
    : streak >= 7 ? 'أسبوعٌ فأكثر من المداومة، بارك الله فيك. «أحبّ الأعمال إلى الله أدومها وإن قلّ».'
    : streak >= 1 ? 'بداية طيبة، واصل ولو بالقليل؛ فإن القليل الدائم خير من كثير منقطع.'
    : 'ابدأ اليوم بما تيسّر، فالمداومة تبدأ بخطوة. «وأن أحبّ الأعمال أدومها وإن قلّ».';
  return (
    <div className="wt">
      <CrescentDoodle />
      <div className="wt-sum">
        <b>{toAr(doneToday)} من {toAr(st.rows.length)}</b>
        <span>{pct === 100 ? 'ما شاء الله، أتممتَ جدولك اليوم 🌟' : 'أتممتَ اليوم'}</span>
        <div className="wt-bar"><i style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="wt-stats">
        <div><b>{toAr(wk)}٪</b><span>آخر ٧ أيام</span></div>
        <div><b>{toAr(mo)}٪</b><span>آخر ٣٠ يومًا</span></div>
        <div><b>{toAr(streak)}</b><span>يوم متتابع</span></div>
        <p>{cheer}</p>
        <small>اليوم المحسوب: ما أُنجز فيه نصف البنود فأكثر. الحديث بمعناه في الصحيحين.</small>
      </div>

      <div className="wt-nav">
        <button type="button" onClick={() => setOff(off - 7)}>‹ أسبوع أسبق</button>
        {off !== 0 && <button type="button" onClick={() => setOff(0)}>اليوم</button>}
        <button type="button" disabled={off >= 0} onClick={() => setOff(Math.min(0, off + 7))}>أسبوع أحدث ›</button>
      </div>

      <div className="wt-scroll">
        <table className="wt-t">
          <thead>
            <tr>
              <th className="wt-l">العبادة</th>
              {days.map((d) => (
                <th key={dkey(d)} className={dkey(d) === today ? 'wt-today' : ''}>
                  <small>{WD[d.getDay()]}</small>
                  {toAr(d.getDate())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {st.rows.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td className="wt-l">
                    <button type="button" className="wt-name" onClick={() => setEdit(edit === r.id ? null : r.id)} aria-expanded={edit === r.id}>
                      {r.t}
                      {r.r && <em> ⏰ {pad(r.r.h)}:{pad(r.r.m)}</em>}
                    </button>
                  </td>
                  {days.map((d) => {
                    const k = dkey(d);
                    const on = (st.days[k] || []).includes(r.id);
                    const future = k > today;
                    return (
                      <td key={k} className={k === today ? 'wt-today' : ''}>
                        <button type="button" className={on ? 'wt-c on' : 'wt-c'} disabled={future} aria-label={`${r.t} ${k}`} aria-pressed={on} onClick={() => toggle(r.id, k)}>
                          {on ? '✓' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
                {edit === r.id && (
                  <tr>
                    <td colSpan={8} className="wt-edit">
                      <label className="wt-line">
                        <input
                          type="checkbox"
                          checked={!!r.r}
                          onChange={(e) => setRem(r.id, e.target.checked ? { h: 5, m: 0, tone: 'voice' } : undefined)}
                        />
                        ذكّرني بهذه العبادة يوميًّا
                      </label>
                      {r.r && (
                        <>
                          <label className="wt-line">
                            الوقت:
                            <input
                              type="time"
                              value={`${pad(r.r.h)}:${pad(r.r.m)}`}
                              onChange={(e) => {
                                const [h, m] = e.target.value.split(':').map(Number);
                                if (!Number.isNaN(h) && !Number.isNaN(m) && r.r) setRem(r.id, { ...r.r, h, m });
                              }}
                            />
                          </label>
                          <label className="wt-line">
                            النغمة:
                            <select value={r.r.tone} onChange={(e) => r.r && setRem(r.id, { ...r.r, tone: e.target.value as Tone })}>
                              {TONES.map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                              ))}
                            </select>
                          </label>
                          {!native && <p className="wt-hint">الإشعار يعمل داخل تطبيق الأندرويد؛ إعدادك محفوظ هنا.</p>}
                        </>
                      )}
                      <button type="button" className="wt-del" onClick={() => delRow(r.id)}>حذف هذا الصف</button>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="wt-add">
        <input value={add} onChange={(e) => setAdd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRow()} placeholder="أضف خانة بكتابتك (مثال: صدقة، زيارة رحم، قراءة كتاب)" maxLength={80} />
        <button type="button" onClick={addRow}>إضافة</button>
      </div>

      <label className="wt-note">
        ملاحظة اليوم
        <textarea
          value={st.notes[noteKey] || ''}
          onChange={(e) => save({ ...st, notes: { ...st.notes, [noteKey]: e.target.value } })}
          placeholder="اكتب ما تريد تذكّره أو تحاسب نفسك عليه اليوم…"
          rows={3}
          maxLength={500}
        />
      </label>

      <button type="button" className="wt-reset" onClick={resetRows}>إرجاع الصفوف الافتراضية</button>
      <p className="wt-fn">اضغط على اسم العبادة لضبط تذكيرها أو حذفها. أي خانة في أيام سبقت تقدر تصحّحها. بياناتك على جهازك فقط. التذكير يُجدول للأيام القادمة كلما فتحت الجدول.</p>

      <style>{`
        .wt { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
        .wt-sum { padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.85); margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
        .wt-sum b { font-size: 18px; color: #f1d77a; }
        .wt-sum span { font-size: 13px; opacity: .8; }
        .wt-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
        .wt-stats > div { padding: 10px 6px; border-radius: 14px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.8); text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .wt-stats b { font-size: 22px; color: #f1d77a; }
        .wt-stats span { font-size: 11.5px; color: rgba(255,241,196,.65); }
        .wt-stats p { grid-column: 1 / -1; margin: 2px 0 0; font-size: 13px; line-height: 1.9; text-align: center; color: #fff1c4; }
        .wt-stats small { grid-column: 1 / -1; text-align: center; font-size: 10.5px; color: rgba(255,241,196,.45); }
        .wt-bar { flex: 1 1 100%; height: 8px; border-radius: 8px; background: rgba(232,194,90,.15); overflow: hidden; }
        .wt-bar i { display: block; height: 100%; background: linear-gradient(90deg, #e8c25a, #7fe0c0); }
        .wt-nav { display: flex; justify-content: space-between; gap: 6px; margin-bottom: 8px; }
        .wt-nav button { padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(232,194,90,.35); background: transparent; color: #f1d77a; font-family: inherit; font-size: 12.5px; }
        .wt-nav button:disabled { opacity: .35; }
        .wt-scroll { overflow-x: auto; border-radius: 14px; border: 1px solid rgba(232,194,90,.25); }
        .wt-t { border-collapse: collapse; width: 100%; min-width: 420px; background: rgba(18,15,8,.7); }
        .wt-t th, .wt-t td { padding: 4px 2px; text-align: center; border-bottom: 1px solid rgba(232,194,90,.12); font-size: 13px; }
        .wt-t th small { display: block; font-size: 9.5px; color: #e8c25a; font-weight: 400; }
        .wt-l { text-align: right !important; position: sticky; right: 0; background: #14110a; min-width: 130px; padding-right: 8px !important; z-index: 1; }
        .wt-today { background: rgba(232,194,90,.1); }
        .wt-name { background: none; border: 0; padding: 8px 0; color: #fff1c4; font-family: var(--font-ruqaa), serif; font-size: 15px; text-align: right; line-height: 1.5; }
        .wt-name em { display: block; font-style: normal; font-size: 11px; color: #7fe0c0; font-family: var(--font-kufi), sans-serif; }
        .wt-c { width: 30px; height: 30px; border-radius: 9px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #12100a; font-weight: 700; font-size: 16px; padding: 0; }
        .wt-c.on { background: #7fe0c0; border-color: #7fe0c0; }
        .wt-c:disabled { opacity: .25; }
        .wt-edit { text-align: right !important; padding: 10px 12px !important; background: rgba(232,194,90,.06); }
        .wt-line { display: flex; gap: 8px; align-items: center; margin: 6px 0; font-size: 13.5px; flex-wrap: wrap; }
        .wt-line input[type=time], .wt-line select { padding: 6px 8px; border-radius: 10px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; max-width: 100%; }
        .wt-hint { font-size: 11.5px; color: #ffd9a0; margin: 4px 0; }
        .wt-del { margin-top: 6px; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(255,140,120,.5); background: transparent; color: #ff9f8f; font-family: inherit; font-size: 12.5px; }
        .wt-add { display: flex; gap: 6px; margin: 12px 0; }
        .wt-add input { flex: 1; min-width: 0; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 14px; }
        .wt-add button { padding: 10px 16px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.15); color: #f1d77a; font-family: inherit; }
        .wt-note { display: block; font-size: 13px; color: #e8c25a; }
        .wt-note textarea { display: block; width: 100%; box-sizing: border-box; margin-top: 6px; padding: 10px; border-radius: 12px; border: 1px solid rgba(232,194,90,.3); background: #1a1409; color: #fff1c4; font-family: var(--font-ruqaa), serif; font-size: 15px; line-height: 1.9; resize: vertical; }
        .wt-reset { display: block; margin: 14px auto 0; background: none; border: 0; color: #e8c25a; font-family: inherit; font-size: 12.5px; text-decoration: underline; }
        .wt-fn { font-size: 11.5px; text-align: center; color: rgba(255,241,196,.5); line-height: 1.8; }
      `}</style>
    </div>
  );
}
