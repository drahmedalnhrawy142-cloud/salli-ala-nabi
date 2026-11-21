'use client';

import { useEffect, useState } from 'react';
import { toAr } from '@/components/quran/data';
import { QuranDoodle } from '@/components/Doodles';

/**
 * ختمة مع الأصحاب: تقسيم المصحف ٣٠ جزءًا على المشاركين، ومشاركة التوزيع نصًّا، ومتابعة من أتمّ جزأه.
 * تعمل على جهازك فقط بلا خادم: كل مشارك يتابع جزأه عنده، وصاحب الختمة يعلّم ما أُتمّ حين يخبره أصحابه.
 */
type K = { id: string; title: string; names: string[]; done: number[]; me: number; at: number };
const KEY = 'gk.v1';

function assign(n: number): number[][] {
  const out: number[][] = Array.from({ length: n }, () => []);
  for (let j = 1; j <= 30; j++) out[(j - 1) % n].push(j);
  return out;
}

export function FriendsKhatma() {
  const [list, setList] = useState<K[] | null>(null);
  const [cur, setCur] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [names, setNames] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      setList(Array.isArray(v) ? v : []);
    } catch {
      setList([]);
    }
  }, []);
  function save(n: K[]) {
    setList(n);
    try {
      localStorage.setItem(KEY, JSON.stringify(n));
    } catch {}
  }
  if (!list) return null;

  const k = list.find((x) => x.id === cur) || null;

  function create() {
    const ns = Array.from(new Set(names.split('\n').map((x) => x.trim()).filter(Boolean))).slice(0, 30);
    if (ns.length < 1) return;
    const nk: K = { id: `k${Date.now()}`, title: title.trim() || 'ختمة جماعية', names: ns, done: [], me: 0, at: Date.now() };
    save([nk, ...list!]);
    setCur(nk.id);
    setTitle('');
    setNames('');
  }
  const upd = (nk: K) => save(list.map((x) => (x.id === nk.id ? nk : x)));

  if (k) {
    const parts = assign(k.names.length);
    const owner = (j: number) => k.names[(j - 1) % k.names.length];
    const pct = Math.round((k.done.length / 30) * 100);
    const text = () =>
      `${k.title}\nتوزيع أجزاء المصحف:\n` +
      k.names.map((n, i) => `• ${n}: ${parts[i].map((j) => `الجزء ${toAr(j)}`).join('، ')}`).join('\n') +
      '\nتقبّل الله منا ومنكم.';
    async function share() {
      const t = text();
      try {
        if (navigator.share) await navigator.share({ text: t });
        else {
          await navigator.clipboard.writeText(t);
          setMsg('تم نسخ التوزيع');
        }
      } catch {
        try {
          await navigator.clipboard.writeText(t);
          setMsg('تم نسخ التوزيع');
        } catch {
          setMsg('تعذّرت المشاركة');
        }
      }
      setTimeout(() => setMsg(''), 1500);
    }
    return (
      <div className="gk">
        <button type="button" className="gk-back" onClick={() => setCur(null)}>← الختمات</button>
        <QuranDoodle />
        <h3 className="gk-h">{k.title}</h3>
        <div className="gk-bar"><i style={{ width: `${pct}%` }} /></div>
        <p className="gk-p">{k.done.length === 30 ? 'تمّت الختمة، تقبّل الله منكم 🤍' : `أُتمّ ${toAr(k.done.length)} من ٣٠ جزءًا`}</p>
        <label className="gk-me">
          أنا:
          <select value={k.me} onChange={(e) => upd({ ...k, me: Number(e.target.value) })}>
            {k.names.map((n, i) => (
              <option key={n} value={i}>{n}</option>
            ))}
          </select>
        </label>
        <div className="gk-g">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => {
            const on = k.done.includes(j);
            const mine = (j - 1) % k.names.length === k.me;
            return (
              <button
                key={j}
                type="button"
                className={`gk-j${on ? ' on' : ''}${mine ? ' me' : ''}`}
                onClick={() => upd({ ...k, done: on ? k.done.filter((x) => x !== j) : [...k.done, j] })}
                aria-pressed={on}
              >
                <b>{toAr(j)}</b>
                <small>{owner(j)}</small>
                {on && <span>✓</span>}
              </button>
            );
          })}
        </div>
        <p className="gk-n">اضغط الجزء لتعليمه إذا أُتمّ. أجزاؤك محدّدة بإطار ذهبي. الأخضر = تم.</p>
        <div className="gk-a">
          <button type="button" onClick={share}>{msg || 'مشاركة التوزيع مع الأصحاب'}</button>
          <button
            type="button"
            className="gk-d"
            onClick={() => {
              if (confirm('حذف هذه الختمة؟')) {
                save(list.filter((x) => x.id !== k.id));
                setCur(null);
              }
            }}
          >
            حذف
          </button>
        </div>
        <Css />
      </div>
    );
  }

  return (
    <div className="gk">
      <QuranDoodle />
      <p className="gk-p">وزّع المصحف على أصحابك أو أهلك: اكتب أسماءهم سطرًا سطرًا، فتُوزَّع الأجزاء الثلاثون عليهم بالتساوي، ثم شارك التوزيع في مجموعتكم.</p>
      <input className="gk-i" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اسم الختمة (مثال: ختمة العائلة)" maxLength={50} />
      <textarea className="gk-i" value={names} onChange={(e) => setNames(e.target.value)} placeholder={'الأسماء، اسم في كل سطر (حتى ٣٠)\nأحمد\nمحمد\nفاطمة'} rows={6} />
      <div className="gk-a">
        <button type="button" onClick={create}>تقسيم الأجزاء</button>
      </div>
      {list.length > 0 && (
        <>
          <h3 className="gk-h">ختماتك</h3>
          {list.map((x) => (
            <button key={x.id} type="button" className="gk-r" onClick={() => setCur(x.id)}>
              <b>{x.title}</b>
              <small>{toAr(x.names.length)} مشاركين • {toAr(x.done.length)}/٣٠</small>
            </button>
          ))}
        </>
      )}
      <p className="gk-n">بياناتك على جهازك فقط، ولا تتزامن تلقائيًّا بين الهواتف: شارك التوزيع نصًّا، وعلّم أنت ما يخبرك به أصحابك أنهم أتمّوه.</p>
      <Css />
    </div>
  );
}

