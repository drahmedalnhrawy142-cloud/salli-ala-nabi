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
  dict(id='gharib', cat='علوم القرآن', title='تفسير غريب القرآن', author='ابن قتيبة الدينوري (ت ٢٧٦هـ)',
       sub='معاني الكلمات الغريبة سورةً سورة', src='0300AH/data/0276IbnQutaybaDinawari/0276IbnQutaybaDinawari.GharibQuran/*Shamela0023621-ara1', via='المكتبة الشاملة',
       kre=r'^سورة [^\[:]+$', nonum=True),
  dict(id='tamhid', cat='علوم القرآن', title='التمهيد في علم التجويد', author='ابن الجزري (ت ٨٣٣هـ)',
       sub='المخارج والصفات وأحكام النون والمد والوقف واللحن', src='0850AH/data/0833IbnJazari/0833IbnJazari.TamhidFiCulumTajwid/*Shamela0008194-ara1', via='المكتبة الشاملة'),
  dict(id='lumca', cat='العقيدة', title='لمعة الاعتقاد', author='ابن قدامة المقدسي (ت ٦٢٠هـ)',
       sub='عقيدة السلف بإيجاز', src='RELEASE/data/0620IbnQudamaMaqdisi/0620IbnQudamaMaqdisi.LumcatIctiqad/*Shamela0030855-ara1', via='المكتبة الشاملة'),
  dict(id='qatr', cat='اللغة العربية', title='متن قطر الندى وبل الصدى', author='ابن هشام الأنصاري (ت ٧٦١هـ)',
       sub='متن مختصر في النحو', src='RELEASE/data/0761JamalDinIbnHisham/0761JamalDinIbnHisham.MatnQatrNada/*Shamela0011376-ara1', via='المكتبة الشاملة'),
  dict(id='adhkar_n', cat='الحديث وعلومه', title='الأذكار', author='النووي (ت ٦٧٦هـ)',
       sub='أذكار اليوم والليلة وآداب كثيرة — فيه روايات ضعيفة، والعمدة على الصحيح', src='RELEASE/data/0676Nawawi/0676Nawawi.Adhkar/*Sham19Y0013566-ara1', via='المكتبة الشاملة'),
  dict(id='kabair', cat='العلم وآدابه', title='الكبائر', author='الذهبي (ت ٧٤٨هـ)',
       sub='الكبائر وتحذير منها — فيه روايات ضعيفة، والعمدة على الصحيح', src='RELEASE/data/0748Dhahabi/0748Dhahabi.Kabair/*Shamela0006848-ara1', via='المكتبة الشاملة'),
  dict(id='qisas', cat='السيرة والتراجم', title='قصص الأنبياء', author='ابن كثير (ت ٧٧٤هـ)',
       sub='قصص الأنبياء عليهم السلام — فيه روايات ضعيفة وإسرائيليات، والعمدة على القرآن والصحيح', src='RELEASE/data/0774IbnKathir/0774IbnKathir.QisasAnbiya/*Shamela0000932-ara1', via='المكتبة الشاملة'),
  dict(id='icrab', cat='علوم القرآن', title='إعراب القرآن', author='أبو جعفر النحاس (ت ٣٣٨هـ)',
       sub='إعراب كل سورة وقراءاتها', src='0350AH/data/0338AbuJacfarNahhas/0338AbuJacfarNahhas.IcrabQuran/*JK001417-ara1', via='المكتبة الشاملة (مشروع جامع الكتب)',
       hm='# | ', kre=r'سورة', nonum=True),
  dict(id='tibyan', cat='علوم القرآن', title='التبيان في آداب حملة القرآن', author='الإمام النووي (ت ٦٧٦هـ)',
       sub='آداب تلاوة القرآن وتعليمه وحفظه', src='0700AH/data/0676Nawawi/0676Nawawi.Tibyan/*Shamela0001969-ara1', via='المكتبة الشاملة',
       kre=r'^الباب', nonum=True),
  dict(id='muwafaqat', cat='أصول الفقه', title='الموافقات', author='أبو إسحاق الشاطبي (ت ٧٩٠هـ)',
       sub='مقاصد الشريعة وأصول الاجتهاد', src='0800AH/data/0790IbnMusaGharnatiShatibi/0790IbnMusaGharnatiShatibi.Muwafaqat/*Shamela0011435-ara1', via='المكتبة الشاملة'),
  dict(id='alfiyya', cat='اللغة العربية', title='ألفية ابن مالك', author='ابن مالك (ت ٦٧٢هـ)',
       sub='ألف بيت في النحو والصرف', nokitab=True, src='0675AH/data/0672IbnMalik/0672IbnMalik.Alfiyya/*Shamela0008522-ara1', via='المكتبة الشاملة'),
  dict(id='ashbah', cat='القواعد الفقهية', title='الأشباه والنظائر', author='جلال الدين السيوطي (ت ٩١١هـ)',
       sub='القواعد الفقهية الكبرى وما يتفرع عنها', src='0925AH/data/0911Suyuti/0911Suyuti.Ashbah/*JK000425-ara1', via='المكتبة الشاملة (مشروع جامع الكتب)',
       pre=r'^القاعدة (الأولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العاشرة)\b', kre=r'^\0'),
  dict(id='tadhkira', cat='العلم وآدابه', title='تذكرة السامع والمتكلم في أدب العالم والمتعلم', author='ابن جماعة (ت ٧٣٣هـ)',
       sub='آداب العالم والمتعلم وطالب العلم', src='0750AH/data/0733IbnJamacaBadrDinHamawi/0733IbnJamacaBadrDinHamawi.TadhkiratSamic/*ShamAY0034810-ara1', via='المكتبة الشاملة'),
  dict(id='iman', cat='العقيدة', title='كتاب الإيمان', author='أبو عبيد القاسم بن سلّام (ت ٢٢٤هـ)',
       sub='حقيقة الإيمان وأركانه وزيادته ونقصانه بالآثار', src='0225AH/data/0224QasimIbnSallam/0224QasimIbnSallam.Iman/*Shamela0011316-ara1', via='المكتبة الشاملة',
       kre=r'^باب', nonum=True),
  dict(id='manasik', cat='الفقه والعبادات', title='الإيضاح في مناسك الحج والعمرة', author='الإمام النووي (ت ٦٧٦هـ)',
       sub='مناسك الحج والعمرة وآدابها وأحكامها', src='0700AH/data/0676Nawawi/0676Nawawi.IdahFiManasikHajj/*Shamela0096232-ara1', via='المكتبة الشاملة',
       kre=r'^الباب', nonum=True),
  dict(id='riyad', cat='الحديث وعلومه', title='رياض الصالحين', author='الإمام النووي (ت ٦٧٦هـ)',
       sub='من كلام سيد المرسلين ﷺ — أبواب الأدب والرقائق والأذكار', src='0700AH/data/0676Nawawi/0676Nawawi.RiyadSalihin/*Shamela0012014-ara1.mARkdown', via='المكتبة الشاملة',
       kre=r'^كتاب', deep=True),
  dict(id='shamail', cat='السيرة والتراجم', title='الشمائل المحمدية', author='الإمام الترمذي (ت ٢٧٩هـ)',
       sub='صفة النبي ﷺ وخَلْقه وأخلاقه وعيشه', src='0300AH/data/0279Tirmidhi/0279Tirmidhi.ShamailMuhammadiyya/*Shamela0013037-ara1', via='المكتبة الشاملة',
       kre=r'^باب', nonum=True),
  dict(id='waqf', cat='علوم القرآن', title='المكتفى في الوقف والابتدا', author='أبو عمرو الداني (ت ٤٤٤هـ)',
       sub='مواضع الوقف التام والكافي في كل سورة', src='0450AH/data/0444AbuCamrDani/0444AbuCamrDani.MuktafiFiWaqf/*Shamela0026461-ara1', via='المكتبة الشاملة',
       kre=r'سورة', nonum=True),
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
        if b.get('deep'):
            l = re.sub(r'^### \|\|\| \d+/(\d+)\s*-?\s*$', r'### | \1-', l)
            l = re.sub(r'^### \|\| (?:\d+\s*-\s*)?', '### | ', l)
        HM = b.get('hm', '### | ')
        m = re.match('^' + re.escape(HM) + r'(.+)$', l)
        if m and not l.startswith(HM + '-'):
            h = re.sub(r'^AUTO\s+', '', clean(m.group(1))).strip(' .')
            if h.startswith('[') and not h.endswith(']'): continue
            h = h.strip('[]')
            if re.match(r'^ص\s*:', h) or not h: continue
            mn = re.match(r'^(\d+)\s*-?$', h)
            if mn:
                if not b.get('nonum'): flush(); pending = mn.group(1)
                continue
            kre = b.get('kre')
            if kre and re.search(kre, h) and len(h) < 70:
                flush()
                h = re.sub(r'^\(\d+\)\s*', '', h).strip('() ')
                if ' سورة ' in h: h = 'سورة ' + h.split(' سورة ', 1)[1]
                h = re.sub(r'^شرح إعراب ', '', h)
                newkit(h); continue
            flush()
            if not kit: newkit(b['title'])
            if not b.get('kre') and h.startswith('كتاب ') and len(h) < 60 and not b.get('nokitab'):
                newkit(h)
            else:
                sec = {'t': h, 'e': []}; kit[-1]['b'].append(sec)
            continue
        if not kit: newkit(b['title'])
        if l.startswith('~~'):
            if para is not None: para += ' ' + l[2:]
            continue
        if l.startswith('### |') and HM == '### | ':
            flush(); para = re.sub(r'^### \|\s*(-:?\s*)?', '', l); num = pending; pending = None; continue
        if l.startswith('# '):
            flush()
            if b.get('pre') and re.match(b['pre'], l[2:]) and len(l) < 120:
                newkit(' '.join(l[2:].split()[:9]))
            para = l[2:]; num = pending; pending = None; continue
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
ONLY = sys.argv[1:]
for b in BOOKS:
    if not ONLY or b['id'] in ONLY: build(b)
# دمج الفهرس: نحفظ ما أضافته سكربتات أخرى (build_siyar_parts) ونحدّث/نضيف ما في BOOKS
ip = f'{OUT}/index.json'
old = json.load(open(ip, encoding='utf-8')) if os.path.exists(ip) else []
new = {b['id']: {k: b[k] for k in ('id', 'cat', 'title', 'author', 'sub', 'via')} for b in BOOKS}
out = [new.pop(x['id'], x) for x in old] + list(new.values())
json.dump(out, open(ip, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
