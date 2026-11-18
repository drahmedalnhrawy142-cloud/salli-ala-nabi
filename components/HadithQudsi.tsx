'use client';

import { useState } from 'react';

/** أحاديث قدسية صحيحة من الصحيحين (البخاري/مسلم) فقط. الألفاظ مقتبسة من الروايات المشهورة، والمقتطف يُشار إليه بـ «…». */
const HQ: { t: string; src: string }[] = [
  {
    t: 'يَا عِبَادِي إِنِّي حَرَّمْتُ الظُّلْمَ عَلَى نَفْسِي، وَجَعَلْتُهُ بَيْنَكُمْ مُحَرَّمًا، فَلَا تَظَالَمُوا…',
    src: 'رواه مسلم',
  },
  {
    t: 'أَنَا عِنْدَ ظَنِّ عَبْدِي بِي، وَأَنَا مَعَهُ إِذَا ذَكَرَنِي، فَإِنْ ذَكَرَنِي فِي نَفْسِهِ ذَكَرْتُهُ فِي نَفْسِي، وَإِنْ ذَكَرَنِي فِي مَلَإٍ ذَكَرْتُهُ فِي مَلَإٍ خَيْرٍ مِنْهُمْ، وَإِنْ تَقَرَّبَ إِلَيَّ شِبْرًا تَقَرَّبْتُ إِلَيْهِ ذِرَاعًا، وَإِنْ تَقَرَّبَ إِلَيَّ ذِرَاعًا تَقَرَّبْتُ إِلَيْهِ بَاعًا، وَإِنْ أَتَانِي يَمْشِي أَتَيْتُهُ هَرْوَلَةً',
    src: 'متفق عليه',
  },
  {
    t: 'مَنْ عَادَى لِي وَلِيًّا فَقَدْ آذَنْتُهُ بِالْحَرْبِ، وَمَا تَقَرَّبَ إِلَيَّ عَبْدِي بِشَيْءٍ أَحَبَّ إِلَيَّ مِمَّا افْتَرَضْتُ عَلَيْهِ، وَمَا يَزَالُ عَبْدِي يَتَقَرَّبُ إِلَيَّ بِالنَّوَافِلِ حَتَّى أُحِبَّهُ…',
    src: 'رواه البخاري',
  },
  {
    t: 'أَعْدَدْتُ لِعِبَادِي الصَّالِحِينَ مَا لَا عَيْنٌ رَأَتْ، وَلَا أُذُنٌ سَمِعَتْ، وَلَا خَطَرَ عَلَى قَلْبِ بَشَرٍ',
    src: 'متفق عليه',
  },
  {
    t: 'إِنَّ رَحْمَتِي سَبَقَتْ غَضَبِي',
    src: 'متفق عليه',
  },
  {
    t: 'كُلُّ عَمَلِ ابْنِ آدَمَ لَهُ إِلَّا الصِّيَامَ، فَإِنَّهُ لِي وَأَنَا أَجْزِي بِهِ',
    src: 'متفق عليه',
  },
  {
    t: 'قَسَمْتُ الصَّلَاةَ بَيْنِي وَبَيْنَ عَبْدِي نِصْفَيْنِ، وَلِعَبْدِي مَا سَأَلَ…',
    src: 'رواه مسلم',
  },
  {
    t: 'أَنَا أَغْنَى الشُّرَكَاءِ عَنِ الشِّرْكِ، مَنْ عَمِلَ عَمَلًا أَشْرَكَ فِيهِ مَعِي غَيْرِي تَرَكْتُهُ وَشِرْكَهُ',
    src: 'رواه مسلم',
  },
  {
    t: 'أَنْفِقْ أُنْفِقْ عَلَيْكَ',
    src: 'متفق عليه',
  },
  {
    t: 'يُؤْذِينِي ابْنُ آدَمَ، يَسُبُّ الدَّهْرَ وَأَنَا الدَّهْرُ، بِيَدِي الْأَمْرُ، أُقَلِّبُ اللَّيْلَ وَالنَّهَارَ',
    src: 'متفق عليه',
  },
  {
    t: 'مَا لِعَبْدِي الْمُؤْمِنِ عِنْدِي جَزَاءٌ إِذَا قَبَضْتُ صَفِيَّهُ مِنْ أَهْلِ الدُّنْيَا ثُمَّ احْتَسَبَهُ إِلَّا الْجَنَّةُ',
    src: 'رواه البخاري',
  },
  {
    t: 'ثَلَاثَةٌ أَنَا خَصْمُهُمْ يَوْمَ الْقِيَامَةِ: رَجُلٌ أَعْطَى بِي ثُمَّ غَدَرَ، وَرَجُلٌ بَاعَ حُرًّا فَأَكَلَ ثَمَنَهُ، وَرَجُلٌ اسْتَأْجَرَ أَجِيرًا فَاسْتَوْفَى مِنْهُ وَلَمْ يُعْطِهِ أَجْرَهُ',
    src: 'رواه البخاري',
  },
  {
    t: 'يَا ابْنَ آدَمَ مَرِضْتُ فَلَمْ تَعُدْنِي…',
    src: 'رواه مسلم',
  },
];

export function HadithQudsi() {
  const [msg, setMsg] = useState('');
  async function copy(i: number) {
    try {
      await navigator.clipboard.writeText(`قال الله تعالى في الحديث القدسي: «${HQ[i].t}» — ${HQ[i].src}`);
      setMsg('تم النسخ');
    } catch {
      setMsg('تعذّر النسخ');
    }
    setTimeout(() => setMsg(''), 1400);
  }
  return (
    <div className="hq">
      <p className="hq-note">أحاديث قدسية صحيحة من الصحيحين فقط. تُنقل بألفاظ الروايات المشهورة، وما اختُصر منها يُشار إليه بـ «…».</p>
      {HQ.map((h, i) => (
        <article key={i} className="hq-card">
          <p className="hq-lead">قال الله تعالى فيما يرويه عنه نبيه ﷺ:</p>
          <p className="hq-text">«{h.t}»</p>
          <div className="hq-foot">
            <span>{h.src}</span>
            <button type="button" onClick={() => copy(i)}>
              نسخ
            </button>
          </div>
        </article>
      ))}
      {msg && <div className="hq-toast">{msg}</div>}
      <style>{`
        .hq { display: flex; flex-direction: column; gap: 12px; }
        .hq-note { margin: 0; text-align: center; font-family: var(--font-ruqaa), serif; font-size: 14.5px; color: rgba(255,241,196,.6); }
        .hq-card { padding: 16px; border-radius: 20px; border: 1px solid rgba(232,194,90,.3); background: rgba(18,15,8,.82); }
        .hq-lead { margin: 0 0 6px; font-family: var(--font-kufi), sans-serif; font-size: 13px; color: #e8c25a; }
        .hq-text { margin: 0; font-family: var(--font-ruqaa), serif; font-size: 21px; line-height: 2.1; color: #fff1c4; }
        .hq-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-family: var(--font-kufi), sans-serif; font-size: 13px; color: #f1d77a; }
        .hq-foot button { padding: 7px 16px; border-radius: 999px; border: 1px solid rgba(232,194,90,.4); background: rgba(232,194,90,.1); color: #f1d77a; font-family: var(--font-kufi), sans-serif; }
        .hq-toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: 110px; background: #f1d77a; color: #1c1405; padding: 8px 18px; border-radius: 999px; font-family: var(--font-kufi), sans-serif; z-index: 40; }
      `}</style>
    </div>
  );
}