function Css() {
  return (
    <style>{`
      .gk { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
      .gk-p { font-size: 14px; line-height: 1.9; margin: 4px 0 10px; font-family: var(--font-ruqaa), serif; }
      .gk-i { display: block; width: 100%; box-sizing: border-box; padding: 10px; margin-bottom: 8px; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; font-size: 14px; }
      .gk-a { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
      .gk-a button { padding: 10px 18px; border-radius: 999px; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.15); color: #f1d77a; font-family: inherit; font-size: 14px; }
      .gk-a .gk-d { border-color: rgba(255,140,120,.5); color: #ff9f8f; background: transparent; }
      .gk-h { color: #f1d77a; font-size: 16px; margin: 14px 0 6px; }
      .gk-r { display: flex; justify-content: space-between; width: 100%; padding: 12px 14px; margin-bottom: 8px; border-radius: 14px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.8); color: #fff1c4; font-family: inherit; text-align: right; }
      .gk-r small { color: #7fe0c0; font-size: 12px; }
      .gk-back { background: none; border: 0; color: #f1d77a; font-family: inherit; font-size: 14px; padding: 4px 0; }
      .gk-bar { height: 10px; border-radius: 10px; background: rgba(232,194,90,.15); overflow: hidden; }
      .gk-bar i { display: block; height: 100%; background: linear-gradient(90deg, #e8c25a, #7fe0c0); }
      .gk-me { display: flex; gap: 8px; align-items: center; font-size: 14px; margin-bottom: 10px; }
      .gk-me select { padding: 6px 10px; border-radius: 10px; border: 1px solid rgba(232,194,90,.4); background: #1a1409; color: #fff1c4; font-family: inherit; }
      .gk-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .gk-j { position: relative; padding: 10px 4px; border-radius: 12px; border: 1px solid rgba(232,194,90,.2); background: rgba(18,15,8,.75); color: #fff1c4; font-family: inherit; display: flex; flex-direction: column; align-items: center; gap: 2px; }
      .gk-j b { font-size: 16px; color: #e8c25a; }
      .gk-j small { font-size: 11px; opacity: .85; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .gk-j.me { border-color: #e8c25a; border-width: 2px; }
      .gk-j.on { background: rgba(127,224,192,.18); border-color: #7fe0c0; }
      .gk-j span { position: absolute; top: 3px; left: 6px; color: #7fe0c0; font-size: 12px; }
      .gk-n { font-size: 11.5px; text-align: center; color: rgba(255,241,196,.5); line-height: 1.8; margin-top: 12px; }
    `}</style>
  );
}
