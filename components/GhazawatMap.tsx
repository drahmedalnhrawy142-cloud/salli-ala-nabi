'use client';

import { useEffect, useRef, useState } from 'react';
import { FiqhBook } from '@/components/FiqhMadhahib';
import { loadLibIndex, libMeta, type BookMeta } from '@/components/ilm/books';

/**
 * الغزوات على الخريطة: السنة وموضع الباب في كتاب «السيرة المدنية والغزوات حسب السنين»
 * (الذهبي، سير أعلام النبلاء). الإحداثيات تقريبية للأماكن المعروفة اليوم، للتوضيح فقط.
 * الخريطة من OpenStreetMap عبر Leaflet وتحتاج نتًّا؛ بدونه تبقى القائمة تعمل كاملة.
 */
type G = { n: string; y: string; ki: number; bi: number; h: string; la: number; lo: number };
type L = {
  map: (el: HTMLElement) => LMap;
  tileLayer: (u: string, o: object) => { addTo: (m: LMap) => void };
  circleMarker: (c: [number, number], o: object) => { addTo: (m: LMap) => LMarker };
};
type LMap = { setView: (c: [number, number], z: number) => LMap; remove: () => void; flyTo: (c: [number, number], z: number) => void; fitBounds: (b: [number, number][], o?: object) => void };
type LMarker = { on: (e: string, f: () => void) => LMarker; setStyle: (o: object) => void };

const CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
const JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
let leafP: Promise<L> | null = null;
function loadLeaflet(): Promise<L> {
  const w = window as unknown as { L?: L };
  if (w.L) return Promise.resolve(w.L);
  if (!leafP) {
    leafP = new Promise<L>((res, rej) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = CSS;
      document.head.appendChild(l);
      const s = document.createElement('script');
      s.src = JS;
      s.onload = () => (w.L ? res(w.L) : rej(new Error('L')));
      s.onerror = () => rej(new Error('net'));
      document.head.appendChild(s);
    });
    leafP.catch(() => (leafP = null));
  }
  return leafP;
}

export function GhazawatMap() {
  const [data, setData] = useState<G[] | null>(null);
  const [meta, setMeta] = useState<BookMeta | null>(null);
  const [err, setErr] = useState(false);
  const [mapOk, setMapOk] = useState<boolean | null>(null);
  const [sel, setSel] = useState(0);
  const [read, setRead] = useState<G | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const marks = useRef<LMarker[]>([]);

  useEffect(() => {
    fetch('/sira/ghazawat.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setErr(true));
    loadLibIndex()
      .then((l) => {
        const b = l.find((x) => x.id === 'maghazi');
        if (b) setMeta(libMeta(b));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!data || read) return;
    let dead = false;
    loadLeaflet()
      .then((L) => {
        if (dead || !el.current) return;
        const m = L.map(el.current).setView([24.5, 39.2], 6);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 15, attribution: '© OpenStreetMap' }).addTo(m);
        mapRef.current = m;
        marks.current = data.map((g, i) =>
          L.circleMarker([g.la, g.lo], { radius: 8, color: '#1a1409', weight: 2, fillColor: '#e8c25a', fillOpacity: 0.95 })
            .addTo(m)
            .on('click', () => setSel(i)),
        );
        m.fitBounds(data.map((g) => [g.la, g.lo] as [number, number]), { padding: [24, 24] });
        setMapOk(true);
      })
      .catch(() => !dead && setMapOk(false));
    return () => {
      dead = true;
      mapRef.current?.remove();
      mapRef.current = null;
      marks.current = [];
    };
  }, [data, read]);

  useEffect(() => {
    marks.current.forEach((m, i) => m.setStyle({ fillColor: i === sel ? '#7fe0c0' : '#e8c25a', radius: i === sel ? 11 : 8 }));
  }, [sel, mapOk]);

  if (err) return <p style={{ textAlign: 'center', color: '#ffd9a0' }}>تعذّر تحميل الغزوات.</p>;
  if (!data) return <p style={{ textAlign: 'center', opacity: 0.7 }}>جارٍ التحميل…</p>;

  if (read && meta)
    return (
      <FiqhBook
        key={`${read.ki}-${read.bi}`}
        dir={meta.dir}
        title={meta.title}
        credit={meta.credit}
        fiqh={false}
        start={{ ki: read.ki, bi: read.bi }}
        backLabel="← رجوع للخريطة"
        onBack={() => setRead(null)}
      />
    );

  const g = data[sel];
  const pick = (i: number) => {
    setSel(i);
    mapRef.current?.flyTo([data[i].la, data[i].lo], 8);
    el.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="gm">
      <div ref={el} className="gm-map" aria-label="خريطة الغزوات" />
      {mapOk === false && <p className="gm-off">الخريطة تحتاج اتصالًا بالنت؛ القائمة أدناه تعمل بدونه، ولكل غزوة رابط لفتح موضعها في الخرائط.</p>}
      <div className="gm-sel">
        <b>{g.n}</b>
        <span>{g.y}</span>
        <div className="gm-b">
          {meta && <button type="button" onClick={() => setRead(g)}>اقرأ ما كتبه الذهبي</button>}
          <a href={`https://www.openstreetmap.org/?mlat=${g.la}&mlon=${g.lo}#map=9/${g.la}/${g.lo}`} target="_blank" rel="noreferrer">افتح في الخرائط</a>
        </div>
      </div>
      <div className="gm-l">
        {data.map((x, i) => (
          <button key={x.n} type="button" className={i === sel ? 'on' : ''} onClick={() => pick(i)}>
            <span>{x.n}</span>
            <small>{x.y.replace(' من الهجرة', '')}</small>
          </button>
        ))}
      </div>
      <p className="gm-n">
        السنوات والأحداث بترتيب الذهبي في «سير أعلام النبلاء»، وفي بعضها خلاف في السنة (كبني النضير والخندق) مبسوط في الكتاب. مواضع النقاط تقريبية للأماكن المعروفة اليوم للتوضيح فقط. الخريطة © مساهمو OpenStreetMap.
      </p>
      <style>{`
        .gm { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
        .gm-map { height: 300px; border-radius: 16px; border: 1px solid rgba(232,194,90,.35); background: #14110a; margin-bottom: 10px; overflow: hidden; direction: ltr; }
        .gm-off { font-size: 12.5px; color: #ffd9a0; text-align: center; margin: 0 0 8px; }
        .gm-sel { padding: 12px 14px; border-radius: 16px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.85); margin-bottom: 10px; display: flex; flex-direction: column; gap: 4px; }
        .gm-sel b { font-size: 16px; color: #f1d77a; }
        .gm-sel span { font-size: 12.5px; color: #7fe0c0; }
        .gm-b { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
        .gm-b button, .gm-b a { padding: 7px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.12); color: #f1d77a; font-family: inherit; font-size: 13px; text-decoration: none; }
        .gm-l { display: flex; flex-direction: column; gap: 6px; }
        .gm-l button { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(232,194,90,.22); background: rgba(18,15,8,.7); color: #fff1c4; font-family: inherit; font-size: 14px; text-align: right; }
        .gm-l button.on { border-color: #7fe0c0; background: rgba(127,224,192,.1); }
        .gm-l small { color: #e8c25a; font-size: 11.5px; }
        .gm-n { font-size: 11.5px; text-align: center; color: rgba(255,241,196,.5); margin: 12px 0 0; line-height: 1.8; }
      `}</style>
    </div>
  );
}
