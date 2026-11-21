/**
 * التعرّف على الكلام للتسميع الصوتي.
 * - على أندرويد: عبر إضافة التطبيق الأصلية (SpeechRecognizer من خدمات جوجل).
 * - في متصفح كروم: عبر Web Speech API.
 * يحتاج اتصالًا بالإنترنت في الغالب، إلا إن كان جهازك يحمل حزمة التعرّف العربي دون اتصال.
 */
type Cb = { onText: (text: string, final: boolean) => void; onEnd: (err?: string) => void };
export type SpeechSession = { stop: () => void };

type CapPlugin = {
  speechPermission?: () => Promise<{ granted: boolean }>;
  speechStart?: (o: { lang: string }) => Promise<void>;
  speechStop?: () => Promise<void>;
  addListener?: (ev: string, cb: (d: { text?: string; final?: boolean; error?: string }) => void) => Promise<{ remove: () => void }>;
};
type Cap = { isNativePlatform?: () => boolean; Plugins?: { FloatingButton?: CapPlugin } };

function cap(): CapPlugin | null {
  try {
    const c = (window as unknown as { Capacitor?: Cap }).Capacitor;
    return c?.isNativePlatform?.() ? c.Plugins?.FloatingButton ?? null : null;
  } catch {
    return null;
  }
}

type WebRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
function webCtor(): (new () => WebRec) | null {
  try {
    const w = window as unknown as { SpeechRecognition?: new () => WebRec; webkitSpeechRecognition?: new () => WebRec };
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  } catch {
    return null;
  }
}

export function speechKind(): 'native' | 'web' | null {
  const c = cap();
  if (c?.speechStart) return 'native';
  return webCtor() ? 'web' : null;
}

/** يطلب إذن الميكروفون على أندرويد (ينتظر حتى يوافق المستخدم) */
export async function ensureMic(): Promise<boolean> {
  const c = cap();
  if (!c?.speechPermission) return true;
  let r = await c.speechPermission();
  for (let i = 0; i < 30 && !r.granted; i++) {
    await new Promise((res) => setTimeout(res, 700));
    r = await c.speechPermission();
  }
  return r.granted;
}

/** يبدأ جلسة استماع واحدة (تنتهي عند الصمت)؛ على المستدعي إعادة تشغيلها للاستمرار */
export async function startSpeech(cb: Cb, lang = 'ar-SA'): Promise<SpeechSession> {
  const c = cap();
  if (c?.speechStart && c.addListener) {
    let done = false;
    const hs: { remove: () => void }[] = [];
    const finish = (err?: string) => {
      if (done) return;
      done = true;
      hs.forEach((h) => h.remove());
      cb.onEnd(err);
    };
    hs.push(await c.addListener('speechResult', (d) => cb.onText(d.text || '', !!d.final)));
    hs.push(await c.addListener('speechEnd', (d) => finish(d.error)));
    try {
      await c.speechStart({ lang });
    } catch (e) {
      finish(String((e as { message?: string })?.message || e));
    }
    return { stop: () => void c.speechStop?.().catch(() => {}) };
  }
  const Ctor = webCtor();
  if (!Ctor) throw new Error('unsupported');
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  let err: string | undefined;
  rec.onresult = (e) => {
    let text = '';
    let fin = false;
    for (let i = 0; i < e.results.length; i++) {
      text += ' ' + e.results[i][0].transcript;
      fin = e.results[i].isFinal;
    }
    cb.onText(text.trim(), fin);
  };
  rec.onerror = (e) => {
    err = e.error;
  };
  rec.onend = () => cb.onEnd(err);
  rec.start();
  return { stop: () => rec.stop() };
}
