import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800"],
});

const title = "날씨 · 실시간 전국 날씨와 AI 날씨 비서";
const description = "전국 주요 도시의 실시간 날씨, 시간별·10일 예보, 미세먼지와 AI 날씨 비서";

export const metadata: Metadata = {
  // 링크 미리보기 이미지(opengraph-image.png)를 절대 주소로 만들 때 쓰는 기준 주소
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title,
  description,
  openGraph: { title, description, type: "website", locale: "ko_KR", siteName: "날씨" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
