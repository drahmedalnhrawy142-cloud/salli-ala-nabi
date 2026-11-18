#!/usr/bin/env python3
"""يستخرج مواضع اختلاف رواية شعبة عن رواية حفص (كلاهما عن عاصم) من نصوص مجمع الملك فهد الرسمية.
المقارنة كلمة بكلمة داخل كل سورة (الترقيم واحد = 6236 آية). لا يُعدَّل أي نص.
الاستخدام: python3 tools/build_qiraat.py hafsData_v18.json ShoubaData08.json"""
import json, re, sys, difflib, collections
H = json.load(open(sys.argv[1], encoding='utf-8'))
S = json.load(open(sys.argv[2], encoding='utf-8'))
num = re.compile(r'[\s ]*[٠-٩]+\s*$')
hw = collections.defaultdict(list)   # sura -> [(ayaIdx, wordIdx, word)]
for i, x in enumerate(H):
    for k, w in enumerate(num.sub('', x['aya_text']).split(' ')):
        hw[x['sora']].append((i, k, w))
sw = collections.defaultdict(list)
for x in S:
    for w in num.sub('', x['aya_text']).split(' '):
        sw[x['sura_no']].append(w)
out = []
for s in range(1, 115):
    a = [w for _, _, w in hw[s]]
    b = sw[s]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            continue
        if i1 == i2:
            i1 = max(0, i1 - 1); i2 = i1 + 1  # إضافة: نربطها بالكلمة السابقة
        ay, wi0, _ = hw[s][i1]
        last = i2 - 1
        # لا نعبر حدود الآية
        while last > i1 and hw[s][last][0] != ay:
            last -= 1
        out.append({'a': ay, 'f': wi0, 't': hw[s][last][1] + 1, 'v': ' '.join(b[j1:j2])})
json.dump(out, open('public/quran/qiraat.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok', len(out))
