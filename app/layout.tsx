import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FONT_CLASSES } from './fonts';
import { PwaSetup } from '@/components/PwaSetup';

export const metadata: Metadata = {
  title: 'صل على النبي ﷺ | تبادل مفاتيح نسك',
  description: 'منصة عربية بسيطة لمشاركة مفاتيح تحدي نسك بين الزوار، دون حسابات أو بيانات شخصية.',
  applicationName: 'صل على النبي ﷺ',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'صل على النبي ﷺ',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#090817',
};

// يطبّق الخط المختار قبل أول رسم للصفحة (لتفادي وميض الخط الافتراضي)
const FONT_BOOT = `try{var m={amiri:1,naskh:1,schehe:1,cairo:1,tajawal:1,almarai:1,plex:1,notokufi:1,messiri:1},r=document.documentElement.style,b=localStorage.getItem('ui_font_body')||'amiri',h=localStorage.getItem('ui_font_head')||'amiri';if(b&&m[b])r.setProperty('--font-ruqaa','var(--f-'+b+')');if(h&&m[h])r.setProperty('--font-kufi','var(--f-'+h+')')}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={FONT_CLASSES} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FONT_BOOT }} />
      </head>
      <body>
        {children}
        <PwaSetup />
      </body>
    </html>
  );
}
