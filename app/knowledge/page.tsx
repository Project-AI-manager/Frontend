import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function KnowledgePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold">База знаний</h1>
        {/* TODO: документы · кандидаты · проверить ответ */}
      </main>
      <Footer />
    </>
  );
}
