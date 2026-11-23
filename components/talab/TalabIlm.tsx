'use client';

import { useEffect, useState } from 'react';
import { FiqhBook } from '@/components/FiqhMadhahib';
import { allBooks, type BookMeta } from '@/components/ilm/books';
import { toAr } from '@/components/quran/data';
import { LEVELS } from './levels';

const KEY = 'ti.v1';

export function TalabIlm() {
  const [done, setDone] = useState<string[]>([]);
  const [lv, setLv] = useState<string | null>(null);
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [read, setRead] = useState<BookMeta | null>(null);

  useEffect(() => {
    allBooks().then(setBooks).catch(() => {});
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(v)) setDone(v);
    } catch {}
  }, []);
  function toggle(id: string) {
    const n = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(n);
    try {
      localStorage.setItem(KEY, JSON.stringify(n));
    } catch {}
  }

  if (read)
    return <FiqhBook key={read.id} dir={read.dir} title={read.title} credit={read.credit} fiqh={read.fiqh} backLabel="← رجوع للمستوى" onBack={() => setRead(null)} />;

  const total = LEVELS.reduce((a, l) => a + l.items.length, 0);
  const cnt = (l: (typeof LEVELS)[number]) => l.items.filter((i) => done.includes(i.id)).length;
  const cur = LEVELS.find((l) => l.id === lv);

  if (!cur)
    return (
      <div className="ti">
        <div className="ti-sum">
          <b>{toAr(done.length)} من {toAr(total)} كتابًا أتممتَها</b>
          <div className="ti-bar"><i style={{ width: `${(done.length / total) * 100}%` }} /></div>
        </div>
        {LEVELS.map((l) => {
          const c = cnt(l);
          return (
            <button key={l.id} type="button" className={`ti-l${c === l.items.length ? ' ok' : ''}`} onClick={() => setLv(l.id)}>
              <span className="ti-i">{c === l.items.length ? '✅' : l.icon}</span>
              <span className="ti-t">
                <b>{l.n}</b>
                <small>{l.sub}</small>
                <span className="ti-b2"><i style={{ width: `${(c / l.items.length) * 100}%` }} /></span>
              </span>
              <em>{toAr(c)}/{toAr(l.items.length)}</em>
            </button>
          );
        })}
        <p className="ti-n">
          ترتيب اجتهادي على طريقة التدرّج المعروفة (المتون المختصرة ثم الأوسع)، وليس نقلًا عن برنامج بعينه. كل كتاب يُقرأ هنا داخل التطبيق، وبجانبه شرح مرئي لعالم معروف. العلم يُؤخذ عن أهله، فاستعن بشيخ ثقة قريب منك.
        </p>
        {css}
      </div>
    );

  return (
    <div className="ti">
      <button type="button" className="ti-back" onClick={() => setLv(null)}>‹ كل المستويات</button>
      <div className="ti-h">
        <span>{cur.icon}</span>
        <h2>{cur.n}</h2>
        <p>{cur.goal}</p>
      </div>
      {cur.items.map((it) => {
        const bk = it.book ? books.find((b) => b.id === it.book) : undefined;
        const ok = done.includes(it.id);
        return (
          <article key={it.id} className={`ti-c${ok ? ' ok' : ''}`}>
            <div className="ti-ct">
              <button type="button" className="ti-ck" aria-label="أتممته" onClick={() => toggle(it.id)}>{ok ? '✓' : ''}</button>
              <div>
                <b>{it.title}</b>
                <small>{it.author}</small>
              </div>
            </div>
            <p>{it.why}</p>
            <div className="ti-ab">
              {bk && <button type="button" onClick={() => setRead(bk)}>📖 اقرأ في التطبيق</button>}
              {!bk && it.where && <span className="ti-w">📍 {it.where}</span>}
              {it.expl && (
                <a href={it.expl.url} target="_blank" rel="noopener noreferrer">
                  ▶ {it.expl.kind === 'search' ? 'ابحث عن الشرح' : it.expl.kind === 'playlist' ? 'قائمة الشرح' : 'الحلقة الأولى'}
                  {it.expl.kind !== 'search' && <small> — {it.expl.who}</small>}
                </a>
              )}
            </div>
          </article>
        );
      })}
      {css}
    </div>
  );
}

const css = (
  <style>{`
    .ti { font-family: var(--font-kufi), sans-serif; color: #fff1c4; display: flex; flex-direction: column; gap: 10px; }
    .ti-sum { padding: 14px; border-radius: 18px; border: 1px solid rgba(232,194,90,.4); background: rgba(18,15,8,.85); display: flex; flex-direction: column; gap: 8px; text-align: center; }
    .ti-sum b { color: #f1d77a; font-size: 16px; }
    .ti-bar, .ti-b2 { height: 8px; border-radius: 8px; background: rgba(232,194,90,.15); overflow: hidden; display: block; }
    .ti-bar i, .ti-b2 i { display: block; height: 100%; background: linear-gradient(90deg, #e8c25a, #7fe0c0); }
    .ti-l { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 20px; border: 1px solid rgba(232,194,90,.32); background: radial-gradient(120% 90% at 100% 0%, rgba(232,194,90,.12), rgba(18,15,8,.85) 70%); color: #fff1c4; font-family: inherit; text-align: start; }
    .ti-l.ok { border-color: #7fe0c0; }
    .ti-i { font-size: 30px; width: 52px; height: 52px; display: grid; place-items: center; border-radius: 50%; background: rgba(232,194,90,.12); flex: none; }
    .ti-t { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .ti-t b { font-size: 16px; color: #f1d77a; }
    .ti-t small { font-size: 12px; color: rgba(255,241,196,.62); line-height: 1.7; }
    .ti-l em { font-style: normal; font-size: 13px; color: rgba(255,241,196,.7); }
    .ti-n { margin: 4px 0 0; font-size: 12px; line-height: 2; text-align: center; color: rgba(255,241,196,.55); }
    .ti-back { align-self: flex-start; padding: 7px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: inherit; font-size: 13px; }
    .ti-h { text-align: center; padding: 12px; border-radius: 20px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.8); }
    .ti-h span { font-size: 34px; }
    .ti-h h2 { margin: 4px 0; font-size: 20px; color: #e8c25a; }
    .ti-h p { margin: 0; font-size: 13.5px; line-height: 2; color: rgba(255,241,196,.8); }
    .ti-c { padding: 14px; border-radius: 18px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); display: flex; flex-direction: column; gap: 8px; }
    .ti-c.ok { border-color: rgba(127,224,192,.6); }
    .ti-ct { display: flex; gap: 10px; align-items: center; }
    .ti-ct b { display: block; font-size: 16px; color: #f1d77a; }
    .ti-ct small { font-size: 12px; color: rgba(255,241,196,.6); }
    .ti-ck { flex: none; width: 36px; height: 36px; border-radius: 12px; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.08); color: #1a1409; font-size: 18px; font-weight: 700; }
    .ti-c.ok .ti-ck { background: #7fe0c0; }
    .ti-c p { margin: 0; font-size: 14px; line-height: 2; color: rgba(255,241,196,.88); }
    .ti-ab { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .ti-ab button, .ti-ab a { padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(232,194,90,.45); background: rgba(232,194,90,.14); color: #f1d77a; font-family: inherit; font-size: 13px; text-decoration: none; }
    .ti-ab a { border-color: rgba(255,120,120,.45); background: rgba(255,120,120,.1); color: #ffb3b3; }
    .ti-ab a small { color: rgba(255,200,200,.7); font-size: 11px; }
    .ti-w { font-size: 12.5px; color: rgba(255,241,196,.7); }
  `}</style>
);
