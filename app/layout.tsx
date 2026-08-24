import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'http://localhost:3000'),
  title: '塔罗静室｜一处安静的自我探索空间',
  description: '通过仪式化阅读与象征解读，梳理困惑、看见方向，并记录属于你的成长旅程。',
  openGraph: {
    title: '塔罗静室',
    description: '一处安静的自我探索空间',
    locale: 'zh_CN',
    type: 'website',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: '塔罗静室品牌预览图' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '塔罗静室',
    description: '一处安静的自我探索空间',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
