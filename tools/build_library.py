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
  dict(id='wasitiyya', cat='العقيدة', title='العقيدة الواسطية', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='أصول الإيمان بالله وصفاته وبالقدر واليوم الآخر ومنهج أهل السنة', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.CaqidaWasitiyya/*Shamela0022665-ara1', via='المكتبة الشاملة'),
  dict(id='usulsunna', cat='العقيدة', title='أصول السنة', author='الإمام أحمد بن حنبل (ت ٢٤١هـ)',
       sub='أصول اعتقاد أهل السنة والتمسك بما كان عليه الصحابة', src='RELEASE/data/0241IbnHanbal/0241IbnHanbal.UsulSunna/*Shamela0006418-ara1', via='المكتبة الشاملة'),
  dict(id='kalimat', cat='العقيدة', title='كلمة الإخلاص وتحقيق معناها', author='ابن رجب الحنبلي (ت ٧٩٥هـ)',
       sub='معنى لا إله إلا الله وشروطها وفضلها', src='RELEASE/data/0795IbnRajabHanbali/0795IbnRajabHanbali.KalimatIkhsas/*Shamela0000696-ara1', via='المكتبة الشاملة'),
  dict(id='cubudiyya', cat='العقيدة', title='العبودية', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='حقيقة العبودية لله ومراتبها', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.Cubudiyya/*Shamela0022647-ara1', via='المكتبة الشاملة'),
  dict(id='nuriqtibas', cat='العقيدة', title='نور الاقتباس في مشكاة وصية النبي ﷺ لابن عباس', author='ابن رجب الحنبلي (ت ٧٩٥هـ)',
       sub='شرح حديث «احفظ الله يحفظك»', src='RELEASE/data/0795IbnRajabHanbali/0795IbnRajabHanbali.NurIqtibas/*ShamAY0034320-ara1', via='المكتبة الشاملة'),
  dict(id='usultafsir', cat='علوم القرآن', title='مقدمة في أصول التفسير', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='كيف يُفسَّر القرآن وأنواع الاختلاف في التفسير', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.MuqaddimaFiUsulTafsir/*Shamela0012081-ara1', via='المكتبة الشاملة'),
  dict(id='jazariyya', cat='علوم القرآن', title='المقدمة الجزرية (منظومة التجويد)', author='ابن الجزري (ت ٨٣٣هـ)',
       sub='منظومة المخارج والصفات وأحكام التجويد', src='RELEASE/data/0833IbnJazari/0833IbnJazari.ManzumaJazariyya/*Shamela0012093-ara1', via='المكتبة الشاملة', nokitab=True),
  dict(id='itqan', cat='علوم القرآن', title='الإتقان في علوم القرآن', author='جلال الدين السيوطي (ت ٩١١هـ)',
       sub='ثمانون نوعًا من علوم القرآن', src='RELEASE/data/0911Suyuti/0911Suyuti.Itqan/*Shamela0011728-ara1', via='المكتبة الشاملة', kre=r'^النوع', nonum=True),
  dict(id='bayquniyya', cat='الحديث وعلومه', title='المنظومة البيقونية', author='عمر البيقوني (ت نحو ١٠٨٠هـ)',
       sub='منظومة في مصطلح الحديث', src='RELEASE/data/1080IbnMuhammadBayquniDimashqi/1080IbnMuhammadBayquniDimashqi.ManzumaBayquniyya/*Shamela0008567-ara1', via='المكتبة الشاملة', nokitab=True),
  dict(id='muqiza', cat='الحديث وعلومه', title='الموقظة في علم مصطلح الحديث', author='الذهبي (ت ٧٤٨هـ)',
       sub='الصحيح والحسن والضعيف وأنواع علوم الحديث بإيجاز', src='RELEASE/data/0748Dhahabi/0748Dhahabi.MuqizaFiCilmMustalahHadith/*Shamela0008195-ara1', via='المكتبة الشاملة'),
  dict(id='taqrib', cat='الحديث وعلومه', title='التقريب والتيسير', author='الإمام النووي (ت ٦٧٦هـ)',
       sub='مختصر علوم الحديث لابن الصلاح', src='RELEASE/data/0676Nawawi/0676Nawawi.Taqrib/*Shamela0005586-ara1', via='المكتبة الشاملة'),
  dict(id='nuzhat', cat='الحديث وعلومه', title='نزهة النظر في توضيح نخبة الفكر', author='ابن حجر العسقلاني (ت ٨٥٢هـ)',
       sub='شرح مصطلح الحديث', src='RELEASE/data/0852IbnHajarCasqalani/0852IbnHajarCasqalani.NuzhatNazar/*Shamela0001565-ara1', via='المكتبة الشاملة'),
  dict(id='adabfatwa', cat='العلم وآدابه', title='آداب الفتوى والمفتي والمستفتي', author='الإمام النووي (ت ٦٧٦هـ)',
       sub='شروط المفتي وآدابه وآداب المستفتي', src='RELEASE/data/0676Nawawi/0676Nawawi.AdabFatwa/*Shamela0006345-ara1', via='المكتبة الشاملة'),
  dict(id='fawaid', cat='العلم وآدابه', title='الفوائد', author='ابن القيم (ت ٧٥١هـ)',
       sub='فوائد في التفسير والإيمان والسلوك', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.Fawaid/*Shamela0006832-ara1', via='المكتبة الشاملة'),
  dict(id='saydkhatir', cat='العلم وآدابه', title='صيد الخاطر', author='ابن الجوزي (ت ٥٩٧هـ)',
       sub='خواطر وتأملات في الدين والنفس والحياة', src='RELEASE/data/0597IbnJawzi/0597IbnJawzi.SaydKhatir/*Shamela0012028-ara1', via='المكتبة الشاملة'),
  dict(id='shudhur', cat='اللغة العربية', title='متن شذور الذهب', author='ابن هشام الأنصاري (ت ٧٦١هـ)',
       sub='متن في النحو للمتوسطين', src='RELEASE/data/0761JamalDinIbnHisham/0761JamalDinIbnHisham.MatnShudhurDhahab/*Shamela0096770-ara1', via='المكتبة الشاملة'),
  dict(id='cumdatfiqh', cat='الفقه والعبادات', title='عمدة الفقه', author='ابن قدامة المقدسي (ت ٦٢٠هـ)',
       sub='متن مختصر في الفقه على مذهب الإمام أحمد', src='RELEASE/data/0620IbnQudamaMaqdisi/0620IbnQudamaMaqdisi.CumdatFiqh/*Shamela0011315-ara1', via='المكتبة الشاملة'),
  dict(id='siyasa', cat='الفقه والعبادات', title='السياسة الشرعية في إصلاح الراعي والرعية', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='الأمانة والعدل وولاية الأمور في الشرع', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.SiyasaSharciyya/*Shamela0031237-ara1', via='المكتبة الشاملة'),
  dict(id='aqsam', cat='علوم القرآن', title='التبيان في أقسام القرآن', author='ابن القيم (ت ٧٥١هـ)',
       sub='أقسام الله في القرآن ودلالاتها', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.TibyanFiAqsamQuran/*Shamela0007572-ara1', via='المكتبة الشاملة'),
  dict(id='tadmuriyya', cat='العقيدة', title='الرسالة التدمرية', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='تحقيق الإثبات للأسماء والصفات وحقيقة التوحيد والقدر', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.RisalaTadmuriyya/*Shamela0022666-ara1', via='المكتبة الشاملة'),
  dict(id='hisba', cat='الفقه والعبادات', title='الحسبة في الإسلام', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='الأمر بالمعروف والنهي عن المنكر وولاية الحسبة', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.Hisba/*Shamela0007263-ara1', via='المكتبة الشاملة'),
  dict(id='rafcmalam', cat='الفقه المقارن', title='رفع الملام عن الأئمة الأعلام', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='أسباب اختلاف الأئمة وعذرهم فيما خالفوا فيه', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.RafcMalam/*Shamela0004118-ara1', via='المكتبة الشاملة'),
  dict(id='amrad', cat='العلم وآدابه', title='أمراض القلوب وشفاؤها', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='الحسد والرياء والكبر ودواؤها', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.AmradQulub/*Shamela0001512-ara1', via='المكتبة الشاملة'),
  dict(id='hasana', cat='العقيدة', title='الحسنة والسيئة', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='أسباب الحسنات والسيئات وما يصيب العبد', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.HasanaWaSayyia/*Shamela0007609-ara1', via='المكتبة الشاملة'),
  dict(id='ahkamsult', cat='الفقه والعبادات', title='الأحكام السلطانية', author='الماوردي (ت ٤٥٠هـ)',
       sub='الإمامة والولايات والقضاء والحسبة', src='RELEASE/data/0450AbuHasanMawardi/0450AbuHasanMawardi.AhkamSultaniyya/*Shamela0022881-ara1.mARkdown', via='المكتبة الشاملة'),
  dict(id='rawdat', cat='أصول الفقه', title='روضة الناظر وجنة المناظر', author='ابن قدامة المقدسي (ت ٦٢٠هـ)',
       sub='في أصول الفقه على مذهب الإمام أحمد', src='RELEASE/data/0620IbnQudamaMaqdisi/0620IbnQudamaMaqdisi.RawdatNazir/*Shamela0012010-ara1', via='المكتبة الشاملة'),
  dict(id='qamthal', cat='علوم القرآن', title='الأمثال في القرآن', author='ابن القيم (ت ٧٥١هـ)',
       sub='ما ضربه الله من الأمثال وما فيها من العبر', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.AmthalFiQuran/*Shamela0000928-ara1', via='المكتبة الشاملة'),
  dict(id='aclam', cat='أصول الفقه', title='إعلام الموقعين عن رب العالمين', author='ابن القيم (ت ٧٥١هـ)',
       sub='الفتوى وأصول الاستدلال ومقاصد الشريعة', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.AclamMuwaqqicin/*Shamela0011496-ara1', via='المكتبة الشاملة'),
  dict(id='turuq', cat='الفقه والعبادات', title='الطرق الحكمية في السياسة الشرعية', author='ابن القيم (ت ٧٥١هـ)',
       sub='القضاء والبيّنات وطرق الحكم بالعدل', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.TuruqHukmiyya/*Shamela0011495-ara1', via='المكتبة الشاملة'),
  dict(id='hijratayn', cat='العقيدة', title='طريق الهجرتين وباب السعادتين', author='ابن القيم (ت ٧٥١هـ)',
       sub='الهجرة إلى الله ورسوله وطبقات المكلفين', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.TariqHijratayn/*Shamela0012029-ara1', via='المكتبة الشاملة'),
  dict(id='cuddat', cat='العلم وآدابه', title='عدة الصابرين وذخيرة الشاكرين', author='ابن القيم (ت ٧٥١هـ)',
       sub='الصبر والشكر وحقيقتهما ومنازلهما', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.CuddatSabirin/*Shamela0011274-ara1', via='المكتبة الشاملة'),
  dict(id='qsalat', cat='الفقه والعبادات', title='الصلاة وحكم تاركها', author='ابن القيم (ت ٧٥١هـ)',
       sub='حكم الصلاة وتاركها ومنزلتها في الدين', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.Salat/*Shamela0007661-ara1', via='المكتبة الشاملة'),
  dict(id='tuhfat', cat='الفقه والعبادات', title='تحفة المودود بأحكام المولود', author='ابن القيم (ت ٧٥١هـ)',
       sub='أحكام المولود وتربية الأولاد', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.TuhfatMawdud/*Shamela0006266-ara1', via='المكتبة الشاملة'),
  dict(id='madarij', cat='العلم وآدابه', title='مدارج السالكين', author='ابن القيم (ت ٧٥١هـ)',
       sub='منازل إياك نعبد وإياك نستعين', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.MadarijSalikin/*Shamela0008370-ara1', via='المكتبة الشاملة'),
  dict(id='ihtijaj', cat='العقيدة', title='الاحتجاج بالقدر', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='حقيقة القدر والاحتجاج به في الذنوب', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.IhtijajBiQadar/*Shamela0000301-ara1', via='المكتبة الشاملة'),
  dict(id='istiqama', cat='العلم وآدابه', title='الاستقامة', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='الاستقامة على الشريعة والسلوك', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.Istiqama/*Shamela0006820-ara1', via='المكتبة الشاملة'),
  dict(id='zuhd', cat='العلم وآدابه', title='الزهد والورع والعبادة', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='حقيقة الزهد والورع وأعمال القلوب', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.ZuhdWaWarac/*Shamela0006826-ara1', via='المكتبة الشاملة'),
  dict(id='sarim', cat='السيرة والتراجم', title='الصارم المسلول على شاتم الرسول', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='حكم من سبّ النبي ﷺ وبيان حقه وتوقيره', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.SarimMaslul/*Shamela0007344-ara1', via='المكتبة الشاملة'),
  dict(id='nubuwwat', cat='العقيدة', title='النبوات', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='حقيقة النبوة والمعجزة والفرق بينها وبين غيرها', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.Nubuwwat/*Shamela0011817-ara1', via='المكتبة الشاملة'),
  dict(id='iqtidasirat', cat='العقيدة', title='اقتضاء الصراط المستقيم', author='ابن تيمية (ت ٧٢٨هـ)',
       sub='مخالفة أصحاب الجحيم وحفظ الهوية', src='RELEASE/data/0728IbnTaymiyya/0728IbnTaymiyya.IqtidaSirat/*Shamela0011620-ara1', via='المكتبة الشاملة'),
  dict(id='gharibqutayba', cat='علوم القرآن', title='تفسير غريب القرآن', author='ابن قتيبة (ت ٢٧٦هـ)',
       sub='شرح مفردات القرآن الغريبة', src='RELEASE/data/0276IbnQutaybaDinawari/0276IbnQutaybaDinawari.GharibQuran/*Shamela0003259-ara1', via='المكتبة الشاملة'),
  dict(id='majaz', cat='علوم القرآن', title='مجاز القرآن', author='أبو عبيدة (ت ٢٠٩هـ)',
       sub='من أقدم ما كُتب في لغة القرآن وأساليبه', src='RELEASE/data/0209AbuCubayda/0209AbuCubayda.MajazQuran/*Shamela0023630-ara1', via='المكتبة الشاملة'),
  dict(id='icjaz', cat='علوم القرآن', title='إعجاز القرآن', author='الباقلاني (ت ٤٠٣هـ)',
       sub='وجوه إعجاز القرآن ونظمه وبلاغته', src='RELEASE/data/0403AbuBakrBaqillani/0403AbuBakrBaqillani.IcjazQuran/*Shamela0000953-ara1', via='المكتبة الشاملة'),
  dict(id='funun', cat='علوم القرآن', title='فنون الأفنان في عيون علوم القرآن', author='ابن الجوزي (ت ٥٩٧هـ)',
       sub='مدخل موجز إلى علوم القرآن', src='RELEASE/data/0597IbnJawzi/0597IbnJawzi.FununAfnan/*Shamela0001402-ara1', via='المكتبة الشاملة'),
  dict(id='mufradat', cat='علوم القرآن', title='المفردات في غريب القرآن', author='الراغب الأصفهاني (ت ٥٠٢هـ)',
       sub='معجم مفردات القرآن ومعانيها', src='RELEASE/data/0502RaghibIsbahani/0502RaghibIsbahani.Mufradat/*Shamela0023636-ara1', via='المكتبة الشاملة'),
  dict(id='nuzhatacyun', cat='علوم القرآن', title='نزهة الأعين النواظر في الوجوه والنظائر', author='ابن الجوزي (ت ٥٩٧هـ)',
       sub='الألفاظ المشتركة في القرآن ووجوه معانيها', src='RELEASE/data/0597IbnJawzi/0597IbnJawzi.NuzhatAcyun/*Shamela0006334-ara1', via='المكتبة الشاملة'),
  dict(id='nasikh', cat='علوم القرآن', title='الناسخ والمنسوخ', author='ابن حزم (ت ٤٥٦هـ)',
       sub='النسخ في القرآن وما قيل فيه', src='RELEASE/data/0456IbnHazm/0456IbnHazm.NasikhWaMansukh/*Shamela0002216-ara1', via='المكتبة الشاملة'),
  dict(id='fadailquran', cat='علوم القرآن', title='فضائل القرآن', author='ابن كثير (ت ٧٧٤هـ)',
       sub='فضل القرآن وآداب تلاوته وتعلمه · تراثي: فيه روايات ضعيفة، للاطلاع', src='RELEASE/data/0774IbnKathir/0774IbnKathir.FadailQuran/*Shamela0022800-ara1', via='المكتبة الشاملة'),
  dict(id='zad', cat='السيرة والتراجم', title='زاد المعاد في هدي خير العباد', author='ابن القيم (ت ٧٥١هـ)',
       sub='هديه ﷺ في العبادات والمعاملات والطب · تراثي: فيه روايات ضعيفة، للاطلاع', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.ZadMacad/*Shamela0021713-ara1', via='المكتبة الشاملة'),
  dict(id='ruh', cat='العقيدة', title='الروح', author='ابن القيم (ت ٧٥١هـ)',
       sub='مسائل الروح والبرزخ · تراثي: فيه روايات ضعيفة، للاطلاع', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.RuhFiKalam/*Shamela0006462-ara1', via='المكتبة الشاملة'),
  dict(id='dawa', cat='العلم وآدابه', title='الجواب الكافي (الداء والدواء)', author='ابن القيم (ت ٧٥١هـ)',
       sub='الذنوب وأثرها وعلاجها · تراثي: فيه روايات ضعيفة، للاطلاع', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.DaWaDawa/*Shamela0000158-ara1', via='المكتبة الشاملة'),
  dict(id='wabil', cat='العلم وآدابه', title='الوابل الصيب من الكلم الطيب', author='ابن القيم (ت ٧٥١هـ)',
       sub='فضل الذكر وفوائده · تراثي: فيه روايات ضعيفة، للاطلاع', src='RELEASE/data/0751IbnQayyimJawziyya/0751IbnQayyimJawziyya.WabilSayyib/*Shamela0000216-ara1', via='المكتبة الشاملة'),
  dict(id='akhlaqquran', cat='علوم القرآن', title='أخلاق أهل القرآن', author='الآجري (ت ٣٦٠هـ)',
       sub='آداب حامل القرآن وأخلاقه · تراثي: فيه روايات ضعيفة، للاطلاع', src='RELEASE/data/0360AbuBakrAjurri/0360AbuBakrAjurri.AkhlaqAhlQuran/*Shamela0010531-ara1', via='المكتبة الشاملة'),
  dict(id='akhlaqculama', cat='العلم وآدابه', title='أخلاق العلماء', author='الآجري (ت ٣٦٠هـ)',
       sub='آداب العالم وأخلاقه · تراثي: فيه روايات ضعيفة، للاطلاع', src='RELEASE/data/0360AbuBakrAjurri/0360AbuBakrAjurri.AkhlaqCulama/*Shamela0001311-ara1', via='المكتبة الشاملة'),
  dict(id='iqtida', cat='العلم وآدابه', title='اقتضاء العلم العمل', author='الخطيب البغدادي (ت ٤٦٣هـ)',
       sub='العمل بالعلم وذم من لا يعمل · تراثي: فيه روايات ضعيفة، للاطلاع', src='RELEASE/data/0463KhatibBaghdadi/0463KhatibBaghdadi.IqtidaCilmCamal/*Shamela0012985-ara1', via='المكتبة الشاملة'),
  dict(id='talbis', cat='العلم وآدابه', title='تلبيس إبليس', author='ابن الجوزي (ت ٥٩٧هـ)',
       sub='مداخل الشيطان على الناس · تراثي: فيه روايات ضعيفة، للاطلاع', src='RELEASE/data/0597IbnJawzi/0597IbnJawzi.TalbisIblis/*Shamela0011438-ara1.mARkdown', via='المكتبة الشاملة'),
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
