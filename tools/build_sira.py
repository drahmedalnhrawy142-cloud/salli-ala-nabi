#!/usr/bin/env python3
"""
يبني بيانات السيرة (سيرة ابن هشام) من نص OpenITI/الشاملة — بدون أي إضافة من عندنا.

المصدر:  OpenITI/0225AH  data/0213IbnHisham/0213IbnHisham.SiraNabawiyya/
         0213IbnHisham.SiraNabawiyya.Shamela0023833-ara1.completed
الطبعة:  تحقيق مصطفى السقا وإبراهيم الأبياري وعبد الحفيظ الشلبي، ط٢ ١٣٧٥هـ/١٩٥٥م، مصطفى البابي الحلبي
الترخيص: CC BY-NC-SA 4.0 (OpenITI / KITAB)

الاستخدام:
    python3 tools/build_sira.py <مسار-ملف-النص> [مجلد-الإخراج=public/sira]

ما يفعله السكريبت فقط:
  - يقرأ العناوين "### |" (أبواب) و"### ||" (فصول فرعية) كما هي.
  - يدمج أسطر الفقرة ("# " + "~~") في فقرة واحدة.
  - يحذف علامات الصفحات PageVxxPyyy وعلامات ms### وأرقام الحواشي [n].
  - يعرف أبيات الشعر من فاصل " ... " بين الشطرين (اصطلاح المصدر نفسه).
  - يقسّم الناتج إلى شرائح JSON صغيرة تُحمَّل عند الحاجة.
لا يغيّر أي كلمة من النص.
"""
import json
import os
import re
import sys

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', 'public', 'sira')
SHARD_TARGET = 140_000  # حجم الشريحة التقريبي بالحروف

PAGE_RE = re.compile(r'PageV(\d+)P(\d+)')
MS_RE = re.compile(r'\bms\d+\b')
FN_RE = re.compile(r'\[\d+\]')
SPACE_RE = re.compile(r'\s+')


def clean(s: str) -> str:
    s = PAGE_RE.sub(' ', s)
    s = MS_RE.sub(' ', s)
    s = FN_RE.sub(' ', s)
    return SPACE_RE.sub(' ', s).strip()


def clean_title(s: str) -> str:
    s = clean(s)
    s = re.sub(r'\s*[:.]\s*$', '', s).strip()
    m = re.fullmatch(r'\((.*)\)', s)
    if m:
        s = m.group(1).strip()
    return s


with open(SRC, encoding='utf-8') as f:
    raw = f.read()

body = raw.split('#META#Header#End#', 1)[1]
lines = body.split('\n')

chapters = []  # {t, pg, b:[...], subs:[]}
cur = None
para = None  # قائمة أسطر الفقرة الجارية
last_page = (1, 1)
pending_pages = []  # فصول لم نعرف صفحتها بعد (علامة الصفحة تأتي في آخرها)


def note_pages(text: str):
    """علامة الصفحة تأتي في آخر الصفحة: أول علامة بعد بداية الباب هي صفحة بدايته."""
    global last_page
    for m in PAGE_RE.finditer(text):
        last_page = (int(m.group(1)), int(m.group(2)))
        while pending_pages:
            pending_pages.pop()['pg'] = list(last_page)


def flush():
    global para
    if para is None or cur is None:
        para = None
        return
    txt = clean(' '.join(para))
    para = None
    if not txt:
        return
    parts = txt.split(' ... ')
    if len(parts) == 2 and len(txt) < 260 and all(p.strip() for p in parts):
        cur['b'].append([parts[0].strip(), parts[1].strip()])
    else:
        cur['b'].append(txt)


for ln in lines:
    if ln.startswith('### |'):
        flush()
        deep = ln.startswith('### ||')
        title = clean_title(ln[6:] if deep else ln[5:])
        note_pages(ln)
        if deep:
            if cur is None:
                continue
            cur['b'].append({'h': title})
            cur['subs'].append([title, len(cur['b']) - 1])
        else:
            cur = {'t': title, 'pg': None, 'b': [], 'subs': []}
            chapters.append(cur)
            pending_pages.append(cur)
        continue
    if ln.startswith('# '):
        flush()
        note_pages(ln)
        para = [ln[2:]]
    elif ln.startswith('~~'):
        note_pages(ln)
        if para is None:
            para = []
        para.append(ln[2:])
    elif ln.strip() == '':
        continue
    else:
        note_pages(ln)
        if para is not None:
            para.append(ln)
flush()

for c in chapters:
    if c['pg'] is None:
        c['pg'] = list(last_page)

# الشرائح
os.makedirs(OUT, exist_ok=True)
for fn in os.listdir(OUT):
    if fn.startswith('s') and fn.endswith('.json'):
        os.remove(os.path.join(OUT, fn))

shards = []
cur_shard = []
size = 0
for i, c in enumerate(chapters):
    n = sum(len(x) if isinstance(x, str) else (len(x[0]) + len(x[1]) if isinstance(x, list) else len(x['h'])) for x in c['b'])
    if cur_shard and size + n > SHARD_TARGET:
        shards.append(cur_shard)
        cur_shard, size = [], 0
    cur_shard.append(i)
    size += n
if cur_shard:
    shards.append(cur_shard)

index = {
    'title': 'السيرة النبوية',
    'author': 'عبد الملك بن هشام (ت ٢١٣هـ)',
    'edition': 'تحقيق مصطفى السقا وإبراهيم الأبياري وعبد الحفيظ الشلبي — مصطفى البابي الحلبي، ط٢ ١٣٧٥هـ/١٩٥٥م',
    'source': 'مكتبة OpenITI (مشروع KITAB) عن المكتبة الشاملة',
    'license': 'CC BY-NC-SA 4.0',
    'chapters': [],
    'shards': len(shards),
}
for si, ids in enumerate(shards):
    data = []
    for i in ids:
        c = chapters[i]
        data.append({'t': c['t'], 'b': c['b']})
        index['chapters'].append({'i': i, 't': c['t'], 'pg': c['pg'], 's': si, 'o': len(data) - 1, 'subs': c['subs']})
    with open(os.path.join(OUT, f's{si}.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

index['chapters'].sort(key=lambda x: x['i'])
with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False, separators=(',', ':'))

words = sum(len((x if isinstance(x, str) else ' '.join(x) if isinstance(x, list) else x['h']).split()) for c in chapters for x in c['b'])
print(f'chapters={len(chapters)} subs={sum(len(c["subs"]) for c in chapters)} shards={len(shards)} words={words}')
