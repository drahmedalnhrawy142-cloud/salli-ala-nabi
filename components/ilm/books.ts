/** سجل الكتب ذات الهيكل الموحّد (كتب ← أبواب ← فقرات) المستعملة في البحث الشامل والمفضلة ومتابعة القراءة. */
export type BookMeta = { id: string; dir: string; title: string; fiqh: boolean; credit: string; sub?: string; author?: string; cat?: string };

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
export const libMeta = (b: LibItem): BookMeta => ({ id: b.id, dir: `/library/${b.id}/`, title: b.title, fiqh: false, credit: libCredit(b), sub: b.sub, author: b.author, cat: b.cat });

/** كتب لها بياناتها الخاصة (الحديث والسيرة والفقه المقارن): تظهر على رفوف المكتبة مع غيرها */
export type Shelf = LibItem & { dir: string; fiqh?: boolean };
export const EXTRA_SHELF: Shelf[] = [
  { id: 'bukhari', dir: '/hadith/bukhari/', cat: 'الحديث وعلومه', title: 'صحيح البخاري', author: 'الإمام البخاري (ت ٢٥٦هـ)', sub: 'الجامع الصحيح بنصه وسنده', via: '' },
  { id: 'muslim', dir: '/hadith/muslim/', cat: 'الحديث وعلومه', title: 'صحيح مسلم', author: 'الإمام مسلم (ت ٢٦١هـ)', sub: 'المسند الصحيح بنصه وسنده', via: '' },
  { id: 'nawawi40', dir: '/hadith/nawawi/', cat: 'الحديث وعلومه', title: 'الأربعون النووية', author: 'الإمام النووي (ت ٦٧٦هـ)', sub: 'اثنان وأربعون حديثًا من جوامع الكلم', via: '' },
  { id: 'sira_h', dir: '/sira/', cat: 'السيرة والتراجم', title: 'السيرة النبوية', author: 'ابن هشام (ت ٢١٣هـ)', sub: 'سيرة رسول الله ﷺ كاملة بفهرسها', via: '' },
  { id: 'ikhtilaf', dir: '/fiqh/', cat: 'الفقه المقارن', title: 'اختلاف الأئمة العلماء', author: 'ابن هبيرة الوزير (ت ٥٦٠هـ)', sub: 'إجماع الأئمة الأربعة وخلافهم مسألةً مسألة', via: '', fiqh: true },
  { id: 'bidaya', dir: '/fiqh/bidaya/', cat: 'الفقه المقارن', title: 'بداية المجتهد ونهاية المقتصد', author: 'ابن رشد الحفيد (ت ٥٩٥هـ)', sub: 'المسائل وأقوال الفقهاء وسبب اختلافهم', via: '', fiqh: true },
  { id: 'arkan_h', dir: '/arkan/', cat: 'الفقه والعبادات', title: 'أركان الإسلام الخمسة', author: 'مختارات من الصحيحين وأمهات الكتب', sub: 'لكل ركن: أحاديثه وشروحه مرتّبة بالأبواب', via: '' },
];
export const shelfMeta = (b: Shelf): BookMeta => ({ id: b.id, dir: b.dir, title: b.title, fiqh: !!b.fiqh, credit: '', sub: b.sub, author: b.author, cat: b.cat });

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
  return [...EXTRA_SHELF.map(shelfMeta), ...lib.map(libMeta)];
}
