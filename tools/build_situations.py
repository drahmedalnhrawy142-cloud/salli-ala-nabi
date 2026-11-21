#!/usr/bin/env python3
"""يولّد public/adhkar/situations.json: أذكار المواقف من adhkar.json (rn0x/adhkar-json عن «حصن المسلم») بلا تعديل في الألفاظ.
الاستخدام: python3 -I tools/build_situations.py <adhkar.json>"""
import json, re, sys
d = json.load(open(sys.argv[1], encoding='utf-8'))
G = [
 ('travel','السفر','🧳',list(range(94,105))),
 ('food','الطعام والشراب','🍽️',list(range(67,76))),
 ('sky','المطر والريح والهلال','🌧️',[60,61,62,63,64,65,66]),
 ('home','البيت واللباس والطهارة','🏠',[3,4,5,6,7,8,13,14,15,16]),
 ('mosque','المسجد والأذان','🕌',[9,10,11,12]),
 ('distress','الهمّ والكرب والدَّين','😔',[33,34,40,42,43,44,45,81,39,41,38,35,36]),
 ('sick','المرض والموت','🤒',[48,49,50,51,52,53,54,55,56,57,58,59,123]),
 ('social','الناس والمجالس','🤝',[76,77,78,79,80,83,84,85,86,88,89,90,92,107,108,111,112,113,121,105,122,82,46,47]),
 ('sleep','النوم والرؤيا','🛏️',[28,29,30]),
 ('hajj','الحج والعمرة','⛰️',[114,115,116,117,118,119,120]),
 ('misc','مواقف أخرى','✨',[124,125,109,110,126,127,93,87,91,106]),
]
def clean(t):
    t = re.sub(r'^\(+\s*', '', t.strip()); return re.sub(r'\s*\)+\.?$', '', t).strip()
out = []
for gid, label, icon, idx in G:
    cats = []
    for i in idx:
        c = d[i]
        cats.append({'t': re.sub(r'\s+', ' ', c['category']).strip(), 'a': [{'x': clean(x['text']), 'n': x['count']} for x in c['array']]})
    out.append({'id': gid, 'label': label, 'icon': icon, 'cats': cats})
json.dump(out, open('public/adhkar/situations.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(sum(len(g['cats']) for g in out), 'categories')
