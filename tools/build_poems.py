# يبني components/poemsData.ts: أبيات في مدح النبي ﷺ من دواوين الصحابة (OpenITI، CC BY-NC-SA 4.0) ومن صحيح البخاري (hadith-json)
import re, glob, json, os
R = '/home/claude/openiti'
def verses(f):
    out = []
    for l in open(f, encoding='utf-8'):
        if l.startswith('# %'):
            t = re.sub(r'PageV\d+P\d+', '', l[2:]); t = re.sub(r'\bms\d+\b', '', t); t = re.sub(r'\s*\d+\s*$', '', t)
            out.append([re.sub(r'\s+', ' ', p).strip(' ،') for p in t.split('%') if p.strip()])
    return out
H = verses(glob.glob(f'{R}/0075AH/data/0054HassanIbnThabit/*/*JK007534-ara1')[0])
K = verses(glob.glob(f'{R}/0050AH/data/0026KacbIbnZuhayr/*/*JK007537-ara1')[0])
HS = 'ديوان حسان بن ثابت ﵁'; KS = 'ديوان كعب بن زهير ﵁'
sets = [
  ('حسان بن ثابت ﵁', HS, H, range(244, 250)),
  ('حسان بن ثابت ﵁', HS, H, range(346, 350)),
  ('حسان بن ثابت ﵁', HS, H, range(273, 275)),
  ('حسان بن ثابت ﵁', HS + ' (مما رواه مسلم في صحيحه)', H, range(23, 28)),
  ('حسان بن ثابت ﵁', HS, H, [254]),
  ('حسان بن ثابت ﵁', HS, H, range(314, 317)),
  ('حسان بن ثابت ﵁', HS + ' (من رثائه للنبي ﷺ)', H, range(280, 285)),
  ('حسان بن ثابت ﵁', HS + ' (من رثائه للنبي ﷺ)', H, range(285, 291)),
  ('حسان بن ثابت ﵁', HS + ' (من رثائه للنبي ﷺ)', H, [294, 295, 297, 298, 299, 300]),
  ('حسان بن ثابت ﵁', HS + ' (من رثائه للنبي ﷺ)', H, [312, 313]),
  ('حسان بن ثابت ﵁', HS + ' (من رثائه للنبي ﷺ)', H, [341, 342, 343]),
  ('حسان بن ثابت ﵁', HS, H, range(1587, 1591)),
  ('حسان بن ثابت ﵁', HS, H, range(1660, 1663)),
  ('كعب بن زهير ﵁', KS, K, [374, 377, 378, 386]),
]
SF = glob.glob(f'{R}/1375AH/data/1359AhmadShawqi/*/*Hindawi070706142-ara1')[0]
SL = open(SF, encoding='utf-8').read().split('\n')
def hem(n): return re.sub(r'\s+', ' ', SL[n - 1][2:]).strip()
SH = 'الشوقيات — الهمزية النبوية (مؤسسة هنداوي عبر OpenITI)'
shawqi = [
  [(2266, 2268), (2270, 2272), (2276, 2278), (2282, 2284)],
  [(2305, 2307), (2309, 2311)],
  [(2294, 2296), (2300, 2302)],
]
SIRA = glob.glob(f'{R}/0225AH/data/0213IbnHisham/0213IbnHisham.SiraNabawiyya/*Shamela0023833-ara1.completed')[0]
SRL = open(SIRA, encoding='utf-8').read().split('\n')
def sv(i):
    t = re.sub(r'PageV\d+P\d+|\bms\d+\b', '', SRL[i][2:]); a, b = [re.sub(r'\s+', ' ', x).strip() for x in t.split(' ... ')]
    return [a, b]
