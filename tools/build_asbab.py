#!/usr/bin/env python3
"""يولّد public/quran/asbab.json: ما ورد في الصحيحين (البخاري ومسلم) عن نزول الآيات.
المنهج: أحاديث فيها «نزلت/أنزل الله» قريبًا من نص آية مقتبسة فيها، تُربط بالآية بمطابقة نصها (٤ كلمات متتالية فأكثر)
لا بالاجتهاد؛ ويُعرض نص الحديث كاملًا ليحكم القارئ. الاستخدام: python3 -I tools/build_asbab.py <db/by_book>"""
import json, re, collections, sys
B = sys.argv[1] + '/the_9_books/'
def norm(s):
    s = re.sub(r'[ؐ-ًؚ-ٰٟۖ-ۭـ‌‍‎‏]', '', s)
    s = re.sub('[أإآٱ]', 'ا', s).replace('ى', 'ي').replace('ة', 'ه')
    return re.sub(r'\s+', ' ', re.sub(r'[^ء-ي ]', ' ', s)).strip()
simple = json.load(open('public/quran/simple.json')); hafs = json.load(open('public/quran/hafs.json'))['ayas']
assert len(simple) == len(hafs) == 6236
words = [norm(x).split() for x in simple]
N = 4
g = collections.defaultdict(set)
for i, w in enumerate(words):
    for k in range(len(w) - N + 1): g[tuple(w[k:k + N])].add(i)
KW = re.compile(r'(نزلت|انزلت|انزل الله|فانزل الله|فانزل|انزل)')
KW2 = re.compile(r'(نزلت هذه الايه|نزلت الايه|نزلت فيه|نزلت في|نزلت هذه|نزل هذا)')
BOOKN = {'bukhari': 'صحيح البخاري', 'muslim': 'صحيح مسلم'}
H = []; A = collections.defaultdict(list)
def wpos(t, rx): return [len(t[:m.start()].split()) for m in rx.finditer(t)]
for book in ['bukhari', 'muslim']:
    d = json.load(open(B + book + '.json', encoding='utf-8'))
    ch = {c['id']: c['arabic'] for c in d['chapters']}
    for h in d['hadiths']:
        t = norm(h['arabic'])
        if not KW.search(t) and not KW2.search(t): continue
        w = t.split(); p1 = wpos(t, KW); p2 = wpos(t, KW2)
        hits = {}
        for k in range(len(w) - N + 1):
            s_ = g.get(tuple(w[k:k + N]))
            if s_ and len(s_) <= 2:
                for i in s_: hits.setdefault(i, []).append(k)
        found = []
        for i, ks in hits.items():
            if len(words[i]) <= N: continue
            if len(ks) < min(3, max(1, len(words[i]) - N + 1)): continue
            first, last = min(ks), max(ks) + N
            if any(0 <= first - pp <= 14 for pp in p1) or any(0 <= pp - last <= 30 for pp in p2 + p1): found.append(i)
        if not found or len(found) > 4: continue
        H.append({'b': BOOKN[book], 'n': str(h['idInBook']), 'c': re.sub(r'\s+', ' ', ch[h['chapterId']]).strip(), 't': re.sub(r'[‎‏]', '', re.sub(r'\s+', ' ', h['arabic'])).strip()})
        for i in found: A[f'{hafs[i][0]}:{hafs[i][1]}'].append(len(H) - 1)
for k in A: A[k] = A[k][:4]
json.dump({'h': H, 'a': A}, open('public/quran/asbab.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(H), 'hadiths', len(A), 'ayahs')
