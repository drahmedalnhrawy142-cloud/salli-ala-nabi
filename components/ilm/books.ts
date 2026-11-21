/** سجل الكتب ذات الهيكل الموحّد (كتب ← أبواب ← فقرات) المستعملة في البحث الشامل والمفضلة ومتابعة القراءة. */
export type BookMeta = { id: string; dir: string; title: string; fiqh: boolean; credit: string; sub?: string };

const FQ_TAIL = ' هذه أقوال علماء للدراسة والاطّلاع، وليست فتوى؛ وللعمل بمسألة تخصّك اسأل عالمًا ثقة. وما يرد من أحاديث فيها فليُرجع إلى درجتها في مظانّها.';
export const FIQH_BOOKS: BookMeta[] = [
  {
    id: 'ikhtilaf',
    dir: '/fiqh/',
    title: 'اختلاف الأئمة العلماء',
    sub: 'ابن هبيرة • إجماع الأئمة الأربعة وخلافهم مسألةً مسألة',
    fiqh: true,
    credit:
      'الكتاب: «اختلاف الأئمة العلماء» للوزير ابن هبيرة الحنبلي (ت ٥٦٠هـ)، يجمع إجماع الأئمة الأربعة (أبي حنيفة ومالك والشافعي وأحمد) ومواضع اختلافهم في أبواب الفقه. النص من المكتبة الشاملة (تحقيق السيد يوسف أحمد) عبر مشروع OpenITI بترخيص CC BY-NC-SA 4.0.' + FQ_TAIL,
  },
  {
    id: 'bidaya',
    dir: '/fiqh/bidaya/',
    title: 'بداية المجتهد ونهاية المقتصد',
    sub: 'ابن رشد الحفيد • المسائل وأقوال الفقهاء وسبب اختلافهم',
    fiqh: true,
    credit:
      'الكتاب: «بداية المجتهد ونهاية المقتصد» لأبي الوليد ابن رشد الحفيد المالكي (ت ٥٩٥هـ)، يعرض مسائل الفقه المتفق عليها والمختلف فيها بين فقهاء الأمصار، مع أدلتهم وسبب اختلافهم. النص من المكتبة الشاملة (دار الحديث، القاهرة) عبر مشروع OpenITI بترخيص CC BY-NC-SA 4.0.' + FQ_TAIL,
  },
];

export type LibItem = { id: string; cat: string; title: string; author: string; sub: string; via: string };
export const libCredit = (b: LibItem) =>
  `الكتاب: «${b.title}» — ${b.author}. النص من ${b.via} عبر مشروع OpenITI بترخيص CC BY-NC-SA 4.0، دون تعديل في ألفاظ المؤلف (وقد تظهر فيه هوامش المحقق وأرقام الأحاديث كما في النسخة الرقمية). للدراسة والاطّلاع؛ والأفضل قراءة الكتب على شيخ أو معلّم.`;
export const libMeta = (b: LibItem): BookMeta => ({ id: b.id, dir: `/library/${b.id}/`, title: b.title, fiqh: false, credit: libCredit(b) });

let libP: Promise<LibItem[]> | null = null;
export function loadLibIndex(): Promise<LibItem[]> {
  if (!libP) {
    libP = fetch('/library/index.json').then((r) => {
      if (!r.ok) throw new Error('lib');
      return r.json() as Promise<LibItem[]>;
    });
    libP.catch(() => (libP = null));
  }
  return libP;
}
export async function allBooks(): Promise<BookMeta[]> {
  const lib = await loadLibIndex();
  return [...FIQH_BOOKS, ...lib.map(libMeta)];
}
