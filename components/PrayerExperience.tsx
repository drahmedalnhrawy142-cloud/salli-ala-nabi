
'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Celebration = {
  id: number;
  left: number;
};

const poems = [
  [
    'أَغَرُّ عَلَيْهِ لِلنُّبُوَّةِ خَاتَمٌ',
    'مِنَ اللَّهِ مَشْهُودٌ يَلُوحُ وَيُشْهَدُ',
  ],
  [
    'وَضَمَّ الْإِلَهُ اسْمَ النَّبِيِّ إِلَى اسْمِهِ',
    'إِذَا قَالَ فِي الْخَمْسِ الْمُؤَذِّنُ أَشْهَدُ',
  ],
  [
    'نَبِيٌّ أَتَانَا بَعْدَ يَأْسٍ وَفَتْرَةٍ',
    'مِنَ الرُّسُلِ وَالْأَوْثَانُ فِي الْأَرْضِ تُعْبَدُ',
  ],
  [
    'مُحَمَّدٌ سَيِّدُ الْكَوْنَيْنِ وَالثَّقَلَيْنِ',
    'وَالْفَرِيقَيْنِ مِنْ عُرْبٍ وَمِنْ عَجَمِ',
  ],
  [
    'نَبِيُّنَا الْآمِرُ النَّاهِي فَلَا أَحَدٌ',
    'أَبَرُّ فِي قَوْلِ لَا مِنْهُ وَلَا نَعَمِ',
  ],
  [
    'هُوَ الْحَبِيبُ الَّذِي تُرْجَى شَفَاعَتُهُ',
    'لِكُلِّ هَوْلٍ مِنَ الْأَهْوَالِ مُقْتَحَمِ',
  ],
  [
    'فَاقَ النَّبِيِّينَ فِي خَلْقٍ وَفِي خُلُقٍ',
    'وَلَمْ يُدَانُوهُ فِي عِلْمٍ وَلَا كَرَمٍ',
  ],
  [
    'وُلِدَ الْهُدَى فَالْكَائِنَاتُ ضِيَاءُ',
    'وَفَمُ الزَّمَانِ تَبَسُّمٌ وَثَنَاءُ',
  ],
  [
    'يَا خَيْرَ مَنْ جَاءَ الْوُجُودَ تَحِيَّةً',
    'مِنْ مُرْسَلِينَ إِلَى الْهُدَى بِكَ جَاءُوا',
  ],
  [
    'وَأَبْيَضَ يُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ',
    'ثِمَالُ الْيَتَامَى عِصْمَةٌ لِلْأَرَامِلِ',
  ],
  [
    'وَشَقَّ لَهُ مِنِ اسْمِهِ لِيُجِلَّهُ',
    'فَذُو الْعَرْشِ مَحْمُودٌ وَهَذَا مُحَمَّدُ',
  ],
  [
    'فَأَمْسَى سِرَاجًا مُسْتَنِيرًا وَهَادِيًا',
    'يَلُوحُ كَمَا لَاحَ الصَّقِيلُ الْمُهَنَّدُ',
  ],
  [
    'مُحَمَّدٌ صَفْوَةُ الْبَارِي وَرَحْمَتُهُ',
    'وَبُغْيَةُ اللَّهِ مِنْ خَلْقٍ وَمِنْ نَسَمِ',
  ],
  [
    'وَأَنْذَرَنَا نَارًا وَبَشَّرَ جَنَّةً',
    'وَعَلَّمَنَا الْإِسْلَامَ فَاللَّهَ نَحْمَدُ',
  ],
  [
    'وَمَا حَمَلَتْ مِنْ نَاقَةٍ فَوْقَ رَحْلِهَا',
    'أَعَفَّ وَأَوْفَى ذِمَّةً مِنْ مُحَمَّدِ',
  ],
  [
    'دَعَا إِلَى اللَّهِ فَالْمُسْتَمْسِكُونَ بِهِ',
    'مُسْتَمْسِكُونَ بِحَبْلٍ غَيْرِ مُنْفَصِمِ',
  ],
  [
    'أَلَا إِنَّ خَيْرَ النَّاسِ نَفْسًا وَوَالِدًا',
    'إِذَا عُدَّ سَادَاتُ الْبَرِيَّةِ أَحْمَدُ',
  ],
];

