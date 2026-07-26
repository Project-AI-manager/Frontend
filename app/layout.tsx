import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

// Кириллические шрифты по требованию CLAUDE.md: Inter/Roboto/системные не используем.
const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  weight: ["600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const onest = Onest({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Автопилот — AI-менеджер в одном окне",
  description:
    "AI-менеджер для продаж и поддержки: собирает обращения в одно окно, отвечает по базе знаний компании и передаёт сложные диалоги менеджеру.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${manrope.variable} ${onest.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
