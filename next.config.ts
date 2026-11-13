import type { NextConfig } from 'next';

// البناء العادي (Vercel) لا يتغير. وضع التطبيق يُفعَّل فقط
// عند تشغيل البناء بالمتغير BUILD_TARGET=mobile.
const isMobileBuild = process.env.BUILD_TARGET === 'mobile';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isMobileBuild
    ? {
        output: 'export' as const,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