type FloatingPlugin = {
  status(): Promise<{ permission: boolean; running: boolean }>;
  requestPermission(): Promise<void>;
  start(options: {
    url: string;
    key: string;
    goal: number;
    today: number;
    haptic: boolean;
  }): Promise<void>;
  stop(): Promise<void>;
  setProgress(options: { goal: number; today: number }): Promise<void>;
  getPending(): Promise<{ count: number }>;
};

// الزرار العايم موجود في تطبيق الأندرويد فقط، مش في الموقع
function getFloating(): FloatingPlugin | null {
  const w = window as unknown as {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: Record<string, unknown>;
    };
  };
  if (!w.Capacitor?.isNativePlatform?.()) return null;
  return (w.Capacitor.Plugins?.FloatingButton as FloatingPlugin) ?? null;
}

const goalOptions = [10, 33, 100, 300, 1000];

function dayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA');
}

const salawat =
  'عَدَدَ مَا صَلَّى عَلَيْكَ اللهُ جَلَّ جَلَالُهُ، وَمَلَائِكَتُهُ، وَجَمِيعُ خَلْقِهِ، وَكَمَا يَلِيقُ بِصَلَاتِهِ، سَلَّمَ وَصَلَّى عَلَيْكَ اللهُ يَا خَيْرَ الوَرَى إِلَى يَوْمِ الدِّينِ، عَنِّي وَعَنْ وَالِدَيَّ وَالمُسْلِمِينَ';

