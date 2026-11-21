# يبني public/fiqh من «اختلاف الأئمة العلماء» لابن هبيرة (ت 560هـ) — نص OpenITI (CC BY-NC-SA 4.0)
import re, json, os, sys
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'fiqh')
lines = open(SRC, encoding='utf-8').read().split('\n')
i = next(k for k, l in enumerate(lines) if 'Header#End' in l) + 1
kit = []; cur = None; bab = None; para = None
def flush():
    global para
    if para is not None and bab is not None:
        t = re.sub(r'\s*ms\d+\b', '', para); t = re.sub(r'\s+', ' ', t).strip()
        if len(t) > 3: bab['e'].append(t)
    para = None
for l in lines[i:]:
    if not l.strip() or re.match(r'^# PageV', l) or l.startswith('#META'): continue
    m = re.match(r'^### \| (كتاب .+|باب .+|فصل.*)$', l)
    if m:
        flush(); h = re.sub(r'\s*ms\d+\b', '', m.group(1)).strip()
        if h.startswith('كتاب'):
            cur = {'t': h, 'b': []}; kit.append(cur); bab = {'t': 'مقدمة', 'e': []}; cur['b'].append(bab)
        elif cur is not None:
            bab = {'t': h, 'e': []}; cur['b'].append(bab)
        continue
    if cur is None: continue
    if l.startswith('~~'):
        if para is not None: para += ' ' + l[2:]
        continue
    if l.startswith('### |'):
        flush(); para = re.sub(r'^### \|\s*(-:?\s*)?', '', l); continue
    if l.startswith('# '):
        flush(); para = l[2:]; continue
flush()
# آخر كتاب: نقطع ما بعد خاتمة الكتاب (المراجع)
for b in kit[-1]['b']:
    for j, e in enumerate(b['e']):
        if e.startswith('الخاتمة. وبهذا تم'):
            b['e'] = b['e'][:j]; break
for k in kit:
    k['b'] = [b for b in k['b'] if b['e']]
os.makedirs(OUT, exist_ok=True)
idx = []
for n, k in enumerate(kit):
    json.dump(k, open(f'{OUT}/k{n}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    idx.append({'t': k['t'], 'b': len(k['b']), 'n': sum(len(b['e']) for b in k['b'])})
json.dump(idx, open(f'{OUT}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(kit), sum(x['n'] for x in idx))
