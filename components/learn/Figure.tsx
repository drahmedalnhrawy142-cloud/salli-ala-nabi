'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * مصلٍّ مجهول الملامح (بلا وجه) برسم جانبي، يتحرك بين الهيئات.
 * لا يُرسم نبيٌّ ولا صحابي: هذا مجرد شخص يوضّح الهيئة.
 * الإحداثيات على لوحة ٣٠٠×٢٦٠، والقبلة إلى اليسار، والأرض عند y=232.
 */
type P = [number, number];
export type Pose = {
  head: P; sh: P; hip: P; knee: P; ank: P; toe: P; elb: P; wr: P;
  finger?: number; // ١ = السبّابة مرفوعة
  turn?: number; // التفاتة الرأس للتسليم
  seven?: boolean; // إبراز الأعضاء السبعة
};

export const POSES: Record<string, Pose> = {
  stand: { head: [150, 46], sh: [150, 76], hip: [150, 128], knee: [150, 180], ank: [150, 226], toe: [136, 229], elb: [140, 106], wr: [130, 92] },
  takbir: { head: [150, 46], sh: [150, 76], hip: [150, 128], knee: [150, 180], ank: [150, 226], toe: [136, 229], elb: [148, 104], wr: [134, 64] },
  chest: { head: [150, 46], sh: [150, 76], hip: [150, 128], knee: [150, 180], ank: [150, 226], toe: [136, 229], elb: [142, 108], wr: [128, 94] },
  ruku: { head: [78, 122], sh: [112, 118], hip: [176, 124], knee: [172, 178], ank: [172, 226], toe: [158, 229], elb: [142, 150], wr: [170, 176] },
  rise: { head: [150, 46], sh: [150, 76], hip: [150, 128], knee: [150, 180], ank: [150, 226], toe: [136, 229], elb: [152, 112], wr: [154, 142] },
  sujud: { head: [86, 214], sh: [128, 186], hip: [198, 150], knee: [168, 212], ank: [212, 222], toe: [198, 227], elb: [146, 188], wr: [106, 222], seven: true },
  jalsa: { head: [182, 98], sh: [182, 126], hip: [190, 190], knee: [136, 212], ank: [194, 226], toe: [180, 229], elb: [176, 162], wr: [148, 200] },
  tashahhud: { head: [182, 98], sh: [182, 126], hip: [190, 190], knee: [136, 212], ank: [194, 226], toe: [180, 229], elb: [176, 164], wr: [150, 196], finger: 1 },
  taslim: { head: [182, 98], sh: [182, 126], hip: [190, 190], knee: [136, 212], ank: [194, 226], toe: [180, 229], elb: [176, 162], wr: [148, 200], turn: 1 },
};

const KEYS = ['head', 'sh', 'hip', 'knee', 'ank', 'toe', 'elb', 'wr'] as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function Figure({ pose, ms = 700, label }: { pose: string; ms?: number; label?: string }) {
  const target = POSES[pose] || POSES.stand;
  const [cur, setCur] = useState<Pose>(target);
  const from = useRef<Pose>(target);
  const raf = useRef(0);
  useEffect(() => {
    const a = from.current;
    const t0 = performance.now();
    cancelAnimationFrame(raf.current);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = ease(k);
      const n: Pose = { ...target } as Pose;
      for (const key of KEYS) n[key] = [lerp(a[key][0], target[key][0], e), lerp(a[key][1], target[key][1], e)];
      n.turn = lerp(a.turn || 0, target.turn || 0, e);
      setCur(n);
      from.current = n;
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose]);

  const c = cur;
  const L = (a: P, b: P) => `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
  const seven = !!target.seven;
  const cloth = '#f3ead2';
  const clothFar = '#b9ad8b';
  const skin = '#c99a6b';
  const kneeFar: P = [c.knee[0] - 7, c.knee[1]];
  return (
    <svg viewBox="0 0 300 260" width="100%" role="img" aria-label={label || 'هيئة المصلّي'} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="fg-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#101830" /><stop offset="1" stopColor="#1a1408" /></linearGradient>
        <pattern id="fg-rug" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="14" height="10" fill="#6d2330" /><path d="M0 5 H14 M7 0 V10" stroke="#e8c25a" strokeWidth="1" opacity=".7" /></pattern>
        <radialGradient id="fg-glow"><stop offset="0" stopColor="#ffd24a" stopOpacity=".9" /><stop offset="1" stopColor="#ffd24a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="300" height="260" fill="url(#fg-bg)" rx="16" />
      <g style={{ direction: 'ltr' }}>
        <text x="12" y="204" fontSize="30" textAnchor="start">🕋</text>
        <text x="26" y="224" fontSize="10" fill="#e8c25a" textAnchor="middle" style={{ fontFamily: 'var(--font-kufi)' }}>القبلة</text>
      </g>
      <rect x="40" y="232" width="236" height="12" fill="url(#fg-rug)" rx="3" />
      {/* الطرف البعيد (أغمق) */}
      <path d={L(c.hip, kneeFar)} stroke={clothFar} strokeWidth="15" strokeLinecap="round" />
      <path d={L(kneeFar, [c.ank[0] - 7, c.ank[1]])} stroke={clothFar} strokeWidth="13" strokeLinecap="round" />
      <path d={L([c.ank[0] - 7, c.ank[1]], [c.toe[0] - 7, c.toe[1]])} stroke={skin} strokeWidth="7" strokeLinecap="round" opacity=".7" />
      {/* الجذع */}
      <path d={L(c.sh, c.hip)} stroke={cloth} strokeWidth="30" strokeLinecap="round" />
      {/* الساق القريبة */}
      <path d={L(c.hip, c.knee)} stroke={cloth} strokeWidth="16" strokeLinecap="round" />
      <path d={L(c.knee, c.ank)} stroke={cloth} strokeWidth="14" strokeLinecap="round" />
      <path d={L(c.ank, c.toe)} stroke={skin} strokeWidth="8" strokeLinecap="round" />
      {/* العنق والرأس (بلا وجه) */}
      <path d={L(c.sh, c.head)} stroke={skin} strokeWidth="9" strokeLinecap="round" />
      <g transform={`translate(${c.head[0]} ${c.head[1]}) scale(${1 - 0.0 * (c.turn || 0)})`}>
        <circle r="14" fill={skin} />
        <path d="M-14 -2 A14 14 0 0 1 14 -2 Z" fill="#fff8e1" transform={`rotate(${(c.turn || 0) * -12})`} />
        {(c.turn || 0) > 0.5 && <path d="M-22 6 l-8 0 m4 -4 l-4 4 l4 4" stroke="#7fe0c0" strokeWidth="2" fill="none" />}
      </g>
      {/* الذراع القريبة */}
      <path d={L(c.sh, c.elb)} stroke={cloth} strokeWidth="11" strokeLinecap="round" />
      <path d={L(c.elb, c.wr)} stroke={cloth} strokeWidth="10" strokeLinecap="round" />
      <circle cx={c.wr[0]} cy={c.wr[1]} r="5.5" fill={skin} />
      {target.finger && <path d={`M${c.wr[0]},${c.wr[1]} l-6,-13`} stroke={skin} strokeWidth="3" strokeLinecap="round" />}
      {/* الأعضاء السبعة */}
      {seven && (
        <g>
          {[[c.head[0] - 12, c.head[1] + 6], [c.wr[0], c.wr[1]], [c.knee[0], c.knee[1]], [c.toe[0], c.toe[1]]].map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="15" fill="url(#fg-glow)" />
          ))}
        </g>
      )}
    </svg>
  );
}
