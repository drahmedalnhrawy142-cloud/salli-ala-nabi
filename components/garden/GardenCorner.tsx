'use client';

import { GardenShare } from './GardenShare';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SectionGrid } from '@/components/SectionGrid';
import { QuranText } from '@/components/quran/QuranText';
import { ayaIndex, loadQuran, toAr } from '@/components/quran/data';
import { GardenScene, MAX_PALMS } from './engine';
import { GARDEN_HADITH } from './ahadith';
import {
  GARDEN_EVENT,
  MILESTONES,
  gardenRead,
  gardenTap,
  gardenToggleHouse,
  gardenView,
  gardenNative,
  daysAway,
  todayKey,
  type GKind,
} from './store';

const DHIKR: { id: GKind; text: string; effect: string }[] = [
  { id: 'palm', text: 'سبحان الله العظيم وبحمده', effect: 'تُغرس لك نخلة في كل مرة' },
  { id: 'ikhlas', text: 'قل هو الله أحد', effect: 'قصر لكل عشر مرات' },
  { id: 'sub', text: 'سبحان الله', effect: 'غِراس الجنة: شجرة لكل ٣٣ ذكرًا من الأربعة' },
  { id: 'hamd', text: 'الحمد لله', effect: 'غِراس الجنة: شجرة لكل ٣٣ ذكرًا من الأربعة' },
  { id: 'tahl', text: 'لا إله إلا الله', effect: 'غِراس الجنة: شجرة لكل ٣٣ ذكرًا من الأربعة' },
  { id: 'akbar', text: 'الله أكبر', effect: 'غِراس الجنة: شجرة لكل ٣٣ ذكرًا من الأربعة' },
];

const MISS = [
  'بستانك اشتاق إليك… مرّ يوم بلا ذكر. اغرس اليوم نخلة تُسقيها بتسبيحة.',
  'الورود في بستانك تنتظر من يسقيها بذكر الله. عُد إليه ولو بتسبيحات قليلة.',
  'أنهارك هدأت قليلًا منذ غبت. كلمة طيبة تُجري الماء من جديد: سبحان الله وبحمده.',
  'لا تعاتب نفسك طويلًا؛ فأحب الأعمال إلى الله أدومها وإن قلّ. ابدأ الآن بتسبيحة.',
];

function stageName(N: number) {
  if (N < 25) return 'بذرة';
  if (N < 100) return 'أرض تخضرّ';
  if (N < 600) return 'روضة';
  if (N < 2000) return 'بستان';
  if (N < 7000) return 'جنّات';
  return 'جنّات وقصور';
}

function useGardenState() {
  const [s, setS] = useState(() => gardenRead());
  useEffect(() => {
    const f = () => setS(gardenRead());
    window.addEventListener(GARDEN_EVENT, f);
    window.addEventListener('storage', f);
    f();
    return () => {
      window.removeEventListener(GARDEN_EVENT, f);
      window.removeEventListener('storage', f);
    };
  }, []);
  return s;
}

