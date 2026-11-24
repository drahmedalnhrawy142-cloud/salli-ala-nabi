#!/usr/bin/env python3
"""يبني public/tuhfa.json من نص «تحفة الأطفال» للجمزوري (OpenITI/المكتبة الشاملة) دون تعديل ألفاظ النظم."""
import re, json, glob
f = glob.glob('/home/claude/openiti/RELEASE/data/1208SulaymanJamzuriAffandi/*TuhfatAtfal/*Shamela0009632-ara1')[0]
secs = []
body = open(f, encoding='utf-8').read().split('#META#Header#End#')[1]
for ln in body.splitlines():
    ln = ln.strip()
    if ln.startswith('### |'):
        secs.append({'t': ln[5:].strip(), 'v': []}); continue
    if not ln.startswith('# ') or ' ... ' not in ln or not secs:
        continue
    ln = re.sub(r'PageV\d+P\d+|ms\d+|~~', '', ln[2:])
    ln = re.sub(r'\(\d+\)', '', ln)
    a, b = [x.strip() for x in ln.split(' ... ', 1)]
    a = a.replace('(', '').replace(')', ''); b = b.replace('(', '').replace(')', '')
    if 'أبياته ند' in a:  # بيت التاريخ في النسخة المنقولة مضطرب الألفاظ فلا نعرضه
        continue
    secs[-1]['v'].append([a, b])
secs = [s for s in secs if s['v']]
json.dump(secs, open('public/tuhfa.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(secs), sum(len(s['v']) for s in secs))
for s in secs: print(s['t'], len(s['v']))
