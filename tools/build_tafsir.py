#!/usr/bin/env python3
"""
يبني public/tafsir/<رقم السورة>.json من «التفسير الميسّر» (مجمع الملك فهد) كما في مشروع spa5k/tafsir_api (MIT)،
مصدره qul.tarteel.ai. لكل سورة مصفوفة نصوص بترتيب الآيات. لا يُعدَّل أي لفظ.
الاستخدام: python3 -I tools/build_tafsir.py <مسار tafsir/ar-tafsir-muyassar> [المجلد الناتج]
"""
import json, os, sys
SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', 'public', 'tafsir')
os.makedirs(OUT, exist_ok=True)
tot = 0
for s in range(1, 115):
    rows = json.load(open(os.path.join(SRC, f'{s}.json'), encoding='utf-8'))
    rows.sort(key=lambda r: r['ayah'])
    assert [r['ayah'] for r in rows] == list(range(1, len(rows) + 1)), s
    assert all(r['surah'] == s and r['text'].strip() for r in rows), s
    json.dump([r['text'].strip() for r in rows], open(os.path.join(OUT, f'{s}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    tot += len(rows)
print('ayat', tot)
