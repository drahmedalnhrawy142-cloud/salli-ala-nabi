#!/usr/bin/env python3
"""يولّد components/virtueData.ts: نصوص أحاديث أيام الفضل مقتطعة (كلام النبي ﷺ فقط) من مشروع hadith-json (sunnah.com).
الاستخدام: python3 -I tools/build_virtue.py <مجلد db/by_book/the_9_books>"""
import json, re, sys, os
D = sys.argv[1]
def st(t): return re.sub(r'[ً-ٰٟ‏‎]', '', t)
def load(b, n):
    for h in json.load(open(os.path.join(D, b + '.json'), encoding='utf-8'))['hadiths']:
        if h['idInBook'] == n: return h['arabic']
def quotes(t):
    t = t.replace('‏', '').replace('‎', '')
    return [q.strip() for q in re.findall(r'"\s*([^"]+?)\s*"', t)]
def cut(q, a, b=None):
    """مقتطف من الاقتباس بين كلمة بداية (a) وكلمة نهاية (b) بحسب النص المجرّد من التشكيل"""
    toks = q.split(); bare = [st(x) for x in toks]
    i = next(k for k in range(len(toks)) if ' '.join(bare[k:k+len(a.split())]) == a)
    j = len(toks)
    if b: j = next(k for k in range(i, len(toks)) if ' '.join(bare[k:k+len(b.split())]) == b)
    return ' '.join(toks[i:j]).strip(' .')
def pick(h, key):
    return next(q for q in quotes(h) if key in st(q))
M2630 = pick(load('muslim', 2630), 'صيام يوم عرفة')
out = {
 'arafah': (cut(M2630, 'صيام يوم عرفة', 'وصيام يوم عاشوراء'), 'رواه مسلم', 'أبو قتادة رضي الله عنه'),
 'ashura': (re.sub(r'^و[\u064B-\u065F]*','',cut(M2630, 'وصيام يوم عاشوراء')), 'رواه مسلم', 'أبو قتادة رضي الله عنه'),
 'tasua': (pick(load('muslim', 2551), 'لئن بقيت'), 'رواه مسلم', 'ابن عباس رضي الله عنهما'),
 'shawwal': (pick(load('muslim', 2642), 'ستا من شوال'), 'رواه مسلم', 'أبو أيوب الأنصاري رضي الله عنه'),
 'ten': (pick(load('bukhari', 943), 'ما العمل في أيام العشر'), 'رواه البخاري', 'ابن عباس رضي الله عنهما'),
 'monthu': (pick(load('tirmidhi', 747), 'تعرض الأعمال'), 'رواه الترمذي', 'أبو هريرة رضي الله عنه'),
 'white': (pick(load('nasai', 2425), 'أيام البيض'), 'رواه النسائي', 'جرير بن عبد الله رضي الله عنه'),
 'qadr': (pick(load('bukhari', 1944), 'تحروا ليلة القدر'), 'رواه البخاري', 'عائشة رضي الله عنها'),
}
for k, v in out.items(): print(k, '|', v[0][:120])
rows = ',\n'.join(f"  {k}: {{ text: {json.dumps(v[0], ensure_ascii=False)}, source: {json.dumps(v[1], ensure_ascii=False)}, narrator: {json.dumps(v[2], ensure_ascii=False)} }}" for k, v in out.items())
open('components/virtueData.ts', 'w', encoding='utf-8').write(
 "// مولَّد بـ tools/build_virtue.py من hadith-json (sunnah.com) — اقتباس كلام النبي ﷺ بلا تعديل. أرقام المصادر تُراجَع قبل النشر.\nexport const VH: Record<string, { text: string; source: string; narrator: string }> = {\n" + rows + "\n};\n")
