import type { Metadata, Viewport } from 'next';
import './globals.css';

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
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
