import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Лендинг — скелет. Дизайн начинаем с шапки (components/layout/header.tsx).
export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-3xl font-bold">Лендинг</h1>
        {/* TODO: hero, каналы, как работает, возможности, тарифы, демо-видео, CTA */}
      </main>
      <Footer />
    </>
  );
}
