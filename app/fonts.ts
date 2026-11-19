import {
  Reem_Kufi,
  Aref_Ruqaa,
  Amiri,
  Noto_Naskh_Arabic,
  Noto_Kufi_Arabic,
  Scheherazade_New,
  Cairo,
  Tajawal,
  Almarai,
  IBM_Plex_Sans_Arabic,
  El_Messiri,
} from 'next/font/google';

/**
 * الخطان الافتراضيان (كوفي للعناوين، رقعة للنصوص) يبقيان كما كانا.
 * باقي الخطوط للاختيار من «المزيد ← نوع الخط»؛ لا تُحمَّل إلا إذا اختارها المستخدم
 * (preload: false، وأجزاء الخط تُجلب عند الاستخدام فقط).
 */
const kufi = Reem_Kufi({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-kufi', display: 'swap' });
const ruqaa = Aref_Ruqaa({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-ruqaa', display: 'swap' });

// ملاحظة: next/font يشترط قيمًا مكتوبة حرفيًا داخل كل استدعاء (لا spread ولا متغيرات).
const amiri = Amiri({ subsets: ['arabic'], display: 'swap', preload: false, weight: ['400', '700'], variable: '--f-amiri' });
const naskh = Noto_Naskh_Arabic({ subsets: ['arabic'], display: 'swap', preload: false, variable: '--f-naskh' });
const notoKufi = Noto_Kufi_Arabic({ subsets: ['arabic'], display: 'swap', preload: false, variable: '--f-notokufi' });
const schehe = Scheherazade_New({ subsets: ['arabic'], display: 'swap', preload: false, weight: ['400', '700'], variable: '--f-schehe' });
const cairo = Cairo({ subsets: ['arabic'], display: 'swap', preload: false, variable: '--f-cairo' });
const tajawal = Tajawal({ subsets: ['arabic'], display: 'swap', preload: false, weight: ['400', '500', '700'], variable: '--f-tajawal' });
const almarai = Almarai({ subsets: ['arabic'], display: 'swap', preload: false, weight: ['400', '700'], variable: '--f-almarai' });
const plex = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], display: 'swap', preload: false, weight: ['400', '500', '700'], variable: '--f-plex' });
const messiri = El_Messiri({ subsets: ['arabic'], display: 'swap', preload: false, variable: '--f-messiri' });

export const FONT_CLASSES = [
  kufi, ruqaa, amiri, naskh, notoKufi, schehe, cairo, tajawal, almarai, plex, messiri,
]
  .map((f) => f.variable)
  .join(' ');
