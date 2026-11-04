'use client';

import { FormEvent, useState } from 'react';

export function CodeActions() {
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');

  function requestCode() {
    setMessage('ميزة الحصول على المفاتيح ستعمل بعد ربط قاعدة البيانات.');
  }

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim()) {
      setMessage('اكتب المفتاح أولًا. لم يتم إرسال أي بيانات.');
      return;
    }
    setMessage('لم يُحفظ المفتاح؛ ستتاح الإضافة بعد ربط قاعدة البيانات.');
  }

  return (
    <div className="cards-grid">
      <article className="panel action-card" aria-labelledby="get-code-title">
        <div className="card-top">
          <div className="icon-box" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4"/><path d="m10.85 12.15 8.3-8.3a2.12 2.12 0 0 1 3 3l-1.6 1.6-2-2-2.2 2.2 2 2-2.25 2.25"/></svg>
          </div>
          <div>
            <h2 className="card-heading" id="get-code-title">مفاتيحك الجاهزة</h2>
            <p className="card-description">إذا توفر مفتاح من زائر كريم، سيكون هنا بانتظارك.</p>
          </div>
        </div>
        <button className="button button-primary card-action" type="button" onClick={requestCode}>
          <span>هات مفتاح</span><span aria-hidden="true">←</span>
        </button>
        <p className="status-message" aria-live="polite">{message}</p>
      </article>

      <article className="panel action-card" aria-labelledby="add-code-title">
        <div className="card-top">
          <div className="icon-box gold-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="5"/></svg>
          </div>
          <div>
            <h2 className="card-heading" id="add-code-title">أضف مفاتيحك</h2>
            <p className="card-description">شارك مفتاحًا متاحًا ليستفيد منه زائر آخر.</p>
          </div>
        </div>
        <form className="card-form" onSubmit={submitCode}>
          <label className="sr-only" htmlFor="code-input">مفتاح نسك</label>
          <input
            className="code-field"
            id="code-input"
            name="code"
            type="text"
            autoComplete="off"
            placeholder="اكتب المفتاح هنا"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-describedby="form-status"
          />
          <button className="button button-outline" type="submit">أضف</button>
        </form>
        <p className="status-message" id="form-status" aria-live="polite">{message}</p>
      </article>
    </div>
  );
}
