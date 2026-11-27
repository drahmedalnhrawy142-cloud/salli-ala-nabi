'use client';

import { memo as __memo } from 'react';
import { useEffect, useRef, useState } from 'react';
import { gardenAdd } from '@/components/garden/store';
import { SectionChips } from '@/components/SectionChips';
import { BeadTasbih, BEAD_STYLES, type BeadStyle } from '@/components/TasbeehBeads';

type Item = { label: string; text: string; source?: string };
type Group = { id: string; title: string; note?: string; items: Item[] };

const PLAIN = [
  'سبحان الله',
  'الحمد لله',
  'الله أكبر',
  'لا إله إلا الله',
  'أستغفر الله',
  'لا حول ولا قوة إلا بالله',
  'سبحان الله وبحمده',
  'اللهم صلِّ على محمد',
];

const UMAMA_SOURCE =
  'رواه أحمد والنسائي في الكبرى — حسّنه الألباني في الصحيحة (٢٥٧٨) وصححه في صحيح الترغيب (١٥٧٥)';
const UMAMA_NOTE =
  'علّمها النبي ﷺ لأبي أمامة رضي الله عنه على أنها أفضل (أو أكثر) من ذكره الليل مع النهار.';

function umama(base: string): Item[] {
  return [
    ['عدد ما خلق', 'عدد ما خلق'],
    ['ملء ما خلق', 'ملء ما خلق'],
    ['عدد ما في الأرض والسماء', 'عدد ما في الأرض والسماء'],
    ['ملء ما في الأرض والسماء', 'ملء ما في الأرض والسماء'],
    ['عدد ما أحصى كتابه', 'عدد ما أحصى كتابه'],
    ['ملء ما أحصى كتابه', 'ملء ما أحصى كتابه'],
    ['عدد كل شيء', 'عدد كل شيء'],
    ['ملء كل شيء', 'ملء كل شيء'],
  ].map(([label, tail]) => ({
    label,
    text: `${base} ${tail}`,
    source: UMAMA_SOURCE,
  }));
}

const GROUPS: Group[] = [
  { id: 'mg-subhan', title: 'سبحان الله', note: UMAMA_NOTE, items: umama('سبحان الله') },
  { id: 'mg-hamd', title: 'الحمد لله', note: UMAMA_NOTE, items: umama('الحمد لله') },
  {
    id: 'mg-muslim',
    title: 'من صحيح مسلم',
    items: [
      {
        label: 'عدد خلقه ورضا نفسه',
        text: 'سبحان الله وبحمده، عدد خلقه، ورضا نفسه، وزنة عرشه، ومداد كلماته',
        source: 'قالها النبي ﷺ لجويرية رضي الله عنها ثلاث مرات — رواه مسلم (٢٧٢٦)',
      },
      {
        label: 'تملأ الميزان',
        text: 'الحمد لله',
        source: 'قال ﷺ: «والحمد لله تملأ الميزان» — رواه مسلم (٢٢٣)',
      },
      {
        label: 'تملآن ما بين السماء والأرض',
        text: 'سبحان الله والحمد لله',
        source:
          'قال ﷺ: «وسبحان الله والحمد لله تملآن (أو تملأ) ما بين السماوات والأرض» — رواه مسلم (٢٢٣)',
      },
    ],
  },
];

const T_PLAIN = [33, 100, 0];
const T_MULTI = [3, 10, 33, 100, 0];

