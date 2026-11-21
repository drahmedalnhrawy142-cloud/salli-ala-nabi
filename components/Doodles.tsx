'use client';

import type { ReactNode } from 'react';

/** رسومات SVG خفيفة متحركة لرؤوس الأقسام (ذهبي على أسود). تتوقف الحركة عند تفضيل تقليل الحركة. */
const GOLD = '#e8c25a';
const MINT = '#7fe0c0';

function Wrap({ children, h = 96, label }: { children: ReactNode; h?: number; label: string }) {
  return (
    <div className="dd" role="img" aria-label={label} style={{ height: h }}>
      {children}
      <style>{`
        .dd { display: flex; justify-content: center; margin: 0 0 8px; }
        .dd svg { height: 100%; width: auto; max-width: 100%; overflow: visible; }
        @keyframes dd-tw { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
        @keyframes dd-fl { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        @keyframes dd-rise { from { transform: translateY(18px) } to { transform: translateY(0) } }
        @keyframes dd-spin { to { transform: rotate(360deg) } }
        @keyframes dd-ray { 0%,100% { opacity: .35 } 50% { opacity: .95 } }
        .dd .tw { animation: dd-tw 2.6s ease-in-out infinite; }
        .dd .fl { animation: dd-fl 4s ease-in-out infinite; }
        .dd .rise { animation: dd-rise 1.6s ease-out both; }
        .dd .ray { animation: dd-ray 3s ease-in-out infinite; }
        .dd .spin { transform-origin: 60px 60px; animation: dd-spin 40s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .dd * { animation: none !important; } }
      `}</style>
    </div>
  );
}

/** شروق: لحديث اليوم */
export function SunriseDoodle() {
  return (
    <Wrap label="شروق الشمس">
      <svg viewBox="0 0 240 96">
        <defs>
          <clipPath id="dd-sky"><rect x="0" y="0" width="240" height="82" /></clipPath>
        </defs>
        <g clipPath="url(#dd-sky)">
        <g className="rise">
          <g className="spin" style={{ transformOrigin: '120px 70px' }}>
            {Array.from({ length: 12 }, (_, i) => (
              <line key={i} className="ray" style={{ animationDelay: `${i * 0.25}s` }} x1="120" y1="70" x2="120" y2="22" stroke={GOLD} strokeWidth="2" strokeLinecap="round" transform={`rotate(${i * 30 - 90} 120 70)`} />
            ))}
          </g>
          <circle cx="120" cy="70" r="22" fill="#14110a" stroke={GOLD} strokeWidth="2.5" />
          <circle cx="120" cy="70" r="14" fill={GOLD} opacity=".9" />
        </g>
        </g>
        <path d="M10 82 H230" stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity=".6" />
                {[[34, 24], [62, 12], [188, 16], [212, 34], [150, 8]].map(([x, y], i) => (
          <path key={i} className="tw" style={{ animationDelay: `${i * 0.5}s` }} d={`M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6}Z`} fill={GOLD} />
        ))}
      </svg>
    </Wrap>
  );
}

/** هلال ونجوم وفانوس: لجدول العبادات */
export function CrescentDoodle() {
  return (
    <Wrap label="هلال ونجوم">
      <svg viewBox="0 0 240 96">
        <g className="fl">
          <path d="M138 14 a34 34 0 1 0 22 58 a28 28 0 1 1 -22 -58z" fill={GOLD} />
        </g>
        {[[70, 26, 1], [96, 60, 0.7], [186, 22, 0.8], [210, 62, 1], [50, 70, 0.6]].map(([x, y, s], i) => (
          <path key={i} className="tw" style={{ animationDelay: `${i * 0.45}s` }} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4Z" fill={MINT} />
        ))}
        <path d="M20 90 H220" stroke={GOLD} strokeWidth="1.5" opacity=".4" strokeDasharray="2 6" strokeLinecap="round" />
      </svg>
    </Wrap>
  );
}

/** مصحف تخرج منه أشعة: للختمة */
export function QuranDoodle() {
  return (
    <Wrap label="مصحف">
      <svg viewBox="0 0 240 96">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} className="ray" style={{ animationDelay: `${i * 0.3}s` }} x1="120" y1="56" x2="120" y2="8" stroke={GOLD} strokeWidth="2" strokeLinecap="round" transform={`rotate(${(i - 4) * 18} 120 56)`} />
        ))}
        <g className="fl">
          <path d="M120 62 C100 52 70 52 52 60 V86 C70 78 100 78 120 88 C140 78 170 78 188 86 V60 C170 52 140 52 120 62Z" fill="#14110a" stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M120 62 V88" stroke={GOLD} strokeWidth="2" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <path d={`M64 ${66 + i * 5} C80 ${63 + i * 5} 96 ${64 + i * 5} 112 ${70 + i * 5}`} stroke={GOLD} strokeWidth="1.2" opacity=".6" fill="none" />
              <path d={`M176 ${66 + i * 5} C160 ${63 + i * 5} 144 ${64 + i * 5} 128 ${70 + i * 5}`} stroke={GOLD} strokeWidth="1.2" opacity=".6" fill="none" />
            </g>
          ))}
        </g>
      </svg>
    </Wrap>
  );
}

/** بوصلة وخيمة: للغزوات */
export function CompassDoodle() {
  return (
    <Wrap label="بوصلة" h={84}>
      <svg viewBox="0 0 120 120" style={{ height: '100%' }}>
        <circle cx="60" cy="60" r="52" fill="none" stroke={GOLD} strokeWidth="2" opacity=".7" />
        <circle cx="60" cy="60" r="44" fill="none" stroke={GOLD} strokeWidth="1" strokeDasharray="2 5" opacity=".5" />
        <g className="spin" style={{ transformOrigin: '60px 60px', animationDuration: '14s' }}>
          <path d="M60 14 L68 60 L60 106 L52 60Z" fill="#14110a" stroke={GOLD} strokeWidth="2" strokeLinejoin="round" />
          <path d="M60 14 L68 60 L52 60Z" fill={MINT} />
        </g>
        <circle cx="60" cy="60" r="4" fill={GOLD} />
      </svg>
    </Wrap>
  );
}
