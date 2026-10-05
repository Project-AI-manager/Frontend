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
    default: "Автопилот — ИИ-помощник для клиентских обращений",
    template: "%s — Автопилот",
  },
  description: "ИИ-помощник для клиентских обращений: ответы по знаниям компании, единый кабинет и оплата по фактическому расходу токенов.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    title: "Автопилот — ИИ-помощник для клиентских обращений",
    description: "Ответы по знаниям компании, единый кабинет, контроль менеджера и оплата по фактическому расходу токенов.",
  },
  twitter: {
    card: "summary",
    title: "Автопилот — ИИ-помощник для клиентских обращений",
    description: "Ответы по знаниям компании, единый кабинет, контроль менеджера и оплата по фактическому расходу токенов.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" className={`${onest.variable} ${manrope.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
