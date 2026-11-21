# يبني من «سير أعلام النبلاء» للذهبي (ت 748هـ) — نص المكتبة الشاملة عبر OpenITI (CC BY-NC-SA 4.0):
#   public/library/maghazi/  : السيرة المدنية والغزوات حسب السنين (كتاب لكل سنة، وباب لكل غزوة/حدث)
#   public/library/ashara/   : تراجم العشرة المبشرين بالجنة (كتاب لكل صحابي)
#   public/sira/ghazawat.json: الغزوات على الخريطة (الإحداثيات تقريبية للأماكن المعروفة اليوم)
# ويضيف الكتابين إلى public/library/index.json (ملاحظة: build_library.py يعيد كتابة الفهرس، فشغّل هذا بعده).
# الاستعمال: python3 build_siyar_parts.py /path/to/Shamela0010906-ara1.mARkdown
import re, json, os, sys
SRC = sys.argv[1]
ROOT = os.path.join(os.path.dirname(__file__), '..', 'public')
lines = open(SRC, encoding='utf-8').read().split('\n')

def clean(t):
    t = re.sub(r'PageV\d+P\d+', '', t); t = re.sub(r'\s*ms\d+\b', '', t)
    return re.sub(r'\s+', ' ', t).strip()

def find(pat, start=0):
    for i in range(start, len(lines)):
        if re.match(pat, lines[i]): return i
    raise SystemExit('missing ' + pat)

def parse(a, b, kit_level, first_bab='ترجمته'):
    """lines[a:b] → قائمة كتب [{t, b:[{t,e}]}]؛ عناوين المستوى kit_level كتب وما دونها أبواب."""
    kit = []; sec = None; para = None
    def flush():
        nonlocal para
        if para is not None and sec is not None:
            t = clean(para)
            if len(t) > 3: sec['e'].append(t)
        para = None
    for l in lines[a:b]:
        l = l.rstrip()
        if not l.strip() or re.match(r'^PageV\d+P\d+$', l.strip()): continue
        m = re.match(r'^### (\|+|\$)\s*(.*)$', l)
        if m:
            flush()
            bars = m.group(1); h = clean(m.group(2)).strip(' :-')
            h = re.sub(r'^\d+\s*-\s*', '', h)
            if bars == kit_level:
                if kit and kit[-1]['t'] == h: sec = kit[-1]['b'][-1]; continue
                kit.append({'t': h, 'b': []}); sec = {'t': first_bab, 'e': []}; kit[-1]['b'].append(sec)
            elif kit:
                sec = {'t': h, 'e': []}; kit[-1]['b'].append(sec)
            continue
        if not kit: continue
        if l.startswith('~~'):
            if para is not None: para += ' ' + l[2:]
            continue
        if l.startswith('# '):
            flush(); para = l[2:]
    flush()
    for k in kit: k['b'] = [s for s in k['b'] if s['e']]
    return [k for k in kit if k['b']]

