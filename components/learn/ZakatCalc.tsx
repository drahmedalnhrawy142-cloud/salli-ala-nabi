'use client';

import { useEffect, useState } from 'react';
import { Evidence, type Ev } from './Evidence';

/**
 * «احسب زكاتك»: يكتب الإنسان ما يملكه في كل باب فيظهر له ما عليه.
 * الأساس: حديث كتاب أبي بكر في الصدقات (البخاري ١٤٠٥) وحديث العُشر ونصفه (البخاري ١٤٣١)
 * ونصوص «عمدة الفقه» لابن قدامة في كتاب الزكاة.
 * تنبيه صريح: تحويل المثقال والدرهم والأوسق إلى جرام وكيلو قيمٌ تقريبية يمكن تعديلها،
 * والحاسبة عونٌ على الحساب وليست فتوى، فيُسأل أهل العلم في المسائل الخاصة.
 */
const B = (file: number, num: string, phrase: string, len = 60): Ev => ({ coll: 'bukhari', file, num, phrase, len });

/* ——— اقتباس من عمدة الفقه (المكتبة داخل التطبيق) ——— */
const DIA = /[ً-ٰٟـ]/g;
const nz = (s: string) => s.replace(DIA, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[،.,:"'«»()\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
let umdat: Promise<string[]> | null = null;
function loadUmdat() {
  if (!umdat) {
    umdat = fetch('/library/cumdatfiqh/k4.json').then((r) => r.json()).then((k: { b: { e: string[] }[] }) => k.b.flatMap((x) => x.e));
  }
  return umdat;
}
function Umdat({ phrase }: { phrase: string }) {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadUmdat().then((all) => {
      const p = nz(phrase);
      const hit = all.find((x) => nz(x).includes(p));
      if (live && hit) setT(hit.replace(/\d+$/, ''));
    }).catch(() => {});
    return () => { live = false; };
  }, [phrase]);
  if (!t) return null;
  return (
    <blockquote className="ev">
      <div className="ev-t">{t}</div>
      <cite>عمدة الفقه لابن قدامة — كتاب الزكاة</cite>
    </blockquote>
  );
}

const AR = '٠١٢٣٤٥٦٧٨٩';
function num(s: string) {
  const w = s.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))).replace(/[٫,]/g, '.').replace(/[^\d.]/g, '');
  const n = parseFloat(w);
  return Number.isFinite(n) ? n : 0;
}
const fmt = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });

function useSaved<T>(key: string, init: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(init);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setV({ ...init, ...JSON.parse(s) }); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [v, (n: T) => { setV(n); try { localStorage.setItem(key, JSON.stringify(n)); } catch {} }];
}

