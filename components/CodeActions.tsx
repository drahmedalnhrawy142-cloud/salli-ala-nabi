
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type NusukCodeResult = {
  code: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return String(error.message);
  }

  return 'Unknown error';
}

export function CodeActions() {
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [receivedCode, setReceivedCode] = useState('');
  const [visitorId, setVisitorId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      let id = localStorage.getItem('nusuk_visitor_id');

      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('nusuk_visitor_id', id);
      }

      setVisitorId(id);
    } catch (error) {
      console.error('Visitor ID error:', error);
      setMessage('تعذر تهيئة هوية الزائر. تحقق من إعدادات المتصفح.');
    }
  }, []);

  async function requestCode() {
    if (!visitorId || loading) return;

    setLoading(true);
    setMessage('');
    setReceivedCode('');

    try {
      const { data, error } = await supabase.rpc(
        'get_next_nusuk_code',
        {
          p_visitor_id: visitorId,
        }
      );

      if (error) {
        console.error('Supabase get_next_nusuk_code error:', error);
        throw error;
      }

      const result = Array.isArray(data)
        ? data[0]
        : data;

      const codeResult = result as NusukCodeResult | null;

      if (!codeResult?.code) {
        setMessage(
          'لا توجد أكواد جديدة متاحة لهذا الزائر حالياً.'
        );
        return;
      }

      setReceivedCode(codeResult.code);
      setMessage('تم الحصول على الكود بنجاح. احتفظ به في مكان آمن.');

    } catch (error) {
      const details = getErrorMessage(error);

      console.error('Request code failed:', error);

      setMessage(`تعذر الحصول على الكود: ${details}`);

    } finally {
      setLoading(false);
    }
  }

  async function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!code.trim()) {
      setMessage('اكتب الكود أولاً.');
      return;
    }

    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.rpc(
        'submit_nusuk_code',
        {
          p_code: code.trim(),
        }
      );

      if (error) {
        console.error('Supabase submit_nusuk_code error:', error);
        throw error;
      }

      if (data?.success) {
        setMessage('تمت إضافة الكود بنجاح. شكراً لمشاركتك!');
        setCode('');
      } else if (data?.message === 'Code already exists') {
        setMessage('هذا الكود موجود بالفعل في قاعدة البيانات.');
      } else {
        setMessage(
          `لم تتم إضافة الكود: ${data?.message || 'استجابة غير متوقعة من قاعدة البيانات.'}`
        );
      }

    } catch (error) {
      const details = getErrorMessage(error);

      console.error('Submit code failed:', error);

      setMessage(`تعذر إضافة الكود: ${details}`);

    } finally {
      setLoading(false);
    }
  }

  async function reportCode() {
    if (!visitorId || !receivedCode || loading) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        'report_nusuk_code',
        {
          p_visitor_id: visitorId,
          p_code: receivedCode,
          p_reason: 'Reported by visitor',
        }
      );

      if (error) {
        console.error('Supabase report_nusuk_code error:', error);
        throw error;
      }

      if (data?.success) {
        setMessage('تم تسجيل بلاغك للمراجعة. شكراً لتنبيهنا!');
      } else {
        setMessage(
          `تعذر تسجيل البلاغ: ${data?.message || 'استجابة غير متوقعة.'}`
        );
      }

    } catch (error) {
      const details = getErrorMessage(error);

      console.error('Report code failed:', error);

      setMessage(`حدث خطأ أثناء إرسال البلاغ: ${details}`);

    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(receivedCode);
      setMessage('تم نسخ الكود.');
    } catch (error) {
      console.error('Copy failed:', error);
      setMessage('تعذر نسخ الكود. يمكنك تحديده ونسخه يدويًا.');
    }
  }

  return (
    <div className="cards-grid">

      <article className="panel action-card">

        <div className="card-top">
          <div className="icon-box" aria-hidden="true">↗</div>

          <div>
            <h2 className="card-heading">الحصول على كود</h2>

            <p className="card-description">
              احصل على كود متاح من الأكواد التي شاركها الزوار.
            </p>
          </div>
        </div>

        <button
          className="button button-primary card-action"
          type="button"
          onClick={requestCode}
          disabled={loading || !visitorId}
        >
          {loading ? 'جارٍ التنفيذ...' : 'اطلب كوداً'}
        </button>

        {receivedCode && (
          <div style={{ marginTop: 16 }}>

            <p className="card-description">
              الكود الخاص بك:
            </p>

            <div
              className="code-field"
              dir="ltr"
              style={{
                display: 'flex',
                alignItems: 'center',
                overflowX: 'auto',
                marginTop: 8,
              }}
            >
              {receivedCode}
            </div>

            <button
              className="button button-outline card-action"
              type="button"
              onClick={copyCode}
            >
              نسخ الكود
            </button>

            <button
              className="button button-outline card-action"
              type="button"
              onClick={reportCode}
              disabled={loading}
            >
              الإبلاغ عن كود غير صالح
            </button>

          </div>
        )}

        <p className="status-message" aria-live="polite">
          {message}
        </p>

      </article>

      <article className="panel action-card">

        <div className="card-top">
          <div className="icon-box gold-icon" aria-hidden="true">+</div>

          <div>
            <h2 className="card-heading">إضافة كود</h2>

            <p className="card-description">
              شارك كوداً متاحاً لديك ليستفيد منه الآخرون.
            </p>
          </div>
        </div>

        <form
          className="card-form"
          onSubmit={submitCode}
        >

          <label
            className="sr-only"
            htmlFor="code-input"
          >
            الكود المراد إضافته
          </label>

          <input
            className="code-field"
            id="code-input"
            name="code"
            type="text"
            autoComplete="off"
            placeholder="ألصق الكود هنا"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />

          <button
            className="button button-outline"
            type="submit"
            disabled={loading}
          >
            {loading ? 'جارٍ الإضافة...' : 'إضافة الكود'}
          </button>

        </form>

        <p className="status-message" aria-live="polite">
          {message}
        </p>

      </article>

    </div>
  );
    }
