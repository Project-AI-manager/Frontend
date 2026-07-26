import type { Metadata } from "next";
import { Onest } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

// Каркасная версия: один нейтральный шрифт с кириллицей.
// Inter/Roboto/системные запрещены по CLAUDE.md.
const onest = Onest({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
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
    <html lang="ru" className={onest.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
