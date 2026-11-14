import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProviderWrapper } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "ระบบแจกอาหารหมาแมว | Pet Food Distribution System",
  description: "ระบบจัดการการแจกอาหารสุนัขและแมว สำหรับผู้ดูแลสัตว์ บ้านพักสัตว์ และกลุ่มช่วยเหลือสัตว์",
  keywords: "อาหารหมา อาหารแมว แจกอาหาร สัตว์เลี้ยง shelter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProviderWrapper>
          {children}
          <Toaster />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
