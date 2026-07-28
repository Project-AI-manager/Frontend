import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";

import { Providers } from "@/components/providers";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/site";

import "./globals.css";

const onest = Onest({ subsets: ["cyrillic", "latin"], variable: "--font-onest", display: "swap" });
const manrope = Manrope({ subsets: ["cyrillic", "latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: SITE_NAME,
  title: {
    default: "Автопилот — ИИ-сотрудник в одном окне",
    template: "%s — Автопилот",
  },
  description: "AI-менеджер для продаж и поддержки: диалоги, база знаний и черновики ответов.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    title: "Автопилот — ИИ-сотрудник в одном окне",
    description: "AI-менеджер для продаж и поддержки: диалоги, база знаний и черновики ответов.",
  },
  twitter: {
    card: "summary",
    title: "Автопилот — ИИ-сотрудник в одном окне",
    description: "AI-менеджер для продаж и поддержки: диалоги, база знаний и черновики ответов.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" className={`${onest.variable} ${manrope.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
