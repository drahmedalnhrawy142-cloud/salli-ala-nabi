#!/usr/bin/env python3
"""يبني public/offline-manifest.json: حزم التحميل للاستخدام بدون نت [{id,t,files:[مسار],kb}] — شغّله بعد أي تغيير في بيانات public."""
import os, json
P = 'public'
PACKS = [
  ('quran', 'نص المصحف وعلومه (التجويد وأسباب النزول والقراءات)', ['quran'], []),
  ('tafsir', 'التفسير الميسّر وتفسير السعدي وغريب القرآن والمعجم', ['tafsir', 'saadi', 'gharib', 'lugha'], []),
  ('hadith', 'كتب الحديث والأحاديث القدسية والأذكار', ['hadith', 'adhkar'], ['qudsi.json']),
  ('library', 'المكتبة العامة (كل الكتب)', ['library'], []),
  ('fiqh', 'كتب الفقه المقارن وأركان الإسلام', ['fiqh', 'arkan'], []),
  ('sira', 'السيرة والغزوات وعلوم القرآن (الإتقان والبرهان)', ['sira', 'ulum'], []),
]
out = []
for pid, t, dirs, extra in PACKS:
    files = []
    for d in dirs:
        for r, _, fs in os.walk(os.path.join(P, d)):
            for f in fs:
                if f.endswith('.json'):
                    files.append('/' + os.path.relpath(os.path.join(r, f), P).replace(os.sep, '/'))
    files += ['/' + e for e in extra if os.path.exists(os.path.join(P, e))]
    files.sort()
    kb = sum(os.path.getsize(os.path.join(P, f.lstrip('/'))) for f in files) // 1024
    out.append({'id': pid, 't': t, 'files': files, 'kb': kb})
json.dump(out, open(os.path.join(P, 'offline-manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for x in out: print(x['id'], len(x['files']), x['kb'] // 1024, 'MB')
