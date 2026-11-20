#!/usr/bin/env python3
"""يولّد public/ulum/: «الإتقان في علوم القرآن» للسيوطي (ت ٩١١هـ) مقسَّمًا على أنواعه، من نص OpenITI (الشاملة، طبعة الهيئة المصرية العامة للكتاب — تحقيق محمد أبو الفضل إبراهيم).
تُستبعد الأنواع التي يغلب عليها جمع مرويات متفاوتة الدرجة (٩ و٧٠–٧٣ و٧٥) التزامًا بقاعدة التطبيق: الصحيح والحسن فقط.
الاستخدام: python3 -I tools/build_itqan.py <ملف النص الخام>"""
import json, os, re, shutil, sys
SKIP = {9, 70, 71, 72, 73, 75}
src = open(sys.argv[1], encoding='utf-8').read().split('\n')
body = []
started = False
for ln in src:
    if ln.startswith('#META') or not ln.strip(): continue
    if re.match(r'^# PageV\d+P\d+', ln): continue
    body.append(ln)
ORD = {}
ones = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر']
types = []  # [(title, [paras])]
cur = None; para = None
def flush():
    global para
    if para is not None and cur is not None:
        t = re.sub(r'\bms\d+\b', '', para); t = re.sub(r'\s+', ' ', t).strip()
        if t: cur[1].append(t)
    para = None
for ln in body:
    if ln.startswith('### |'):
        flush()
        h = re.sub(r'\bms\d+\b', '', ln[5:]); h = re.sub(r'\s+', ' ', h).strip()
        if h.startswith('النوع'):
            cur = [h, []]; types.append(cur)
        elif cur is not None and h and not h.startswith('المجلد'):
            para = h + ' '
        elif h.startswith('المجلد'):
            cur = None if cur is None else cur
        continue
    if cur is None: continue
    if ln.startswith('# '):
        flush(); para = ln[2:]
    elif ln.startswith('~~'):
        para = (para or '') + ' ' + ln[2:]
flush()
shutil.rmtree('public/ulum', ignore_errors=True); os.makedirs('public/ulum')
# أرقام الأنواع بالترتيب: النوع ٢٢–٢٧ مدمجة في عنوان واحد، فنرقّم بحسب المواضع المعروفة من العناوين
numbers = []; n = 0
for t in types:
    m = re.match(r'النوع (.+?): ', t[0])
    numbers.append(None)
index = []
# ترقيم: الأنواع تتسلسل 1..80 عدا المدمج (٢٢–٢٧) فيأخذ رقم ٢٢ ويقفز ٦
n = 0
for t in types:
    n += 1
    if 'والثالث والرابع والخامس والسادس والسابع' in t[0]: num = 22; n = 27
    else: num = n
    t.append(num)
for title, paras, num in types:
    if num in SKIP: continue
    name = re.sub(r'^النوع [^:]+: ', '', title).strip()
    json.dump(paras, open(f'public/ulum/{num}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    index.append({'n': num, 'l': '٢٢–٢٧' if num == 22 else None, 't': name, 'k': len(paras), 'c': sum(len(p) for p in paras)})
json.dump(index, open('public/ulum/index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(types), 'types found;', len(index), 'kept;', sum(i['c'] for i in index), 'chars')
for i in index[:3] + index[19:25]: print(i)
