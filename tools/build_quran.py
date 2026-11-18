#!/usr/bin/env python3
"""يبني ملفات المصحف من بيانات مجمع الملك فهد لطباعة المصحف الشريف (رواية حفص v18).
المصدر: https://qurancomplex.gov.sa/en/techquran/dev/  (نسخة مرآة: github.com/ibnhazm/KFGQPC)
الاستخدام: python3 tools/build_quran.py <hafsData_v18.json>
لا يعدّل في النص إطلاقًا؛ يفصل فقط رقم الآية الملحق بآخر النص."""
import json, re, sys
src = sys.argv[1]
d = json.load(open(src, encoding='utf-8'))
assert len(d) == 6236
num = re.compile(r'[\s ]*[٠-٩]+\s*$')
ayas, simple, suras = [], [], {}
for x in d:
    t = num.sub('', x['aya_text'])
    assert t and not re.search(r'[٠-٩]\s*$', t)
    ayas.append([x['sora'], x['aya_no'], x['page'], x['jozz'], t])
    simple.append(x['aya_text_emlaey'].strip())
    s = suras.setdefault(x['sora'], {'n': x['sora'], 'name': x['sora_name_ar'].strip(), 'ayas': 0, 'page': x['page'], 'juz': x['jozz']})
    s['ayas'] += 1
page_index = [0] * 606
for i in range(len(ayas) - 1, -1, -1):
    page_index[ayas[i][2]] = i
page_index[605] = len(ayas)
for p in range(604, 0, -1):
    if page_index[p] == 0 and p != 1:
        page_index[p] = page_index[p + 1]
out = {'suras': [suras[k] for k in sorted(suras)], 'ayas': ayas, 'pageIndex': page_index[:606]}
json.dump(out, open('public/quran/hafs.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(simple, open('public/quran/simple.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok', len(ayas), len(out['suras']))