export function PrayerExperience() {
  const [count, setCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [globalCount, setGlobalCount] = useState(0);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [poemIndex, setPoemIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [goal, setGoal] = useState(100);
  const [streak, setStreak] = useState(0);
  const [haptic, setHaptic] = useState(true);
  const [goalDone, setGoalDone] = useState(false);
  const [floatSupported, setFloatSupported] = useState(false);
  const [floatPerm, setFloatPerm] = useState(false);
  const [floatOn, setFloatOn] = useState(false);
  const nextId = useRef(0);
  const lastCelebrationAt = useRef(0);
  const chamberLightRef = useRef<HTMLDivElement | null>(null);
  // نخبّي الصفحة لحد ما التنسيقات تتحمّل، علشان ما تظهرش مفككة لثواني عند فتح التطبيق
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const savedCount = Number(
      localStorage.getItem('prayer_personal_count') || 0
    );
    setCount(savedCount);

    const today = new Date().toLocaleDateString('en-CA');
    const savedDate = localStorage.getItem('prayer_count_date');
    const savedToday = Number(
      localStorage.getItem('prayer_today_count') || 0
    );

    if (savedDate === today) {
      setTodayCount(savedToday);
    } else {
      localStorage.setItem('prayer_count_date', today);
      localStorage.setItem('prayer_today_count', '0');
      setTodayCount(0);
    }

    const savedGoal = Number(localStorage.getItem('prayer_goal') || 100);
    if (savedGoal > 0) setGoal(savedGoal);
    setHaptic(localStorage.getItem('prayer_haptic') !== 'off');

    const streakDate = localStorage.getItem('prayer_streak_date');
    const savedStreak = Number(
      localStorage.getItem('prayer_streak') || 0
    );
    if (streakDate === today || streakDate === dayKey(-1)) {
      setStreak(savedStreak);
    }

    loadGlobalCount();
  }, []);

  // صلوات اتعملت من الزرار العايم: نضيفها للعدادات هنا
  function applyExternalPrayers(n: number) {
    const today = dayKey();
    const total = Number(localStorage.getItem('prayer_personal_count') || 0) + n;
    const base =
      localStorage.getItem('prayer_count_date') === today
        ? Number(localStorage.getItem('prayer_today_count') || 0)
        : 0;
    const nextToday = base + n;

    localStorage.setItem('prayer_personal_count', String(total));
    localStorage.setItem('prayer_count_date', today);
    localStorage.setItem('prayer_today_count', String(nextToday));
    setCount(total);
    setTodayCount(nextToday);

    if (localStorage.getItem('prayer_streak_date') !== today) {
      const yesterday = localStorage.getItem('prayer_streak_date') === dayKey(-1);
      const nextStreak = yesterday
        ? Number(localStorage.getItem('prayer_streak') || 0) + 1
        : 1;
      localStorage.setItem('prayer_streak', String(nextStreak));
      localStorage.setItem('prayer_streak_date', today);
      setStreak(nextStreak);
    }

    loadGlobalCount();
  }

  // متابعة الزرار العايم: الحالة + الصلوات الجديدة
  useEffect(() => {
    const fp = getFloating();
    if (!fp) return;
    setFloatSupported(true);

    let stopped = false;
    async function sync() {
      if (!fp || stopped) return;
      try {
        const st = await fp.status();
        setFloatPerm(st.permission);
        setFloatOn(st.running);
        const pending = await fp.getPending();
        if (pending.count > 0) applyExternalPrayers(pending.count);
      } catch (error) {
        console.error('تعذر قراءة حالة الزرار العايم:', error);
      }
    }

    sync();
    const timer = window.setInterval(sync, 2000);
    document.addEventListener('visibilitychange', sync);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  // الحلقة الذهبية على الزرار العايم تتحدّث مع هدفك وعدّاد اليوم
  useEffect(() => {
    const fp = getFloating();
    if (fp && floatOn) {
      fp.setProgress({ goal, today: todayCount }).catch(() => {});
    }
  }, [goal, todayCount, floatOn]);

  async function toggleFloating() {
    const fp = getFloating();
    if (!fp) return;
    try {
      if (!floatPerm) {
        await fp.requestPermission();
        return;
      }
      if (floatOn) {
        await fp.stop();
        setFloatOn(false);
      } else {
        await fp.start({
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          goal,
          today: todayCount,
          haptic,
        });
        setFloatOn(true);
      }
    } catch (error) {
      console.error('تعذر تشغيل الزرار العايم:', error);
    }
  }

  function chooseGoal(value: number) {
    setGoal(value);
    setGoalDone(false);
    localStorage.setItem('prayer_goal', String(value));
  }

  function toggleHaptic() {
    const next = !haptic;
    setHaptic(next);
    localStorage.setItem('prayer_haptic', next ? 'on' : 'off');
    if (next && navigator.vibrate) navigator.vibrate(25);
  }

  async function loadGlobalCount() {
    try {
      const { data, error } = await supabase
        .from('prayer_stats')
        .select('total_count')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setGlobalCount(Number(data.total_count || 0));
    } catch (error) {
      console.error('تعذر تحميل إجمالي الصلوات:', error);
    } finally {
      setGlobalLoading(false);
    }
  }

  async function incrementGlobalCount() {
    try {
      const { data, error } = await supabase.rpc(
        'increment_prayer_count'
      );

      if (error) throw error;
      setGlobalCount(Number(data));
    } catch (error) {
      console.error('تعذر تحديث إجمالي الصلوات:', error);
    }
  }

  function addPrayer() {
    const nextCount = count + 1;
    const today = new Date().toLocaleDateString('en-CA');
    const savedDate = localStorage.getItem('prayer_count_date');
    const nextToday = savedDate === today ? todayCount + 1 : 1;

    setCount(nextCount);
    setTodayCount(nextToday);

    localStorage.setItem('prayer_personal_count', String(nextCount));
    localStorage.setItem('prayer_count_date', today);
    localStorage.setItem('prayer_today_count', String(nextToday));

    const streakDate = localStorage.getItem('prayer_streak_date');
    let nextStreak = Number(localStorage.getItem('prayer_streak') || 0);
    if (streakDate !== today) {
      nextStreak = streakDate === dayKey(-1) ? nextStreak + 1 : 1;
      localStorage.setItem('prayer_streak', String(nextStreak));
      localStorage.setItem('prayer_streak_date', today);
    }
    setStreak(nextStreak);

    if (nextToday === goal) {
      setGoalDone(true);
      if (haptic && navigator.vibrate) navigator.vibrate([40, 60, 40, 60, 90]);
    } else if (haptic && navigator.vibrate) {
      navigator.vibrate(20);
    }

    incrementGlobalCount();

    // لو الضغط سريع جدًا: العدّ يتحسب، بس الرسوم المتحركة نقللها علشان التطبيق ما يتقلش
    const now = Date.now();
    if (now - lastCelebrationAt.current < 250) return;
    lastCelebrationAt.current = now;
    lightUpChamber();

    const id = ++nextId.current;

    setCelebrations((old) => [
      ...old.slice(-2),
      {
        id,
        left: 35 + Math.random() * 30,
      },
    ]);

    window.setTimeout(() => {
      setCelebrations((old) =>
        old.filter((item) => item.id !== id)
      );
    }, 3600);
  }

  // نور أبيض ينوّر الضريح من جوه (من ورا الأسوار) بعد ما سهم النور يوصل،
  // ويكمل من القيمة الحالية لو الزائر ضغط أكتر من مرة.
  function lightUpChamber() {
    const el = chamberLightRef.current;

    if (!el || typeof el.animate !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    el.animate(
      [
        { opacity: 1, offset: 0.16, easing: 'ease-in-out' },
        { opacity: 0.75, offset: 0.42, easing: 'ease-out' },
        { opacity: 0, offset: 1 },
      ],
      { duration: 3200, delay: 1500, easing: 'linear' }
    );
  }

  function changePoem() {
    setPoemIndex((old) => (old + 1) % poems.length);
    setCopied(false);
  }

  async function copyPoem() {
    try {
      await navigator.clipboard.writeText(
        poems[poemIndex].join('\n')
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('تعذر نسخ الأبيات:', error);
    }
  }

  return (
    <main
      className="prayer-experience"
      dir="rtl"
      style={{ visibility: ready ? 'visible' : 'hidden' }}
    >
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #050304;
        }

        .prayer-experience {
          min-height: 100vh;
          overflow: hidden;
          color: #f8f5ed;
          background:
            radial-gradient(
              ellipse at 50% 8%,
              rgba(176, 118, 38, 0.2),
              transparent 48%
            ),
            linear-gradient(
              180deg,
              #050304 0%,
              #140a06 48%,
              #070304 100%
            );
          font-family: Tahoma, Arial, sans-serif;
          text-align: center;
        }

        .sky-scene {
          min-height: 720px;
          height: 100svh;
          max-height: 1000px;
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(
              circle at 50% 58%,
              rgba(214, 150, 52, 0.16),
              transparent 38%
            ),
            linear-gradient(
              180deg,
              #040203 0%,
              #120805 52%,
              #22110a 100%
            );
        }

        .sky-scene::before,
        .sky-scene::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background-image:
            radial-gradient(2px 2px at 12% 18%, #ffe7a3 50%, transparent 100%),
            radial-gradient(1px 1px at 28% 32%, #f2c76a 50%, transparent 100%),
            radial-gradient(2px 2px at 76% 14%, #ffd98a 50%, transparent 100%),
            radial-gradient(1px 1px at 88% 42%, #fff1cc 50%, transparent 100%),
            radial-gradient(2px 2px at 52% 24%, #f2c76a 50%, transparent 100%),
            radial-gradient(1px 1px at 42% 9%, #fff1cc 50%, transparent 100%),
            radial-gradient(1px 1px at 18% 57%, #ffd98a 50%, transparent 100%),
            radial-gradient(2px 2px at 83% 62%, #f2c76a 50%, transparent 100%);
          background-size: 310px 290px;
          animation: stars-twinkle 4s ease-in-out infinite alternate;
        }

        .sky-scene::after {
          opacity: 0.5;
          transform: translateY(40px);
          animation-delay: 1.5s;
          background-size: 230px 250px;
        }

        @keyframes stars-twinkle {
          from { opacity: 0.25; }
          to { opacity: 1; }
        }

        .sky-glow {
          position: absolute;
          width: 75vw;
          height: 75vw;
          max-width: 600px;
          max-height: 600px;
          border-radius: 50%;
          background: rgba(226, 160, 60, 0.1);
          filter: blur(65px);
          top: 8%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 0;
        }

        .scene-image {
          position: absolute;
          z-index: 2;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 43%;
          background-image:
            linear-gradient(
              180deg,
              #120805 0%,
              rgba(24, 12, 6, 0.35) 28%,
              rgba(0, 0, 0, 0.18) 100%
            ),
            url('/images/c5a8d5c4609027ede5212a874381354e.jpg');
          background-size: cover;
          background-position: center 38%;
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 22%,
            black 100%
          );
        }

        .scene-image::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 35%,
            rgba(4, 2, 1, 0.55) 100%
          );
        }

        .prayer-button {
          position: absolute;
          z-index: 5;
          bottom: 28px;
          left: 6%;
          width: 88%;
          min-height: 76px;
          border: 1px solid rgba(255, 232, 177, 0.9);
          border-radius: 24px;
          color: #173453;
          background: linear-gradient(
            135deg,
            #fff7db 0%,
            #e7c779 48%,
            #cda44f 100%
          );
          box-shadow:
            0 8px 35px rgba(0, 0, 0, 0.35),
            0 0 35px rgba(245, 211, 137, 0.2),
            inset 0 1px rgba(255, 255, 255, 0.8);
          font-size: clamp(18px, 4.5vw, 24px);
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .prayer-button:active {
          transform: scale(0.97);
        }

        .celebration {
          position: absolute;
          z-index: 4;
          bottom: 110px;
          pointer-events: none;
          width: 1px;
          height: 1px;
        }

        /* الكرة الزجاجية وبداخلها ﷺ */
        .celebration-orb {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.9);
          background: radial-gradient(
            circle at 35% 25%,
            rgba(255, 255, 255, 0.95),
            rgba(255, 244, 222, 0.48) 35%,
            rgba(255, 200, 110, 0.18) 72%,
            rgba(255, 255, 255, 0.08) 100%
          );
          box-shadow:
            inset -5px -5px 12px rgba(255, 190, 100, 0.2),
            0 0 20px 8px rgba(255, 224, 160, 0.5);
          will-change: transform, opacity;
          animation: orb-flight 1s cubic-bezier(.2, .7, .25, 1) forwards;
        }

        .orb-text {
          color: #b68a38;
          font-size: 17px;
          font-weight: 900;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.9);
        }

        @keyframes orb-flight {
          0% {
            transform: translate(-50%, 0) scale(0.55);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -60vh) scale(1.25);
            opacity: 0;
          }
        }

        /* الانفجار في نفس نقطة وصول الكرة */
        .celebration-burst {
          position: absolute;
          left: 0;
          bottom: 60vh;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff8d9;
          box-shadow: 0 0 22px 12px rgba(255, 215, 120, 0.8);
          opacity: 0;
          will-change: transform, opacity;
          animation: golden-burst 1.2s 0.95s ease-out forwards;
        }

        .celebration-burst::before,
        .celebration-burst::after {
          content: '';
          position: absolute;
          inset: -24px;
          border: 2px solid rgba(255, 226, 153, 0.8);
          border-radius: 50%;
          animation: burst-ring 1s 1s ease-out forwards;
        }

        .celebration-burst::after {
          inset: -42px;
          animation-delay: 1.08s;
        }

        @keyframes golden-burst {
          0% {
            transform: translate(-50%, 50%) scale(0.1);
            opacity: 0;
          }
          25% {
            transform: translate(-50%, 50%) scale(3.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 50%) scale(0.7);
            opacity: 0;
          }
        }

        @keyframes burst-ring {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }

        /* العبارة تخرج من مركز الانفجار */
        .celebration-message {
          position: absolute;
          left: 0;
          bottom: calc(60vh + 7px);
          width: max-content;
          max-width: 90vw;
          color: #ffe5a0;
          font-size: clamp(19px, 5vw, 28px);
          font-weight: 900;
          text-shadow: 0 0 12px rgba(255, 208, 105, 0.95);
          opacity: 0;
          will-change: transform, opacity;
          transform: translate(-50%, 50%) scale(0.15);
          animation: message-appear 2s 1.05s ease-out forwards;
        }

        @keyframes message-appear {
          0% {
            opacity: 0;
            transform: translate(-50%, 50%) scale(0.15);
          }
          22% {
            opacity: 1;
            transform: translate(-50%, 50%) scale(1.12);
          }
          65% {
            opacity: 1;
            transform: translate(-50%, 25%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.9);
          }
        }

        .content-area {
          position: relative;
          z-index: 3;
          width: min(100% - 32px, 720px);
          margin: -1px auto 0;
          padding: 30px 0 55px;
        }

        .content-card {
          margin-bottom: 18px;
          padding: 25px 20px;
          border: 1px solid rgba(232, 180, 80, 0.3);
          border-radius: 25px;
          background: linear-gradient(
            145deg,
            rgba(34, 18, 10, 0.88),
            rgba(10, 5, 4, 0.94)
          );
          box-shadow:
            0 15px 45px rgba(0, 0, 0, 0.16),
            inset 0 1px rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(12px);
        }

        .section-title {
          margin: 0 0 15px;
          color: #f2d58e;
          font-size: 19px;
          font-weight: 800;
        }

        .hadith-text {
          margin: 0;
          color: #fff8e8;
          font-size: 18px;
          line-height: 2.1;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .stat-card {
          padding: 20px 10px;
          border: 1px solid rgba(224, 201, 147, 0.28);
          border-radius: 19px;
          background: rgba(0, 0, 0, 0.38);
        }

        .stat-card.global-stat {
          grid-column: 1 / -1;
          background: rgba(139, 105, 43, 0.16);
          border-color: rgba(242, 213, 142, 0.45);
        }

        .stat-number {
          display: block;
          color: #f2d58e;
          font-size: 29px;
          font-weight: 900;
          direction: ltr;
        }

        .stat-label {
          display: block;
          margin-top: 7px;
          color: #e4dede;
          font-size: 13px;
        }

        .salawat-text {
          margin: 0;
          color: #fff1d0;
          font-size: 18px;
          line-height: 2.2;
          text-align: center;
        }

        .poem-line {
          margin: 9px 0;
          color: #fff7e8;
          font-size: 19px;
          font-weight: 700;
          line-height: 2;
        }

        .poem-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 17px;
        }

        .poem-change,
        .poem-copy {
          padding: 12px 23px;
          border: 1px solid rgba(242, 213, 142, 0.45);
          border-radius: 15px;
          color: #f4d991;
          background: rgba(242, 213, 142, 0.08);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .poem-copy {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #fff4d8;
          background: rgba(255, 255, 255, 0.07);
        }

        .poem-copy:active,
        .poem-change:active {
          transform: scale(0.97);
        }


        /* نور أبيض من داخل الضريح: يظهر فقط من فتحات الشبكة، والأسوار قدامه */
        .chamber-light {
          position: absolute;
          z-index: 3;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 43%;
          pointer-events: none;
          opacity: 0;
          mix-blend-mode: screen;
          background:
            radial-gradient(
              ellipse 24% 22% at 50% 50%,
              rgba(255, 255, 255, 1) 0%,
              rgba(255, 255, 255, 0) 100%
            ),
            radial-gradient(
              ellipse 74% 66% at 50% 48%,
              rgba(250, 252, 255, 0.95) 0%,
              rgba(232, 242, 255, 0.55) 46%,
              rgba(220, 234, 255, 0) 82%
            );
          --chamber-mask: url('data:image/png;base64,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');
          -webkit-mask-image: var(--chamber-mask);
          mask-image: var(--chamber-mask);
          -webkit-mask-size: cover;
          mask-size: cover;
          -webkit-mask-position: center 38%;
          mask-position: center 38%;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
        }

        /* سهم النور النازل من الانفجار إلى الضريح */
        .light-descent {
          position: absolute;
          z-index: 3;
          width: 40px;
          margin-left: -20px;
          bottom: 25%;
          height: calc(110px + 60vh - 25%);
          pointer-events: none;
        }

        /* رأس سهم أبيض منوّر وراه ذيل قصير */
        .light-head {
          position: absolute;
          left: 50%;
          top: 0;
          width: 18px;
          height: 30px;
          opacity: 0;
          transform: translate(-50%, -50%);
          filter:
            drop-shadow(0 0 5px #ffffff)
            drop-shadow(0 0 14px rgba(225, 238, 255, 0.85));
          animation:
            head-move 0.55s 1s cubic-bezier(0.5, 0, 0.9, 0.55) both,
            head-glow 0.95s 1s linear both;
        }

        .light-head::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #ffffff;
          clip-path: polygon(50% 100%, 0% 0%, 50% 32%, 100% 0%);
        }

        /* ذيل قصير وبسيط ورا رأس السهم فقط */
        .light-head::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 62%;
          width: 3px;
          height: 80px;
          margin-left: -1.5px;
          border-radius: 3px;
          background: linear-gradient(
            to top,
            rgba(255, 255, 255, 0.95),
            rgba(255, 255, 255, 0)
          );
        }

        .light-impact {
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 110px;
          height: 110px;
          margin: 0 0 -55px -55px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(235, 244, 255, 0.5) 38%,
            rgba(220, 234, 255, 0) 70%
          );
          opacity: 0;
          transform: scale(0.2);
          animation: light-impact 1s 1.5s ease-out both;
        }

        @keyframes head-move {
          from { top: 0%; }
          to { top: 100%; }
        }

        @keyframes head-glow {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          58% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
          }
        }

        @keyframes light-impact {
          0% {
            opacity: 0;
            transform: scale(0.2);
          }
          25% {
            opacity: 1;
            transform: scale(0.9);
          }
          100% {
            opacity: 0;
            transform: scale(1.6);
          }
        }

        @media (min-width: 700px) {
          .sky-scene {
            min-height: 850px;
          }

          .scene-image {
            height: 48%;
            background-position: center 42%;
          }

          .chamber-light {
            height: 48%;
            -webkit-mask-position: center 42%;
            mask-position: center 42%;
          }

          .light-descent {
            bottom: 28%;
            height: calc(110px + 60vh - 28%);
          }

          .prayer-button {
            left: 50%;
            width: min(600px, 76%);
            transform: translateX(-50%);
          }

          .prayer-button:active {
            transform: translateX(-50%) scale(0.97);
          }

          .content-card {
            padding: 32px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sky-scene::before,
          .sky-scene::after,
          .celebration-orb,
          .celebration-burst,
          .celebration-burst::before,
          .celebration-burst::after,
          .celebration-message,
          .light-head,
          .light-impact {
            animation-duration: 0.01ms !important;
          }
        }

        .goal-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .goal-progress-text {
          font-size: 1.1rem;
          font-weight: 700;
          color: #f4d98a;
        }

        .streak-badge {
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.95rem;
          color: #ffe7a8;
          background: rgba(255, 190, 80, 0.14);
          border: 1px solid rgba(255, 214, 120, 0.35);
        }

        .goal-bar {
          height: 12px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
        }

        .goal-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #d9a441, #ffe39a);
          transition: width 0.5s ease;
        }

        .goal-done {
          margin: 14px 0 0;
          text-align: center;
          color: #ffe39a;
          font-weight: 700;
        }

        .goal-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .goal-chip,
        .haptic-toggle {
          font: inherit;
          cursor: pointer;
          color: #f4e7c0;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 214, 120, 0.3);
          border-radius: 999px;
          padding: 8px 16px;
        }

        .goal-chip-on {
          color: #1c2540;
          font-weight: 700;
          background: #ffe39a;
          border-color: #ffe39a;
        }

        .haptic-toggle {
          margin-top: 14px;
        }

        .float-note {
          margin: 0 0 4px;
          line-height: 1.9;
          color: #dfe8f5;
        }

        @media (prefers-reduced-motion: reduce) {
          .goal-bar-fill {
            transition: none;
          }
        }
      `}</style>

      <section className="sky-scene" aria-label="سماء الصلاة على النبي">
        <div className="sky-glow" />
        <div className="scene-image" />
        <div className="chamber-light" ref={chamberLightRef} />

        {celebrations.map((item) => (
          <Fragment key={item.id}>
            <div
              className="celebration"
              style={{ left: `${item.left}%` }}
            >
              <div className="celebration-orb">
                <span className="orb-text">ﷺ</span>
              </div>

              <div className="celebration-burst" />

              <div className="celebration-message">
                صلّى الله عليك عشرًا
              </div>
            </div>

            <div
              className="light-descent"
              style={{ left: `${item.left}%` }}
            >
              <div className="light-head" />
              <div className="light-impact" />
            </div>
          </Fragment>
        ))}

        <button
          type="button"
          className="prayer-button"
          onClick={addPrayer}
        >
          هنا الصلاة والسلام على رسول الله ﷺ
        </button>
      </section>

      <div className="content-area">
        <section className="content-card">
          <h2 className="section-title">حديث النبي ﷺ</h2>
          <p className="hadith-text">
            «مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً؛
            صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا»
          </p>
        </section>

        <section className="content-card">
          <h2 className="section-title">عدادات الصلوات</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">
                {count.toLocaleString('ar-EG')}
              </span>
              <span className="stat-label">إجمالي صلواتك</span>
            </div>

            <div className="stat-card">
              <span className="stat-number">
                {todayCount.toLocaleString('ar-EG')}
              </span>
              <span className="stat-label">صلواتك اليوم</span>
            </div>

            <div className="stat-card global-stat">
              <span className="stat-number">
                {globalLoading
                  ? '...'
                  : globalCount.toLocaleString('ar-EG')}
              </span>
                            <span className="stat-label">
                إجمالي صلوات جميع زوار الموقع
              </span>
            </div>
          </div>
        </section>

        <section className="content-card">
          <h2 className="section-title">هدفك اليومي</h2>

          <div className="goal-top">
            <span className="goal-progress-text">
              {Math.min(todayCount, goal).toLocaleString('ar-EG')} من{' '}
              {goal.toLocaleString('ar-EG')}
            </span>
            <span className="streak-badge">
              🔥 {streak.toLocaleString('ar-EG')}{' '}
              {streak === 1 ? 'يوم متتالي' : 'أيام متتالية'}
            </span>
          </div>

          <div
            className="goal-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={Math.min(todayCount, goal)}
          >
            <div
              className="goal-bar-fill"
              style={{
                width: `${Math.min(100, (todayCount / goal) * 100)}%`,
              }}
            />
          </div>

          {(goalDone || todayCount >= goal) && (
            <p className="goal-done">
              ما شاء الله، أتممت هدفك اليوم. تقبّل الله منك ﷺ
            </p>
          )}

          <div className="goal-options">
            {goalOptions.map((value) => (
              <button
                type="button"
                key={value}
                className={
                  value === goal ? 'goal-chip goal-chip-on' : 'goal-chip'
                }
                onClick={() => chooseGoal(value)}
              >
                {value.toLocaleString('ar-EG')}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="haptic-toggle"
            onClick={toggleHaptic}
          >
            {haptic ? '📳 الاهتزاز: مفعّل' : '📴 الاهتزاز: متوقف'}
          </button>
        </section>

        {floatSupported && (
          <section className="content-card">
            <h2 className="section-title">الأيقونة العايمة</h2>
            <p className="float-note">
              زرار صغير بصورة اللوحة الذهبية يظهر فوق كل التطبيقات. دوس عليه
              للصلاة على النبي ﷺ وإنت بتتصفح، والحلقة الذهبية بتوريك تقدمك في
              هدفك اليوم. اسحبه لأي مكان، واسحبه على ✕ لإغلاقه.
            </p>
            <button
              type="button"
              className="haptic-toggle"
              onClick={toggleFloating}
            >
              {!floatPerm
                ? 'السماح بالظهور فوق التطبيقات'
                : floatOn
                  ? 'إيقاف الأيقونة العايمة'
                  : 'تشغيل الأيقونة العايمة'}
            </button>
            {!floatPerm && (
              <p className="float-note">
                هيفتح لك الإعدادات: فعّل الخيار، وارجع للتطبيق.
              </p>
            )}
          </section>
        )}

        {/* نص الصلاة موجود بدون عنوان */}
        <section className="content-card">
          <p className="salawat-text">{salawat}</p>
        </section>

        <section className="content-card">
          <h2 className="section-title">من مدح رسول الله ﷺ</h2>

          {poems[poemIndex].map((line, index) => (
            <p className="poem-line" key={index}>
              {line}
            </p>
          ))}

          <div className="poem-actions">
            <button
              type="button"
              className="poem-copy"
              onClick={copyPoem}
            >
              {copied ? '✓ تم النسخ' : '⧉ نسخ الأبيات'}
            </button>

            <button
              type="button"
              className="poem-change"
              onClick={changePoem}
            >
              تغيير الأبيات
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default PrayerExperience;