function GardenView() {
  const s = useGardenState();
  const v = gardenView(s);
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const scene = useRef<GardenScene | null>(null);
  const [sel, setSel] = useState<GKind>('palm');
  const [bump, setBump] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    try {
      const k = localStorage.getItem('garden_sel') as GKind | null;
      if (k && DHIKR.some((d) => d.id === k)) setSel(k);
    } catch {}
  }, []);

  // إنشاء المشهد بمقاس الحاوية
  useEffect(() => {
    const el = wrap.current;
    const c = cv.current;
    if (!el || !c) return;
    const W = Math.max(280, Math.min(560, Math.round(el.clientWidth)));
    const H = Math.round(W * 1.12);
    c.style.width = `${W}px`;
    c.style.height = `${H}px`;
    const sc = new GardenScene(c, W, H, Math.min(2, window.devicePixelRatio || 1));
    scene.current = sc;
    sc.setView(gardenView());
    sc.start();
    const tick = setInterval(() => sc.setView(gardenView()), 60000);
    const vis = () => (document.hidden ? sc.stop() : sc.start());
    document.addEventListener('visibilitychange', vis);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      clearInterval(tick);
      sc.stop();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    scene.current?.setView(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.N, v.palms, v.palaces, v.houses, v.trees]);

  const pick = (k: GKind) => {
    setSel(k);
    try {
      localStorage.setItem('garden_sel', k);
    } catch {}
  };

  const tap = useCallback(() => {
    gardenTap(sel);
    setBump((b) => b + 1);
    try {
      if (navigator.vibrate) navigator.vibrate(12);
    } catch {}
  }, [sel]);

  const cur = DHIKR.find((d) => d.id === sel)!;
  const count = sel === 'palm' ? s.palm : sel === 'ikhlas' ? s.ikhlas : s.f[sel];
  const four = s.f.sub + s.f.hamd + s.f.tahl + s.f.akbar;
  const next = MILESTONES.find((m) => m.at > v.N);
  const prev = [...MILESTONES].reverse().find((m) => m.at <= v.N);
  const pct = next ? Math.round(((v.N - (prev?.at ?? 0)) / (next.at - (prev?.at ?? 0))) * 100) : 100;
  const houseToday = s.houses.includes(todayKey());

  const [away, setAway] = useState<number | null>(null);
  useEffect(() => setAway(daysAway()), [s.t]);
  const [rem, setRem] = useState<{ on: boolean; min: number } | null>(null);
  useEffect(() => {
    const n = gardenNative();
    if (!n?.gardenStatus) return;
    n.gardenStatus().then(setRem).catch(() => {});
    // مزامنة آخر يوم ذكر عند فتح البستان
    n.gardenSet?.({ last: localStorage.getItem('garden_last') || '' })?.catch?.(() => {});
  }, []);
  async function saveRem(next: { on: boolean; min: number }) {
    setRem(next);
    const w = window as unknown as { Capacitor?: { Plugins?: { FloatingButton?: { reminderRequestPermission?: () => Promise<void> } } } };
    try {
      if (next.on) await w.Capacitor?.Plugins?.FloatingButton?.reminderRequestPermission?.();
      await gardenNative()?.gardenSet?.({ on: next.on, min: next.min, last: localStorage.getItem('garden_last') || '' });
    } catch {}
  }
  const miss = away != null && away >= 1 && !(typeof document === 'undefined');

  return (
    <div className="gd">
      {miss && (
        <div className="gd-miss" role="status">
          <b>{away === 1 ? 'مرّ يوم' : `مرّت ${toAr(away!)} أيام`} منذ آخر ذكر</b>
          <span>{MISS[(away! + v.palms) % MISS.length]}</span>
        </div>
      )}
      <div ref={wrap} className="gd-scene">
        <canvas ref={cv} aria-label="بستانك" />
        <div className="gd-chip">
          <b>{stageName(v.N)}</b>
          <span>{toAr(v.N)} ذكرًا</span>
        </div>
      </div>

      <button type="button" className="gd-tap" onClick={tap} aria-label={`عُدّ ${cur.text}`}>
        <span className="gd-tap-n" key={bump}>
          {sel === 'ikhlas' ? toAr(s.ikhlas % 10) + ' / ١٠' : toAr(count)}
        </span>
        <span className="gd-tap-t">{cur.text}</span>
        {sel === 'ikhlas' && <span className="gd-tap-s">قصور: {toAr(v.palaces)}</span>}
        {(sel === 'sub' || sel === 'hamd' || sel === 'tahl' || sel === 'akbar') && (
          <span className="gd-tap-s">الأربعة معًا: {toAr(four)} (لكل ٣٣ شجرة)</span>
        )}
      </button>

      <div className="gd-stats">
        <div><b>{toAr(v.palms)}</b><span>نخلة{v.palms > MAX_PALMS ? ' (يظهر ١٤)' : ''}</span></div>
        <div><b>{toAr(v.trees)}</b><span>شجرة غِراس</span></div>
        <div><b>{toAr(v.palaces)}</b><span>قصر</span></div>
        <div><b>{toAr(v.houses)}</b><span>بيت</span></div>
      </div>

      <div className="gd-next">
        {next ? (
          <>
            <div className="gd-next-t">
              باقي {toAr(next.at - v.N)} ذكرًا: <b>{next.text}</b>
            </div>
            <div className="gd-bar"><i style={{ width: `${pct}%` }} /></div>
          </>
        ) : (
          <div className="gd-next-t">وصل بستانك لأعلى مراحله. زِد ما شئت من الذكر.</div>
        )}
      </div>

      <button type="button" className="gd-house" onClick={() => setShareOpen(true)}>
        📤 شارك بستانك أو أهدِ نخلة
      </button>
      {shareOpen && <GardenShare scene={cv.current} total={v.N} palms={v.palms} onClose={() => setShareOpen(false)} />}

      <h3 className="gd-h">سبحة البستان</h3>
      <div className="gd-chips">
        {DHIKR.map((d) => (
          <button key={d.id} type="button" className={`gd-c${d.id === sel ? ' on' : ''}`} onClick={() => pick(d.id)}>
            {d.text}
          </button>
        ))}
      </div>
      <p className="gd-eff">{cur.effect}</p>


      <button type="button" className={`gd-house${houseToday ? ' on' : ''}`} onClick={gardenToggleHouse}>
        {houseToday ? '✓ صليتُ اليوم ١٢ ركعة سنة (بيت في الجنة)' : 'صليتُ اليوم ١٢ ركعة سنة'}
      </button>

      {rem && (
        <div className="gd-rem">
          <button type="button" className={rem.on ? 'on' : ''} onClick={() => saveRem({ ...rem, on: !rem.on })}>
            {rem.on ? '🔔 تذكير البستان مفعّل' : '🔕 فعّل تذكير البستان (عتاب لطيف إن غبت)'}
          </button>
          {rem.on && (
            <label>
              وقت التذكير:
              <input
                type="time"
                value={`${String(Math.floor(rem.min / 60)).padStart(2, '0')}:${String(rem.min % 60).padStart(2, '0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  if (!Number.isNaN(h)) saveRem({ ...rem, min: h * 60 + (m || 0) });
                }}
              />
            </label>
          )}
          <p>يصلك إشعار في الوقت المحدد فقط إن لم تذكر الله في التطبيق ذلك اليوم.</p>
        </div>
      )}

      <p className="gd-note">
        المشهد تصوير رمزي لتحفيزك على الذكر، أما الجنة الحقيقية فوق ما نتخيل. وكل ما يُعدّ في التطبيق من أذكار (السبحة وأذكار اليوم
        والصلاة على النبي ﷺ) يُنمي بستانك.
      </p>

      <style>{`
        .gd-scene { position: relative; border-radius: 22px; overflow: hidden; border: 1px solid rgba(232,194,90,.4); background: #0b1a10; }
        .gd-scene canvas { display: block; margin: 0 auto; max-width: 100%; }
        .gd-chip { position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; gap: 2px; padding: 8px 14px; border-radius: 16px; background: rgba(10,18,10,.7); border: 1px solid rgba(232,194,90,.5); color: #f1d77a; font-family: var(--font-kufi), sans-serif; backdrop-filter: blur(4px); }
        .gd-chip b { font-size: 16px; }
        .gd-chip span { font-size: 12px; color: rgba(255,241,196,.8); }
        .gd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
        .gd-stats div { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px; border-radius: 16px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.78); }
        .gd-stats b { font-family: var(--font-kufi), sans-serif; font-size: 20px; color: #f1d77a; }
        .gd-stats span { font-family: var(--font-kufi), sans-serif; font-size: 11.5px; color: rgba(255,241,196,.7); text-align: center; }
        .gd-next { padding: 12px; border-radius: 16px; border: 1px solid rgba(232,194,90,.25); background: rgba(18,15,8,.7); }
        .gd-next-t { font-family: var(--font-ruqaa), serif; font-size: 16px; line-height: 1.8; color: #f7ebc1; }
        .gd-next-t b { color: #f1d77a; font-family: var(--font-kufi), sans-serif; }
        .gd-bar { height: 8px; border-radius: 6px; background: rgba(232,194,90,.15); margin-top: 8px; overflow: hidden; }
        .gd-bar i { display: block; height: 100%; background: linear-gradient(90deg, #8a5a12, #f1d77a); border-radius: 6px; transition: width .3s; }
        .gd-h { font-family: var(--font-kufi), sans-serif; font-size: 16px; color: #f1d77a; margin: 18px 0 8px; }
        .gd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .gd-c { padding: 8px 13px; border-radius: 999px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.78); color: #f7ebc1; font-family: var(--font-ruqaa), serif; font-size: 15px; cursor: pointer; }
        .gd-c.on { background: rgba(232,194,90,.24); border-color: #f1d77a; color: #fff1c4; }
        .gd-miss { display: flex; flex-direction: column; gap: 4px; margin: 0 0 10px; padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,150,90,.5); background: rgba(60,28,10,.55); color: #ffd9b0; font-family: var(--font-ruqaa), serif; font-size: 15px; line-height: 1.8; }
        .gd-miss b { font-family: var(--font-kufi), sans-serif; font-size: 14px; color: #ffb877; }
        .gd-rem { margin-top: 12px; padding: 12px; border-radius: 16px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.7); display: flex; flex-direction: column; gap: 8px; font-family: var(--font-kufi), sans-serif; color: #f7ebc1; font-size: 13.5px; }
        .gd-rem button { padding: 10px; border-radius: 14px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #f7ebc1; font-family: var(--font-kufi), sans-serif; font-size: 14px; }
        .gd-rem button.on { background: rgba(232,194,90,.2); color: #f1d77a; border-color: #f1d77a; }
        .gd-rem input { margin-inline-start: 8px; background: #1a1409; color: #f1d77a; border: 1px solid rgba(232,194,90,.4); border-radius: 8px; padding: 4px 8px; }
        .gd-rem p { margin: 0; font-family: var(--font-ruqaa), serif; font-size: 13px; color: rgba(255,241,196,.55); }
        .gd-eff { font-family: var(--font-ruqaa), serif; font-size: 14px; color: rgba(255,241,196,.65); margin: 8px 0 12px; }
        .gd-tap { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 10px; padding: 12px 10px; border-radius: 22px; border: 1.5px solid rgba(232,194,90,.6); background: radial-gradient(120% 100% at 50% 0%, rgba(232,194,90,.22), rgba(18,15,8,.9) 70%); color: #f1d77a; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; }
        .gd-tap:active { transform: scale(.97); }
        .gd-tap-n { font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 36px; line-height: 1; animation: gdpop .25s ease-out; }
        @keyframes gdpop { from { transform: scale(1.25); } to { transform: scale(1); } }
        .gd-tap-t { font-family: var(--font-ruqaa), serif; font-size: 18px; color: #fff1c4; }
        .gd-tap-s { font-family: var(--font-kufi), sans-serif; font-size: 12.5px; color: rgba(255,241,196,.65); }
        .gd-house { width: 100%; margin-top: 10px; padding: 12px; border-radius: 16px; border: 1px solid rgba(232,194,90,.35); background: rgba(18,15,8,.78); color: #f7ebc1; font-family: var(--font-kufi), sans-serif; font-size: 14px; cursor: pointer; }
        .gd-house.on { background: rgba(232,194,90,.2); border-color: #f1d77a; color: #f1d77a; }
        .gd-note { font-family: var(--font-ruqaa), serif; font-size: 13.5px; line-height: 1.9; color: rgba(255,241,196,.55); margin: 14px 0 0; }
      `}</style>
    </div>
  );
}

function Ahadith() {
  return (
    <div className="gh">
      {GARDEN_HADITH.map((h) => (
        <article key={h.id} className="gh-c">
          <p className="gh-t">« {h.text} »</p>
          {h.note && <p className="gh-n">{h.note}</p>}
          <div className="gh-m">
            <span>{h.narrator}</span>
            <span>{h.source}</span>
            <span className="gh-g">{h.grade}</span>
          </div>
        </article>
      ))}
      <style>{`
        .gh-c { margin: 0 0 12px; padding: 14px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.78); }
        .gh-t { font-family: var(--font-ruqaa), serif; font-size: 18px; line-height: 2.1; color: #f7ebc1; margin: 0 0 8px; }
        .gh-n { font-family: var(--font-ruqaa), serif; font-size: 14px; line-height: 1.9; color: rgba(255,241,196,.65); margin: 0 0 8px; }
        .gh-m { display: flex; flex-wrap: wrap; gap: 8px; font-family: var(--font-kufi), sans-serif; font-size: 12px; color: rgba(255,241,196,.7); }
        .gh-m span { padding: 3px 10px; border-radius: 999px; border: 1px solid rgba(232,194,90,.25); }
        .gh-g { color: #f1d77a; border-color: rgba(232,194,90,.6) !important; }
      `}</style>
    </div>
  );
}

function About() {
  const [aya, setAya] = useState('');
  useEffect(() => {
    let live = true;
    loadQuran()
      .then((d) => {
        const i = ayaIndex(d, 47, 15);
        if (live) setAya(d.ayas[i][4]);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="ga">
      <p>
        بستانك يكبر مع كل ذكر تعدّه في التطبيق: يخضرّ العشب، ويجري النهر، وتتفتح الورود، وتنبع العيون، ثم يظهر الذهب والقصور في المراحل
        المتقدمة. والنخيل والقصور والغِراس تظهر بحسب الأحاديث المذكورة في قسم «أحاديث الجنة».
      </p>
      {aya && (
        <p className="ga-q">
          <QuranText text={aya} />
          <span className="ga-r">سورة محمد، الآية ١٥</span>
        </p>
      )}
      <p className="ga-n">التصوير رمزي لا يُراد به وصف الجنة الحقيقية. وصورة النبي ﷺ لا تُرسم في التطبيق.</p>
      <style>{`
        .ga p { font-family: var(--font-ruqaa), serif; font-size: 16.5px; line-height: 2; color: #f7ebc1; margin: 0 0 12px; }
        .ga-q { padding: 14px; border-radius: 18px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.78); text-align: center; font-size: 20px !important; }
        .ga-r { display: block; font-family: var(--font-kufi), sans-serif; font-size: 12px; color: #e8c25a; margin-top: 6px; }
        .ga-n { font-size: 13.5px !important; color: rgba(255,241,196,.55) !important; }
      `}</style>
    </div>
  );
}

export function GardenCorner() {
  return (
    <SectionGrid
      secs={[
        { id: 'garden', label: 'بستاني', icon: '🌴', hint: 'يكبر مع كل ذكر', render: () => <GardenView /> },
        { id: 'ahadith', label: 'أحاديث الجنة', icon: '📜', hint: 'النخيل والقصور', render: () => <Ahadith /> },
        { id: 'about', label: 'عن البستان', icon: 'ℹ️', render: () => <About /> },
      ]}
    />
  );
}
