"""يبني خريطة ربط آيات الروايات بأرقام آيات حفص (التي تُسمّى بها ملفات everyayah) بمحاذاة الكلمات."""
import json, re, difflib, glob, os
R='public/quran/'
def norm(w):
    w=re.sub(r'[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ‌‍]','',w)
    w=re.sub('[آأإٱا]','ا',w); w=w.replace('ى','ي').replace('ة','ه').replace('ؤ','و').replace('ئ','ي')
    return w
def words(d):
    out={}
    for a in d['ayas']:
        for i,w in enumerate(a[4].split()):
            out.setdefault(a[0],[]).append((norm(w),a[1]))
    return out
H=json.load(open(R+'hafs.json')); hw=words(H)
res={}
for f in sorted(glob.glob(R+'r/*.json')):
    rid=os.path.basename(f)[:-5]; D=json.load(open(f)); rw=words(D)
    m={}; mism=0
    for s,rl in rw.items():
        hl=hw[s]
        sm=difflib.SequenceMatcher(None,[x[0] for x in rl],[x[0] for x in hl],autojunk=False)
        mp={}
        for a,b,n in sm.get_matching_blocks():
            for k in range(n): mp[a+k]=b+k
        # لكل آية في الرواية: مجموعة آيات حفص لكلماتها
        byA={}
        for i,(w,ay) in enumerate(rl): byA.setdefault(ay,[]).append(i)
        last=None
        for ay,idxs in byA.items():
            hs=[hl[mp[i]][1] for i in idxs if i in mp]
            if not hs:
                # لا مطابقة: اعتمد أقرب سابق
                hs=[last] if last else [1]; mism+=1
            m[f'{s}:{ay}']=[min(hs),max(hs)]
            last=max(hs)
    res[rid]=m
    ident=sum(1 for k,v in m.items() if v==[int(k.split(':')[1])]*2)
    print(rid,len(m),'identity',ident,'nomatch',mism)
json.dump(res,open(R+'r/audiomap.json','w'),separators=(',',':'))
