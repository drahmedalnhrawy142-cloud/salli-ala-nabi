# يبني public/fiqh/bidaya من «بداية المجتهد ونهاية المقتصد» لابن رشد الحفيد (ت 595هـ) — نص OpenITI (CC BY-NC-SA 4.0)
import re, json, os, sys
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'fiqh', 'bidaya')
lines = open(SRC, encoding='utf-8').read().split('\n')
i = next(k for k, l in enumerate(lines) if 'Header#End' in l) + 1
def clean(t):
    t = re.sub(r'PageV\d+P\d+', '', t); t = re.sub(r'\s*ms\d+\b', '', t)
    return re.sub(r'\s+', ' ', t).strip()
kit = []; sec = None; para = None; pend_title = None
def flush():
    global para
    if para is not None and sec is not None:
        t = clean(para)
        if len(t) > 3: sec['e'].append(t)
    para = None
for l in lines[i:]:
    if not l.strip() or re.match(r'^# PageV', l) or l.startswith('#META'): continue
    l = l.rstrip()
    m = re.match(r'^### \| (\[.+?\]|(?:كتاب|الباب|باب|الفصل|فصل) .+)$', l)
    if m:
        flush(); h = clean(m.group(1)).strip('[] .')
        if h.startswith('كتاب'):
            if kit and kit[-1]['t'] == h: sec = kit[-1]['b'][0]; continue
            kit.append({'t': h, 'b': []}); sec = {'t': 'تمهيد', 'e': []}; kit[-1]['b'].append(sec)
        elif kit:
            sec = {'t': h, 'e': []}; kit[-1]['b'].append(sec)
        continue
    if not kit: continue
    if l.startswith('~~'):
        if para is not None: para += ' ' + l[2:]
        continue
    if l.startswith('### |'):
        flush(); para = re.sub(r'^### \|\s*(-:?\s*)?', '', l); continue
    if l.startswith('# '):
        flush(); para = l[2:]; continue
flush()
os.makedirs(OUT, exist_ok=True)
idx = []
for n, k in enumerate(kit):
    k['b'] = [s for s in k['b'] if s['e']]
    json.dump(k, open(f'{OUT}/k{n}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    idx.append({'t': k['t'], 'b': len(k['b']), 'n': sum(len(s['e']) for s in k['b'])})
json.dump(idx, open(f'{OUT}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(kit), sum(x['n'] for x in idx))
