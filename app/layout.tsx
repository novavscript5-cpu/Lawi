import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lawi AI - 대한민국 법률 상담',
  description: 'Microsoft Copilot Studio와 연결된 Lawi 법률 AI 웹 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
