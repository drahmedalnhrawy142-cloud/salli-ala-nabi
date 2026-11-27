'use client';

import { useId, useRef } from 'react';

export type BeadStyle = 'amber' | 'ebony' | 'pearl' | 'turq';
export const BEAD_STYLES: { id: BeadStyle; label: string; hi: string; mid: string; lo: string }[] = [
  { id: 'amber', label: 'عنبر', hi: '#ffe7a0', mid: '#d99a2b', lo: '#6b3d08' },
  { id: 'ebony', label: 'أبنوس', hi: '#8c8c8c', mid: '#262626', lo: '#050505' },
  { id: 'pearl', label: 'لؤلؤ', hi: '#ffffff', mid: '#e3dccb', lo: '#9d937d' },
  { id: 'turq', label: 'فيروز', hi: '#b9fff0', mid: '#1fb5a0', lo: '#0a5a50' },
];

const CX = 150;
const CY = 140;
const R = 100;

/**
 * سبحة بحبّات حقيقية الشكل: حلقة من الحبّات على خيط، وحبّة الإمام مع الشرّابة،
 * وكل لمسة (أو سحبة بالإبهام لأعلى/أسفل) تُمرّر حبّة واحدة وتدور الحلقة.
 * الحبّات التي عُدَّت في الدورة تضيء بالذهبي.
 */
export function BeadTasbih({
  N, c, taps, style, name, num, of, onTap,
}: {
  N: number; c: number; taps: number; style: BeadStyle; name: string; num: string; of: string; onTap: () => void;
}) {
  const uid = useId().replace(/:/g, '');
  const st = BEAD_STYLES.find((s) => s.id === style) || BEAD_STYLES[0];
  const step = 360 / N;
  const r = Math.max(4.5, Math.min(14, 0.42 * ((2 * Math.PI * R) / N)));
  const cm = c % N;
  const drag = useRef<{ y: number; moved: boolean } | null>(null);

  function down(e: React.PointerEvent) {
    drag.current = { y: e.clientY, moved: false };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientY - d.y) > 30) {
      d.moved = true;
      d.y = e.clientY;
      onTap();
    }
  }
  function up() {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) onTap();
  }

  const beads = Array.from({ length: N }, (_, k) => {
    const a = ((90 - (k + 1) * step) * Math.PI) / 180;
    return { k, x: CX + R * Math.cos(a), y: CY + R * Math.sin(a), lit: k < cm };
  });

  return (
    <div className="tbd" role="button" tabIndex={0} aria-label={`${name}: ${num}`}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } }}>
      <svg viewBox="0 0 300 330" width="100%" aria-hidden="true">
        <defs>
          <radialGradient id={'g' + uid} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor={st.hi} /><stop offset=".5" stopColor={st.mid} /><stop offset="1" stopColor={st.lo} />
          </radialGradient>
          <radialGradient id={'l' + uid} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#fffbe0" /><stop offset=".45" stopColor="#f1d77a" /><stop offset="1" stopColor="#9a6a10" />
          </radialGradient>
          <filter id={'s' + uid} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#000" floodOpacity=".6" />
          </filter>
        </defs>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#6b5420" strokeWidth="2" />
        <g style={{ transform: `rotate(${taps * step}deg)`, transformOrigin: `${CX}px ${CY}px`, transition: 'transform .28s cubic-bezier(.3,.8,.3,1)' }}>
          {beads.map((b) => (
            <circle key={b.k} cx={b.x} cy={b.y} r={r} fill={`url(#${b.lit ? 'l' : 'g'}${uid})`} filter={`url(#s${uid})`} />
          ))}
        </g>
        {/* حبّة الإمام والشرّابة ثابتتان عند الإبهام */}
        <line x1={CX} y1={CY + R} x2={CX} y2={CY + R + 22} stroke="#6b5420" strokeWidth="2" />
        <ellipse cx={CX} cy={CY + R + 18} rx="9" ry="12" fill={`url(#g${uid})`} filter={`url(#s${uid})`} />
        <g stroke="#d6b04a" strokeWidth="2.2" strokeLinecap="round">
          {[-8, -4, 0, 4, 8].map((d) => <line key={d} x1={CX + d * 0.4} y1={CY + R + 30} x2={CX + d * 1.6} y2={CY + R + 58} />)}
        </g>
        <circle cx={CX} cy={CY + R + 30} r="3.5" fill="#d6b04a" />
        {/* مؤشر مكان الإبهام */}
        <path d={`M ${CX - 7} ${CY + R - 24} L ${CX + 7} ${CY + R - 24} L ${CX} ${CY + R - 14} Z`} fill="#f1d77a" opacity=".85" />
      </svg>
      <div className="tbd-mid">
        <span className="tbd-name">{name}</span>
        <span className="tbd-num">{num}</span>
        <span className="tbd-of">{of}</span>
      </div>
      <style>{`
        .tbd { position: relative; width: 300px; max-width: 100%; margin: 8px auto 0; touch-action: none; user-select: none; cursor: pointer; }
        .tbd:focus-visible { outline: 2px solid #f1d77a; border-radius: 16px; }
        .tbd-mid { position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; width: 150px; pointer-events: none; text-align: center; }
        .tbd-name { font-family: var(--font-ruqaa), serif; font-size: 1.05rem; color: #fff1c4; line-height: 1.5; }
        .tbd-num { font-family: var(--font-kufi), sans-serif; font-weight: 700; font-size: 2.8rem; color: #f1d77a; line-height: 1.15; }
        .tbd-of { font-family: var(--font-kufi), sans-serif; opacity: .7; font-size: .85rem; }
      `}</style>
    </div>
  );
}
