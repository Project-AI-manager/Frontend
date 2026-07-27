import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const onest = Onest({ subsets: ["cyrillic", "latin"], variable: "--font-onest", display: "swap" });
const manrope = Manrope({ subsets: ["cyrillic", "latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "Автопилот — ИИ-сотрудник в одном окне",
  description: "AI-менеджер для продаж и поддержки: диалоги, база знаний и черновики ответов.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${onest.variable} ${manrope.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
