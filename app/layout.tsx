import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 패션 아바타 플랫폼",
  description: "AI 모델이 제품을 착용한 마케팅 영상을 자동으로 생성합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
