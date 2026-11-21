# يبني public/arkan/: تجميعة أحاديث أركان الإسلام الخمسة من الصحيحين (نص sunnah.com عبر hadith-json كما هو)
# كتاب لكل ركن، وأبواب بحسب كتب الصحيحين (مجزّأة للتحميل الخفيف).
import json, os
H = os.path.join(os.path.dirname(__file__), '..', 'public', 'hadith')
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'arkan')
os.makedirs(OUT, exist_ok=True)
hi = {b['id']: {c['id']: c['t'] for c in b['chapters']} for b in json.load(open(f'{H}/index.json', encoding='utf-8'))}
NAME = {'bukhari': 'صحيح البخاري', 'muslim': 'صحيح مسلم', 'nawawi': 'الأربعون النووية'}
SHORT = {'bukhari': 'البخاري', 'muslim': 'مسلم', 'nawawi': 'الأربعون النووية'}
# الركن ← [(الكتاب، رقم الفصل في فهرس hadith)]
PILLARS = [
  ('الشهادتان', [('nawawi', 0), ('bukhari', 2), ('muslim', 1)]),
  ('الصلاة', [('bukhari', 8), ('bukhari', 9), ('bukhari', 10), ('muslim', 4), ('muslim', 5)]),
  ('الزكاة', [('bukhari', 24), ('muslim', 12)]),
  ('الصيام', [('bukhari', 30), ('bukhari', 31), ('bukhari', 32), ('bukhari', 33), ('muslim', 13), ('muslim', 14)]),
  ('الحج', [('bukhari', 25), ('bukhari', 26), ('bukhari', 27), ('bukhari', 28), ('muslim', 15)]),
]
STEP = 25
idx = []
for n, (name, srcs) in enumerate(PILLARS):
    kit = {'t': name, 'b': []}
    for book, ch in srcs:
        arr = json.load(open(f'{H}/{book}/{ch}.json', encoding='utf-8'))
        if book == 'nawawi':
            arr = [a for a in arr if str(a[0]) == '3']  # «بني الإسلام على خمس»
            title = 'الأربعون النووية — حديث بني الإسلام على خمس'
        else:
            title = f'{SHORT[book]} — {hi[book][ch]}'
        paras = [f'{t.strip()}  [{SHORT[book]} {a}]' if book != 'nawawi' else f'{t.strip()}  [الأربعون النووية {a}]' for a, t in arr]
        if len(paras) > STEP:
            for j in range(0, len(paras), STEP):
                kit['b'].append({'t': f'{title} — الجزء {j // STEP + 1}', 'e': paras[j:j + STEP]})
        else:
            kit['b'].append({'t': title, 'e': paras})
    json.dump(kit, open(f'{OUT}/k{n}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    idx.append({'t': name, 'b': len(kit['b']), 'n': sum(len(b['e']) for b in kit['b'])})
    print(name, idx[-1])
json.dump(idx, open(f'{OUT}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
