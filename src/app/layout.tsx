import type { Metadata } from 'next';
import { Noto_Serif_KR, Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const serif = Noto_Serif_KR({
  weight: ['400', '600', '900'],
  subsets: ['latin'],
  variable: '--font-serif',
});

const sans = Noto_Sans_KR({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: '명리재(命理齋)',
  description: '현대인을 위한 가장 아름답고 직관적인 디지털 한옥 철학관',
  openGraph: {
    title: '명리재(命理齋)',
    description: '나의 숨겨진 사주와 강점을 아름다운 리포트로 만나보세요.',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${serif.variable} ${sans.variable} antialiased font-sans bg-zinc-50 text-zinc-900`}
      >
        {children}
      </body>
    </html>
  );
}
