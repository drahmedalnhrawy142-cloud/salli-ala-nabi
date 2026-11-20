#!/usr/bin/env python3
"""يولّد public/ulum/: موسوعة علوم القرآن من نصوص OpenITI (المكتبة الشاملة، تحقيق محمد أبو الفضل إبراهيم):
- «الإتقان في علوم القرآن» للسيوطي (ت ٩١١هـ)
- «البرهان في علوم القرآن» للزركشي (ت ٧٩٤هـ)
تُستبعد الأنواع التي يغلب عليها جمع مرويات متفاوتة الدرجة التزامًا بقاعدة التطبيق (الصحيح والحسن فقط).
الاستخدام: python3 -I tools/build_itqan.py <نص الإتقان> <نص البرهان>"""
import json, os, re, shutil, sys
ORDW = {}
BOOKS = [
 ('itqan', 'الإتقان في علوم القرآن', 'جلال الدين السيوطي (ت ٩١١هـ)', sys.argv[1], {9, 70, 71, 72, 73, 75}),
 ('burhan', 'البرهان في علوم القرآن', 'بدر الدين الزركشي (ت ٧٩٤هـ)', sys.argv[2], {1, 6, 26, 27, 28}),
]
shutil.rmtree('public/ulum', ignore_errors=True); os.makedirs('public/ulum')
books = []
def clean(t): return re.sub(r'\s+', ' ', re.sub(r'\bms\d+\b', '', t)).strip()
WORDS = {'الأول':1,'الثاني':2,'الثالث':3,'الرابع':4,'الخامس':5,'السادس':6,'السابع':7,'الثامن':8,'التاسع':9,'العاشر':10}
for bid, title, author, path, SKIP in BOOKS:
    src = open(path, encoding='utf-8').read().split('\n')
    body = [ln for ln in src if not ln.startswith('#META') and ln.strip() and not re.match(r'^# PageV\d+P\d+', ln)]
    # نبدأ من «المجلد الأول» لنتجاوز مقدمة المحقق
    start = next((i for i, ln in enumerate(body) if ln.startswith('### | المجلد الأول')), 0)
    body = body[start:]
    types = []; cur = None; para = None
    def flush():
        global para
        if para is not None and cur is not None:
            t = clean(para)
            if t: cur[1].append(t)
        para = None
    for ln in body:
        if ln.startswith('### |'):
            flush(); h = clean(ln[5:])
            if h.startswith('النوع'): cur = [h, []]; types.append(cur)
            elif h.startswith('تابع النوع'): pass
            elif cur is not None and h and not h.startswith('المجلد') and not re.fullmatch(r'\.+', h): para = h + ' '
            continue
        if cur is None: continue
        if ln.startswith('# '): flush(); para = ln[2:]
        elif ln.startswith('~~'): para = (para or '') + ' ' + ln[2:]
    flush()
    os.makedirs(f'public/ulum/{bid}')
    index = []; n = 0
    for t in types:
        n += 1
        merged = 'والثالث والرابع والخامس والسادس والسابع' in t[0]
        num = 22 if merged else n
        if merged: n = 27
        if num in SKIP: continue
        name = re.sub(r'^النوع [^:]+:\s*', '', t[0]).strip()
        name = re.sub(r'^النوع .*? في ', 'في ', name) if name.startswith('النوع') else name
        json.dump(t[1], open(f'public/ulum/{bid}/{num}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        index.append({'n': num, 'l': '٢٢–٢٧' if merged else None, 't': name, 'k': len(t[1]), 'c': sum(len(p) for p in t[1])})
    books.append({'id': bid, 'title': title, 'author': author, 'types': index})
    print(bid, len(types), 'types;', len(index), 'kept;', sum(i['c'] for i in index), 'chars')
json.dump(books, open('public/ulum/index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for b in books: print([ (i['n'], i['t'][:30]) for i in b['types'][:3]], [(i['n'], i['t'][:30]) for i in b['types'][-2:]])
