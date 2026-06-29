import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Едино",
  description: "AI-сотрудник в едином окне",
};

// Шрифты не подключены намеренно — выберем вместе со стилем (нужна кириллица).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
