import type { Metadata } from "next";

import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Автопилот — AI-менеджер для диалогов",
  description: "Единое рабочее пространство для диалогов, знаний и каналов.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
