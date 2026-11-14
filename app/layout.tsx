import type { Metadata, Viewport } from 'next';
import { Reem_Kufi, Aref_Ruqaa } from 'next/font/google';
import './globals.css';

// كوفي للعناوين (تشبه لوجو التطبيق) ورقعة للنصوص
const kufi = Reem_Kufi({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-kufi',
  display: 'swap',
});

const ruqaa = Aref_Ruqaa({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-ruqaa',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'صلي على النبي ﷺ | تبادل مفاتيح نسك',
  description: 'منصة عربية بسيطة لمشاركة مفاتيح تحدي نسك بين الزوار، دون حسابات أو بيانات شخصية.',
  applicationName: 'صلي على النبي ﷺ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'صلي على النبي ﷺ',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#090817',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${kufi.variable} ${ruqaa.variable}`}>
      <body>{children}</body>
    </html>
  );
}