SS = 'سيرة ابن هشام (مؤسسة الشاملة عبر OpenITI)'
sira = [
  ('عباس بن مرداس ﵁', [21978, 21979]),
  ('عباس بن مرداس ﵁', [22091, 22092, 22093]),
  ('عباس بن مرداس ﵁', [22104, 22105, 22106]),
  ('عباس بن مرداس ﵁', [22025, 22026]),
  ('عبد الله بن رواحة ﵁', [17072, 17073]),
  ('كعب بن مالك ﵁', [19815, 19816]),
  ('كعب بن مالك ﵁', [13678, 13679]),
  ('كعب بن مالك ﵁', [15786, 15787, 15788]),
]
# الهمزية: أبيات منتقاة بمطالعها
seq = [re.sub(r'\s+', ' ', re.sub(r'\bms\d+\b|PageV\d+P\d+', '', l[2:])).strip() for l in SL if l.startswith('# ') and not re.match(r'^# \d+', l) and not l.startswith('# |')]
def hv(anchor):
    k = next(i for i, x in enumerate(seq) if anchor in x)
    return [seq[k], seq[k + 1]]
HAM = [
  ['وبدا محياك الذي قسماته', 'وعليه من نور النبوة رونق'],
  ['يا من له الأخلاق ما تهوى العلا', 'زانتك في الخلق العظيم شمائل', 'أما الجمال فأنت شمس سمائه'],
  ['فإذا سخوت بلغت بالجود المدى', 'وإذا عفوت فقادرا ومقدرا', 'وإذا رحمت فأنت أم أو أب'],
  ['وإذا غضبت فإنما هي غضبة', 'وإذا رضيت فذاك في مرضاته', 'وإذا خطبت فللمنابر هزة'],
  ['وتمد حلمك للسفيه مداريا', 'في كل نفس من سطاك مهابة'],
  ['يا أيها الأمي حسبك رتبة', 'الذكر آية ربك الكبرى التي', 'بك يا ابن عبد الله قامت سمحة'],
  ['والدين يسر والخلافة بيعة', 'أنصفت أهل الفقر من أهل الغنى'],
  ['يا أيها المسرى به شرفا إلى', 'يتساءلون وأنت أطهر هيكل'],
  ['ساقي الجريح ومطعم الأسرى ومن', 'إن الشجاعة في الرجال غلاظة', 'من قومه'],
  ['أنت الذي نظم البرية دينه', 'ظلموا شريعتك التي نلنا بها', 'صلى عليك الله ما صحب الدجى'],
]
out = []
for poet, src, V, idx in sets:
    lines = [v for i in idx for v in [V[i]] if len(v) == 2]
    out.append({'poet': poet, 'src': src, 'v': lines})
SB = 'الشوقيات — نهج البردة (مؤسسة هنداوي عبر OpenITI)'
nahj = [
  [(13136, 13138), (13142, 13144), (13148, 13150)],
  [(13256, 13258), (13260, 13262), (13266, 13268)],
]
for g in shawqi: out.append({'poet': 'أحمد شوقي', 'src': SH, 'v': [[hem(a), hem(b)] for a, b in g]})
for poet, ids in sira: out.append({'poet': poet, 'src': SS, 'v': [sv(i) for i in ids]})
for g in HAM: out.append({'poet': 'أحمد شوقي', 'src': SH, 'v': [hv(a) for a in g]})
for g in nahj: out.append({'poet': 'أحمد شوقي', 'src': SB, 'v': [[hem(a), hem(b)] for a, b in g]})
out.insert(0, {'poet': 'أبو طالب (ممّا تمثّل به ابن عمر ﵄ ورواه البخاري)', 'src': 'صحيح البخاري، كتاب الاستسقاء',
               'v': [['وَأَبْيَضَ يُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ', 'ثِمَالُ الْيَتَامَى عِصْمَةٌ لِلأَرَامِلِ']]})
ts = '// مولَّد بـ tools/build_poems.py — لا يُعدَّل يدويًا\nexport type Poem = { poet: string; src: string; v: string[][] };\nexport const POEMS: Poem[] = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n'
open(os.path.join(os.path.dirname(__file__), '..', 'components', 'poemsData.ts'), 'w', encoding='utf-8').write(ts)
print(len(out), [len(o['v']) for o in out])
