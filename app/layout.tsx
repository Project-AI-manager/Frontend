import type { Metadata } from "next";
import { Geologica, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// Distinctive professional: характерный дисплейный шрифт + чистый гротеск (кириллица).
const geologica = Geologica({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700", "800", "900"],
  variable: "--font-geologica",
});
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Едино — AI-сотрудник в едином окне",
  description:
    "AI-сотрудник, который отвечает вашим клиентам из Avito, VK, MAX и веб-чата — в одном окне.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geologica.variable} ${manrope.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
