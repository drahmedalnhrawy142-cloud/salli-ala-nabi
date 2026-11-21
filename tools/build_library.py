# يبني public/library/<id>/ من نصوص OpenITI (CC BY-NC-SA 4.0) لكتب متفق عليها عند أهل السنة، ويكتب public/library/index.json
import re, json, os, glob, sys
R = '/home/claude/openiti'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'library')
BOOKS = [
  dict(id='tahawiyya', cat='العقيدة', title='متن العقيدة الطحاوية', author='أبو جعفر الطحاوي (ت ٣٢١هـ)',
       sub='عقيدة أهل السنة والجماعة بإيجاز', src='0325AH/data/0321Tahawi/0321Tahawi.MatnCaqida/*JK000126-ara1', via='JK (مكتبة الشاملة/المكتبة الوقفية عبر OpenITI)'),
  dict(id='jami', cat='الحديث وعلومه', title='جامع العلوم والحكم', author='ابن رجب الحنبلي (ت ٧٩٥هـ)',
       sub='شرح خمسين حديثًا من جوامع الكلم', src='0800AH/data/0795IbnRajabHanbali/0795IbnRajabHanbali.JamicCulumWaHikam/*Shamela0004268-ara1', via='المكتبة الشاملة'),
  dict(id='umdat', cat='الحديث وعلومه', title='عمدة الأحكام', author='عبد الغني المقدسي (ت ٦٠٠هـ)',
       sub='أحاديث الأحكام المتفق عليها في الصحيحين', src='0600AH/data/0600CabdGhaniMaqdisi/0600CabdGhaniMaqdisi.CumdatAhkam/*Shamela0006075-ara1', via='المكتبة الشاملة'),
  dict(id='muqaddima', cat='الحديث وعلومه', title='مقدمة ابن الصلاح', author='ابن الصلاح الشهرزوري (ت ٦٤٣هـ)',
       sub='معرفة أنواع علوم الحديث', src='0650AH/data/0643IbnSalahShahrazuri/0643IbnSalahShahrazuri.MuqaddimatCulumHadith/*Shamela0022870-ara1', via='المكتبة الشاملة'),
  dict(id='nukhba', cat='الحديث وعلومه', title='نخبة الفكر', author='ابن حجر العسقلاني (ت ٨٥٢هـ)',
       sub='متن مختصر في مصطلح الحديث', src='0875AH/data/0852IbnHajarCasqalani/0852IbnHajarCasqalani.NukhbatFikar/*Shamela0005940-ara1', via='المكتبة الشاملة'),
  dict(id='waraqat', cat='أصول الفقه', title='الورقات', author='إمام الحرمين الجويني (ت ٤٧٨هـ)',
       sub='متن مختصر في أصول الفقه', src='0500AH/data/0478ImamHaramaynJuwayni/0478ImamHaramaynJuwayni.Waraqat/*Shamela0006297-ara1', via='المكتبة الشاملة'),
  dict(id='risala', cat='أصول الفقه', title='الرسالة', author='الإمام الشافعي (ت ٢٠٤هـ)',
       sub='أول كتاب في أصول الفقه', nokitab=True, src='0225AH/data/0204Shafici/0204Shafici.Risala/*Shamela0008180-ara1', via='المكتبة الشاملة'),
  dict(id='fadl', cat='العلم وآدابه', title='فضل علم السلف على الخلف', author='ابن رجب الحنبلي (ت ٧٩٥هـ)',
       sub='في فضل العلم النافع وأدب طالبه', src='0800AH/data/0795IbnRajabHanbali/0795IbnRajabHanbali.FadlCilmSalaf/*Shamela0000132-ara1', via='المكتبة الشاملة'),
  dict(id='ajrumiyya', cat='اللغة العربية', title='متن الآجرومية', author='ابن آجروم (ت ٧٢٣هـ)',
       sub='مبادئ النحو للمبتدئين', src='0725AH/data/0723IbnAjrum/0723IbnAjrum.Ajrumiyya/*Shamela0011371-ara1', via='المكتبة الشاملة'),
]
def clean(t):
    t = re.sub(r'PageV\d+P\d+', '', t); t = re.sub(r'\s*ms\d+\b', '', t)
    t = re.sub(r'^\$\s*', '', t.replace(' $ ', ' '))
    return re.sub(r'\s+', ' ', t).strip()
def build(b):
    f = glob.glob(os.path.join(R, b['src']))[0]
    lines = open(f, encoding='utf-8').read().split('\n')
    i = next(k for k, l in enumerate(lines) if 'Header#End' in l) + 1
    kit = []; sec = None; para = None; num = None
    def newkit(t):
        nonlocal sec
        kit.append({'t': t, 'b': []}); sec = {'t': 'تمهيد', 'e': []}; kit[-1]['b'].append(sec)
    def flush():
        nonlocal para, num
        if para is not None and sec is not None:
            t = clean(para)
            if num: t = f'({num}) ' + t
            if len(t) > 2: sec['e'].append(t)
        para = None; num = None
    pending = None
    for l in lines[i:]:
        l = l.rstrip()
        if not l or re.match(r'^# PageV', l) or l.startswith('#META'): continue
        m = re.match(r'^### \| (.+)$', l)
        if m and not l.startswith('### | -'):
            h = clean(m.group(1)).strip('[] .')
            if re.match(r'^ص\s*:', h) or not h: continue
            mn = re.match(r'^(\d+)\s*-?$', h)
            if mn:
                flush(); pending = mn.group(1); continue
            flush()
            if not kit: newkit(b['title'])
            if h.startswith('كتاب ') and len(h) < 60 and not b.get('nokitab'):
                newkit(h)
            else:
                sec = {'t': h, 'e': []}; kit[-1]['b'].append(sec)
            continue
        if not kit: newkit(b['title'])
        if l.startswith('~~'):
            if para is not None: para += ' ' + l[2:]
            continue
        if l.startswith('### |'):
            flush(); para = re.sub(r'^### \|\s*(-:?\s*)?', '', l); num = pending; pending = None; continue
        if l.startswith('# '):
            flush(); para = l[2:]; num = pending; pending = None; continue
    flush()
    # تقطيع الأبواب الطويلة
    for k in kit:
        nb = []
        for s in k['b']:
            if s['t'] == 'تمهيد' and len(k['b']) == 1: s['t'] = 'المتن'
            if not s['e']: continue
            if len(s['e']) > 60:
                step = 40
                for j in range(0, len(s['e']), step):
                    nb.append({'t': f"{s['t']} — الجزء {j//step+1}", 'e': s['e'][j:j+step]})
            else: nb.append(s)
        k['b'] = nb
    kit = [k for k in kit if k['b']]
    d = os.path.join(OUT, b['id']); os.makedirs(d, exist_ok=True)
    idx = []
    for n, k in enumerate(kit):
        json.dump(k, open(f'{d}/k{n}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        idx.append({'t': k['t'], 'b': len(k['b']), 'n': sum(len(s['e']) for s in k['b'])})
    json.dump(idx, open(f'{d}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(b['id'], len(kit), sum(x['n'] for x in idx), sum(os.path.getsize(f'{d}/k{n}.json') for n in range(len(kit)))//1024, 'KB')
os.makedirs(OUT, exist_ok=True)
for b in BOOKS: build(b)
json.dump([{k: b[k] for k in ('id', 'cat', 'title', 'author', 'sub', 'via')} for b in BOOKS], open(f'{OUT}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
