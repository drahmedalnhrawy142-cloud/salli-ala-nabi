#!/usr/bin/env python3
"""
يبني public/quran/tajweed.json: مواضع أحكام التجويد على نص مصحف المجمع (hafs.json).

المدخلات:
  1) بيانات التجويد: cpfair/quran-tajweed  output/tajweed.hafs.uthmani-pause-sajdah.json  (CC BY 4.0)
     مواضعها مقيسة على نص تانزيل العثماني.
  2) نص تانزيل العثماني (tanzil-uthmani-1.1.txt) — مدخل للبناء فقط، لا يُنشر مع التطبيق.
  3) public/quran/hafs.json (نص مجمع الملك فهد) — الذي يعرضه التطبيق.
الطريقة: تُقسَّم كل آية في النصين إلى «مقاطع» (حرف أساسي + علاماته) ثم تُحاذى المقاطع بحروفها
الأساسية، وتُنقل مواضع الأحكام من مقاطع تانزيل إلى مقاطع المجمع. لا يُغيَّر أي حرف في النص.
المخرجات: مصفوفة بعدد الآيات (بنفس ترتيب hafs.json)؛ لكل آية قائمة مسطحة [حكم، بداية، نهاية، ...].
الاستخدام: python3 tools/build_tajweed_marks.py <tajweed.json> <tanzil.txt> [hafs.json] [out.json]
"""
import difflib
import json
import os
import sys
import unicodedata

TJ, TZ = sys.argv[1], sys.argv[2]
HAFS = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(__file__), '..', 'public', 'quran', 'hafs.json')
OUT = sys.argv[4] if len(sys.argv) > 4 else os.path.join(os.path.dirname(__file__), '..', 'public', 'quran', 'tajweed.json')

RULES = [
    'ghunnah', 'ikhfa', 'ikhfa_shafawi', 'idghaam_ghunnah', 'idghaam_shafawi', 'idghaam_mutajanisayn',
    'idghaam_mutaqaribayn', 'idghaam_no_ghunnah', 'iqlab', 'qalqalah', 'madd_2', 'madd_246',
    'madd_muttasil', 'madd_munfasil', 'madd_6', 'hamzat_wasl', 'lam_shamsiyyah', 'silent',
]
RID = {r: i for i, r in enumerate(RULES)}
# عند تداخل حكمين على المقطع نفسه: الأعلى أولوية يظهر
PRIORITY = ['madd_6', 'madd_muttasil', 'madd_munfasil', 'madd_246', 'madd_2', 'qalqalah', 'iqlab', 'ikhfa', 'ikhfa_shafawi',
            'idghaam_ghunnah', 'idghaam_shafawi', 'idghaam_mutajanisayn', 'idghaam_mutaqaribayn', 'idghaam_no_ghunnah',
            'ghunnah', 'lam_shamsiyyah', 'hamzat_wasl', 'silent']

BASE_MAP = {'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ٲ': 'ا', 'ء': 'ء', 'ؤ': 'و', 'ئ': 'ي', 'ة': 'ه'}


def is_mark(ch):
    return unicodedata.category(ch) in ('Mn', 'Mc', 'Me') or ch in 'ـ'


def clusters(s):
    """قائمة (بداية، نهاية، الحرف الأساسي المطبَّع) لكل مقطع. المسافات والرموز المنفردة تُتخطى."""
    out = []
    i = 0
    while i < len(s):
        ch = s[i]
        if ch == ' ' or ch == ' ' or ch == '۞' or not (ch.isalpha()):
            i += 1
            continue
        j = i + 1
        while j < len(s) and is_mark(s[j]):
            j += 1
        out.append((i, j, BASE_MAP.get(ch, ch)))
        i = j
    return out


hafs = json.load(open(HAFS, encoding='utf-8'))
ayas = hafs['ayas']
lines = [l.rstrip('\n') for l in open(TZ, encoding='utf-8')]
bas = lines[0]
tz = {}
k = 0
for a in ayas:
    s, n = a[0], a[1]
    if n == 1 and s not in (1, 9) and lines[k] == bas:
        k += 1
    tz[(s, n)] = lines[k]
    k += 1

ann = {(x['surah'], x['ayah']): x['annotations'] for x in json.load(open(TJ, encoding='utf-8'))}

out = []
stats = dict(ayas=0, ann=0, mapped=0, dropped_unaligned=0, dropped_check=0, bad_ayas=0)
check_fail = {'hamzat_wasl': 0, 'qalqalah': 0}


def check(rule, ch_base_wasl, base_ours):
    if rule == 'hamzat_wasl':
        return base_ours == 'ا'
    if rule == 'qalqalah':
        return base_ours in 'قطبجد'
    if rule == 'lam_shamsiyyah':
        return base_ours == 'ل'
    return True


for idx, a in enumerate(ayas):
    s, n = a[0], a[1]
    t_tz = tz[(s, n)]
    t_us = a[4]
    cz = clusters(t_tz)
    cu = clusters(t_us)
    sm = difflib.SequenceMatcher(None, ''.join(c[2] for c in cz), ''.join(c[2] for c in cu), autojunk=False)
    m = {}  # فهرس مقطع تانزيل -> فهرس مقطع المجمع
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal' or (tag == 'replace' and i2 - i1 == j2 - j1):
            for d in range(i2 - i1):
                m[i1 + d] = j1 + d
    # فهرس المقطع الذي يحوي كل موضع حرفي في تانزيل
    pos2c = {}
    for ci, (b, e, _) in enumerate(cz):
        for p in range(b, e):
            pos2c[p] = ci
    items = {}  # (بداية، نهاية) في نص المجمع -> حكم بأعلى أولوية
    ayah_bad = False
    for an in ann.get((s, n), []):
        stats['ann'] += 1
        # الحكم قد يقع على علامة ملتصقة بمقطع؛ نأخذ المقاطع التي تغطيها المدى
        cs = sorted({pos2c[p] for p in range(an['start'], an['end']) if p in pos2c})
        if not cs:
            stats['dropped_unaligned'] += 1
            continue
        if any(c not in m for c in cs):
            stats['dropped_unaligned'] += 1
            continue
        us = [m[c] for c in cs]
        rule = an['rule']
        if not check(rule, None, cu[us[0]][2]):
            check_fail[rule] = check_fail.get(rule, 0) + 1
            stats['dropped_check'] += 1
            ayah_bad = True
            continue
        b = cu[us[0]][0]
        e = cu[us[-1]][1]
        key = (b, e)
        if key not in items or PRIORITY.index(rule) < PRIORITY.index(items[key]):
            items[key] = rule
        stats['mapped'] += 1
    flat = []
    if ayah_bad:
        # آية فيها فحص فاشل: احتمال اختلاف النصين فيها، فنتركها بلا تلوين بدل أن نلوّن موضعًا خاطئًا
        stats['bad_ayas'] += 1
        items = {}
    for (b, e), r in sorted(items.items()):
        flat += [RID[r], b, e]
    out.append(flat)
    stats['ayas'] += 1

json.dump({'rules': RULES, 'a': out}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(stats, check_fail, 'bytes', os.path.getsize(OUT))
