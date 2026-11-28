'use client';

import { SectionGrid } from '@/components/SectionGrid';
import { PrayGuide } from './Pray';
import { DinGuide, GhuslGuide, TayammumGuide, AdhanGuide } from './Fard3';
import { ZakatCalc } from './ZakatCalc';
import { WuduGuide, ZakatGuide, SiyamGuide, HajjGuide } from './Fard2';

/** «تعلّم الفروض»: دروس مصوّرة تفاعلية، أدلتها من نصوص الصحيحين الموجودة في التطبيق. */
export function LearnFard() {
  return (
    <SectionGrid
      secs={[
        { id: 'din', label: 'أركان الدين', icon: '🏠', hint: 'الإسلام والإيمان والإحسان من حديث جبريل', render: () => <DinGuide /> },
        { id: 'wudu', label: 'الوضوء', icon: '💧', hint: 'مواضعه مرتبة على الجسم بأدلته', render: () => <WuduGuide /> },
        { id: 'ghusl', label: 'الغسل', icon: '🚿', hint: 'مراحله من حديث ميمونة', render: () => <GhuslGuide /> },
        { id: 'tayammum', label: 'التيمم', icon: '🏜️', hint: 'أربع خطوات بآية المائدة وحديث عمار', render: () => <TayammumGuide /> },
        { id: 'adhan', label: 'الأذان وإجابته', icon: '📣', hint: 'تفاعلي: المؤذن يقول وأنت تجيب', render: () => <AdhanGuide /> },
        { id: 'pray', label: 'الصلاة كما صلّى النبي ﷺ', icon: '🕌', hint: 'رسوم متحركة خطوة خطوة بالأدلة', render: () => <PrayGuide /> },
        { id: 'zakat', label: 'الزكاة', icon: '💰', hint: 'النصاب والأصناف الثمانية', render: () => <ZakatGuide /> },
        { id: 'zcalc', label: 'احسب زكاتك', icon: '🧮', hint: 'اكتب ما تملكه فيظهر ما عليك', render: () => <ZakatCalc /> },
        { id: 'siyam', label: 'الصيام', icon: '🌙', hint: 'من الفجر إلى الغروب بالآيات', render: () => <SiyamGuide /> },
        { id: 'hajj', label: 'الحج', icon: '🕋', hint: 'خريطة المناسك من حديث جابر', render: () => <HajjGuide /> },
      ]}
    />
  );
}