function Field({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="zc-f">
      <span>{label}{hint && <small> {hint}</small>}</span>
      <input inputMode="decimal" value={value} placeholder="٠" onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ——— الأنعام ——— */
function camels(n: number): string {
  if (n < 5) return 'لا زكاة فيها (دون خمس)';
  if (n <= 24) return `${fmt(Math.floor(n / 5))} ${Math.floor(n / 5) === 1 ? 'شاة' : 'من الغنم'}`;
  if (n <= 35) return 'بنت مخاض';
  if (n <= 45) return 'بنت لبون';
  if (n <= 60) return 'حِقّة';
  if (n <= 75) return 'جَذَعة';
  if (n <= 90) return 'بنتا لبون';
  if (n <= 120) return 'حِقّتان';
  for (let b = Math.floor(n / 50); b >= 0; b--) {
    const r = n - 50 * b;
    if (r % 40 === 0) {
      const a = r / 40;
      return [a ? `${fmt(a)} بنت لبون` : '', b ? `${fmt(b)} حقّة` : ''].filter(Boolean).join(' و');
    }
  }
  return 'في كل أربعين بنت لبون، وفي كل خمسين حقّة (راجع أهل العلم في العدد)';
}
function sheep(n: number): string {
  if (n < 40) return 'لا زكاة فيها (دون أربعين)';
  if (n <= 120) return 'شاة واحدة';
  if (n <= 200) return 'شاتان';
  if (n <= 300) return 'ثلاث شياه';
  return `${fmt(Math.floor(n / 100))} شياه (شاة عن كل مائة)`;
}

const INIT = {
  cash: '', gold: '', silver: '', trade: '', owed: '', debts: '', gp: '', sp: '', ng: '85', ns: '595', basis: 'silver',
  crop: '', irr: 'rain', nc: '653', cam: '', shp: '',
};

export function ZakatCalc() {
  const [s, set] = useSaved('zk.calc', INIT);
  const [tab, setTab] = useState<'mal' | 'crop' | 'herd'>('mal');
  const up = (k: keyof typeof INIT) => (v: string) => set({ ...s, [k]: v });

  const gold = num(s.gold), silver = num(s.silver), gp = num(s.gp), sp = num(s.sp);
  const wealth = num(s.cash) + gold * gp + silver * sp + num(s.trade) + num(s.owed) - num(s.debts);
  const nisabG = num(s.ng) * gp, nisabS = num(s.ns) * sp;
  const nisab = s.basis === 'gold' ? nisabG : nisabS;
  const needPrice = (gold > 0 && !gp) || (silver > 0 && !sp) || !nisab;
  const due = wealth >= nisab && nisab > 0 ? wealth * 0.025 : 0;

  const crop = num(s.crop), nc = num(s.nc);
  const rate = s.irr === 'rain' ? 0.1 : 0.05;
  const cropDue = nc > 0 && crop >= nc ? crop * rate : 0;

  return (
    <div className="zc">
      <section className="zc-card">
        <h2>🧮 احسب زكاتك</h2>
        <p className="zc-p">اكتب ما تملكه في كل باب، فتظهر لك الزكاة. ما تكتبه يُحفظ على جهازك فقط.</p>
        <div className="zc-tabs">
          <button type="button" className={tab === 'mal' ? 'on' : ''} onClick={() => setTab('mal')}>💰 المال والذهب</button>
          <button type="button" className={tab === 'crop' ? 'on' : ''} onClick={() => setTab('crop')}>🌾 الزروع</button>
          <button type="button" className={tab === 'herd' ? 'on' : ''} onClick={() => setTab('herd')}>🐪 الأنعام</button>
        </div>

        {tab === 'mal' && (
          <>
            <div className="zc-grid">
              <Field label="نقد في يدك وحساباتك" hint="(بعملتك)" value={s.cash} onChange={up('cash')} />
              <Field label="ذهب تملكه" hint="(جرام)" value={s.gold} onChange={up('gold')} />
              <Field label="فضة تملكها" hint="(جرام)" value={s.silver} onChange={up('silver')} />
              <Field label="عروض تجارة" hint="(قيمتها اليوم)" value={s.trade} onChange={up('trade')} />
              <Field label="ديون لك مرجوّة السداد" value={s.owed} onChange={up('owed')} />
              <Field label="ديون عليك حالّة" value={s.debts} onChange={up('debts')} />
              <Field label="سعر جرام الذهب اليوم" value={s.gp} onChange={up('gp')} />
              <Field label="سعر جرام الفضة اليوم" value={s.sp} onChange={up('sp')} />
              <Field label="نصاب الذهب" hint="(جرام، قابل للتعديل)" value={s.ng} onChange={up('ng')} />
              <Field label="نصاب الفضة" hint="(جرام، قابل للتعديل)" value={s.ns} onChange={up('ns')} />
            </div>
            <div className="zc-basis">
              <span>اعتبار النصاب:</span>
              <button type="button" className={s.basis === 'silver' ? 'on' : ''} onClick={() => set({ ...s, basis: 'silver' })}>بالفضة</button>
              <button type="button" className={s.basis === 'gold' ? 'on' : ''} onClick={() => set({ ...s, basis: 'gold' })}>بالذهب</button>
            </div>
            <div className={due > 0 ? 'zc-res yes' : 'zc-res'}>
              <div>إجمالي مالك الزكوي: <b>{fmt(Math.max(0, wealth))}</b></div>
              <div>النصاب ({s.basis === 'gold' ? 'ذهب' : 'فضة'}): <b>{nisab ? fmt(nisab) : '—'}</b></div>
              {needPrice ? <div className="zc-note">أدخل سعر الجرام لتظهر النتيجة.</div>
                : due > 0 ? <div className="zc-big">زكاتك: {fmt(due)} <small>(٢٫٥٪ = ربع العشر)</small></div>
                : <div className="zc-big no">لم يبلغ مالك النصاب، فلا زكاة عليك الآن.</div>}
            </div>
            <ul className="zc-notes">
              <li>الزكاة تجب بعد أن يمرّ على النصاب سنة هجرية كاملة (الحول).</li>
              <li>الحليّ المستعمل: فيه خلاف بين المذاهب، فاسأل أهل العلم عنه.</li>
              <li>نصاب الذهب والفضة بالجرام تقريبٌ معتمد عند كثير من المعاصرين، وللمثقال والدرهم مقادير يُرجع فيها لأهل العلم.</li>
            </ul>
            <Evidence ev={B(24, '1405', 'وفي الرقة ربع العشر فإن لم تكن إلا تسعين ومائة فليس فيها شيء', 20)} />
            <Umdat phrase="ولا زكاة في الفضة حتى تبلغ مائتي درهم" />
            <Umdat phrase="ولا زكاة في مال حتى يحول عليه الحول" />
            <Umdat phrase="ومن كان عليه دين يستغرق النصاب" />
          </>
        )}

        {tab === 'crop' && (
          <>
            <div className="zc-grid">
              <Field label="محصولك بعد الحصاد" hint="(كيلو)" value={s.crop} onChange={up('crop')} />
              <Field label="نصاب الخمسة أوسق" hint="(كيلو، تقريب قابل للتعديل)" value={s.nc} onChange={up('nc')} />
            </div>
            <div className="zc-basis">
              <span>السقي:</span>
              <button type="button" className={s.irr === 'rain' ? 'on' : ''} onClick={() => set({ ...s, irr: 'rain' })}>مطر وعيون</button>
              <button type="button" className={s.irr === 'pump' ? 'on' : ''} onClick={() => set({ ...s, irr: 'pump' })}>بجهد وآلة (نضح)</button>
            </div>
            <div className={cropDue > 0 ? 'zc-res yes' : 'zc-res'}>
              {crop <= 0 ? <div className="zc-note">اكتب كمية المحصول.</div>
                : cropDue > 0 ? <div className="zc-big">زكاتك: {fmt(cropDue)} كيلو <small>({s.irr === 'rain' ? 'العُشر ١٠٪' : 'نصف العُشر ٥٪'})</small></div>
                : <div className="zc-big no">لم يبلغ المحصول النصاب.</div>}
            </div>
            <Evidence ev={B(24, '1431', 'فيما سقت السماء والعيون أو كان عثريا العشر وما سقي بالنضح نصف العشر', 10)} />
            <Evidence ev={B(24, '1358', 'وليس فيما دون خمس أوسق صدقة', 10)} />
          </>
        )}

        {tab === 'herd' && (
          <>
            <div className="zc-grid">
              <Field label="عدد الإبل السائمة" value={s.cam} onChange={up('cam')} />
              <Field label="عدد الغنم السائمة" value={s.shp} onChange={up('shp')} />
            </div>
            <div className="zc-res yes">
              {num(s.cam) > 0 && <div className="zc-big">الإبل ({fmt(num(s.cam))}): {camels(Math.floor(num(s.cam)))}</div>}
              {num(s.shp) > 0 && <div className="zc-big">الغنم ({fmt(num(s.shp))}): {sheep(Math.floor(num(s.shp)))}</div>}
              {!num(s.cam) && !num(s.shp) && <div className="zc-note">اكتب عدد ما تملكه.</div>}
            </div>
            <ul className="zc-notes">
              <li>الزكاة في السائمة، وهي الراعية في أكثر العام، وبعد مرور الحول.</li>
              <li>البقر لم أضفه هنا لأن دليله ليس في الصحيحين اللذين أعتمد عليهما في هذا القسم.</li>
            </ul>
            <Evidence ev={B(24, '1405', 'في أربع وعشرين من الإبل فما دونها من الغنم من كل خمس شاة', 520)} />
            <Evidence ev={B(24, '1405', 'وفي صدقة الغنم في سائمتها إذا كانت أربعين إلى عشرين ومائة شاة', 360)} />
          </>
        )}
      </section>
      <style>{`
        .zc { font-family: var(--font-kufi), sans-serif; color: #fff1c4; }
        .zc-card { padding: 12px; border-radius: 18px; border: 1px solid rgba(232,194,90,.28); background: rgba(18,15,8,.82); }
        .zc-card h2 { margin: 0 0 6px; color: #f1d77a; font-family: var(--font-ruqaa), serif; font-size: 1.2rem; }
        .zc-p { margin: 0 0 10px; font-size: .88rem; opacity: .8; line-height: 1.8; }
        .zc-tabs, .zc-basis { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin: 8px 0; }
        .zc-tabs button, .zc-basis button { padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: transparent; color: #e8c25a; font-family: inherit; font-size: 13px; }
        .zc-tabs button.on, .zc-basis button.on { background: rgba(232,194,90,.25); color: #fff1c4; border-color: #e8c25a; }
        .zc-basis span { font-size: .85rem; opacity: .8; }
        .zc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .zc-f { display: flex; flex-direction: column; gap: 4px; font-size: .8rem; }
        .zc-f small { opacity: .65; }
        .zc-f input { padding: 10px; border-radius: 10px; border: 1px solid rgba(232,194,90,.35); background: #0d0b06; color: #fff1c4; font-family: inherit; font-size: 15px; text-align: center; width: 100%; box-sizing: border-box; }
        .zc-res { margin-top: 10px; padding: 12px; border-radius: 14px; border: 1px dashed rgba(232,194,90,.4); font-size: .95rem; line-height: 2; }
        .zc-res.yes { border: 1px solid #7fe0c0; background: rgba(127,224,192,.1); }
        .zc-big { font-size: 1.25rem; color: #ffd24a; font-weight: 700; } .zc-big small { font-size: .75rem; color: #bff3e1; font-weight: 400; } .zc-big.no { color: #fff1c4; font-size: 1rem; }
        .zc-note { opacity: .75; font-size: .85rem; }
        .zc-notes { margin: 10px 0 0; padding: 0 18px 0 0; font-size: .82rem; line-height: 1.9; opacity: .85; }
      `}</style>
    </div>
  );
}
