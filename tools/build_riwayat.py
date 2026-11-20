#!/usr/bin/env python3
"""يبني public/quran/r/<رواية>.json لكل رواية من بيانات مجمع الملك فهد (مرآة: github.com/ibnhazm/KFGQPC).
نفس بنية hafs.json: suras / ayas [سورة، آية، صفحة، جزء، نص] / pageIndex. لا يُعدَّل النص؛ يُفصل فقط رقم الآية الملحق.
ترقيم الآيات والصفحات خاص بكل رواية كما في مصحفها. ويُنسخ خط كل رواية إلى public/fonts.
الاستخدام: python3 -I tools/build_riwayat.py <مجلد KFGQPC>"""
import json, os, re, shutil, sys
ROOT = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'public')
os.makedirs(os.path.join(OUT, 'quran', 'r'), exist_ok=True)
R = {
    'shouba': ('shouba/data/ShoubaData08.json', 'shouba/font/shouba.8.woff2'),
    'warsh': ('warsh/data/warshData_v10.json', 'warsh/font/warsh.10.woff2'),
    'qaloon': ('qaloon/data/QaloonData_v10.json', 'qaloon/font/qaloon.10.woff2'),
    'doori': ('doori/data/DooriData_v09.json', 'doori/font/doori.9.woff2'),
    'soosi': ('soosi/data/SoosiData09.json', 'soosi/font/soosi.9.woff2'),
    'bazzi': ('bazzi/data/BazziData_v07.json', 'bazzi/font/bazzi.7.woff2'),
    'qumbul': ('qumbul/data/QumbulData_v07.json', 'qumbul/font/qumbul.7.woff2'),
}
num = re.compile(r'[\s ]*[٠-٩]+\s*$')
for rid, (jf, ff) in R.items():
    d = json.load(open(os.path.join(ROOT, jf), encoding='utf-8'))
    ayas, suras = [], {}
    for x in d:
        t = num.sub('', x['aya_text'])
        assert t and not re.search(r'[٠-٩]\s*$', t), (rid, x['id'])
        pg = int(str(x['page']).split('-')[0])
        ayas.append([x['sura_no'], x['aya_no'], pg, x['jozz'], t])
        s = suras.setdefault(x['sura_no'], {'n': x['sura_no'], 'name': x['sura_name_ar'].strip(), 'ayas': 0, 'page': pg, 'juz': x['jozz']})
        s['ayas'] += 1
    maxp = max(a[2] for a in ayas)
    pi = [0] * (maxp + 2)
    for i in range(len(ayas) - 1, -1, -1):
        pi[ayas[i][2]] = i
    pi[maxp + 1] = len(ayas)
    for p in range(maxp, 0, -1):
        if pi[p] == 0 and p != 1:
            pi[p] = pi[p + 1]
    out = {'suras': [suras[k] for k in sorted(suras)], 'ayas': ayas, 'pageIndex': pi}
    fn = os.path.join(OUT, 'quran', 'r', rid + '.json')
    json.dump(out, open(fn, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    shutil.copyfile(os.path.join(ROOT, ff), os.path.join(OUT, 'fonts', os.path.basename(ff)))
    print(rid, len(ayas), len(out['suras']), 'pages', maxp, os.path.getsize(fn) // 1024, 'KB')
