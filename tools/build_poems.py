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
for g in nahj: out.append({'poet': 'أحمد شوقي', 'src': SB, 'v': [[hem(a), hem(b)] for a, b in g]})
out.insert(0, {'poet': 'أبو طالب (ممّا تمثّل به ابن عمر ﵄ ورواه البخاري)', 'src': 'صحيح البخاري، كتاب الاستسقاء',
               'v': [['وَأَبْيَضَ يُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ', 'ثِمَالُ الْيَتَامَى عِصْمَةٌ لِلأَرَامِلِ']]})
ts = '// مولَّد بـ tools/build_poems.py — لا يُعدَّل يدويًا\nexport type Poem = { poet: string; src: string; v: string[][] };\nexport const POEMS: Poem[] = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n'
open(os.path.join(os.path.dirname(__file__), '..', 'components', 'poemsData.ts'), 'w', encoding='utf-8').write(ts)
print(len(out), [len(o['v']) for o in out])
