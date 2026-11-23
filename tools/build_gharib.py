# يبني public/gharib/{سورة}.json و index.json من «تفسير غريب القرآن» لابن قتيبة (ت 276هـ)
# نص المكتبة الشاملة عبر OpenITI (CC BY-NC-SA 4.0). الكتاب مرتّب بالسور ثم أرقام الآيات، فنربط كل شرح بآيته مباشرة.
# الاستعمال: python3 build_gharib.py /path/to/0276IbnQutaybaDinawari.GharibQuran.Shamela0003259-ara1
import re, json, os, sys
lines = open(sys.argv[1], encoding='utf-8').read().split('\n')
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'gharib')
os.makedirs(OUT, exist_ok=True)
def clean(t):
    t = re.sub(r'PageV\d+P\d+', '', t); t = re.sub(r'\s*\bms\d+\b', '', t)
    t = re.sub(r'\s*\(\d+\)', '', t)
    t = t.replace('{', '﴿').replace('}', '﴾')
    return re.sub(r'\s+', ' ', t).strip()
start = next(i for i, l in enumerate(lines) if re.match(r'^### \| *سورة الحمد', l))
sura = 0; aya = None; para = None
data = {}
def flush():
    global para
    if para is not None and sura and aya:
        t = clean(para)
        if t and t != '* * *' and not re.match(r'^[\*\s]+$', t) and not re.match(r'^\(\d+\)', t):
            for k in range(aya[0], aya[1] + 1):
                data.setdefault(sura, {}).setdefault(k, []).append(t)
    para = None
for l in lines[start:]:
    l = l.rstrip()
    if not l.strip() or re.match(r'^PageV\d+P\d+$', l.strip()): continue
    m = re.match(r'^### \| *(.*)$', l)
    if m:
        flush(); h = m.group(1).strip()
        if h.startswith('سورة'):
            sura += 1; aya = None
            if h.replace('سورة', '').strip() == 'اللهب': sura = 111  # الكتاب لا يتناول الكافرون والنصر
        else:
            n = re.match(r'^(\d+)(?:\s*-\s*(\d+))?\s*-?\s*$', h)
            if n: aya = (int(n.group(1)), int(n.group(2) or n.group(1)))
        continue
    if l.startswith('~~'):
        if para is not None: para += ' ' + l[2:]
        continue
    if l.startswith('# '):
        flush()
        if sura == 114 and l.startswith('# (قال أبو محمد)'): break  # خاتمة الكتاب خارج التفسير
        para = l[2:]
flush()
print('suras', sura, 'with data', len(data))
idx = {}
for s, d in data.items():
    json.dump({str(a): v for a, v in sorted(d.items())}, open(f'{OUT}/{s}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    idx[s] = sorted(d)
json.dump(idx, open(f'{OUT}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ayat', sum(len(v) for v in idx.values()))
