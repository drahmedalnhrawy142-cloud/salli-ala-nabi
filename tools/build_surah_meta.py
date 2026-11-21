#!/usr/bin/env python3
"""يولّد components/quran/surahMeta.ts: [مكية(0)/مدنية(1), عدد الكلمات, عدد الحروف] لكل سورة.
المكي/المدني من بيانات Tanzil (عبر risan/quran-json، CC BY-SA 4.0)، والأعداد محسوبة من نص simple.json (بلا بسملة السور).
الاستخدام: python3 -I tools/build_surah_meta.py <chapters.json>"""
import json, re, sys
ch = json.load(open(sys.argv[1], encoding='utf-8'))['chapters']
simple = json.load(open('public/quran/simple.json')); hafs = json.load(open('public/quran/hafs.json'))['ayas']
cnt = {}
for t, a in zip(simple, hafs):
    s = a[0]; w = t.split()
    if s == 1 and a[1] == 1 and len(w) == 4 and w[0].startswith('بِسْمِ'): continue
    c = cnt.setdefault(s, [0, 0]); c[0] += len(w); c[1] += len(re.sub(r'[^ء-ي]', '', re.sub(r'[ً-ٰٟ]', '', t)))
rows = [[1 if c['type'] == 'medinan' else 0, cnt[c['id']][0], cnt[c['id']][1]] for c in ch]
open('components/quran/surahMeta.ts', 'w').write('// مولَّد بـ tools/build_surah_meta.py — المكي/المدني: Tanzil (CC BY-SA 4.0 عبر risan/quran-json)\n// [0 مكية | 1 مدنية، كلمات، حروف]\nexport const SURAH_META: [number, number, number][] = ' + json.dumps(rows) + ';\n')
print(len(rows), sum(r[0] == 0 for r in rows), 'meccan', sum(r[1] for r in rows), 'words')
