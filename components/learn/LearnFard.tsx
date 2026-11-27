'use client';

import { SectionGrid } from '@/components/SectionGrid';
import { PrayGuide } from './Pray';

/** «تعلّم الفروض»: دروس مصوّرة تفاعلية، أدلتها من نصوص الصحيحين الموجودة في التطبيق. */
export function LearnFard() {
  return (
    <SectionGrid
      secs={[
        { id: 'pray', label: 'الصلاة كما صلّى النبي ﷺ', icon: '🕌', hint: 'رسوم متحركة خطوة خطوة بالأدلة', render: () => <PrayGuide /> },
      ]}
    />
  );
}
