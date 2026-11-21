# دليل التسليم: صلّي على النبي ﷺ

## المشروع
- **الموقع**: https://salli-ala-nabi.vercel.app — Next.js 15 + React 19 + Supabase على Vercel. فرع الإنتاج: `feature/arabic-frontend`. أي دفع لهذا الفرع ينشر على الموقع الحي.
- **التطبيق**: Capacitor 8 للأندرويد، يُبنى على GitHub Actions. كود الواجهة في `components/`، وكود أندرويد الأصلي في `native/` ويُحقن بسكربت `native/patch_android.py` بعد `npx cap add android`.

## الفروع
| الفرع | الغرض |
|---|---|
| `feature/arabic-frontend` | الموقع الحي (لا تدفع إليه إلا عند النشر) |
| `floating-button` | تطوير التطبيق، كل دفعة تبني APK للتجربة (workflow: `android.yml`) |
| `release` | بناء AAB/APK الإصدار لجوجل بلاي (workflow: `android-release.yml`) |

## بناء نسخة التجربة
ادفع إلى `floating-button` ثم افتح تبويب Actions في GitHub وحمّل ملف الـAPK من آخر تشغيل ناجح.

## بناء نسخة جوجل بلاي
1. أضف أربعة Secrets في إعدادات المستودع: `ANDROID_KEYSTORE_BASE64` و`ANDROID_KEYSTORE_PASSWORD` و`ANDROID_KEY_ALIAS` و`ANDROID_KEY_PASSWORD`.
2. ادفع: `git push origin floating-button:release`.
3. حمّل ملف الـAAB من Actions وارفعه في Play Console. بدون الأسرار يُبنى إصدار غير موقّع.
4. احتفظ بملف المفتاح (keystore) وكلمات مروره في مكان آمن: ضياعه يمنع تحديث التطبيق.

## الترجمة (عربي/English)
- القواميس في `components/en/`: `ui.ts` لنصوص الواجهة (تُستبدل)، و`tr.ts` للنصوص المقدّسة (تبقى عربية وتظهر الترجمة تحتها).
- المفتاح هو النص العربي كما يظهر تمامًا. القيم التي فيها `{0}` و`{1}` أجزاء متغيرة.
- أي نص عربي جديد في الواجهة يحتاج سطرًا جديدًا في القاموس، وإلا يظهر بالعربية في النسخة الإنجليزية.
- المنطق في `components/i18n.ts`، وزر التبديل في `components/LangSwitch.tsx`.
- إشعارات أندرويد والويدجت وبطاقة الصورة المشاركة ما زالت بالعربية فقط.

## ما يحتاج مراجعة بشرية
- ترجمة الأذكار والأحاديث والآيات وأسماء الله ومواقف السيرة، قبل النشر.
- إيميل التواصل في `PRIVACY.md` (مكانه فارغ).

## ملفات الستور
`play/STORE-LISTING.md` (عربي) و`play/STORE-LISTING-EN.md` (إنجليزي) والأيقونة `play/icon-512.png` والصورة `play/feature-graphic-1024x500.png`.
