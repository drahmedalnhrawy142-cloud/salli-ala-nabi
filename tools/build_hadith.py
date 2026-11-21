#!/usr/bin/env python3
"""يولّد public/hadith/: مكتبة الحديث (صحيح البخاري، صحيح مسلم، الأربعون النووية) من hadith-json (sunnah.com).
الاستخدام: python3 -I tools/build_hadith.py <مجلد db/by_book>"""
import json, os, re, sys, shutil
B = sys.argv[1]
OUT = 'public/hadith'
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
BOOKS = [('bukhari', 'صحيح البخاري', 'the_9_books/bukhari.json'), ('muslim', 'صحيح مسلم', 'the_9_books/muslim.json'), ('nawawi', 'الأربعون النووية', 'forties/nawawi40.json')]
def clean(t): return re.sub(r'[‎‏]', '', re.sub(r'\s+', ' ', t)).strip()
index = []
for bid, title, path in BOOKS:
    d = json.load(open(os.path.join(B, path), encoding='utf-8'))
    os.makedirs(f'{OUT}/{bid}')
    by = {}
    for h in d['hadiths']: by.setdefault(int(h['chapterId']), []).append([str(h['idInBook']), clean(h['arabic'])])
    chs = []
    for c in d['chapters']:
        cid = int(c['id']); items = by.get(cid, [])
        if not items: continue
        json.dump(items, open(f'{OUT}/{bid}/{cid}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        chs.append({'id': cid, 't': clean(c['arabic']), 'n': len(items)})
    index.append({'id': bid, 'title': title, 'total': sum(c['n'] for c in chs), 'chapters': chs})
    print(bid, sum(c['n'] for c in chs), len(chs))
json.dump(index, open(f'{OUT}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
