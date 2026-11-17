'use client';

import { memo as __memo } from 'react';
import { useState } from 'react';

const PREFIXES = ['prayer_', 'tasbeeh_', 'wird_', 'adhkar_', 'share_', 'prophet_quiz_', 'ui_', 'pt_'];

function allowed(k: string) {
  return PREFIXES.some((p) => k.startsWith(p));
}

/** نسخة احتياطية: نسخ بياناتك كنص، ولصقه على جهاز آخر. */
function Backup() {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');

  function exportData() {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && allowed(k)) data[k] = localStorage.getItem(k) || '';
      }
      const code = 'SALLI1:' + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      setText(code);
      navigator.clipboard
        ?.writeText(code)
        .then(() => setMsg('اتنسخ الكود. الصقه في مكان آمن (رسائلك مثلًا).'))
        .catch(() => setMsg('حدّد الكود وانسخه يدويًا.'));
      if (!navigator.clipboard) setMsg('حدّد الكود وانسخه يدويًا.');
    } catch {
      setMsg('تعذر تجهيز النسخة.');
    }
  }

  function importData() {
    try {
      const raw = text.trim();
      if (!raw.startsWith('SALLI1:')) {
        setMsg('الكود غير صحيح.');
        return;
      }
      const data = JSON.parse(decodeURIComponent(escape(atob(raw.slice(7)))));
      let n = 0;
      for (const k of Object.keys(data)) {
        if (allowed(k) && typeof data[k] === 'string') {
          localStorage.setItem(k, data[k]);
          n++;
        }
      }
      setMsg(`تم استيراد ${n.toLocaleString('ar-EG')} عنصر. هيتعاد فتح التطبيق…`);
      setTimeout(() => location.reload(), 1200);
    } catch {
      setMsg('الكود غير صحيح أو تالف.');
    }
  }

  return (
    <section className="content-card" id="s-backup">
      <h2 className="section-title">نسخة احتياطية</h2>
      <p className="bk-note">
        بياناتك محفوظة على جهازك فقط. انسخ الكود لتحتفظ بها، أو الصقه على جهاز
        آخر لتستعيدها.
      </p>
      <textarea
        className="bk-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="الصق كود النسخة هنا للاستيراد"
        rows={4}
      />
      <div className="bk-row">
        <button type="button" className="bk-btn" onClick={exportData}>
          نسخ بياناتي
        </button>
        <button type="button" className="bk-btn" onClick={importData}>
          استيراد
        </button>
      </div>
      {msg && <p className="bk-msg">{msg}</p>}
      <style>{`
        .bk-note { font-family: var(--font-ruqaa), serif; line-height: 1.9; margin: 0 0 10px; opacity: .9; }
        .bk-text { width: 100%; box-sizing: border-box; border-radius: 12px; border: 1px solid rgba(232,194,90,.4); background: rgba(255,255,255,.04); color: #fff1c4; padding: 10px; font-size: .85rem; direction: ltr; }
        .bk-row { display: flex; gap: 10px; margin-top: 10px; }
        .bk-btn { flex: 1; padding: 12px; border-radius: 14px; cursor: pointer; border: 1px solid rgba(232,194,90,.6); background: rgba(232,194,90,.12); color: #f1d77a; font-family: var(--font-kufi), sans-serif; font-weight: 700; }
        .bk-msg { font-family: var(--font-ruqaa), serif; text-align: center; color: #f1d77a; }
      `}</style>
    </section>
  );
}

const BackupMemo = __memo(Backup);
export { BackupMemo as Backup };