def write(book, kit):
    out = os.path.join(ROOT, 'library', book)
    os.makedirs(out, exist_ok=True)
    idx = []
    for n, k in enumerate(kit):
        json.dump(k, open(f'{out}/k{n}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        idx.append({'t': k['t'], 'b': len(k['b']), 'n': sum(len(s['e']) for s in k['b'])})
    json.dump(idx, open(f'{out}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(book, len(kit), sum(x['n'] for x in idx))

# ===== المغازي حسب السنين =====
a = find(r'^### \|\|  السنة الأولى من الهجرة'); b = find(r'^### \|\|  فصل في معجزاته')
mk = parse(a, b, '||', 'تمهيد')
# «وفي سنة ست:» تتمة لسنة ست
merged = []
for k in mk:
    if k['t'].startswith('وفي سنة') and merged: merged[-1]['b'] += k['b']
    else: merged.append(k)
mk = merged
YN = ['السنة الأولى من الهجرة', 'السنة الثانية من الهجرة', 'السنة الثالثة من الهجرة', 'السنة الرابعة من الهجرة', 'السنة الخامسة من الهجرة', 'السنة السادسة من الهجرة',
      'السنة السابعة من الهجرة', 'السنة الثامنة من الهجرة', 'السنة التاسعة من الهجرة', 'السنة العاشرة من الهجرة', 'السنة الحادية عشرة (وفاة النبي ﷺ في ربيع الأول)']
assert len(mk) == len(YN)
for k, y in zip(mk, YN): k['t'] = y
write('maghazi', mk)

# ===== الغزوات على الخريطة (إحداثيات تقريبية) =====
# (جزء من عنوان الباب في كتاب الذهبي، الاسم المعروض، خط العرض، خط الطول)
PLACES = [
  ('غزوة الأبواء', 'غزوة الأبواء (ودّان)', 23.19, 39.05),
  ('غزوة بواط', 'غزوة بواط', 24.25, 38.35),
  ('غزوة العشيرة', 'غزوة العشيرة (ينبع)', 24.09, 38.06),
  ('غزوة بدر الكبرى', 'غزوة بدر الكبرى', 23.745, 38.792),
  ('غزوة بني النضير', 'غزوة بني النضير', 24.44, 39.65),
  ('غزوة أحد', 'غزوة أحد', 24.501, 39.612),
  ('غزوة حمراء الأسد', 'غزوة حمراء الأسد', 24.414, 39.544),
  ('غزوة دومة الجندل', 'غزوة دومة الجندل', 29.811, 39.870),
  ('غزوة الخندق', 'غزوة الخندق (الأحزاب)', 24.479, 39.599),
  ('غزوة بني قريظة', 'غزوة بني قريظة', 24.45, 39.63),
  ('قصة غزوة الحديبية', 'صلح الحديبية', 21.443, 39.686),
  ('غزوة خيبر', 'غزوة خيبر', 25.699, 39.292),
  ('غزوة وادي القرى', 'غزوة وادي القرى (العُلا)', 26.608, 37.923),
  ('عمرة القضية', 'عمرة القضاء', 21.4225, 39.8262),
  ('غزوة مؤتة', 'غزوة مؤتة', 31.079, 35.709),
  ('فتح مكة', 'فتح مكة', 21.4225, 39.8262),
  ('غزوة الطائف', 'غزوة الطائف', 21.270, 40.416),
  ('غزوة تبوك', 'غزوة تبوك', 28.384, 36.566),
  ('حجة الوداع', 'حجة الوداع (عرفة)', 21.355, 39.984),
]
rows = []
for key, name, la, lo in PLACES:
    hit = None
    for ki, k in enumerate(mk):
        if key == 'غزوة الخندق' and ki < 4: continue  # الذهبي يذكرها في الرابعة (قول) ثم الخامسة (ابن إسحاق)
        for bi, s in enumerate(k['b']):
            if key in s['t']: hit = (ki, bi, k['t'], s['t']); break
        if hit: break
    if not hit: print('NOT FOUND', key); continue
    rows.append({'n': name, 'y': hit[2], 'ki': hit[0], 'bi': hit[1], 'h': hit[3], 'la': la, 'lo': lo})
json.dump(rows, open(os.path.join(ROOT, 'sira', 'ghazawat.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ghazawat', len(rows))

# ===== العشرة المبشرون =====
H = lambda p: find(p)
a_bakr = H(r'^### \|\|  - أبو بكر الصديق'); a_umar = H(r'^### \|\|  - سيرة عمر الفاروق'); a_uth = H(r'^### \|\|  - سيرة ذي النورين')
a_ali = H(r'^### \|\|  - سيرة أبي الحسنين'); a_hawadith_ali = H(r'^### \|\|\| الحوادث في خلافة علي')
a_ubayda = H(r'^### \$ 1 - أبو عبيدة'); a_talha = H(r'^### \$ 2 - طلحة'); a_zubayr = H(r'^### \$ 3 - الزبير'); a_awf = H(r'^### \$ 4 - عبد الرحمن'); a_sad = H(r'^### \$ 5 - سعد'); a_said = H(r'^### \$ 6 - سعيد'); a_mus = H(r'^### \$ 7 - مصعب')
a_hawadith_umar = H(r'^### \|\|\| الحوادث في خلافة عمر'); a_hawadith_uth = H(r'^### \|\|\| الحوادث في خلافة ذي النورين')
a_amal = H(r'^### \|\|\| ذكر عمال أبي بكر')
# أبو بكر: من ترجمته إلى قصة الأسود العنسي (تشمل خلافته الإجمالية)
a_aswad = H(r'^### \|\|\| قصة الأسود العنسي')
PEOPLE = [
  ('أبو بكر الصديق', a_bakr, a_aswad, '|||'),
  ('عمر بن الخطاب الفاروق', a_umar, a_hawadith_umar, '|||'),
  ('عثمان بن عفان ذو النورين', a_uth, a_hawadith_uth, '|||'),
  ('علي بن أبي طالب', a_ali, a_hawadith_ali, '|||'),
  ('طلحة بن عبيد الله', a_talha, a_zubayr, '$'),
  ('الزبير بن العوام', a_zubayr, a_awf, '$'),
  ('عبد الرحمن بن عوف', a_awf, a_sad, '$'),
  ('سعد بن أبي وقاص', a_sad, a_said, '$'),
  ('سعيد بن زيد', a_said, a_mus, '$'),
  ('أبو عبيدة بن الجراح', a_ubayda, a_talha, '$'),
]
ORDER = ['أبو بكر الصديق', 'عمر بن الخطاب الفاروق', 'عثمان بن عفان ذو النورين', 'علي بن أبي طالب', 'طلحة بن عبيد الله', 'الزبير بن العوام', 'عبد الرحمن بن عوف', 'سعد بن أبي وقاص', 'سعيد بن زيد', 'أبو عبيدة بن الجراح']
kit = []
for name in ORDER:
    nm, a, b, lv = next(p for p in PEOPLE if p[0] == name)
    parts = parse(a, b, '#nomatch')  # لا كتب: نبني باب واحد ثم أبواب فرعية
    # نبني يدويًا: عنوان الترجمة نفسه (السطر a) هو بداية، وما بعده أبواب
    sec = {'t': 'ترجمته', 'e': []}; secs = [sec]; para = None
    def fl():
        global para
        if para is not None:
            t = clean(para)
            if len(t) > 3: secs[-1]['e'].append(t)
        para = None
    for l in lines[a + 1:b]:
        l = l.rstrip()
        if not l.strip() or re.match(r'^PageV\d+P\d+$', l.strip()): continue
        m = re.match(r'^### \|+\s*(.*)$', l)
        if m:
            fl(); secs.append({'t': clean(m.group(1)).strip(' :-') or 'فصل', 'e': []}); continue
        if l.startswith('~~'):
            if para is not None: para += ' ' + l[2:]
            continue
        if l.startswith('# '):
            fl(); para = l[2:]
    fl()
    secs = [s for s in secs if s['e']]
    kit.append({'t': name, 'b': secs})
write('ashara', kit)

# ===== فهرس المكتبة =====
ip = os.path.join(ROOT, 'library', 'index.json')
idx = [x for x in json.load(open(ip, encoding='utf-8')) if x['id'] not in ('maghazi', 'ashara')]
VIA = 'المكتبة الشاملة'
idx.append(dict(id='maghazi', cat='السيرة والتراجم', title='السيرة المدنية والغزوات حسب السنين',
                author='الذهبي (ت ٧٤٨هـ) — من «سير أعلام النبلاء»', sub='من الهجرة إلى السنة الحادية عشرة: الغزوات والسرايا بتواريخها', via=VIA))
idx.append(dict(id='ashara', cat='السيرة والتراجم', title='العشرة المبشرون بالجنة',
                author='الذهبي (ت ٧٤٨هـ) — من «سير أعلام النبلاء»', sub='تراجم أبي بكر وعمر وعثمان وعلي وطلحة والزبير وعبد الرحمن وسعد وسعيد وأبي عبيدة', via=VIA))
json.dump(idx, open(ip, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