function Tasbeeh({ mode = 'plain' }: { mode?: 'plain' | 'multi' }) {
  const multi = mode === 'multi';
  const sfx = multi ? '_m' : '';
  const first = multi ? GROUPS[0].items[0] : null;

  const [plainIdx, setPlainIdx] = useState(0);
  const [sel, setSel] = useState<Item | null>(first);
  const [target, setTarget] = useState(multi ? 10 : 33);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [rounds, setRounds] = useState<Record<string, number>>({});
  const [auto, setAuto] = useState(true);
  const [view, setView] = useState<'beads' | 'ring'>('beads');
  const [bstyle, setBstyle] = useState<BeadStyle>('amber');
  const [taps, setTaps] = useState(0);

  useEffect(() => {
    try {
      setCounts(JSON.parse(localStorage.getItem('tasbeeh_counts') || '{}') || {});
      setRounds(JSON.parse(localStorage.getItem('tasbeeh_rounds') || '{}') || {});
      const t = localStorage.getItem('tasbeeh_target' + sfx);
      if (t !== null) setTarget(Number(t));
      if (localStorage.getItem('tasbeeh_auto') === '0') setAuto(false);
      if (localStorage.getItem('tasbeeh_view') === 'ring') setView('ring');
      const bs = localStorage.getItem('tasbeeh_beads');
      if (BEAD_STYLES.some((x) => x.id === bs)) setBstyle(bs as BeadStyle);
      if (multi) {
        const saved = localStorage.getItem('tasbeeh_msel');
        const all = GROUPS.flatMap((g) => g.items);
        const f = all.find((x) => x.text + '|' + x.label === saved);
        if (f) setSel(f);
      } else {
        const i = Number(localStorage.getItem('tasbeeh_idx') || 0);
        if (i >= 0 && i < PLAIN.length) setPlainIdx(i);
      }
    } catch {}
  }, [multi, sfx]);

  const name = multi ? sel?.text || '' : PLAIN[plainIdx];
  const key = (multi ? 'm|' + (sel?.label || '') + '|' : '') + name;
  const c = counts[key] || 0;
  const r = rounds[key] || 0;

  function save(nc: Record<string, number>, nr: Record<string, number>) {
    setCounts(nc);
    setRounds(nr);
    try {
      localStorage.setItem('tasbeeh_counts', JSON.stringify(nc));
      localStorage.setItem('tasbeeh_rounds', JSON.stringify(nr));
    } catch {}
  }

  const tapRef = useRef<() => void>(() => {});
  tapRef.current = tap;

  function tap() {
    gardenAdd(1);
    setTaps((t) => t + 1);
    let next = c + 1;
    let nr = r;
    let done = false;
    if (target > 0 && next >= target) {
      next = 0;
      nr = r + 1;
      done = true;
    }
    try {
      if (navigator.vibrate) navigator.vibrate(done ? [40, 50, 80] : 15);
    } catch {}
    save({ ...counts, [key]: next }, { ...rounds, [key]: nr });
    // الذكر المضاعف: عند إتمام العدد ننتقل تلقائيًّا للصيغة التالية في نفس المجموعة (عدد ما خلق ← ملء ما خلق …)
    if (done && multi && auto && sel) {
      const g = GROUPS.find((x) => x.items.some((i) => i.text === sel.text && i.label === sel.label));
      const idx = g ? g.items.findIndex((i) => i.text === sel.text && i.label === sel.label) : -1;
      const nx = g && idx >= 0 ? g.items[idx + 1] : undefined;
      if (nx) {
        setSel(nx);
        try {
          localStorage.setItem('tasbeeh_msel', nx.text + '|' + nx.label);
        } catch {}
      }
    }
  }

  function pickView(v: 'beads' | 'ring') {
    setView(v);
    try { localStorage.setItem('tasbeeh_view', v); } catch {}
  }
  function pickBead(v: BeadStyle) {
    setBstyle(v);
    try { localStorage.setItem('tasbeeh_beads', v); } catch {}
  }

  function toggleAuto(v: boolean) {
    setAuto(v);
    try {
      localStorage.setItem('tasbeeh_auto', v ? '1' : '0');
    } catch {}
  }

  // زر الصوت: الواجهة الظاهرة بس هي اللي تعدّ
  useEffect(() => {
    function onVol(e: Event) {
      const t = (e as CustomEvent<{ tab: string }>).detail?.tab;
      if (t === (multi ? 'multi' : 'tasbih')) tapRef.current();
    }
    window.addEventListener('volume-tap', onVol);
    return () => window.removeEventListener('volume-tap', onVol);
  }, [multi]);

  function reset() {
    save({ ...counts, [key]: 0 }, { ...rounds, [key]: 0 });
  }

  function pickPlain(i: number) {
    setPlainIdx(i);
    try {
      localStorage.setItem('tasbeeh_idx', String(i));
    } catch {}
  }

  function pickMulti(it: Item) {
    setSel(it);
    try {
      localStorage.setItem('tasbeeh_msel', it.text + '|' + it.label);
    } catch {}
    document
      .getElementById('tb-counter' + sfx)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function pickTarget(t: number) {
    setTarget(t);
    try {
      localStorage.setItem('tasbeeh_target' + sfx, String(t));
    } catch {}
  }

  const n = (v: number) => v.toLocaleString('ar-EG');
  const pct = target > 0 ? Math.min(100, (c / target) * 100) : 100;
  const R = 112;
  const C = 2 * Math.PI * R;
  const targets = multi ? T_MULTI : T_PLAIN;

  return (
    <>
      {multi && (
        <SectionChips
          items={[
            { id: 'tb-counter_m', label: 'العدّاد', icon: '📿' },
            { id: 'mg-subhan', label: 'سبحان الله', icon: '✨' },
            { id: 'mg-hamd', label: 'الحمد لله', icon: '🤲' },
            { id: 'mg-muslim', label: 'من صحيح مسلم', icon: '📖' },
          ]}
        />
      )}

      <section className="content-card tasbeeh" id={'tb-counter' + sfx}>
        <h2 className="section-title">{multi ? 'الذكر المضاعف' : 'السبحة'}</h2>

        {!multi && (
          <div className="tb-chips">
            {PLAIN.map((d, i) => (
              <button
                key={d}
                type="button"
                className={i === plainIdx ? 'tb-chip tb-on' : 'tb-chip'}
                onClick={() => pickPlain(i)}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        <div className="tb-chips" style={{ marginBottom: 6 }}>
          <button type="button" className={view === 'beads' ? 'tb-chip tb-on' : 'tb-chip'} onClick={() => pickView('beads')}>📿 مسبحة</button>
          <button type="button" className={view === 'ring' ? 'tb-chip tb-on' : 'tb-chip'} onClick={() => pickView('ring')}>⭕ عدّاد</button>
        </div>

        {view === 'beads' && (
          <>
            <BeadTasbih
              N={target > 0 && target <= 33 ? target : 33}
              c={c}
              taps={taps}
              style={bstyle}
              name={name}
              num={n(c)}
              of={target > 0 ? `من ${n(target)}` : 'بلا حد ∞'}
              onTap={tap}
            />
            <div className="tb-chips" style={{ marginTop: 4 }}>
              {BEAD_STYLES.map((b) => (
                <button key={b.id} type="button" className={b.id === bstyle ? 'tb-chip tb-on' : 'tb-chip'} onClick={() => pickBead(b.id)}>{b.label}</button>
              ))}
            </div>
            <p className="tb-source" style={{ opacity: 0.7, fontSize: '.8rem' }}>المس الحبّات أو اسحب بإبهامك لأعلى وأسفل لتمرير حبّة</p>
          </>
        )}

        {view === 'ring' && (
        <button type="button" className="tb-btn" onClick={tap} aria-label={`${name}: ${c}`}>
          <svg viewBox="0 0 260 260" className="tb-ring" aria-hidden="true">
            <circle cx="130" cy="130" r={R} fill="none" stroke="rgba(232,194,90,.15)" strokeWidth="8" />
            <circle
              cx="130" cy="130" r={R} fill="none" stroke="#f1d77a" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100}
              transform="rotate(-90 130 130)"
              style={{ transition: 'stroke-dashoffset .2s ease' }}
            />
          </svg>
          <span className={multi ? 'tb-name tb-name-sm' : 'tb-name'}>{name}</span>
          <span className="tb-num">{n(c)}</span>
          <span className="tb-of">{target > 0 ? `من ${n(target)}` : 'بلا حد ∞'}</span>
        </button>
        )}

        {multi && sel?.source && <p className="tb-source">{sel.source}</p>}

        <p className="tb-rounds">
          {r > 0 ? `أتممت ${n(r)} ${r === 1 ? 'دورة' : 'دورات'}` : ' '}
        </p>

        <div className="tb-targets">
          {targets.map((t) => (
            <button
              key={t}
              type="button"
              className={t === target ? 'tb-chip tb-on' : 'tb-chip'}
              onClick={() => pickTarget(t)}
            >
              {t > 0 ? n(t) : '∞'}
            </button>
          ))}
          <button type="button" className="tb-chip tb-reset" onClick={reset}>
            تصفير
          </button>
        </div>
        {multi && (
          <label className="tb-auto">
            <input type="checkbox" checked={auto} onChange={(e) => toggleAuto(e.target.checked)} /> الانتقال تلقائيًّا للصيغة التالية عند إتمام العدد
          </label>
        )}
      </section>

      {multi &&
        GROUPS.map((g) => (
          <section className="content-card" id={g.id} key={g.id}>
            <h2 className="section-title">{g.title}</h2>
            {g.note && <p className="tb-note">{g.note}</p>}
            <div className="tb-chips">
              {g.items.map((it) => (
                <button
                  key={it.label}
                  type="button"
                  className={
                    sel && sel.label === it.label && sel.text === it.text
                      ? 'tb-chip tb-on'
                      : 'tb-chip'
                  }
                  onClick={() => pickMulti(it)}
                >
                  {it.label}
                </button>
              ))}
            </div>
            {g.items[0]?.source && g.id !== 'mg-muslim' && (
              <p className="tb-source">{g.items[0].source}</p>
            )}
          </section>
        ))}

      <style>{`
        .tb-auto { display: block; margin-top: 12px; text-align: center; font-size: 13px; color: rgba(255,241,196,.8); }
        .tb-chips, .tb-targets { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .tb-chip { font-family: var(--font-ruqaa), serif; font-size: 1rem; padding: 7px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; cursor: pointer; }
        .tb-targets .tb-chip { font-family: var(--font-kufi), sans-serif; font-weight: 700; }
        .tb-on { background: rgba(232,194,90,.2); color: #f6e49c; }
        .tb-reset { border-color: rgba(255,150,120,.45); color: #ffb19c; }
        .tb-btn { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 18px auto 6px; width: 260px; max-width: 100%; aspect-ratio: 1; border-radius: 50%; border: 0; background: radial-gradient(circle at 50% 35%, rgba(232,194,90,.18), rgba(232,194,90,.04) 70%); cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        .tb-btn:active { transform: scale(.97); }
        .tb-ring { position: absolute; inset: 0; width: 100%; height: 100%; }
        .tb-name { font-family: var(--font-ruqaa), serif; font-size: 1.2rem; color: #fff1c4; max-width: 70%; line-height: 1.6; }
        .tb-name-sm { font-size: 1rem; max-width: 62%; line-height: 1.5; }
        .tb-num { font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 3.4rem; color: #f1d77a; line-height: 1.2; }
        .tb-of { font-family: var(--font-kufi), sans-serif; opacity: .7; font-size: .95rem; }
        .tb-rounds { font-family: var(--font-kufi), sans-serif; color: #e8c25a; min-height: 1.6em; margin: 8px 0 12px; text-align: center; }
        .tb-source { font-family: var(--font-ruqaa), serif; color: #c9a24a; text-align: center; line-height: 1.9; font-size: .95rem; margin: 6px 0; }
        .tb-note { font-family: var(--font-ruqaa), serif; text-align: center; line-height: 1.9; opacity: .9; margin: 0 0 12px; }
      `}</style>
    </>
  );
}

const TasbeehMemo = __memo(Tasbeeh);
export { TasbeehMemo as Tasbeeh };
