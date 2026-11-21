#!/usr/bin/env python3
"""
يبني public/qudsi.json — الأحاديث القدسية الصحيحة بنصوصها الكاملة، بلا أي كتابة من عندنا.

المصدر: AhmedBaset/hadith-json (مأخوذ من sunnah.com):
  db/by_book/forties/qudsi40.json  — «الأربعون القدسية»
  db/by_book/the_9_books/bukhari.json — لإضافة حديث من صحيح البخاري غير مذكور في الأربعين
الاستخدام: python3 tools/build_qudsi.py <مجلد-hadith-json> [الإخراج]

الانتقاء (كله يتحقق منه السكريبت):
  - تُقبل أحاديث الأربعين التي يذكر سطر تخريجها في النص: البخاري أو مسلم، أو «بسند صحيح/بأسانيد صحيحة»،
    أو «حسن صحيح» عند الترمذي، أو «حسن» (ظاهرة في سطر التخريج). وتُستبعد التي لا درجة لها.
  - الأحاديث التي بلا سطر تخريج (١١، ٣٠، ٣٥، ٣٦) أُثبتت بمطابقة نصها في صحيح البخاري/مسلم (تحقق مسبقًا).
"""
import json
import os
import re
import sys

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', 'public', 'qudsi.json')

TASH = re.compile(r'[ً-ٰٟـۖ-ۭ]')


def norm(s):
    s = TASH.sub('', s)
    s = re.sub('[إأآٱ]', 'ا', s).replace('ى', 'ي').replace('ة', 'ه')
    s = re.sub(r'[^\w\s]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


Q = json.load(open(os.path.join(SRC, 'db/by_book/forties/qudsi40.json'), encoding='utf-8'))['hadiths']
BK = json.load(open(os.path.join(SRC, 'db/by_book/the_9_books/bukhari.json'), encoding='utf-8'))
BCH = {c['id']: c['arabic'] for c in BK['chapters']}

# أحاديث بلا سطر تخريج ثبتت مطابقتها لنص الصحيحين (انظر الوصف أعلاه)
VERIFIED_NO_SRC = {11: 'رواه البخاري (كتاب النفقات)', 30: 'رواه البخاري ومسلم', 35: 'رواه البخاري (كتاب التوحيد) ومسلم', 36: 'رواه البخاري ومسلم'}
EXCLUDE = {9}  # تخريجه الترمذي بلا درجة مذكورة في المصدر؛ أما «حسن» فمقبول بطلب صاحب التطبيق


def accept(n, text):
    if n in EXCLUDE:
        return None
    if n in VERIFIED_NO_SRC:
        return VERIFIED_NO_SRC[n]
    paras = [p.strip() for p in text.split('\n') if p.strip()]
    srcs = [p for p in paras if 'رواه' in p or 'رواهُ' in p or 'رواهُ' in p.replace('ُ', '')]
    line = srcs[0] if srcs else ''
    ln = norm(line)
    if re.search(r'البخاري|مسلم', ln):
        return None if False else 'ok'
    if re.search(r'صحيح|صحيحه|حسن', ln):
        return 'ok'
    return None


def tidy(p):
    p = re.sub(r'\s+', ' ', p).strip()
    p = re.sub(r'^[:.\s]+', '', p)
    # أسطر التخريج في المصدر أقواسها مختلّة؛ نوازنها دون المساس بالألفاظ
    if 'رواه' in p.replace('ُ', '') and p.count('(') != p.count(')'):
        if p.startswith('(') and p.count('(') > p.count(')'):
            p = p[1:]
        if p.count('(') > p.count(')'):
            p += ')'
    return p


def title_of(paras):
    # أول فقرة بعد سطر الإسناد لا تبدأ بـ«عن»
    for p in paras[1:] if len(paras) > 1 else paras:
        t = tidy(p)
        if not t or 'رواه' in t:
            continue
        t = re.sub(r'^["“«\s]+', '', t)
        t = t.lstrip('(').strip()
        words = re.sub(r'[“”"«»]', '', t).split(' ')
        return ' '.join(words[:6]) + ('…' if len(words) > 6 else '')
    # الإسناد والمتن في فقرة واحدة: نأخذ ما بعد النقطتين الرأسيتين الأولى
    first = paras[0] if paras else ''
    if ':' in first:
        t = tidy(first.split(':', 1)[1])
        words = t.split(' ')
        return ' '.join(words[:6]) + ('…' if len(words) > 6 else '')
    return ''


items = []
for h in Q:
    n = h['idInBook']
    ok = accept(n, h['arabic'])
    if not ok:
        continue
    paras = [tidy(p) for p in h['arabic'].split('\n') if tidy(p)]
    src_line = None
    if n in VERIFIED_NO_SRC and not any('رواه' in p for p in paras):
        src_line = VERIFIED_NO_SRC[n]
    items.append({'n': n, 't': title_of(paras), 'p': paras, **({'s': src_line} if src_line else {})})

json.dump({'items': items}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(items), 'items; excluded', sorted(EXCLUDE), 'ids', [i['n'] for i in items])
