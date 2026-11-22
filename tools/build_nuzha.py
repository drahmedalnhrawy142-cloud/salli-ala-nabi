#!/usr/bin/env python3
"""نزهة القلوب (غريب القرآن) لابن عزيز السجستاني — OpenITI 0330IbnCuzayzSijistani (Shamela0022910) → public/lugha/nuzha.json
[[كلمة, نص المادة, الحرف]] — يُقطَّع النص الجاري «كلمة: معناها.» عند كل كلمة تتبعها نقطتان، والنص المعروض حرفيّ من الكتاب."""
import re, json, glob, os
R = '/home/claude/openiti/0350AH/data/0330IbnCuzayzSijistani/0330IbnCuzayzSijistani.GharibQuran/'
f = glob.glob(R + '*0022910-ara1')[0]
L = open(f, encoding='utf-8').read().split('\n')
i = next(k for k, l in enumerate(L) if 'Header#End' in l) + 1
BAD = re.compile(r'^(و?قال|و?قيل|و?يقال|و?قوله|و?ومنه|و?أي|و?يعني|و?يريد|و?وقرئ|و?وقرىء|و?قرئ|و?قرىء|و?فمن|و?فإن|و?يراد|و?مثل|و?كقوله|و?وكقوله|و?وفي|و?وقد|و?وأما|و?ويقرأ|و?وهو|و?ويقال|و?والعرب|و?العرب|و?وإنما|و?ومعنى|و?معنى|و?فقال|و?فيقال|و?يقرأ|و?وروي|و?روي|و?وقول)\b')
letter = 'مقدمة'; cur = []; secs = []
def flush():
    global cur
    if cur: secs.append((letter, ' '.join(cur)))
    cur = []
for l in L[i:]:
    l = l.rstrip()
    if not l: continue
    if re.match(r'^# PageV', l): continue
    m = re.match(r'^### \| \(?\s*(?:\[?فصل\]?\s*)?(.*?)\)?\s*$', l)
    if l.startswith('### |'):
        flush()
        mm = re.search(r'باب\s+(\S+)', re.sub(r'\bms\d+\b', '', l))
        if mm: letter = mm.group(1).strip('()')
        continue
    if l.startswith('# ') and letter == 'مقدمة': continue
    t = l[2:] if l.startswith(('# ', '~~')) and not l.startswith('~~') else (l[2:] if l.startswith('~~') else l)
    t = re.sub(r'PageV\d+P\d+', '', t); t = re.sub(r'\bms\d+\b', '', t)
    t = t.replace('[', '').replace(']', '')
    if l.startswith('# ') and t.startswith('/'): t = t.lstrip('/ ')
    cur.append(t.strip())
flush()
out = []
for lt, txt in secs:
    if lt == 'مقدمة': continue
    txt = re.sub(r'\s+', ' ', txt).strip()
    parts = re.split(r'(?<=[.؟!)]) +(?=[^\s:.؟!(]+(?: [^\s:.؟!(]+){0,3}:)', txt)
    for p in parts:
        m = re.match(r'^([^:]{1,40}?):\s*(.*)$', p)
        if m and not BAD.match(m.group(1)) and len(m.group(2)) > 0:
            out.append([m.group(1).strip(' ؟?'), p.strip(), lt])
        elif out and out[-1][2] == lt:
            out[-1][1] += ' ' + p
        elif m is None and out:
            out[-1][1] += ' ' + p
os.makedirs('public/lugha', exist_ok=True)
json.dump(out, open('public/lugha/nuzha.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'entries', os.path.getsize('public/lugha/nuzha.json') // 1024, 'KB')
