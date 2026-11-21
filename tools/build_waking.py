#!/usr/bin/env python3
"""يولّد components/adhkarWaking.ts من adhkar.json (rn0x/adhkar-json، عن «حصن المسلم»): أول ثلاثة أذكار من «أذكار الاستيقاظ من النوم».
الاستخدام: python3 -I tools/build_waking.py <adhkar.json>"""
import json, re, sys
d = json.load(open(sys.argv[1], encoding='utf-8'))
c = [x for x in d if x['category'] == 'أذكار الاستيقاظ من النوم'][0]['array'][:3]
def clean(t):
    t = re.sub(r'^\(+\s*', '', t.strip()); return re.sub(r'\s*\)+\.?$', '', t).strip()
items = [{'id': f'w{i+1}', 'text': clean(x['text']), 'count': x['count'], 'source': 'حصن المسلم — أذكار الاستيقاظ من النوم'} for i, x in enumerate(c)]
open('components/adhkarWaking.ts', 'w', encoding='utf-8').write(
    "// مولَّد بـ tools/build_waking.py من adhkar.json (rn0x/adhkar-json) عن «حصن المسلم» — بلا تعديل في الألفاظ.\nexport const WAKING = "
    + json.dumps(items, ensure_ascii=False, indent=2) + " as { id: string; text: string; count: number; source: string }[];\n")
